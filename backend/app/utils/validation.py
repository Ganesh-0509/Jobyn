"""
validation.py — input validation & sanitization for backend endpoints.

Strips potentially dangerous content from user-supplied text inputs
before they reach the DB or ML pipeline.
"""

import re
import html

# Max allowed resume raw text length (chars)
MAX_RESUME_TEXT = 500_000
MAX_SKILL_LENGTH = 100
MAX_EMAIL_LENGTH = 254

_EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
_SCRIPT_RE = re.compile(r'<script[\s>]|javascript:|on\w+\s*=', re.IGNORECASE)


def sanitize_text(text: str) -> str:
    """Escape HTML entities and strip script-like patterns."""
    cleaned = html.escape(text, quote=True)
    return cleaned


def sanitize_plain(text: str) -> str:
    """Strip any HTML tags entirely (for plain text fields like names/skills)."""
    return re.sub(r'<[^>]+>', '', text).strip()


def validate_email(email: str | None) -> str | None:
    """Return cleaned email or None if invalid."""
    if not email:
        return None
    email = email.strip()[:MAX_EMAIL_LENGTH]
    if not _EMAIL_RE.match(email):
        return None
    return email


def validate_role(role: str, valid_roles: list[str]) -> str | None:
    """Return role if valid, else None."""
    return role if role in valid_roles else None


def validate_skill(skill: str) -> str | None:
    """Return cleaned skill or None if invalid."""
    cleaned = sanitize_plain(skill)[:MAX_SKILL_LENGTH]
    if not cleaned or _SCRIPT_RE.search(cleaned):
        return None
    return cleaned


def validate_resume_text(text: str) -> tuple[bool, str]:
    """Validate resume text length. Returns (is_valid, message)."""
    if len(text) < 10:
        return False, "Resume text is too short — is the file empty?"
    if len(text) > MAX_RESUME_TEXT:
        return False, f"Resume text exceeds {MAX_RESUME_TEXT} characters."
    return True, ""


def sanitize_filename(filename: str) -> str:
    """
    Remove path traversal sequences, strip leading/trailing spaces/dots,
    and restrict character set to alphanumeric, dots, dashes, and underscores.
    """
    import os
    # 1. Get base name (prevent path traversal like ../)
    base = os.path.basename(filename)

    # 2. Split name and extension
    name, ext = os.path.splitext(base)

    # 3. Clean filename name portion (keep alphanumeric, space, underscore, dash)
    cleaned_name = re.sub(r'[^a-zA-Z0-9_\-\s]', '', name).strip()

    # 4. Clean extension portion (only allow alphanumeric file formats like pdf, docx)
    cleaned_ext = re.sub(r'[^a-zA-Z0-9]', '', ext).lower().strip()

    # 5. Fallback if everything was stripped
    if not cleaned_name:
        cleaned_name = "uploaded_file"

    # 6. Re-assemble and limit length
    safe_filename = f"{cleaned_name}.{cleaned_ext}"
    if len(safe_filename) > 100:
        safe_filename = safe_filename[-100:]

    return safe_filename


def sanitize_recursive(val: any) -> any:
    """Recursively sanitize strings inside nested objects (dicts, lists, primitives)."""
    if isinstance(val, str):
        return sanitize_text(val)
    elif isinstance(val, dict):
        return {k: sanitize_recursive(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [sanitize_recursive(i) for i in val]
    return val
