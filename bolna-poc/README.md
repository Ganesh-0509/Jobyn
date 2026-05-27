# Bolna Voice AI Integration — Proof of Concept

> A FastAPI webhook that receives Bolna voice call transcripts, evaluates candidate answers using CampusSync Edge's interview engine, and returns structured feedback — bridging Bolna's Voice AI platform with CampusSync's career readiness intelligence.

## What This Does

1. **Bolna makes a voice call** to a candidate (simulating a technical interview)
2. **Bolna sends a webhook** with the call transcript to this server
3. **This server evaluates** the transcript using CampusSync's interview engine (keyword/concept matching + LLM-powered scoring)
4. **Returns structured feedback** — score, strengths, weaknesses, recommended next steps

## Architecture

```
┌──────────────┐     Webhook POST      ┌─────────────────────┐
│  Bolna Voice │ ──────────────────────▶ │  FastAPI Webhook    │
│  AI Platform │     (transcript)       │  (this server)      │
└──────────────┘                        └─────────┬───────────┘
                                                  │
                                                  ▼
                                        ┌─────────────────────┐
                                        │  Interview Engine   │
                                        │  (from CampusSync)  │
                                        └─────────┬───────────┘
                                                  │
                                                  ▼
                                        ┌─────────────────────┐
                                        │  Structured Result  │
                                        │  score + feedback   │
                                        └─────────────────────┘
```

## Quick Start

```bash
pip install fastapi uvicorn pydantic
python main.py
# Server runs at http://localhost:9000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook/bolna` | Receive Bolna call transcript, return evaluation |
| POST | `/simulate` | Run a simulated interview (no Bolna needed) |
| GET | `/health` | Health check |

## Webhook Payload Format

```json
{
  "call_id": "bolna_call_123",
  "candidate_name": "John Doe",
  "role": "Software Developer",
  "transcript": [
    {"speaker": "agent", "text": "Explain how a HashMap works internally."},
    {"speaker": "user", "text": "A HashMap uses a hash function to map keys to array indices..."}
  ],
  "duration_seconds": 180,
  "metadata": {"source": "bolna", "campaign": "campussync_mock_interview"}
}
```

## Response Format

```json
{
  "call_id": "bolna_call_123",
  "score": 78,
  "max_score": 100,
  "verdict": "Good",
  "strengths": ["hash function", "collision resolution", "O(1)"],
  "gaps": ["load factor", "equals/hashcode contract"],
  "feedback": "Strong understanding of core HashMap mechanics...",
  "recommended_skills": ["Advanced Data Structures", "System Design"],
  "evaluation_method": "hybrid"
}
```
