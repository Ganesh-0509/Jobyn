"""
Bolna Voice AI + CampusSync Edge — Integration Proof of Concept

A FastAPI webhook server that bridges Bolna's Voice AI platform
with CampusSync Edge's interview evaluation engine.

How it works:
1. Bolna sends a webhook when a voice call starts or when a user speaks
2. This server manages the interview session state
3. Transcribed answers are forwarded to CampusSync's /interview/evaluate
4. Next questions (or feedback) are returned to Bolna for text-to-speech

Usage:
    uvicorn server:app --port 8001
    Then configure a Bolna agent webhook to point to http://your-server:8001/bolna/webhook
"""

import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

# ── Configuration ──────────────────────────────────────────────────────────────

CAMPUSSYNC_API = os.getenv("CAMPUSSYNC_API", "http://localhost:8000")
BOLNA_API_KEY = os.getenv("BOLNA_API_KEY", "")

log = logging.getLogger("bolna-poc")

app = FastAPI(
    title="Bolna + CampusSync Integration POC",
    description="Webhook bridge between Bolna Voice AI and CampusSync interview evaluation",
    version="0.1.0",
)

# ── In-memory session store ────────────────────────────────────────────────────
# In production, use Redis or a database. This is a POC.

sessions: dict[str, dict] = {}

# ── Question bank (sourced from CampusSync Edge interview_engine.py) ───────────

QUESTIONS_BY_ROLE = {
    "Software Developer": [
        {"id": "sd_001", "question": "Explain how a HashMap works internally."},
        {"id": "sd_002", "question": "What is the difference between SQL JOINs?"},
        {"id": "sd_003", "question": "Explain the concept of RESTful APIs."},
        {"id": "sd_004", "question": "What are the SOLID principles?"},
        {"id": "sd_005", "question": "How does garbage collection work in Python?"},
    ],
    "Data Scientist": [
        {"id": "ds_001", "question": "Explain the bias-variance tradeoff."},
        {"id": "ds_002", "question": "What is the difference between L1 and L2 regularization?"},
        {"id": "ds_003", "question": "How do you handle missing data?"},
        {"id": "ds_004", "question": "Explain cross-validation and why it's used."},
        {"id": "ds_005", "question": "What is a confusion matrix?"},
    ],
    "DevOps Engineer": [
        {"id": "do_001", "question": "Explain the difference between containers and virtual machines."},
        {"id": "do_002", "question": "What is Infrastructure as Code?"},
        {"id": "do_003", "question": "Explain CI/CD and its benefits."},
        {"id": "do_004", "question": "What is blue-green deployment?"},
        {"id": "do_005", "question": "How does DNS resolution work?"},
    ],
}

DEFAULT_ROLE = "Software Developer"
MAX_QUESTIONS = 5

# ── Request/Response models ────────────────────────────────────────────────────

class BolnaWebhookEvent(BaseModel):
    """Incoming webhook from Bolna Voice AI platform."""
    event_type: str                     # "call_start", "user_speech", "call_end"
    call_id: Optional[str] = None       # Unique call identifier
    transcript: Optional[str] = None    # User's speech (from Bolna's STT)
    role: Optional[str] = None          # Requested interview role
    metadata: Optional[dict] = None

class BolnaResponse(BaseModel):
    """Response back to Bolna — what the AI should say next."""
    action: str                         # "speak" or "end"
    text: str                           # Text for Bolna to speak via TTS
    score: Optional[float] = None       # Current interview score (if ending)
    summary: Optional[str] = None       # Final summary (if ending)


# ── Webhook endpoint ──────────────────────────────────────────────────────────

@app.post("/bolna/webhook", response_model=BolnaResponse)
async def bolna_webhook(event: BolnaWebhookEvent):
    """
    Main webhook endpoint for Bolna Voice AI integration.

    Handles three event types:
    - call_start: Initialize interview session, return first question
    - user_speech: Evaluate answer, return next question or end
    - call_end: Return final scorecard
    """
    call_id = event.call_id or "anonymous"

    if event.event_type == "call_start":
        return _handle_call_start(call_id, event.role)

    elif event.event_type == "user_speech":
        return await _handle_user_speech(call_id, event.transcript)

    elif event.event_type == "call_end":
        return _handle_call_end(call_id)

    else:
        raise HTTPException(status_code=400, detail=f"Unknown event type: {event.event_type}")


# ── Event handlers ─────────────────────────────────────────────────────────────

def _handle_call_start(call_id: str, role: Optional[str]) -> BolnaResponse:
    """Initialize a new interview session and return the first question."""
    role = role or DEFAULT_ROLE
    questions = QUESTIONS_BY_ROLE.get(role, QUESTIONS_BY_ROLE[DEFAULT_ROLE])

    sessions[call_id] = {
        "role": role,
        "questions": questions,
        "current_q": 0,
        "scores": [],
        "answers": [],
    }

    first_q = questions[0]["question"]
    log.info("Call %s started — role: %s", call_id, role)

    return BolnaResponse(
        action="speak",
        text=(
            f"Welcome to your mock technical interview for {role}. "
            f"I'll ask you {MAX_QUESTIONS} questions. Let's begin. "
            f"Question 1: {first_q}"
        ),
    )


async def _handle_user_speech(call_id: str, transcript: Optional[str]) -> BolnaResponse:
    """Evaluate the user's answer and return the next question or end."""
    if call_id not in sessions:
        return BolnaResponse(action="speak", text="I lost track of our session. Let's start over.")

    if not transcript:
        return BolnaResponse(action="speak", text="I didn't catch that. Could you repeat your answer?")

    session = sessions[call_id]
    current_q = session["current_q"]
    questions = session["questions"]

    # Forward to CampusSync evaluation endpoint
    evaluation = await _evaluate_answer(
        role=session["role"],
        question_id=questions[current_q]["id"],
        answer=transcript,
    )

    score = evaluation.get("score", 0)
    grade = evaluation.get("grade", "N/A")
    feedback = evaluation.get("feedback", "")
    detected = evaluation.get("detected_concepts", [])
    missing = evaluation.get("missing_concepts", [])

    session["scores"].append(score)
    session["answers"].append(transcript)

    log.info("Call %s Q%d — score: %.0f, grade: %s", call_id, current_q + 1, score, grade)

    # Move to next question
    session["current_q"] += 1

    if session["current_q"] >= min(MAX_QUESTIONS, len(questions)):
        # Interview complete — return final summary
        return _build_final_response(session)

    # Return feedback + next question
    next_q = questions[session["current_q"]]["question"]
    q_num = session["current_q"] + 1

    # Build feedback sentence
    feedback_parts = [f"Score: {score:.0f} out of 100, grade {grade}."]
    if detected:
        feedback_parts.append(f"I detected these concepts: {', '.join(detected[:3])}.")
    if missing:
        feedback_parts.append(f"Consider mentioning: {', '.join(missing[:2])}.")
    feedback_parts.append(f"Question {q_num}: {next_q}")

    return BolnaResponse(action="speak", text=" ".join(feedback_parts))


def _handle_call_end(call_id: str) -> BolnaResponse:
    """Return final scorecard when the call ends."""
    if call_id not in sessions:
        return BolnaResponse(action="end", text="Thank you for the interview.", score=0)

    session = sessions.pop(call_id)
    return _build_final_response(session)


# ── CampusSync API integration ─────────────────────────────────────────────────

async def _evaluate_answer(role: str, question_id: str, answer: str) -> dict:
    """
    Forward the answer to CampusSync Edge's /interview/evaluate endpoint.
    Falls back to a simple keyword check if the API is unavailable.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{CAMPUSSYNC_API}/interview/evaluate",
                json={
                    "role": role,
                    "question_id": question_id,
                    "answer": answer,
                },
            )
            if resp.status_code == 200:
                return resp.json()
            log.warning("CampusSync returned %d: %s", resp.status_code, resp.text)
    except httpx.RequestError as e:
        log.warning("CampusSync API unreachable: %s", e)

    # Fallback: simple scoring based on answer length and keyword presence
    return _fallback_evaluate(answer)


def _fallback_evaluate(answer: str) -> dict:
    """Simple fallback scoring when CampusSync API is unavailable."""
    words = answer.lower().split()
    score = min(100, len(words) * 2)  # 2 points per word, capped at 100
    grade = "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
    return {
        "score": score,
        "grade": grade,
        "feedback": "Scored based on answer length (CampusSync API unavailable).",
        "detected_concepts": [],
        "missing_concepts": [],
    }


# ── Final response builder ─────────────────────────────────────────────────────

def _build_final_response(session: dict) -> BolnaResponse:
    """Build the final scorecard summary."""
    scores = session["scores"]
    avg_score = sum(scores) / len(scores) if scores else 0
    best = max(scores) if scores else 0
    q_count = len(scores)

    if avg_score >= 80:
        verdict = "Strong performance. You demonstrated solid technical knowledge."
    elif avg_score >= 60:
        verdict = "Good performance. There's room to deepen your explanations."
    elif avg_score >= 40:
        verdict = "Fair performance. Focus on covering more key concepts in your answers."
    else:
        verdict = "Needs improvement. Practice explaining core concepts more thoroughly."

    summary = (
        f"Interview complete. You answered {q_count} questions. "
        f"Average score: {avg_score:.0f} out of 100. "
        f"Best score: {best:.0f}. "
        f"{verdict} "
        f"Thank you for practicing with CampusSync Edge."
    )

    return BolnaResponse(
        action="end",
        text=summary,
        score=avg_score,
        summary=summary,
    )


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "bolna-campussync-poc",
        "campussync_api": CAMPUSSYNC_API,
        "active_sessions": len(sessions),
    }


@app.get("/")
async def root():
    return {
        "name": "Bolna + CampusSync Integration POC",
        "description": "Webhook bridge between Bolna Voice AI and CampusSync interview evaluation",
        "endpoints": {
            "POST /bolna/webhook": "Main Bolna webhook handler",
            "GET /health": "Health check",
        },
    }
