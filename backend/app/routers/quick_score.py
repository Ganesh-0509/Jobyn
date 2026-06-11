"""
quick_score.py — anonymous resume scoring endpoint.

Upload a PDF/DOCX and get an instant readiness score without authentication.
Rate-limited to 5 requests/minute per IP. Results are ephemeral (not persisted).
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from app.services.resume_parser import parse_resume
from app.services.skill_dictionary import extract_skills
from app.services.role_readiness_engine import calculate_role_readiness
from app.core.rate_limiter import limiter
import logging

log = logging.getLogger(__name__)

router = APIRouter(prefix="/quick-score", tags=["Quick Score"])

MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("")
@limiter.limit("5/minute")
async def quick_score(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Anonymous resume scoring — no auth required.
    Accepts a PDF or DOCX file (max 5 MB) and returns an instant
    readiness score against the best-matching role.  Results are
    ephemeral and not persisted to any database.
    """
    # ── Validate file extension ────────────────────────────────────────
    filename = (file.filename or "").lower()
    if not filename.endswith((".pdf", ".docx")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported.",
        )

    try:
        file_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file.")

    # ── Validate file size ─────────────────────────────────────────────
    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 5 MB.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        # ── Core pipeline ──────────────────────────────────────────────
        parsed = parse_resume(file_bytes, file.filename or "upload.pdf")
        skills = extract_skills(parsed["raw_text"])

        # Score against a generic role to get a baseline readiness number
        result = calculate_role_readiness(
            resume_skills=skills,
            sections_detected=parsed["sections_detected"],
            raw_text=parsed["raw_text"],
            role_name="full_stack_developer",
        )

        missing_count = len(result.get("missing_core_skills", []))

        return {
            "score": result.get("final_score", 0),
            "role": result.get("role", "full_stack_developer"),
            "readiness_category": result.get("readiness_category", "Needs Improvement"),
            "missing_count": missing_count,
        }

    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=400, detail="Could not parse the uploaded file.")
    except Exception:
        log.exception("Quick score failed")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
