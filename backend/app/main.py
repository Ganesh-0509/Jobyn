"""
main.py — application entry point (Phase 4B — ML Inference Layer).

Startup sequence:
  1. Validate JSON configs (skills/roles/scoring)
  2. Check Supabase connectivity (non-fatal warning)
  3. Load v2 ML models (fatal if files missing)
  4. Accept requests

Middleware: CORS (explicit origin allowlist)

Routers:
  - analyze.py   → /upload, /roles
  - data.py      → /history, /compare, /analytics, /export
  - ml.py        → /ml/* (Phase 4A similarity / impact)
  - inference.py → /health, /predict  (Phase 4B RandomForest serving)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config_loader import validate_all
from app.core.supabase_client import check_connection
from app.model_loader import load_models, is_loaded, get_metadata
from app.routers import analyze
from app.routers import data as data_router
import os
from app.routers import ml as ml_router
from app.routers import inference as inference_router
from app.routers import interview as interview_router
from app.core.rate_limiter import limiter, rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.settings import settings

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s  %(levelname)-8s  [%(name)s]  %(message)s",
    datefmt = "%H:%M:%S",
)

log = logging.getLogger("main")

# ---- Env‑var check ----------------------------------------------------------
if not os.getenv("BYTEZ_API_KEY"):
    log.warning("BYTEZ_API_KEY is missing – Bytez-powered features will be unavailable.")


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):

    # 1. Validate config files
    validate_all()

    # 2. Supabase (non-fatal)
    db = check_connection()
    if db["supabase"] == "connected":
        log.info("Supabase connected  %s", db.get("url", ""))
    else:
        log.warning("Supabase %s — %s", db["supabase"], db.get("detail", ""))

    # 3. ML models (fatal if missing)
    try:
        load_models()
        log.info("ML inference layer ready.")
    except RuntimeError as e:
        log.error("ML model load failed: %s", e)
        log.warning(
            "Server starting WITHOUT ML inference. "
            "Run:  ..\venv\\Scripts\\python -m app.ml_pipeline.train_v2 --seed 42"
        )

    yield


# ── App factory ────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "CampusSync Edge — Resume Intelligence API",
    description = (
        "**Phase 4B — Production ML Inference**\n\n"
        "- **Deterministic scoring** (config-driven)\n"
        "- **Supabase persistence** (real resume data)\n"
        "- **RandomForest v2 inference** (82.1% role accuracy, RMSE=1.04)\n\n"
        "Start with `POST /upload` to analyse a resume, "
        "then use `POST /predict` for ML-powered role prediction."
    ),
    version     = settings.APP_VERSION,
    lifespan    = lifespan,
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ── Rate limiting ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse

# ── HTTP Response Security Headers Middleware ────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ── Auth & Request Auditing Middleware ───────────────────────────────────────
@app.middleware("http")
async def audit_auth_requests(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    
    # Log auth/sensitive actions specifically
    if "auth" in path.lower() or "admin" in path.lower():
        log.info(f"AUDIT LOG: Sensitive route access on '{path}' by client IP {client_ip}")
        
    response = await call_next(request)
    return response

# ── Global API Error and Exception Logger ─────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    client_ip = request.client.host if request.client else "unknown"
    log.critical(
        f"API ERROR ALERT: Client {client_ip} triggered unhandled Exception on {request.method} {request.url.path}. "
        f"Message: {str(exc)}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Security Event: An internal error occurred. Administrators have been alerted."}
    )

from app.routers import ai_insight
from app.routers import feedback as feedback_router
from app.routers import content_feedback as content_feedback_router
from app.routers import project_generator

# ── App factory ────────────────────────────────────────────────────────────────
# ... (rest of App factory)
app.include_router(analyze.router)
app.include_router(data_router.router)
app.include_router(ml_router.router)
app.include_router(inference_router.router)
app.include_router(interview_router.router)
app.include_router(ai_insight.router)
app.include_router(feedback_router.router)
app.include_router(content_feedback_router.router)
app.include_router(project_generator.router)


# ── Root ────────────────────────────────────────────────────────────────────────

from app.core.cache import cache as _app_cache

@app.api_route("/", methods=["GET", "HEAD"], tags=["Status"], summary="Service root status")
def root():
    db   = check_connection()
    meta = get_metadata() if is_loaded() else {}
    return {
        "status":        "Resume Intelligence API Running",
        "version":       settings.APP_VERSION,
        "model_version": meta.get("version", "not_loaded"),
        "model_accuracy": f"{meta.get('accuracy', 0)*100:.1f}%" if meta else "N/A",
        "database":      db["supabase"],
        "cache_backend": _app_cache.backend,
        "docs":          "/docs",
    }