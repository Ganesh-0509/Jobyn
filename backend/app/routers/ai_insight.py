from datetime import date
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.ai_service import ai_service
from app.services.interview_service import interview_service
from app.services.curriculum_graph import (
    get_prerequisites, get_unlocked_skills, get_learning_path,
    get_curriculum_overview, can_unlock, CURRICULUM_GRAPH,
)
from app.core.rate_limiter import ai_limit, heavy_limit
from app.services.knowledge_service import knowledge_service
from app.core.auth import get_admin_user

router = APIRouter(prefix="/ai", tags=["AI Insights"])

class ForecastRequest(BaseModel):
    role: str
    missing_skills: List[str]

class ChatRequest(BaseModel):
    skill: str
    query: str
    history: Optional[List[dict]] = []
    mastered_skills: Optional[List[str]] = []

class ContributionRequest(BaseModel):
    skill: str
    submitted_by: str
    notes_content: Dict[str, Any]

class SmartPlanRequest(BaseModel):
    """Build a dependency-aware learning plan."""
    missing_core_skills: List[str]
    missing_optional_skills: List[str] = []
    mastered_skills: List[str] = []
    daily_hours: float = 2.0
    deadline: Optional[str] = None  # ISO date string e.g. "2026-03-22"


# ── Smart Plan Endpoint ──────────────────────────────────────────────────────


def _resolve_full_path(
    missing_skills: List[str],
    mastered: List[str],
) -> List[Dict[str, Any]]:
    """
    Build a topologically-sorted learning path that respects the
    curriculum dependency graph.  Each skill in the final list includes
    its prerequisites and what it unlocks.
    """
    mastered_set = {s.lower().strip() for s in mastered}
    seen: set = set()
    ordered: List[str] = []

    def dfs(skill: str):
        norm = skill.lower().strip()
        if norm in seen or norm in mastered_set:
            return
        seen.add(norm)
        for prereq in CURRICULUM_GRAPH.get(norm, []):
            dfs(prereq)
        ordered.append(norm)

    for skill in missing_skills:
        dfs(skill)

    # Build rich items with metadata
    items: List[Dict[str, Any]] = []
    # Reverse map: what does each skill unlock?
    unlocks_map: Dict[str, List[str]] = {}
    for s, prereqs in CURRICULUM_GRAPH.items():
        for p in prereqs:
            unlocks_map.setdefault(p, []).append(s)

    for idx, skill in enumerate(ordered):
        prereqs = [p for p in CURRICULUM_GRAPH.get(skill, []) if p not in mastered_set]
        unlocks = [u for u in unlocks_map.get(skill, []) if u in seen]
        is_target = skill in {s.lower().strip() for s in missing_skills}

        # Estimate study time based on prerequisite depth
        depth = len(CURRICULUM_GRAPH.get(skill, []))
        if depth >= 3:
            minutes = 150
            difficulty = "Advanced"
        elif depth >= 1:
            minutes = 90
            difficulty = "Intermediate"
        else:
            minutes = 60
            difficulty = "Foundational"

        items.append({
            "id": f"sp-{idx}",
            "skill": skill,
            "title": f"{'Master' if is_target else 'Learn'} {skill.title()}",
            "prerequisites": prereqs,
            "unlocks": unlocks,
            "is_target_skill": is_target,
            "is_prerequisite": not is_target,
            "difficulty": difficulty,
            "duration_minutes": minutes,
            "order": idx,
        })

    return items


@router.post("/smart-plan")
@heavy_limit
async def build_smart_plan(request: Request, req: SmartPlanRequest):
    """
    Build a dependency-aware learning plan.  Returns an ordered list of
    skills with prerequisites, unlock chains, and day-by-day scheduling.
    Supports optional deadline mode.
    """
    all_missing = req.missing_core_skills + req.missing_optional_skills
    if not all_missing:
        raise HTTPException(status_code=400, detail="No missing skills provided.")

    items = _resolve_full_path(all_missing, req.mastered_skills)

    # ── Day-by-day scheduling ───────────────────────────────────────
    daily_minutes = req.daily_hours * 60

    # If deadline is set, calculate required daily hours
    recommended_daily = req.daily_hours
    days_available = None
    if req.deadline:
        try:
            deadline_date = date.fromisoformat(req.deadline)
            today = date.today()
            delta = (deadline_date - today).days
            if delta > 0:
                days_available = delta
                total_minutes = sum(i["duration_minutes"] for i in items)
                needed_daily = total_minutes / delta
                recommended_daily = round(max(needed_daily / 60, 0.5), 1)
                # Use the recommended daily if it's higher than what user set
                if needed_daily > daily_minutes:
                    daily_minutes = needed_daily
        except ValueError:
            pass

    schedule: List[Dict[str, Any]] = []
    current_day = 1
    day_minutes = 0

    for item in items:
        if day_minutes + item["duration_minutes"] > daily_minutes and schedule:
            last_day = schedule[-1]["day"]
            if last_day == current_day:
                current_day += 1
                day_minutes = 0

        item["scheduled_day"] = current_day
        schedule.append({"day": current_day, **item})
        day_minutes += item["duration_minutes"]

        if day_minutes >= daily_minutes:
            current_day += 1
            day_minutes = 0

    total_days = current_day if day_minutes > 0 else current_day - 1
    total_days = max(total_days, 1)
    total_minutes = sum(i["duration_minutes"] for i in items)
    target_count = sum(1 for i in items if i["is_target_skill"])
    prereq_count = sum(1 for i in items if i["is_prerequisite"])

    return {
        "schedule": schedule,
        "total_skills": len(items),
        "target_skills": target_count,
        "prerequisite_skills": prereq_count,
        "total_days": total_days,
        "total_hours": round(total_minutes / 60, 1),
        "daily_hours": req.daily_hours,
        "recommended_daily_hours": recommended_daily,
        "days_available": days_available,
        "deadline": req.deadline,
    }


@router.post("/market-forecast")
@ai_limit
async def get_forecast(request: Request, req: ForecastRequest):
    """Get a dynamic market forecast."""
    if not req.role or not req.missing_skills:
        raise HTTPException(status_code=400, detail="Role and missing skills required.")
    return await ai_service.get_market_forecast(req.role, req.missing_skills)

@router.get("/study/notes")
@ai_limit
async def get_study_notes(request: Request, skill: str, existing_skills: Optional[str] = None):
    """Generates study notes for a specific skill (intro + first section)."""
    if not skill:
        raise HTTPException(status_code=400, detail="Skill name is required.")
    return await ai_service.get_study_materials(skill, existing_skills or "")

@router.get("/study/section")
@ai_limit
async def get_study_section(request: Request, skill: str, section_idx: int, existing_skills: Optional[str] = None):
    """Generates a single study section on-demand for progressive loading."""
    if not skill:
        raise HTTPException(status_code=400, detail="Skill name is required.")
    if section_idx < 0 or section_idx > 4:
        raise HTTPException(status_code=400, detail="section_idx must be 0-4.")
    return await ai_service.get_study_section(skill, section_idx, existing_skills or "")

@router.get("/study/quiz")
@ai_limit
async def get_study_quiz(request: Request, skill: str):
    """Generates a verification quiz for a specific skill."""
    if not skill:
        raise HTTPException(status_code=400, detail="Skill name is required.")
    return await ai_service.generate_quiz(skill)

@router.post("/study/chat")
@ai_limit
async def study_chat(request: Request, req: ChatRequest):
    """Provides a chat interface for a specific skill."""
    if not req.skill or not req.query:
        raise HTTPException(status_code=400, detail="Skill and query are required.")
    
    context = f"Student already knows: {', '.join(req.mastered_skills or [])}"
    content = await ai_service.get_chat_response(req.skill, req.query, req.history, context)
    return {"response": content}


# ── AI Interview Simulator ────────────────────────────────────────────────────

class InterviewStartRequest(BaseModel):
    skill: str
    difficulty: str = "medium"  # easy | medium | hard
    role: Optional[str] = ""

class InterviewAnswerRequest(BaseModel):
    skill: str
    question: str
    answer: str
    question_number: int = 1
    difficulty: str = "medium"
    history: Optional[List[Dict[str, Any]]] = []

class InterviewEndRequest(BaseModel):
    skill: str
    difficulty: str = "medium"
    history: List[Dict[str, Any]]


@router.post("/interview/start")
@ai_limit
async def start_interview(request: Request, req: InterviewStartRequest):
    """Start a mock interview session — returns the first question."""
    if not req.skill:
        raise HTTPException(status_code=400, detail="Skill is required.")
    return await interview_service.start_interview(req.skill, req.difficulty, req.role)


@router.post("/interview/answer")
@ai_limit
async def evaluate_interview_answer(request: Request, req: InterviewAnswerRequest):
    """Evaluate the candidate's answer and return a follow-up question."""
    if not req.skill or not req.answer:
        raise HTTPException(status_code=400, detail="Skill and answer are required.")
    return await interview_service.evaluate_answer(
        skill=req.skill,
        question=req.question,
        answer=req.answer,
        question_number=req.question_number,
        difficulty=req.difficulty,
        history=req.history or [],
    )


@router.post("/interview/end")
@ai_limit
async def end_interview(request: Request, req: InterviewEndRequest):
    """End the interview and return a comprehensive scorecard."""
    if not req.history:
        raise HTTPException(status_code=400, detail="Interview history is required.")
    return await interview_service.end_interview(req.skill, req.difficulty, req.history)


# ── Community & Admin Routes ──
def _sb():
    from app.core.supabase_client import get_supabase
    return get_supabase()

@router.post("/study/contribute")
@heavy_limit
async def submit_contribution(request: Request, req: ContributionRequest):
    from app.utils.validation import sanitize_plain, sanitize_recursive
    
    clean_skill = sanitize_plain(req.skill).lower()
    clean_submitted_by = sanitize_plain(req.submitted_by)
    clean_content = sanitize_recursive(req.notes_content)
    
    if not clean_skill or not clean_submitted_by or not clean_content:
        raise HTTPException(status_code=400, detail="Invalid contribution input data.")

    try:
        sb = _sb()
        sb.table("contributions").insert({
            "topic": clean_skill,
            "submitted_by": clean_submitted_by,
            "content": clean_content,
            "status": "pending",
        }).execute()
        return {"status": "success", "message": "Contribution submitted for review."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit contribution: {e}")

@router.get("/admin/contributions")
async def get_pending_contributions(admin=Depends(get_admin_user)):
    try:
        sb = _sb()
        resp = (
            sb.table("contributions")
            .select("*")
            .eq("status", "pending")
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch contributions: {e}")

@router.post("/admin/contributions/{id}/approve")
async def approve_contribution(id: int, admin=Depends(get_admin_user)):
    try:
        sb = _sb()
        # Fetch the contribution
        resp = sb.table("contributions").select("*").eq("id", id).limit(1).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Not found")
        contrib = resp.data[0]

        # Move content to knowledge cache
        knowledge_service.cache_knowledge(contrib["topic"], contrib["content"], "study")

        # Mark as approved
        sb.table("contributions").update({"status": "approved"}).eq("id", id).execute()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Approval failed: {e}")

@router.post("/admin/contributions/{id}/reject")
async def reject_contribution(id: int, admin=Depends(get_admin_user)):
    try:
        sb = _sb()
        resp = sb.table("contributions").update({"status": "rejected"}).eq("id", id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rejection failed: {e}")

@router.get("/admin/stats")
async def get_admin_stats(admin=Depends(get_admin_user)):
    try:
        sb = _sb()

        # Contribution counts
        pending_resp = sb.table("contributions").select("id", count="exact").eq("status", "pending").execute()
        approved_resp = sb.table("contributions").select("id", count="exact").eq("status", "approved").execute()
        pending = pending_resp.count if pending_resp.count is not None else len(pending_resp.data or [])
        approved = approved_resp.count if approved_resp.count is not None else len(approved_resp.data or [])

        # Knowledge cache topic count
        total_skills = knowledge_service.get_all_topics_count()

        # Active students (unique emails from resumes)
        active_students = 0
        resp = sb.table("resumes").select("user_email", count="exact").execute()
        emails = set(r.get("user_email") for r in resp.data if r.get("user_email"))
        active_students = len(emails)

    except Exception:
        pending = 0
        approved = 0
        total_skills = 0
        active_students = 0

    return {
        "pending_reviews": pending,
        "approved_contributions": approved,
        "total_courses_cached": total_skills,
        "active_students": active_students,
    }


# ── Curriculum Graph Routes ──────────────────────────────────────────────────

class CurriculumRequest(BaseModel):
    mastered_skills: List[str]

class UnlockCheckRequest(BaseModel):
    skill: str
    mastered_skills: List[str]
    quiz_score: Optional[float] = 0.0


@router.get("/curriculum/overview")
def curriculum_overview():
    """Returns the full skill dependency graph and metadata."""
    return get_curriculum_overview()


@router.get("/curriculum/prerequisites")
def skill_prerequisites(skill: str):
    """Returns prerequisite skills for a given topic."""
    prereqs = get_prerequisites(skill)
    return {"skill": skill, "prerequisites": prereqs}


@router.post("/curriculum/unlocked")
def unlocked_skills(req: CurriculumRequest):
    """Returns all skills unlocked based on the student's mastered skill set."""
    return {"mastered": req.mastered_skills, "unlocked": get_unlocked_skills(req.mastered_skills)}


@router.post("/curriculum/learning-path")
def learning_path(skill: str, req: CurriculumRequest):
    """Returns the ordered prerequisite learning path to reach a target skill."""
    path = get_learning_path(skill, req.mastered_skills)
    return {"target": skill, "learning_path": path, "total_steps": len(path)}


@router.post("/curriculum/can-unlock")
def check_unlock(req: UnlockCheckRequest):
    """Checks if a student can unlock a skill based on prerequisites and quiz score."""
    return can_unlock(req.skill, req.mastered_skills, req.quiz_score)
