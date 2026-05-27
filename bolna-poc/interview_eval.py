"""
interview_eval.py — Interview evaluation logic.

Extracted from CampusSync Edge's interview_engine.py
(https://github.com/Ganesh-0509/CampusSync-Edge)

This module provides keyword/concept matching for evaluating
interview answers. No LLM required — runs fully on-device.
"""

from __future__ import annotations
import re
from typing import Optional

# ── Question Bank (subset for POC) ──────────────────────────────────────

QUESTION_BANK: dict[str, list[dict]] = {
    "Software Developer": [
        {
            "id": "sd_001",
            "question": "Explain how a HashMap (or Python dict) works internally.",
            "concepts": [
                "hash function", "collision", "bucket", "key", "value",
                "load factor", "O(1)", "equals", "hashcode", "chaining",
                "open addressing",
            ],
            "difficulty": "Intermediate",
        },
        {
            "id": "sd_002",
            "question": "What is the difference between SQL JOINs (INNER, LEFT, RIGHT, FULL)?",
            "concepts": [
                "inner join", "left join", "right join", "full join",
                "null", "matching rows", "foreign key", "on clause",
            ],
            "difficulty": "Beginner",
        },
        {
            "id": "sd_003",
            "question": "Explain the difference between REST and GraphQL APIs.",
            "concepts": [
                "rest", "graphql", "endpoint", "query", "mutation",
                "over-fetching", "under-fetching", "schema", "http methods",
                "stateless",
            ],
            "difficulty": "Intermediate",
        },
        {
            "id": "sd_004",
            "question": "What are the SOLID principles in object-oriented design?",
            "concepts": [
                "single responsibility", "open closed", "liskov substitution",
                "interface segregation", "dependency inversion", "solid",
            ],
            "difficulty": "Intermediate",
        },
        {
            "id": "sd_005",
            "question": "How does garbage collection work in Python?",
            "concepts": [
                "reference counting", "garbage collector", "circular reference",
                "generational", "gc module", "memory management", "del",
                "weakref", "mark and sweep",
            ],
            "difficulty": "Advanced",
        },
    ],
    "Data Scientist": [
        {
            "id": "ds_001",
            "question": "Explain the bias-variance tradeoff in machine learning.",
            "concepts": [
                "bias", "variance", "overfitting", "underfitting",
                "model complexity", "generalization", "training error",
                "test error", "regularization",
            ],
            "difficulty": "Intermediate",
        },
        {
            "id": "ds_002",
            "question": "What is the difference between L1 and L2 regularization?",
            "concepts": [
                "l1", "l2", "lasso", "ridge", "sparsity", "feature selection",
                "penalty", "lambda", "coefficients", "shrinkage",
            ],
            "difficulty": "Advanced",
        },
    ],
    "DevOps Engineer": [
        {
            "id": "do_001",
            "question": "Explain the difference between containers and virtual machines.",
            "concepts": [
                "container", "virtual machine", "docker", "hypervisor",
                "kernel", "isolation", "overhead", "startup time",
                "image", "os-level",
            ],
            "difficulty": "Beginner",
        },
    ],
}


def get_questions_for_role(role: str) -> list[dict]:
    """Get interview questions for a given role."""
    return QUESTION_BANK.get(role, [])


def normalize(text: str) -> str:
    """Normalize text for comparison."""
    return re.sub(r"[^\w\s]", "", text.lower().strip())


def evaluate_answer(role: str, question: str, answer: str) -> dict:
    """
    Evaluate a single interview answer against expected concepts.

    Returns:
        dict with keys: score, concepts_found, concepts_missing,
        matched_ratio, difficulty, tip
    """
    # Find the question in the bank
    questions = get_questions_for_role(role)
    matched_q = None

    # Try exact match first, then fuzzy
    for q in questions:
        q_norm = normalize(q["question"])
        input_norm = normalize(question)
        # Check if significant overlap
        q_words = set(q_norm.split())
        input_words = set(input_norm.split())
        overlap = len(q_words & input_words) / max(len(q_words), 1)
        if overlap > 0.5:
            matched_q = q
            break

    if not matched_q:
        # Fallback: generic evaluation
        return _generic_evaluate(answer)

    concepts = [c.lower() for c in matched_q["concepts"]]
    answer_lower = answer.lower()

    found = [c for c in concepts if c in answer_lower]
    missing = [c for c in concepts if c not in answer_lower]
    ratio = len(found) / len(concepts) if concepts else 0

    score = min(100, int(ratio * 100 + 10))  # +10 bonus for effort

    return {
        "score": score,
        "concepts_found": found,
        "concepts_missing": missing,
        "matched_ratio": round(ratio, 2),
        "difficulty": matched_q.get("difficulty", "Unknown"),
        "tip": matched_q.get("tip", ""),
    }


def _generic_evaluate(answer: str) -> dict:
    """Evaluate an answer when no matching question is found."""
    words = answer.split()
    length = len(words)

    if length < 10:
        score = 30
        feedback = "Answer is too short. Provide more detail."
    elif length < 30:
        score = 55
        feedback = "Decent answer, but could be more comprehensive."
    elif length < 80:
        score = 75
        feedback = "Good length. Covers the topic reasonably well."
    else:
        score = 85
        feedback = "Detailed answer. Good depth of explanation."

    return {
        "score": score,
        "concepts_found": [],
        "concepts_missing": [],
        "matched_ratio": 0,
        "difficulty": "Unknown",
        "tip": feedback,
    }
