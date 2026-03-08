import os
import json
import logging
import httpx
from typing import Optional, Dict, Any, List
from app.services.gemini_service import gemini_service
from app.services.bytez_service import bytez_service
from app.services.knowledge_service import knowledge_service
from app.utils.llm_utils import extract_content, parse_json_from_llm

log = logging.getLogger("ai_service")

# ── Section definitions for progressive generation ────────────────────────────
SECTION_DEFS = [
    {"idx": 0, "title": "Concept Foundation", "desc": "What it is, real-world analogy, why it matters"},
    {"idx": 1, "title": "Core Theory & How It Works", "desc": "Internals, mechanics, how things connect"},
    {"idx": 2, "title": "Implementation with Code", "desc": "Full working example with explanation"},
    {"idx": 3, "title": "Interview Patterns & Common Questions", "desc": "What interviewers ask, how to answer"},
    {"idx": 4, "title": "Practice Problems & LeetCode", "desc": "Curated problems with hints and difficulty"},
]


def _is_quality_content(data: dict) -> bool:
    """Check if generated content has enough quality (not truncated)."""
    dc = data.get("detailed_content", [])
    if len(dc) < 2:
        return False
    # At least 2 sections need code examples and key_takeaway
    good = sum(1 for s in dc if s.get("example") and s.get("key_takeaway"))
    return good >= 2


class AIService:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.bytez_key = os.getenv("BYTEZ_API_KEY")

    async def get_market_forecast(self, role: str, missing_skills: list) -> Dict[str, Any]:
        """Market forecast — checks Supabase cache first, then Bytez/Gemini, caches result."""
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

        knowledge_service.cache_knowledge(cache_key, result, "forecast")
        return result

    # ── Single-section generator (for progressive loading) ────────────────────

    def _section_prompt(self, skill: str, section_idx: int, existing_skills: str = "") -> str:
        """Build a focused prompt for ONE section only — much less likely to truncate."""
        sdef = SECTION_DEFS[section_idx]

        # Special prompt for the LeetCode/practice section
        if section_idx == 4:
            return f"""You are a senior coding interview coach.
Generate a practice problems section for: {skill}

Return valid JSON only:
{{
  "subheading": "Practice Problems & LeetCode",
  "explanation": "Overview of the key problem-solving patterns for {skill} (2 paragraphs max)",
  "example": "```python\\n# Full solution for a classic {skill} problem\\n# with comments explaining each step\\n```",
  "key_takeaway": "One sentence about the most important pattern to remember",
  "try_it": "Try solving the first Easy problem before looking at any hints",
  "complexity": "Varies by problem",
  "leetcode_problems": [
    {{
      "title": "Exact LeetCode Problem Name",
      "number": 1,
      "difficulty": "Easy",
      "url": "https://leetcode.com/problems/exact-slug/",
      "pattern": "Which pattern this problem tests (e.g. Two Pointers, Sliding Window)",
      "hint": "A helpful hint without giving away the solution",
      "description": "1-2 sentence problem summary: what you receive as input and what you must return",
      "example_input": "nums = [2, 7, 11, 15], target = 9",
      "example_output": "[0, 1]"
    }}
  ]
}}

RULES:
- Include exactly 5 real LeetCode problems relevant to {skill}. Use ACTUAL LeetCode problem names, numbers, and URL slugs.
- Mix difficulties: 2 Easy, 2 Medium, 1 Hard.
- The example code MUST solve one of the listed problems completely with comments.
- Every problem MUST have description, example_input, and example_output filled in.
- Each URL must be a real leetcode.com/problems/slug/ link.
- Do NOT invent fake problem numbers or names."""

        return f"""You are a senior interview curriculum architect.
Generate ONE detailed study section for: {skill}
Section: "{sdef['title']}" — {sdef['desc']}
Student already knows: [{existing_skills}]

Return valid JSON only (one object, NOT an array):
{{
  "subheading": "{sdef['title']}",
  "explanation": "Clear explanation with real-world analogy (2-3 paragraphs, under 200 words)",
  "algorithm": "Step 1: ...\\nStep 2: ... (if applicable, else omit this field)",
  "example": "```python\\n# Actual runnable code here — must be copy-pasteable\\nresult = compute()\\nprint(result)  # Output: ...\\n```",
  "key_takeaway": "One memorable sentence summarizing this section",
  "try_it": "Mini challenge: modify the code above to handle edge case X",
  "complexity": "Time: O(n), Space: O(1) (if applicable, else omit)"
}}

RULES:
- The example MUST be real runnable code in markdown fences.
- key_takeaway and try_it are REQUIRED.
- Keep explanation under 200 words.
- Return ONLY the JSON object, no extra text."""

    async def _generate_single_section(self, skill: str, section_idx: int, existing_skills: str = "") -> Optional[Dict[str, Any]]:
        """Generate a single section via Gemini (preferred) or Bytez."""
        prompt = self._section_prompt(skill, section_idx, existing_skills)

        def _validate_section(data, idx):
            """Validate section has required fields; extra check for LeetCode section."""
            if not data or not data.get("subheading"):
                return False
            if idx == 4 and not data.get("leetcode_problems"):
                log.warning("Section 4 missing leetcode_problems — rejecting")
                return False
            return True

        # Try Gemini first (better at structured JSON)
        if self.gemini_key and gemini_service.client:
            try:
                from app.core.settings import settings
                response = gemini_service.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                )
                data = parse_json_from_llm(response.text)
                if _validate_section(data, section_idx):
                    return data
            except Exception as e:
                log.warning("Gemini section %d failed for [%s]: %s", section_idx, skill, e)

        # Bytez fallback
        if self.bytez_key and bytez_service.model:
            try:
                res = bytez_service.model.run([{"role": "user", "content": prompt}])
                content = extract_content(res)
                data = parse_json_from_llm(content)
                if _validate_section(data, section_idx):
                    return data
            except Exception as e:
                log.warning("Bytez section %d failed for [%s]: %s", section_idx, skill, e)

        # Retry once for section 4 with a more explicit prompt
        if section_idx == 4:
            log.info("Retrying LeetCode section with explicit prompt for [%s]", skill)
            retry_prompt = self._section_prompt(skill, 4, existing_skills)
            retry_prompt += "\n\nIMPORTANT: The leetcode_problems array is REQUIRED. Do NOT omit it."
            for provider in ['gemini', 'bytez']:
                try:
                    if provider == 'gemini' and self.gemini_key and gemini_service.client:
                        from app.core.settings import settings
                        resp = gemini_service.client.models.generate_content(
                            model=settings.GEMINI_MODEL, contents=retry_prompt)
                        data = parse_json_from_llm(resp.text)
                    elif provider == 'bytez' and self.bytez_key and bytez_service.model:
                        res = bytez_service.model.run([{"role": "user", "content": retry_prompt}])
                        data = parse_json_from_llm(extract_content(res))
                    else:
                        continue
                    if data and data.get("leetcode_problems"):
                        return data
                except Exception as e:
                    log.warning("Retry %s section 4 failed: %s", provider, e)

        return None

    async def get_study_section(self, skill: str, section_idx: int, existing_skills: str = "") -> Dict[str, Any]:
        """
        Generate or retrieve a single section for progressive loading.
        Checks Supabase section cache first.
        """
        cache_key = f"{skill.lower()}_section_{section_idx}"
        cached = knowledge_service.get_cached_knowledge(cache_key, "section")
        if cached:
            return cached

        section = await self._generate_single_section(skill, section_idx, existing_skills)
        if section:
            knowledge_service.cache_knowledge(cache_key, section, "section")
            return section

        sdef = SECTION_DEFS[section_idx] if section_idx < len(SECTION_DEFS) else {"title": "Section", "desc": ""}
        return {
            "subheading": sdef["title"],
            "explanation": f"Content for {sdef['title']} is being generated. Please try again in a moment.",
            "is_fallback": True,
        }

    # ── Full study materials (intro-first approach) ───────────────────────────

    async def _gemini_study_intro(self, skill: str, existing_skills: str = "") -> Optional[Dict[str, Any]]:
        """Generate just the intro/overview + first section via Gemini (fast, small output)."""
        if not self.gemini_key or not gemini_service.client:
            return None

        prompt = f"""You are a senior interview curriculum architect.
Generate a study guide OVERVIEW with the first section for: {skill}
Student already knows: [{existing_skills}]

Return this exact JSON:
{{
  "skill": "{skill}",
  "quick_summary": "2-3 sentence overview of {skill} and why it matters for interviews",
  "estimated_study_time": "45 minutes",
  "sub_roadmap": [
    {{"title": "Concept Foundation", "duration": "10 minutes"}},
    {{"title": "Core Theory & How It Works", "duration": "10 minutes"}},
    {{"title": "Implementation with Code", "duration": "10 minutes"}},
    {{"title": "Interview Patterns & Common Questions", "duration": "10 minutes"}},
    {{"title": "Practice Problems & LeetCode", "duration": "5 minutes"}}
  ],
  "detailed_content": [
    {{
      "subheading": "Concept Foundation",
      "explanation": "Clear explanation with real-world analogy (2-3 paragraphs)",
      "algorithm": "Step 1: ...\\nStep 2: ...",
      "example": "```python\\n# Actual runnable code\\nresult = compute()\\nprint(result)\\n```",
      "key_takeaway": "One memorable sentence",
      "try_it": "Mini challenge for the student",
      "complexity": "Time: O(n), Space: O(1)"
    }}
  ],
  "pro_tip": "Industry expert tip about {skill}...",
  "total_sections": 5
}}

RULES:
- detailed_content should have ONLY 1 section (the Concept Foundation).
- The example MUST be real runnable code.
- key_takeaway and try_it are REQUIRED.
- pro_tip must be a genuine industry insight, not empty."""
        try:
            from app.core.settings import settings
            response = gemini_service.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            data = parse_json_from_llm(response.text)
            if data and data.get("detailed_content") and data.get("quick_summary"):
                data["sources"] = [{"title": skill, "source_type": "Gemini AI", "version": settings.GEMINI_MODEL}]
                data["total_sections"] = 5
                return data
        except Exception as e:
            log.warning("Gemini study intro failed for [%s]: %s", skill, e)
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
        Progressive study material generation.
        Returns the overview + first section quickly.
        Remaining sections are loaded on-demand via get_study_section().
        """
        # 1. Supabase knowledge cache (full version from previous complete generation)
        cached = knowledge_service.get_cached_knowledge(skill, "study")
        if cached and _is_quality_content(cached):
            cached["total_sections"] = max(cached.get("total_sections", 5), len(cached.get("detailed_content", [])))
            return cached

        # 2. Try RAG pipeline
        try:
            from app.services.rag_service import generate_rag_tutorial
            result = await generate_rag_tutorial(
                skill=skill,
                existing_skills=existing_skills,
                model=bytez_service.model if self.bytez_key else None
            )
            if result and not result.get("is_fallback") and _is_quality_content(result):
                result["total_sections"] = len(result.get("detailed_content", []))
                knowledge_service.cache_knowledge(skill, result, "study")
                return result
        except Exception as e:
            log.warning("RAG pipeline error for [%s]: %s -- falling back.", skill, e)

        # 3. Gemini intro-first (fast — generates only overview + section 1)
        if self.gemini_key:
            intro = await self._gemini_study_intro(skill, existing_skills)
            if intro:
                # Cache the intro — section endpoint fills the rest
                knowledge_service.cache_knowledge(skill, intro, "study")
                return intro

        # 4. Bytez fallback
        if self.bytez_key:
            res = await bytez_service.get_study_materials(skill, existing_skills)
            if res and not res.get("is_fallback"):
                res["total_sections"] = 5
                knowledge_service.cache_knowledge(skill, res, "study")
                return res

        return {
            "skill": skill,
            "quick_summary": f"Fundamentals of {skill}.",
            "key_concepts": [{"title": "Basics", "description": "Core principles."}],
            "pro_tip": "Keep practicing.",
            "estimated_study_time": "30 mins",
            "total_sections": 5,
            "is_fallback": True,
        }

    async def generate_quiz(self, skill: str) -> Dict[str, Any]:
        """Generates a quiz for a skill with Supabase caching."""
        cached = knowledge_service.get_cached_knowledge(skill, "quiz")
        if cached:
            return cached

        # Try Gemini first (better output quality)
        if self.gemini_key:
            gemini_res = await self._gemini_quiz(skill)
            if gemini_res:
                knowledge_service.cache_knowledge(skill, gemini_res, "quiz")
                return gemini_res

        if self.bytez_key:
            res = await bytez_service.generate_quiz(skill)
            if res and not res.get("is_fallback"):
                knowledge_service.cache_knowledge(skill, res, "quiz")
                return res

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
