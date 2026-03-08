"""
rate_limiter.py — global rate-limiting middleware using slowapi.

Limits per IP address:
  - General endpoints: 60 requests / minute
  - Upload endpoint:   10 requests / minute
  - AI/LLM endpoints:  20 requests / minute
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.settings import settings

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

# Pre-built rate-limit decorators for different endpoint tiers
upload_limit = limiter.limit(settings.RATE_LIMIT_UPLOAD)
ai_limit     = limiter.limit(settings.RATE_LIMIT_AI)
heavy_limit  = limiter.limit(settings.RATE_LIMIT_HEAVY)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom 429 response for rate-limited requests."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": str(exc.detail),
            "retry_after": exc.detail,
        },
    )
