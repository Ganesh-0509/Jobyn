import os
import json
import logging
import httpx
from typing import Optional, Dict, Any
from app.services.gemini_service import gemini_service
from app.services.bytez_service import bytez_service
from app.services.knowledge_service import knowledge_service
from app.utils.llm_utils import extract_content, parse_json_from_llm

log = logging.getLogger("ai_service")


class AIService:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.bytez_key = os.getenv("BYTEZ_API_KEY")

    async def get_market_forecast(self, role: str, missing_skills: list) -> Dict[str, Any]:
        """Market forecast — checks Supabase cache first, then Bytez/Gemini, caches result."""
        # Check Supabase knowledge_cache first (shared across all users)
        cache_key = f"forecast_{role.lower().replace(' ', '_')}"
        cached = knowledge_service.get_cached_knowledge(cache_key, "forecast")
        if cached and not cached.get("is_fallback"):
            log.info("Forecast cache HIT for [%s]", role)
            cached["_cache_hit"] = True
            return cached

        result = None
        if self.bytez_key:
            result = await bytez_service.get_market_forecast(role, missing_skills)
        if (result is None or result.get("is_fallback")) and self.gemini_key:
            result = await gemini_service.get_market_forecast(role, missing_skills)
        if result is None or result.get("is_fallback"):
            return gemini_service._get_fallback(role, missing_skills)

        # Cache in Supabase for other users
        knowledge_service.cache_knowledge(cache_key, result, "forecast")
        return result

    async def _gemini_study_materials(self, skill: str, existing_skills: str = "") -> Optional[Dict[str, Any]]:
        """Generate study materials directly via Gemini as a fallback."""
        if not self.gemini_key or not gemini_service.client:
            return None

        prompt = f"""You are a senior interview curriculum architect.
Generate a structured, interview-focused study guide JSON for: {skill}
Student already knows: [{existing_skills}]

Return this exact JSON format:
{{
  "skill": "{skill}",
  "quick_summary": "High-level overview of {skill}...",
  "estimated_study_time": "45 minutes",
  "sub_roadmap": [{{"title": "Topic", "duration": "Time"}}],
  "detailed_content": [
    {{
      "subheading": "1. Concept Foundation",
      "explanation": "Clear explanation with a real-world analogy (2-3 paragraphs)",
      "algorithm": "Step 1: ...\\nStep 2: ...",
      "example": "```python\\n# Actual runnable code here\\nresult = compute()\\nprint(result)\\n```",
      "key_takeaway": "One memorable sentence summarizing this section",
      "try_it": "Mini challenge: modify the code above to handle edge case X",
      "complexity": "Time: O(n), Space: O(1)"
    }}
  ],
  "pro_tip": "industry tip..."
}}

RULES:
- Every section MUST have a runnable code example in markdown code fences.
- Every section MUST have a key_takeaway and try_it field.
- Keep explanations under 200 words. Produce exactly 5 sections."""
        try:
            from app.core.settings import settings
            response = gemini_service.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            data = parse_json_from_llm(response.text)
            if data and data.get("detailed_content"):
                data["sources"] = [{"title": skill, "source_type": "Gemini AI", "version": settings.GEMINI_MODEL}]
                return data
        except Exception as e:
            log.warning("Gemini study materials failed for [%s]: %s", skill, e)
        return None

    async def _gemini_quiz(self, skill: str) -> Optional[Dict[str, Any]]:
        """Generate quiz directly via Gemini."""
        if not self.gemini_key or not gemini_service.client:
            return None

        prompt = f"""Generate 5 challenging multiple-choice interview preparation questions for {skill}.

RULES:
- Questions should be scenario-based, not trivial definitions.
- Include code snippets in questions where applicable.
- Each option should be plausible. Provide detailed explanations.
- Mix difficulty: 2 medium, 2 hard, 1 expert.

Return valid JSON only:
{{
  "skill": "{skill}",
  "questions": [
    {{
      "id": 1,
      "question": "Scenario-based question...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Detailed explanation of why this is correct and why others are wrong.",
      "difficulty": "medium"
    }}
  ]
}}"""
        try:
            from app.core.settings import settings
            response = gemini_service.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            data = parse_json_from_llm(response.text)
            if data and data.get("questions"):
                return data
        except Exception as e:
            log.warning("Gemini quiz failed for [%s]: %s", skill, e)
        return None

    async def get_study_materials(self, skill: str, existing_skills: str = "") -> Dict[str, Any]:
        """
        Full RAG pipeline for study material generation.
        1. Redis cache -> 2. PGVector retrieval -> 3. LLM generation -> 4. Judge -> 5. Cache.
        Falls back to Supabase knowledge cache, then Gemini, then Bytez, then static.
        """
        # 1. Try the full RAG pipeline (Redis + PGVector + Judge)
        try:
            from app.services.rag_service import generate_rag_tutorial
            result = await generate_rag_tutorial(
                skill=skill,
                existing_skills=existing_skills,
                model=bytez_service.model if self.bytez_key else None
            )
            if result and not result.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, result, "study")
                return result
        except Exception as e:
            log.warning("RAG pipeline error for [%s]: %s -- falling back.", skill, e)

        # 2. Supabase knowledge cache
        cached = knowledge_service.get_cached_knowledge(skill, "study")
        if cached:
            return cached

        # 3. Direct Gemini (no RAG)
        if self.gemini_key:
            gemini_result = await self._gemini_study_materials(skill, existing_skills)
            if gemini_result:
                knowledge_service.cache_knowledge(skill, gemini_result, "study")
                return gemini_result

        # 4. Direct Bytez (no RAG, no cache)
        if self.bytez_key:
            res = await bytez_service.get_study_materials(skill, existing_skills)
            if res and not res.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, res, "study")
            return res

        return {
            "skill": skill,
            "quick_summary": f"Fundamentals of {skill}.",
            "key_concepts": [{"title": "Basics", "description": "Core principles."}],
            "pro_tip": "Keep practicing.",
            "estimated_study_time": "30 mins",
            "is_fallback": True,
        }

    async def generate_quiz(self, skill: str) -> Dict[str, Any]:
        """Generates a quiz for a skill with Supabase caching."""
        cached = knowledge_service.get_cached_knowledge(skill, "quiz")
        if cached:
            return cached

        if self.bytez_key:
            res = await bytez_service.generate_quiz(skill)
            if res and not res.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, res, "quiz")
                return res

        # Gemini fallback for quiz
        if self.gemini_key:
            gemini_res = await self._gemini_quiz(skill)
            if gemini_res:
                knowledge_service.cache_knowledge(skill, gemini_res, "quiz")
                return gemini_res

        return {
            "skill": skill,
            "questions": [{
                "id": 1,
                "question": f"Is {skill} important?",
                "options": ["Yes", "No", "Maybe", "I don't know"],
                "correct_index": 0,
                "explanation": "Of course it is.",
            }],
            "is_fallback": True,
        }

    async def get_chat_response(self, skill: str, user_query: str, chat_history: list = [], context: str = "") -> str:
        """Study Hub AI Assistant -- answers doubts about a specific skill."""
        if not self.bytez_key:
            return "AI Chat assistant is currently unavailable. Please try again later."

        material = knowledge_service.get_cached_knowledge(skill, "study")
        material_context = ""
        if material:
            material_context = f"\nStudy Summary: {material.get('quick_summary', '')}"
            for section in material.get("detailed_content", [])[:2]:
                material_context += f"\n- {section.get('subheading', '')}: {section.get('explanation', '')[:200]}"

        system_prompt = (
            f"You are a senior tutor specializing in {skill}.\n"
            f"Student Background: {context}\n"
            f"{material_context}\n"
            "Behavior: Be concise, accurate, and give code examples when relevant."
        )

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(chat_history[-5:])
        messages.append({"role": "user", "content": user_query})

        try:
            result = bytez_service.model.run(messages)
            output = ""
            if hasattr(result, "output") and isinstance(result.output, dict):
                output = result.output.get("content", "")
            elif isinstance(result, dict):
                output = result.get("output", {}).get("content", "") if isinstance(result.get("output"), dict) else str(result.get("output", ""))
            else:
                output = str(result)
            return output
        except Exception as e:
            log.error("Chat failed: %s", e)
            return "Sorry, I couldn't process that. Could you rephrase?"




ai_service = AIService()
