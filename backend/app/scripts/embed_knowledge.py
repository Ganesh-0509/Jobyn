"""
embed_knowledge.py — One-time script to embed the curated knowledge base into PGVector using Gemini.

Run once after setting up Supabase PGVector extension:
    python -m app.scripts.embed_knowledge

Prerequisites:
    - SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY in .env
    - 'knowledge_chunks' table and 'match_knowledge' function created in Supabase
"""

from __future__ import annotations
import os
import sys
import logging
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-8s %(message)s")
log = logging.getLogger("embed_knowledge")

KNOWLEDGE_BASE_DIR = Path(__file__).resolve().parent.parent.parent / "knowledge_base"

# ── Text Chunker ──────────────────────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> list[str]:
    """Simple overlap chunker."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c.strip() for c in chunks if c.strip()]


# ── Embedding ─────────────────────────────────────────────────────────────────
def embed_text(text: str) -> list[float] | None:
    try:
        from google import genai
        from app.core.settings import settings
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        embed_res = client.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            contents=text,
        )
        return embed_res.embeddings[0].values
    except Exception as e:
        log.error("Gemini embedding failed: %s", e)
        return None


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    from supabase import create_client

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not all([supabase_url, supabase_key, gemini_key]):
        log.error("Missing environment variables: SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY")
        sys.exit(1)

    sb = create_client(supabase_url, supabase_key)

    # Clear existing chunks for a clean re-embed
    log.info("Clearing existing knowledge_chunks...")
    try:
        sb.table("knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception as e:
        log.warning("Could not clear chunks: %s", e)

    total_inserted = 0

    # Walk all markdown files in knowledge_base/
    for md_file in sorted(KNOWLEDGE_BASE_DIR.rglob("*.md")):
        topic = md_file.stem.replace("_", " ").title()
        log.info("Processing: %s → topic '%s'", md_file.relative_to(KNOWLEDGE_BASE_DIR), topic)

        content = md_file.read_text(encoding="utf-8")
        chunks = chunk_text(content)

        for i, chunk in enumerate(chunks):
            embedding = embed_text(chunk)
            if embedding is None:
                log.warning("  Skipping chunk %d (embedding failed)", i)
                continue

            try:
                sb.table("knowledge_chunks").insert({
                    "topic": topic,
                    "content": chunk,
                    "embedding": embedding,
                    "source_version": "v1.0"
                }).execute()
                total_inserted += 1
                log.info("  Inserted chunk %d/%d for [%s]", i + 1, len(chunks), topic)
            except Exception as e:
                log.error("  DB insert failed: %s", e)

    log.info("=" * 60)
    log.info("Embedding complete — %d chunks inserted using Gemini.", total_inserted)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
