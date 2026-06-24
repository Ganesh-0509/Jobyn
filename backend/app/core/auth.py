"""
auth.py — JWT verification for Supabase Auth tokens.

Provides a FastAPI dependency `get_current_user` that:
  1. Reads the Authorization: Bearer <token> header
  2. Decodes and verifies the JWT against Supabase's JWT secret
  3. Returns user info (sub, email) or raises 401

Also provides `optional_user` which returns None instead of 401
for endpoints that work both authenticated and anonymously.
"""

import os
import logging
from functools import lru_cache
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt  # PyJWT
from jwt import PyJWKClient

logger = logging.getLogger(__name__)

# Supabase JWT secret — found in Dashboard → Settings → API → JWT Secret.
# Used only for legacy HS256 tokens. Projects on the newer "JWT signing keys"
# system issue asymmetric (ES256/RS256) tokens verified via JWKS instead.
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
HS_ALGORITHM = "HS256"
ASYMMETRIC_ALGORITHMS = ["ES256", "RS256"]

_bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    """Cached client for Supabase's JWKS (public signing keys). PyJWKClient
    caches the fetched key set internally, so this is one network call per key
    rotation, not per request."""
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL not set — cannot verify asymmetric JWTs.")
    return PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")


class AuthUser:
    """Minimal user object extracted from a verified JWT."""
    def __init__(self, sub: str, email: str, role: str = "authenticated"):
        self.sub = sub      # Supabase user UUID
        self.email = email
        self.role = role

    def __repr__(self):
        return f"AuthUser(email={self.email!r})"


def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT. Raises on failure.

    Supports both token types Supabase can issue:
      - Asymmetric (ES256/RS256) — the current default; verified against the
        project's public JWKS. This is what the new sb_publishable/sb_secret
        key system produces.
      - Legacy HS256 — verified with the shared SUPABASE_JWT_SECRET.
    """
    alg = jwt.get_unverified_header(token).get("alg", HS_ALGORITHM)

    # ── Asymmetric tokens (current Supabase default) — verify via JWKS ──────
    if alg in ASYMMETRIC_ALGORITHMS:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=ASYMMETRIC_ALGORITHMS,
            audience="authenticated",
            leeway=30,  # tolerate minor clock skew between Supabase and this host
        )

    # ── Legacy HS256 tokens — verify with the shared secret ────────────────
    if not JWT_SECRET:
        # Enforce strict secret configuration in production hosts (Render or ENV=production)
        is_prod = os.getenv("ENV", "development").lower() == "production" or os.getenv("RENDER") is not None
        if is_prod:
            logger.critical("FATAL SECURITY ERROR: SUPABASE_JWT_SECRET is not configured in production!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Security Error: Authentication service misconfiguration."
            )
        # Dev mode: no secret configured → trust the token payload without verification
        logger.warning("SUPABASE_JWT_SECRET not set — skipping JWT verification (dev mode)")
        return jwt.decode(token, options={"verify_signature": False})

    return jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[HS_ALGORITHM],
        audience="authenticated",
        leeway=30,  # tolerate minor clock skew between Supabase and this host
    )


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> AuthUser:
    """
    **Required auth** dependency.
    Raises 401 if no valid token is provided.
    """
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = _decode_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWKClientError as e:
        logger.error("JWKS signing-key retrieval failed: %s", e)
        raise HTTPException(status_code=401, detail="Could not verify token signature")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return AuthUser(
        sub=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "authenticated"),
    )


async def optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[AuthUser]:
    """
    **Optional auth** dependency.
    Returns AuthUser if a valid token is present, None otherwise.
    Useful for endpoints that work both ways.
    """
    if creds is None or not creds.credentials:
        return None

    try:
        payload = _decode_token(creds.credentials)
        return AuthUser(
            sub=payload.get("sub", ""),
            email=payload.get("email", ""),
            role=payload.get("role", "authenticated"),
        )
    except Exception:
        return None


async def get_admin_user(
    user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    """
    **Required Admin auth** dependency.
    Raises 403 Forbidden if the user is not an admin.
    """
    from app.core.settings import settings
    if user.email.lower() not in [e.lower() for e in settings.ADMIN_EMAILS]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative access required.",
        )
    return user
