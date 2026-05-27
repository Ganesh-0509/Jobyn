"""
feedback.py — API endpoints for prediction feedback / corrections.

POST /feedback          → submit a correction or confirmation
GET  /feedback/summary  → aggregated feedback statistics
GET  /feedback/corrections → labelled correction pairs for retraining
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.feedback_service import (
    submit_feedback,
    get_feedback_summary,
    get_correction_pairs,
)

router = APIRouter(prefix="/feedback", tags=["Feedback Loop"])


class FeedbackRequest(BaseModel):
    predicted_role: str
    correct_role: str | None = None
    score_feedback: str | None = Field(
        None, pattern="^(too_high|too_low|accurate)$"
    )
    comment: str | None = None
    analysis_id: int | None = None
    user_email: str | None = None


@router.post("")
def post_feedback(body: FeedbackRequest):
    """Submit a prediction correction or confirmation."""
    try:
        record = submit_feedback(
            predicted_role=body.predicted_role,
            correct_role=body.correct_role,
            score_feedback=body.score_feedback,
            comment=body.comment,
            analysis_id=body.analysis_id,
            user_email=body.user_email,
        )
        return {"status": "recorded", "feedback": record}
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")


@router.get("/summary")
def feedback_summary():
    """Return aggregated feedback statistics."""
    try:
        return get_feedback_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")


@router.get("/corrections")
def feedback_corrections():
    """
    Return all correction pairs where predicted ≠ correct.
    
    Each record is a labelled sample for retraining.
    """
    try:
        return {"corrections": get_correction_pairs()}
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
