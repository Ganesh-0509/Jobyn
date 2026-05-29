"""
data_loader.py (v2) — unified loader for real training data.

Loads from resume_analysis_synthetic_v2 table which now contains
29,000+ real resume datasets from HuggingFace (tech-only filtered).
Records with data_type='real_dataset' get weight 1.5.

Original load_dataset() is preserved for Phase 4A similarity engine.
"""

from app.core.supabase_client import get_supabase
from app.core.settings import settings
import logging
import time

logger = logging.getLogger(__name__)

# ── Sample weights ─────────────────────────────────────────────────────────────
WEIGHT_REAL      = 1.5
WEIGHT_SYNTHETIC = 1.0

# ── TTL cache for dataset (avoids hitting Supabase on every ML endpoint) ──────
_dataset_cache: list[dict] | None = None
_dataset_cache_ts: float = 0

_combined_cache: list[dict] | None = None
_combined_cache_ts: float = 0

_NUMERIC_FIELDS = [
    "core_coverage_percent",
    "optional_coverage_percent",
    "project_score_percent",
    "ats_score_percent",
    "structure_score_percent",
]


def _clean_record(row: dict, weight: float) -> dict | None:
    """Validate and normalise a raw Supabase row into a clean record dict."""
    skills = row.get("detected_skills") or []
    score  = row.get("final_score")

    if not isinstance(skills, list) or score is None:
        return None

    numeric = {
        field: int(row.get(field) or 0)
        for field in _NUMERIC_FIELDS
    }

    return {
        "detected_skills": [s.lower().strip() for s in skills if s],
        "role":            str(row.get("role", "Unknown")),
        "final_score":     int(score),
        **numeric,
        "sample_weight":   weight,
    }


# ── Phase 4A loader (real data only) ──────────────────────────────────────────

def load_dataset() -> list[dict]:
    """
    Fetch role_analyses joined with resume detected_skills.
    Used by Phase 4A similarity / projection engines.
    Results cached for 5 minutes to avoid repeated Supabase calls.
    """
    global _dataset_cache, _dataset_cache_ts

    now = time.monotonic()
    if _dataset_cache is not None and (now - _dataset_cache_ts) < settings.DATASET_CACHE_TTL:
        return _dataset_cache

    try:
        sb = get_supabase()

        analyses = (
            sb.table("role_analyses")
            .select("id, resume_id, role, final_score")
            .execute()
            .data or []
        )
        if not analyses:
            return []

        resume_ids   = list({a["resume_id"] for a in analyses})
        resumes_resp = (
            sb.table("resumes")
            .select("id, detected_skills")
            .in_("id", resume_ids)
            .execute()
        )
        resume_map = {
            r["id"]: (r.get("detected_skills") or [])
            for r in (resumes_resp.data or [])
        }

        records = []
        for a in analyses:
            skills = resume_map.get(a["resume_id"], [])
            score  = a.get("final_score")
            if score is None:
                continue
            records.append({
                "resume_id":       a["resume_id"],
                "analysis_id":     a["id"],
                "role":            a.get("role", "Unknown"),
                "final_score":     int(score),
                "detected_skills": [s.lower().strip() for s in skills if s],
            })

        _dataset_cache = records
        _dataset_cache_ts = time.monotonic()
        return records

    except EnvironmentError:
        return []


# ── Phase 4B loader (real + synthetic, with weights) ──────────────────────────

def load_combined_dataset() -> list[dict]:
    """
    Fetch and merge:
      - role_analyses (real resumes)  → sample_weight = 1.5
      - resume_analysis_synthetic     → sample_weight = 1.0

    Returns a flat list of clean record dicts ready for feature engineering.
    """
    try:
        sb = get_supabase()

        # ── Real data ─────────────────────────────────────────────────────────
        analyses = (
            sb.table("role_analyses")
            .select("*")
            .execute()
            .data or []
        )
        resume_ids   = list({a["resume_id"] for a in analyses})
        resumes_resp = (
            sb.table("resumes")
            .select("id, detected_skills")
            .in_("id", resume_ids)
            .execute()
            if resume_ids else type("R", (), {"data": []})()
        )
        resume_map = {
            r["id"]: (r.get("detected_skills") or [])
            for r in (resumes_resp.data or [])
        }

        real_records: list[dict] = []
        for a in analyses:
            merged = {**a, "detected_skills": resume_map.get(a["resume_id"], [])}
            rec    = _clean_record(merged, WEIGHT_REAL)
            if rec:
                real_records.append(rec)

        # ── Synthetic data ────────────────────────────────────────────────────
        synthetic_rows = (
            sb.table("resume_analysis_synthetic")
            .select("*")
            .execute()
            .data or []
        )
        synthetic_records: list[dict] = []
        for row in synthetic_rows:
            rec = _clean_record(row, WEIGHT_SYNTHETIC)
            if rec:
                synthetic_records.append(rec)

        combined = real_records + synthetic_records

        logger.info(
            f"Dataset loaded — "
            f"{len(real_records)} real (×{WEIGHT_REAL}) + "
            f"{len(synthetic_records)} synthetic (×{WEIGHT_SYNTHETIC}) "
            f"= {len(combined)} total"
        )
        return combined

    except EnvironmentError as e:
        raise RuntimeError(f"Supabase not configured: {e}") from e


# ── Phase 4B v2 loader (real + synthetic_v2 only) ─────────────────────────────

SYNTHETIC_V2_TABLE = "resume_analysis_synthetic_v2"


def _fetch_all_rows(sb, table: str, select: str = "*") -> list[dict]:
    """Fetch all rows from a Supabase table, handling pagination."""
    all_rows = []
    offset = 0
    batch = 1000
    while True:
        resp = (
            sb.table(table)
            .select(select)
            .range(offset, offset + batch - 1)
            .execute()
        )
        rows = resp.data or []
        all_rows.extend(rows)
        if len(rows) < batch:
            break
        offset += batch
    return all_rows


def _fetch_real_records(sb) -> tuple[list[dict], int]:
    """Shared helper: fetch real role_analyses joined with resume skills."""
    analyses = (
        sb.table("role_analyses")
        .select("*")
        .execute()
        .data or []
    )
    if not analyses:
        return [], 0

    resume_ids   = list({a["resume_id"] for a in analyses})
    resumes_resp = (
        sb.table("resumes")
        .select("id, detected_skills")
        .in_("id", resume_ids)
        .execute()
        if resume_ids else type("R", (), {"data": []})()
    )
    resume_map = {
        r["id"]: (r.get("detected_skills") or [])
        for r in (resumes_resp.data or [])
    }

    records: list[dict] = []
    for a in analyses:
        merged = {**a, "detected_skills": resume_map.get(a["resume_id"], [])}
        rec    = _clean_record(merged, WEIGHT_REAL)
        if rec:
            records.append(rec)

    return records, len(records)


def load_combined_dataset_v2() -> list[dict]:
    """
    Fetch and merge:
      - role_analyses (real resumes)         → sample_weight = 1.5
      - resume_analysis_synthetic_v2         → sample_weight = 1.0

    Intentionally IGNORES resume_analysis_synthetic (v1 table).
    """
    try:
        sb = get_supabase()

        real_records, real_count = _fetch_real_records(sb)

        # ── Training data from v2 table ──────────────────────────────────────
        training_rows = _fetch_all_rows(sb, SYNTHETIC_V2_TABLE)
        training_records: list[dict] = []
        for row in training_rows:
            # Real dataset records get real weight; synthetic get synthetic weight
            dtype = row.get("data_type", "synthetic_v2")
            weight = WEIGHT_REAL if dtype == "real_dataset" else WEIGHT_SYNTHETIC
            rec = _clean_record(row, weight)
            if rec:
                training_records.append(rec)

        combined = real_records + training_records

        real_dataset_count = sum(1 for r in training_records if r.get("sample_weight") == WEIGHT_REAL)
        logger.info(
            f"Dataset v2 loaded — "
            f"{real_count} user resumes (x{WEIGHT_REAL}) + "
            f"{len(training_records)} training data ({real_dataset_count} real, "
            f"{len(training_records) - real_dataset_count} synthetic) "
            f"= {len(combined)} total"
        )
        return combined

    except EnvironmentError as e:
        raise RuntimeError(f"Supabase not configured: {e}") from e
