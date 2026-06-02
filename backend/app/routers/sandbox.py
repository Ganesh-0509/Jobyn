"""
sandbox.py — code execution sandbox with line-by-line tracing.

Provides two endpoints:
  - POST /sandbox/run    — execute code, return stdout/stderr
  - POST /sandbox/trace  — execute code step-by-step, return line-by-line state
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import subprocess
import tempfile
import os
import sys
import json
import io
import threading
import traceback

import logging

log = logging.getLogger(__name__)

router = APIRouter(prefix="/sandbox", tags=["Sandbox"])

# ── Constants ─────────────────────────────────────────────────────────────────

EXEC_TIMEOUT = 5  # seconds
MAX_CODE_LENGTH = 10_000  # characters
MAX_STEPS = 500  # max trace steps to prevent infinite loops

# ── Request/Response models ──────────────────────────────────────────────────


class RunRequest(BaseModel):
    code: str
    language: str = "python"
    stdin: str = ""


class TraceRequest(BaseModel):
    code: str
    language: str = "python"
    stdin: str = ""


class TraceStep(BaseModel):
    line: int
    locals: Dict[str, str] = {}
    output: str = ""
    error: Optional[str] = None
    event: str = "line"  # line, call, return, exception


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    returncode: int
    timed_out: bool


class TraceResponse(BaseModel):
    steps: List[TraceStep]
    error: Optional[str] = None
    stdout: str = ""


# ── Python Tracer ─────────────────────────────────────────────────────────────


def _trace_python(code: str, stdin_data: str) -> TraceResponse:
    """Trace Python code execution step-by-step using bdb."""
    import bdb
    import io
    import sys
    import signal

    steps: List[TraceStep] = []
    captured_output = io.StringIO()
    step_count = [0]

    class PythonTracer(bdb.Bdb):
        def __init__(self):
            super().__init__()
            self.stopframe = None
            self._skip_calls = set()

        def user_line(self, frame):
            """Called on each line execution."""
            step_count[0] += 1
            if step_count[0] > MAX_STEPS:
                self.set_quit()
                return

            # Only trace the user's code (the __sandbox_main__ module)
            if frame.f_code.co_filename != "<sandbox>":
                return

            lineno = frame.f_lineno
            local_vars = {}
            for k, v in frame.f_locals.items():
                if k.startswith("__") and k.endswith("__"):
                    continue
                try:
                    repr_v = repr(v)
                    if len(repr_v) > 200:
                        repr_v = repr_v[:200] + "..."
                    local_vars[k] = repr_v
                except Exception:
                    local_vars[k] = "<unrepresentable>"

            steps.append(TraceStep(
                line=lineno,
                locals=local_vars,
                output=captured_output.getvalue(),
                event="line"
            ))

        def user_call(self, frame, argument_list):
            """Called on function call."""
            if frame.f_code.co_filename == "<sandbox>":
                step_count[0] += 1
                if step_count[0] > MAX_STEPS:
                    self.set_quit()
                    return
                steps.append(TraceStep(
                    line=frame.f_lineno,
                    locals={},
                    output=captured_output.getvalue(),
                    event="call"
                ))

        def user_return(self, frame, return_value):
            """Called on function return."""
            if frame.f_code.co_filename == "<sandbox>":
                step_count[0] += 1
                if step_count[0] > MAX_STEPS:
                    self.set_quit()
                    return
                ret_repr = repr(return_value)
                if len(ret_repr) > 200:
                    ret_repr = ret_repr[:200] + "..."
                steps.append(TraceStep(
                    line=frame.f_lineno,
                    locals={"return": ret_repr},
                    output=captured_output.getvalue(),
                    event="return"
                ))

        def user_exception(self, frame, exception):
            """Called on exception."""
            if frame.f_code.co_filename == "<sandbox>":
                steps.append(TraceStep(
                    line=frame.f_lineno,
                    locals={},
                    output=captured_output.getvalue(),
                    error=f"{type(exception).__name__}: {exception}",
                    event="exception"
                ))

    # Redirect stdout
    old_stdout = sys.stdout
    sys.stdout = captured_output

    # Set up stdin
    old_stdin = sys.stdin
    if stdin_data:
        sys.stdin = io.StringIO(stdin_data)

    tracer = PythonTracer()
    error_msg = None

    try:
        # Compile and trace
        compiled = compile(code, "<sandbox>", "exec")
        tracer.run(compiled)
    except bdb.BdbQuit:
        pass  # Normal quit from set_quit()
    except SyntaxError as e:
        error_msg = f"SyntaxError at line {e.lineno}: {e.msg}"
        steps.append(TraceStep(
            line=e.lineno or 1,
            locals={},
            output=captured_output.getvalue(),
            error=error_msg,
            event="exception"
        ))
    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        steps.append(TraceStep(
            line=0,
            locals={},
            output=captured_output.getvalue(),
            error=error_msg,
            event="exception"
        ))
    finally:
        sys.stdout = old_stdout
        sys.stdin = old_stdin

    if step_count[0] > MAX_STEPS:
        error_msg = f"Execution stopped after {MAX_STEPS} steps (possible infinite loop)"

    return TraceResponse(
        steps=steps,
        error=error_msg,
        stdout=captured_output.getvalue()
    )


# ── JavaScript Tracer ─────────────────────────────────────────────────────────


def _trace_javascript(code: str, stdin_data: str) -> TraceResponse:
    """Trace JavaScript code by injecting trace calls."""
    import re

    lines = code.split("\n")
    traced_lines = []
    traced_lines.append("const __traceData__ = [];")
    traced_lines.append("const __origConsoleLog__ = console.log;")
    traced_lines.append("let __traceOutput__ = '';")
    traced_lines.append("console.log = function(...args) {")
    traced_lines.append("  __traceOutput__ += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\\n';")
    traced_lines.append("  __origConsoleLog__(...args);")
    traced_lines.append("};")
    traced_lines.append("function __trace__(line, vars) {")
    traced_lines.append("  __traceData__.push({line, locals: vars, output: __traceOutput__});")
    traced_lines.append("}")
    traced_lines.append("")

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Skip empty lines, comments, opening/closing braces
        if not stripped or stripped.startswith("//") or stripped in ("{", "}", "};"):
            traced_lines.append(line)
            continue

        # Skip lines that are part of multi-line statements (rough heuristic)
        if stripped.startswith(".") or stripped.startswith(")") or stripped.startswith("]"):
            traced_lines.append(line)
            continue

        # Extract variable assignments for tracing
        var_match = re.match(r"(?:let|const|var)\s+(\w+)\s*=", stripped)
        assign_match = re.match(r"(\w+)\s*=", stripped)

        indent = len(line) - len(line.lstrip())
        indent_str = " " * indent

        if var_match:
            var_name = var_match.group(1)
            traced_lines.append(line)
            traced_lines.append(f'{indent_str}__trace__({i}, {{"{var_name}": JSON.stringify({var_name})}});')
        elif assign_match and not stripped.startswith(("if", "for", "while", "function", "class", "return", "switch", "try", "catch")):
            var_name = assign_match.group(1)
            traced_lines.append(line)
            traced_lines.append(f'{indent_str}__trace__({i}, {{"{var_name}": JSON.stringify({var_name})}});')
        else:
            traced_lines.append(line)
            traced_lines.append(f'{indent_str}__trace__({i}, {{}});')

    traced_lines.append("")
    traced_lines.append("console.log = __origConsoleLog__;")
    traced_lines.append("JSON.stringify(__traceData__);")

    traced_code = "\n".join(traced_lines)

    # Execute with Node.js
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            filepath = os.path.join(tmpdir, "trace.js")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(traced_code)

            proc = subprocess.run(
                ["node", filepath],
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=EXEC_TIMEOUT,
                cwd=tmpdir,
            )

            if proc.returncode != 0:
                return TraceResponse(
                    steps=[],
                    error=proc.stderr.strip() if proc.stderr else "Execution error",
                    stdout=""
                )

            # Parse trace data from stdout (last line is JSON)
            output_lines = proc.stdout.strip().split("\n")
            json_str = output_lines[-1] if output_lines else "[]"

            try:
                trace_data = json.loads(json_str)
            except json.JSONDecodeError:
                return TraceResponse(
                    steps=[],
                    error="Failed to parse trace data",
                    stdout="\n".join(output_lines[:-1])
                )

            steps = []
            for item in trace_data:
                locals_dict = {}
                for k, v in item.get("locals", {}).items():
                    try:
                        parsed = json.loads(v) if isinstance(v, str) else v
                        locals_dict[k] = repr(parsed)
                    except (json.JSONDecodeError, TypeError):
                        locals_dict[k] = str(v)

                steps.append(TraceStep(
                    line=item.get("line", 0),
                    locals=locals_dict,
                    output=item.get("output", ""),
                    event="line"
                ))

            return TraceResponse(steps=steps, stdout=steps[-1].output if steps else "")

    except subprocess.TimeoutExpired:
        return TraceResponse(
            steps=[],
            error=f"Execution timed out after {EXEC_TIMEOUT} seconds",
            stdout=""
        )
    except FileNotFoundError:
        return TraceResponse(
            steps=[],
            error="Node.js not found. JavaScript execution requires Node.js installed.",
            stdout=""
        )
    except Exception as e:
        return TraceResponse(steps=[], error=f"Trace error: {str(e)}", stdout="")


# ── Simple Run (no tracing) ───────────────────────────────────────────────────


def _run_code(language: str, code: str, stdin_data: str) -> RunResponse:
    """Execute code in a subprocess with a timeout."""
    result = RunResponse(stdout="", stderr="", returncode=1, timed_out=False)

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            if language == "python":
                filepath = os.path.join(tmpdir, "solution.py")
                cmd = ["python", filepath]
            elif language == "javascript":
                filepath = os.path.join(tmpdir, "solution.js")
                cmd = ["node", filepath]
            else:
                result.stderr = f"Unsupported language: {language}"
                return result

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(code)

            proc = subprocess.run(
                cmd,
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=EXEC_TIMEOUT,
                cwd=tmpdir,
            )

            result.stdout = proc.stdout.strip()
            result.stderr = proc.stderr.strip()
            result.returncode = proc.returncode

    except subprocess.TimeoutExpired:
        result.timed_out = True
        result.stderr = f"Execution timed out after {EXEC_TIMEOUT} seconds."
    except Exception as e:
        result.stderr = f"Execution error: {str(e)}"

    return result


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/run", response_model=RunResponse)
async def run_code(body: RunRequest):
    """Execute code and return stdout/stderr."""
    if not body.code or len(body.code) > MAX_CODE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Code must be 1-{MAX_CODE_LENGTH} characters."
        )

    language = body.language.lower()
    if language not in ("python", "javascript"):
        raise HTTPException(
            status_code=400,
            detail="Supported languages: python, javascript."
        )

    return _run_code(language, body.code, body.stdin)


@router.post("/trace", response_model=TraceResponse)
async def trace_code(body: TraceRequest):
    """Execute code step-by-step, returning line-by-line state."""
    if not body.code or len(body.code) > MAX_CODE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Code must be 1-{MAX_CODE_LENGTH} characters."
        )

    language = body.language.lower()
    if language not in ("python", "javascript"):
        raise HTTPException(
            status_code=400,
            detail="Supported languages: python, javascript."
        )

    if language == "python":
        return _trace_python(body.code, body.stdin)
    else:
        return _trace_javascript(body.code, body.stdin)
