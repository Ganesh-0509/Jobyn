"""
knowledge_service.py — knowledge cache backed by Supabase.

Reads / writes from the ``knowledge_cache`` table in Supabase.
Falls back gracefully when Supabase is unavailable (returns None / logs warning).
"""

import logging
from typing import Optional, Dict, Any

log = logging.getLogger("knowledge_service")

# Bump this when prompts change significantly to auto-invalidate stale cache
CACHE_VERSION = 4


def _sb():
    from app.core.supabase_client import get_supabase
    return get_supabase()


class KnowledgeService:
    def get_cached_knowledge(self, topic: str, type: str = "study") -> Optional[Dict[str, Any]]:
        """
        Retrieves cached AI content (notes or quiz) from Supabase ``knowledge_cache``.
        Automatically rejects stale entries from older cache versions.
        """
        try:
            sb = _sb()
            resp = (
                sb.table("knowledge_cache")
                .select("content")
                .eq("topic", topic.lower())
                .eq("type", type)
                .limit(1)
                .execute()
            )
            if resp.data:
                content = resp.data[0]["content"]
                # Reject stale cache entries from older versions
                if content.get("_cache_version", 0) < CACHE_VERSION:
                    log.info("Supabase cache STALE for %s (%s) — version %s < %s, will regenerate",
                             topic, type, content.get("_cache_version", 0), CACHE_VERSION)
                    return None
                log.info("Supabase cache HIT for %s (%s)", topic, type)
                return content
        except Exception as e:
            log.warning("Knowledge cache read error: %s", e)
        return None

    def cache_knowledge(self, topic: str, content: Dict[str, Any], type: str = "study"):
        """
        Upserts AI content into the Supabase ``knowledge_cache`` table.
        Stamps content with the current cache version for future invalidation.
        Gracefully handles RLS / permission errors — logs a warning and continues.
        """
        try:
            content["_cache_version"] = CACHE_VERSION
            sb = _sb()
            sb.table("knowledge_cache").upsert(
                {
                    "topic": topic.lower(),
                    "type": type,
                    "content": content,
                    "updated_at": "now()",
                },
                on_conflict="topic,type",
            ).execute()
            log.info("Cached %s (%s) v%s to Supabase", topic, type, CACHE_VERSION)
        except Exception as e:
            err_str = str(e)
            if "row-level security" in err_str or "401" in err_str or "403" in err_str:
                log.warning("Knowledge cache write skipped (RLS policy): %s (%s)", topic, type)
            else:
                log.warning("Knowledge cache write error: %s", e)

    def get_all_topics_count(self) -> int:
        """Return number of distinct topics in the knowledge cache."""
        try:
            sb = _sb()
            resp = sb.table("knowledge_cache").select("topic").execute()
            return len({row["topic"] for row in resp.data})
        except Exception as e:
            log.warning("Knowledge topics count error: %s", e)
            return 0


knowledge_service = KnowledgeService()
