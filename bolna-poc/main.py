"""
Bolna Voice AI Integration — Proof of Concept

FastAPI server that receives Bolna voice call transcripts,
evaluates candidate answers, and returns structured feedback.

Uses the same interview evaluation logic as CampusSync Edge.
"""

import json
import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from interview_eval import evaluate_answer, get_questions_for_role

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bolna-poc")

app = FastAPI(
    title="Bolna x CampusSync Integration",
    description="Voice AI interview evaluation powered by CampusSync Edge",
    version="0.1.0",
)


# ── Models ──────────────────────────────────────────────────────────────

class TranscriptEntry(BaseModel):
    speaker: str = Field(..., description="'agent' or 'user'")
    text: str


class BolnaWebhookPayload(BaseModel):
    call_id: str
    candidate_name: str = "Candidate"
    role: str = "Software Developer"
    transcript: list[TranscriptEntry]
    duration_seconds: int = 0
    metadata: dict = {}


class EvaluationResult(BaseModel):
    call_id: str
    score: float
    max_score: float = 100
    verdict: str
    strengths: list[str]
    gaps: list[str]
    feedback: str
    recommended_skills: list[str]
    evaluation_method: str
    questions_asked: int
    answers_evaluated: int


class SimulateRequest(BaseModel):
    role: str = "Software Developer"
    answers: list[str] = Field(
        default=[],
        description="List of candidate answers. If empty, uses demo answers."
    )


# ── Core Logic ──────────────────────────────────────────────────────────

def extract_qa_pairs(transcript: list[TranscriptEntry]) -> list[dict]:
    """Extract question-answer pairs from a Bolna call transcript."""
    pairs = []
    current_question = None

    for entry in transcript:
        if entry.speaker == "agent":
            current_question = entry.text
        elif entry.speaker == "user" and current_question:
            pairs.append({
                "question": current_question,
                "answer": entry.text,
            })
            current_question = None

    return pairs


def evaluate_transcript(
    role: str,
    transcript: list[TranscriptEntry],
    metadata: dict = None,
) -> dict:
    """Evaluate a full interview transcript and return structured feedback."""
    qa_pairs = extract_qa_pairs(transcript)

    if not qa_pairs:
        return {
            "score": 0,
            "verdict": "No valid Q&A pairs found",
            "strengths": [],
            "gaps": [],
            "feedback": "Could not extract question-answer pairs from the transcript.",
            "recommended_skills": [],
            "evaluation_method": "none",
            "questions_asked": 0,
            "answers_evaluated": 0,
        }

    all_strengths = set()
    all_gaps = set()
    total_score = 0
    evaluations = []

    for qa in qa_pairs:
        # Try to match the question to our bank
        result = evaluate_answer(role, qa["question"], qa["answer"])
        total_score += result.get("score", 0)
        all_strengths.update(result.get("concepts_found", []))
        all_gaps.update(result.get("concepts_missing", []))
        evaluations.append(result)

    avg_score = total_score / len(qa_pairs) if qa_pairs else 0

    # Determine verdict
    if avg_score >= 85:
        verdict = "Excellent"
    elif avg_score >= 70:
        verdict = "Good"
    elif avg_score >= 50:
        verdict = "Needs Improvement"
    else:
        verdict = "Insufficient"

    # Generate feedback
    feedback_parts = []
    if all_strengths:
        feedback_parts.append(f"Strong areas: {', '.join(list(all_strengths)[:5])}.")
    if all_gaps:
        feedback_parts.append(f"Areas to improve: {', '.join(list(all_gaps)[:5])}.")
    feedback_parts.append(
        f"Answered {len(qa_pairs)} question(s) with an average score of {avg_score:.0f}/100."
    )

    return {
        "score": round(avg_score, 1),
        "verdict": verdict,
        "strengths": list(all_strengths)[:10],
        "gaps": list(all_gaps)[:10],
        "feedback": " ".join(feedback_parts),
        "recommended_skills": list(all_gaps)[:5],  # skills to work on
        "evaluation_method": "keyword_concept_matching",
        "questions_asked": len(qa_pairs),
        "answers_evaluated": len(evaluations),
    }


# ── Endpoints ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "bolna-x-campussync", "version": "0.1.0"}


@app.post("/webhook/bolna", response_model=EvaluationResult)
async def bolna_webhook(payload: BolnaWebhookPayload):
    """
    Receive a Bolna voice call transcript and evaluate the candidate.

    This endpoint is designed to be registered as a Bolna webhook URL.
    When a Bolna voice interview call completes, Bolna sends the
    transcript here for evaluation.
    """
    log.info(
        "Received Bolna webhook: call_id=%s, role=%s, entries=%d",
        payload.call_id,
        payload.role,
        len(payload.transcript),
    )

    result = evaluate_transcript(payload.role, payload.transcript, payload.metadata)
    result["call_id"] = payload.call_id
    result["max_score"] = 100

    log.info(
        "Evaluation complete: call_id=%s, score=%.1f, verdict=%s",
        payload.call_id,
        result["score"],
        result["verdict"],
    )

    return result


@app.post("/simulate")
async def simulate_interview(req: SimulateRequest):
    """
    Run a simulated interview without Bolna.
    Uses the question bank and evaluates provided answers.
    Useful for testing the evaluation logic.
    """
    questions = get_questions_for_role(req.role)

    if not questions:
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for role: {req.role}"
        )

    # Use provided answers or generate demo answers
    answers = req.answers
    if not answers:
        answers = [
            "A HashMap uses a hash function to convert keys into array indices. When there's a collision, it uses chaining or open addressing to store multiple values at the same index.",
            "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table and matching rows from the right. RIGHT JOIN is the opposite.",
            "REST is an architectural style using HTTP methods (GET, POST, PUT, DELETE) for stateless communication. It uses standard HTTP status codes and JSON for data exchange.",
        ]

    # Build synthetic transcript
    transcript = []
    for i, q in enumerate(questions[: len(answers)]):
        transcript.append(TranscriptEntry(speaker="agent", text=q["question"]))
        transcript.append(TranscriptEntry(speaker="user", text=answers[i]))

    result = evaluate_transcript(req.role, transcript)
    result["call_id"] = f"sim_{req.role.lower().replace(' ', '_')}"
    result["max_score"] = 100

    return result


# ── Main ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 9000))
    log.info("Starting Bolna x CampusSync integration on port %d", port)
    uvicorn.run(app, host="0.0.0.0", port=port)
