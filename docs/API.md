# API Reference — CampusSync Edge

> **Base URL**: `http://localhost:8000` (development) / `https://campussync-edge-api.onrender.com` (production)
>
> **Swagger UI**: `/docs` | **ReDoc**: `/redoc`

---

## Authentication

Most endpoints require a Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <supabase-access-token>
```

Three auth levels:
- **None** — No token required
- **Required** — Valid JWT required (401 if missing/invalid)
- **Admin** — Valid JWT + email in `ADMIN_EMAILS` env var (403 if not admin)

---

## Rate Limits

| Tier | Limit | Applies To |
|---|---|---|
| Default | 60/minute per IP | All endpoints |
| Upload | 10/minute per IP | `POST /upload` |
| AI | 20/minute per IP + 30/minute per user | LLM-powered endpoints |
| Heavy | 30/minute per IP | Computationally expensive endpoints |

Rate-limited responses return `429 Too Many Requests` with `retry_after` detail.

---

## Error Format

All errors return consistent JSON:

```json
{
  "detail": "Human-readable error message"
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Authentication required |
| 403 | Forbidden (not admin / IDOR check failed) |
| 404 | Resource not found |
| 413 | File too large |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Endpoints

### Status

#### `GET /` — Service Root

Returns service status, version, model info, and database connectivity.

**Auth**: None

```bash
curl http://localhost:8000/
```

```json
{
  "status": "Resume Intelligence API Running",
  "version": "4.2.0",
  "model_version": "v2",
  "model_accuracy": "95.0%",
  "database": "connected",
  "cache_backend": "redis",
  "docs": "/docs"
}
```

#### `GET /health` — Health Check

Lightweight uptime probe.

**Auth**: None

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok" }
```

---

### Resume Analysis

#### `POST /upload` — Upload Resume

Upload a PDF/DOCX resume and receive a full readiness analysis. Auto-detects the best-fit role by scoring against all 7 roles.

**Auth**: Optional | **Rate Limit**: 10/min

**Request**: `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | PDF or DOCX file (max 5MB) |
| `role` | string | No | Target role (default: `auto`) |
| `privacy_mode` | bool | No | Process in-memory only (default: false) |
| `user_email` | string | No | User email (fallback if no auth) |

```bash
curl -X POST http://localhost:8000/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@resume.pdf" \
  -F "role=auto"
```

**Response** (200):

```json
{
  "role": "Software Developer",
  "final_score": 72,
  "readiness_category": "Improving",
  "core_coverage_percent": 65.0,
  "optional_coverage_percent": 40.0,
  "project_score_percent": 80.0,
  "ats_score_percent": 70.0,
  "structure_score_percent": 75.0,
  "missing_core_skills": ["docker", "kubernetes"],
  "missing_optional_skills": ["aws", "terraform"],
  "recommendations": ["Add Docker containerization to projects..."],
  "detected_skills": ["python", "react", "sql", "git"],
  "sections_detected": ["skills", "projects", "education", "links"],
  "links": ["https://github.com/username"],
  "role_matches": [
    { "role": "Software Developer", "score": 72 },
    { "role": "Full Stack Developer", "score": 68 },
    { "role": "Backend Developer", "score": 65 }
  ],
  "auto_detected": true,
  "resume_id": 42,
  "analysis_id": 87,
  "privacy_active": false
}
```

#### `GET /roles` — List Roles

Returns all supported career roles.

**Auth**: None

```bash
curl http://localhost:8000/roles
```

```json
{
  "valid_roles": [
    "Software Developer", "Frontend Developer", "Backend Developer",
    "Full Stack Developer", "Data Scientist", "ML Engineer", "DevOps Engineer"
  ]
}
```

---

### ML Inference

#### `POST /predict` — Predict Role & Score

Run RandomForest inference on a feature vector. Returns predicted role, confidence, score, and weak areas.

**Auth**: None

**Request Body**:

```json
{
  "skills": ["python", "react", "sql", "git"],
  "core_coverage": 0.65,
  "optional_coverage": 0.40,
  "project_score": 0.80,
  "ats_score": 0.70,
  "structure_score": 0.75
}
```

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"skills": ["python", "react", "sql"], "core_coverage": 0.65, "optional_coverage": 0.4, "project_score": 0.8, "ats_score": 0.7, "structure_score": 0.75}'
```

**Response** (200):

```json
{
  "predicted_role": "Software Developer",
  "confidence": 0.87,
  "resume_score": 72.5,
  "weak_areas": ["docker", "kubernetes", "ci/cd"],
  "model_version": "v2",
  "inference_time_ms": 12.3
}
```

---

### Hybrid Intelligence (`/ml`)

#### `POST /ml/predict-role` — Cross-Role Validation

Scores your resume against all 7 roles and returns the best match.

**Auth**: None

```bash
curl -X POST http://localhost:8000/ml/predict-role \
  -H "Content-Type: application/json" \
  -d '{"skills": ["python", "react", "sql"], "raw_text": "..."}'
```

**Response** (200):

```json
{
  "predicted_role": "Full Stack Developer",
  "confidence": 0.72,
  "top_matches": [
    { "role": "Full Stack Developer", "score": 72 },
    { "role": "Software Developer", "score": 68 },
    { "role": "Frontend Developer", "score": 65 }
  ],
  "reasoning": "Your highest potential match is Full Stack Developer with a score of 72%.",
  "model_version": "cross-role-validator-4.2.0"
}
```

#### `POST /ml/project-score` — Skill Impact Simulation

Simulate adding a skill and predict the expected score change.

**Auth**: None

```bash
curl -X POST http://localhost:8000/ml/project-score \
  -H "Content-Type: application/json" \
  -d '{"current_skills": ["python", "sql"], "add_skill": "docker"}'
```

#### `GET /ml/skill-impact` — Skill Impact Rankings

Returns skill impact rankings (delta from global mean score).

**Auth**: None | **Query**: `?live=true` for live computation (default: cached)

```bash
curl http://localhost:8000/ml/skill-impact
```

#### `GET /ml/status` — ML Health Check

```bash
curl http://localhost:8000/ml/status
```

```json
{
  "dataset_size": 57100,
  "model_cached": true,
  "model_updated_at": "2026-05-27T10:30:00Z",
  "active_version": "v2",
  "ready": true
}
```

#### `GET /ml/versions` — List Model Versions

**Auth**: None

#### `GET /ml/versions/active` — Active Model Version

**Auth**: None

#### `POST /ml/versions/{tag}/promote` — Promote Model Version

**Auth**: Admin

#### `DELETE /ml/versions/{tag}` — Delete Model Version

**Auth**: Admin

#### `POST /ml/recompute-model` — Recompute Hybrid Model

**Auth**: Admin

---

### History & Analytics (`/history`, `/compare`, `/analytics`, `/export`)

#### `GET /history/{resume_id}` — Analysis History

Chronological list of all role analyses for a resume.

**Auth**: Required (IDOR-protected)

```bash
curl http://localhost:8000/history/42 \
  -H "Authorization: Bearer <token>"
```

#### `GET /compare/{resume_id}` — Role Comparison

Latest analysis score per role for a resume.

**Auth**: Required (IDOR-protected)

#### `GET /analytics/role-stats` — Platform Analytics

Aggregated analytics: avg/min/max per role, top missing/detected skills.

**Auth**: Required | **Query**: `?page=1&per_page=50`

#### `GET /session/latest/{email}` — Latest Session

Latest resume + analysis for a user.

**Auth**: Required (email-level IDOR check)

#### `GET /export/dataset` — Export ML Dataset

ML-ready paginated dataset export.

**Auth**: Admin | **Query**: `?page=1&per_page=50`

#### `DELETE /history/analysis/{analysis_id}` — Delete Analysis

**Auth**: Required (ownership check)

#### `DELETE /history/resume/{resume_id}` — Delete Resume

Deletes resume and all associated analyses.

**Auth**: Required (ownership check)

#### `DELETE /user/data` — GDPR Deletion

Deletes all user data across 7 tables.

**Auth**: Required

```bash
curl -X DELETE http://localhost:8000/user/data \
  -H "Authorization: Bearer <token>"
```

```json
{
  "detail": "All your data has been deleted.",
  "tables_cleared": {
    "resumes": 2,
    "role_analyses": 5,
    "prediction_feedback": 1,
    "user_study_progress": 12,
    "user_quiz_attempts": 8,
    "content_feedback": 3,
    "contributions": 0
  }
}
```

---

### AI Study Hub (`/ai`)

#### `POST /ai/smart-plan` — Learning Plan

Build a dependency-aware learning plan with day-by-day scheduling.

**Auth**: None | **Rate Limit**: 30/min (heavy) + 30/min (per-user)

```bash
curl -X POST http://localhost:8000/ai/smart-plan \
  -H "Content-Type: application/json" \
  -d '{
    "missing_core_skills": ["docker", "kubernetes"],
    "missing_optional_skills": ["aws"],
    "mastered_skills": ["python", "git"],
    "daily_hours": 2.0,
    "deadline": "2026-06-15"
  }'
```

**Response** (200):

```json
{
  "schedule": [
    {
      "day": 1,
      "skill": "docker",
      "title": "Master Docker",
      "prerequisites": [],
      "unlocks": ["kubernetes"],
      "difficulty": "Foundational",
      "duration_minutes": 60,
      "order": 0
    }
  ],
  "total_skills": 3,
  "target_skills": 3,
  "prerequisite_skills": 0,
  "total_days": 2,
  "total_hours": 4.0,
  "daily_hours": 2.0,
  "recommended_daily_hours": 2.0,
  "days_available": 19,
  "deadline": "2026-06-15"
}
```

#### `POST /ai/market-forecast` — Market Forecast

Dynamic career market forecast powered by Gemini.

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user)

#### `GET /ai/study/notes` — Study Notes

Generate study notes for a skill (intro + first section).

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user) | **Query**: `?skill=python&existing_skills=git,sql`

#### `GET /ai/study/section` — Study Section

Generate a single study section (progressive loading).

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user) | **Query**: `?skill=python&section_idx=0`

#### `GET /ai/study/quiz` — Generate Quiz

Section-specific or general quiz.

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user) | **Query**: `?skill=python&section_idx=0`

#### `POST /ai/study/progress` — Save Progress

Mark a study section as completed.

**Auth**: Required

```bash
curl -X POST http://localhost:8000/ai/study/progress \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"skill": "python", "section_idx": 0}'
```

#### `GET /ai/study/progress` — Get Progress

**Auth**: Required | **Query**: `?skill=python` (optional — omit for all skills)

#### `POST /ai/study/quiz/submit` — Submit Quiz Grade

Logs quiz score and auto-registers progress on pass.

**Auth**: Required

#### `POST /ai/study/chat` — AI Chat Assistant

Chat with an AI about a specific skill.

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user)

#### `POST /ai/study/contribute` — Submit Contribution

Submit community study notes for review.

**Auth**: None | **Rate Limit**: 30/min (heavy)

#### `POST /ai/interview/start` — Start Interview

Start an AI mock interview session.

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user)

#### `POST /ai/interview/answer` — Evaluate Answer

Evaluate an interview answer and get a follow-up question.

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user)

#### `POST /ai/interview/end` — End Interview

End interview and get a comprehensive scorecard.

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user)

#### `GET /ai/admin/contributions` — Pending Contributions

**Auth**: Admin

#### `POST /ai/admin/contributions/{id}/approve` — Approve Contribution

**Auth**: Admin

#### `POST /ai/admin/contributions/{id}/reject` — Reject Contribution

**Auth**: Admin

#### `GET /ai/admin/stats` — Admin Stats

**Auth**: Admin

#### `POST /ai/admin/ingest-course` — Ingest Course

Scrape an authority URL and compile a course (Pathway A: RAG, Pathway B: static).

**Auth**: Admin | **Rate Limit**: 30/min (heavy)

#### `GET /ai/curriculum/overview` — Curriculum Graph

Full skill dependency graph + metadata.

**Auth**: None

#### `GET /ai/curriculum/prerequisites` — Skill Prerequisites

**Auth**: None | **Query**: `?skill=react`

#### `POST /ai/curriculum/unlocked` — Unlocked Skills

**Auth**: None

#### `POST /ai/curriculum/learning-path` — Learning Path

**Auth**: None

#### `POST /ai/curriculum/can-unlock` — Check Unlock

**Auth**: None

---

### Rule-Based Interview (`/interview`)

#### `GET /interview/question` — Random Question

**Auth**: None | **Query**: `?role=Software Developer`

#### `GET /interview/questions/{role}` — All Questions for Role

**Auth**: None

#### `POST /interview/evaluate` — Evaluate Answer

Score an answer using keyword/concept matching.

**Auth**: None

```bash
curl -X POST http://localhost:8000/interview/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Software Developer",
    "question_id": "q1",
    "answer": "React is a JavaScript library for building user interfaces..."
  }'
```

**Response** (200):

```json
{
  "score": 75,
  "grade": "Good",
  "detected_concepts": ["components", "jsx", "virtual dom"],
  "missing_concepts": ["hooks", "state management"],
  "total_concepts": 5,
  "feedback": "Good foundation but missing key concepts...",
  "tip": "Mention hooks and state management patterns.",
  "diagnostic_flag": false,
  "learning_path": ["react hooks", "state management"]
}
```

#### `GET /interview/dependencies` — Skill Dependencies

**Auth**: None

#### `GET /interview/dependencies/{skill}` — Skill Prerequisites

**Auth**: None

---

### Feedback (`/feedback`)

#### `POST /feedback` — Submit Feedback

Submit a prediction correction or confirmation.

**Auth**: Required

#### `GET /feedback/summary` — Feedback Stats

**Auth**: None | **Query**: `?page=1&per_page=50`

#### `GET /feedback/corrections` — Correction Pairs

Labelled correction pairs for model retraining.

**Auth**: None | **Query**: `?page=1&per_page=50`

---

### Content Feedback (`/content-feedback`)

#### `POST /content-feedback` — Submit Content Feedback

**Auth**: Required

#### `GET /content-feedback/summary` — Content Feedback Stats

**Auth**: None | **Query**: `?skill=python`

#### `GET /content-feedback/low-rated` — Low-Rated Content

Content below rating threshold — candidates for regeneration.

**Auth**: None | **Query**: `?threshold=3.0`

---

### Projects (`/projects`)

#### `POST /projects/generate` — Generate Project

AI-generated capstone project tailored to role and missing skills.

**Auth**: None | **Rate Limit**: 20/min (AI) + 30/min (per-user)

```bash
curl -X POST http://localhost:8000/projects/generate \
  -H "Content-Type: application/json" \
  -d '{"role": "Backend Developer", "skills": ["docker", "kubernetes"]}'
```

#### `POST /projects/verify` — Verify GitHub Repo

Verify a GitHub repo against the project spec.

**Auth**: None | **Rate Limit**: 30/min (heavy)

```bash
curl -X POST http://localhost:8000/projects/verify \
  -H "Content-Type: application/json" \
  -d '{
    "github_url": "https://github.com/user/repo",
    "project_markdown": "# Project Spec...",
    "required_skills": ["docker", "kubernetes"],
    "role": "Backend Developer"
  }'
```

**Response** (200):

```json
{
  "verified": true,
  "verdict": "VERIFIED",
  "overall_score": 85,
  "criteria": {
    "skill_coverage": { "score": 90, "detail": "All required skills demonstrated" },
    "spec_alignment": { "score": 80, "detail": "Core requirements met" },
    "code_authenticity": { "score": 85, "detail": "Original code detected" },
    "documentation": { "score": 90, "detail": "Comprehensive README" },
    "completeness": { "score": 80, "detail": "Most features implemented" }
  }
}
```

---

## Request Body Schemas

### ResumeInput (`POST /predict`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skills` | `list[str]` | required | Extracted skills (lowercase) |
| `project_score_percent` | `float` | `0` | Project quality score (0-100) |
| `ats_score_percent` | `float` | `0` | ATS compliance score (0-100) |
| `structure_score_percent` | `float` | `0` | Resume structure score (0-100) |
| `raw_text` | `str` | `""` | Full resume text |
| `sections_detected` | `list[str]` | `[]` | Resume sections found |
| `current_role` | `str` | `""` | Current or target role |

### RolePredictRequest (`POST /ml/predict-role`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skills` | `list[str]` | required | Extracted skills |
| `project_score_percent` | `float` | `0` | Project score |
| `ats_score_percent` | `float` | `0` | ATS score |
| `structure_score_percent` | `float` | `0` | Structure score |
| `raw_text` | `str` | `""` | Resume text (max 500K chars) |
| `sections_detected` | `list[str]` | `[]` | Detected sections |
| `current_role` | `str` | `""` | Current role for comparison |

### SmartPlanRequest (`POST /ai/smart-plan`)

| Field | Type | Default | Description |
|---|---|---|---|
| `missing_core_skills` | `list[str]` | required | Core skills to learn |
| `missing_optional_skills` | `list[str]` | `[]` | Optional skills |
| `mastered_skills` | `list[str]` | `[]` | Already known skills |
| `daily_hours` | `float` | `2.0` | Study hours per day |
| `deadline` | `str?` | `null` | ISO date (e.g. `"2026-06-15"`) |

### ChatRequest (`POST /ai/study/chat`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill topic |
| `query` | `str` | required | User question (max 10K chars) |
| `history` | `list[dict]` | `[]` | Conversation history |
| `mastered_skills` | `list[str]` | `[]` | Context for personalization |

### InterviewStartRequest (`POST /ai/interview/start`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill to interview on |
| `difficulty` | `str` | `"medium"` | easy / medium / hard |
| `role` | `str` | `""` | Target role |

### InterviewAnswerRequest (`POST /ai/interview/answer`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill context |
| `question` | `str` | required | The question asked |
| `answer` | `str` | required | User's answer |
| `question_number` | `int` | `1` | Question number in session |
| `difficulty` | `str` | `"medium"` | Difficulty level |
| `history` | `list[dict]` | `[]` | Session history |

### EvaluateRequest (`POST /interview/evaluate`)

| Field | Type | Default | Description |
|---|---|---|---|
| `role` | `str` | required | Role context |
| `question_id` | `str` | required | Question identifier |
| `answer` | `str` | required | User's answer text |

### ProjectRequest (`POST /projects/generate`)

| Field | Type | Default | Description |
|---|---|---|---|
| `role` | `str` | required | Target role |
| `skills` | `list[str]` | required | Skills to acquire |

### VerifyRequest (`POST /projects/verify`)

| Field | Type | Default | Description |
|---|---|---|---|
| `github_url` | `str` | required | GitHub repository URL |
| `project_markdown` | `str` | required | Original project spec (max 100K chars) |
| `required_skills` | `list[str]` | required | Skills to demonstrate |
| `role` | `str` | required | Target role |

### FeedbackRequest (`POST /feedback`)

| Field | Type | Default | Description |
|---|---|---|---|
| `predicted_role` | `str` | required | What the model predicted |
| `correct_role` | `str?` | `null` | What it should have been |
| `score_feedback` | `str?` | `null` | too_high / too_low / accurate |
| `comment` | `str?` | `null` | Free-text feedback |
| `analysis_id` | `int?` | `null` | Associated analysis ID |

### ContentFeedbackRequest (`POST /content-feedback`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill being rated |
| `section_idx` | `int?` | `null` | Section index |
| `feedback_type` | `str` | required | rating / error_report / suggestion / quality_issue |
| `rating` | `int?` | `null` | 1-5 stars |
| `comment` | `str?` | `null` | Free-text |
| `content_type` | `str` | `"section"` | section / overview / quiz |

---

## Supported Roles

| Role | Core Skills | Optional Skills |
|---|---|---|
| Software Developer | python, java, git, sql, docker, testing | kubernetes, aws, ci-cd, agile |
| Frontend Developer | javascript, react, html, css, typescript | next.js, vue, svelte, testing, figma |
| Backend Developer | python, sql, docker, rest, git | redis, aws, kubernetes, graphql, testing |
| Full Stack Developer | javascript, react, python, sql, docker, git | typescript, aws, redis, testing, ci-cd |
| Data Scientist | python, sql, statistics, machine-learning, pandas | deep-learning, nlp, spark, tensorflow, r |
| ML Engineer | python, machine-learning, deep-learning, docker, mlops | kubernetes, tensorflow, pytorch, spark, onnx |
| DevOps Engineer | docker, kubernetes, linux, ci-cd, aws | terraform, ansible, monitoring, gcp, security |

---

## Scoring Formula

```
Final Score = (Core Coverage    x 0.35) +
              (Optional Coverage x 0.10) +
              (Project Score     x 0.25) +
              (ATS Score         x 0.20) +
              (Structure Score   x 0.10)
```

**Readiness Categories:**

| Category | Score Range |
|---|---|
| Job Ready | >= 75 |
| Improving | >= 45 |
| Needs Development | < 45 |

**Weighted Skill Coverage:** Skills marked as `high` importance in `scoring.json` count 1.5x, `medium` 1.0x, `low` 0.7x.

---

## Request Body Schemas

### ResumeInput (`POST /predict`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skills` | `list[str]` | required | Extracted skills (lowercase) |
| `project_score_percent` | `float` | `0` | Project quality score (0-100) |
| `ats_score_percent` | `float` | `0` | ATS compliance score (0-100) |
| `structure_score_percent` | `float` | `0` | Resume structure score (0-100) |
| `raw_text` | `str` | `""` | Full resume text |
| `sections_detected` | `list[str]` | `[]` | Resume sections found |
| `current_role` | `str` | `""` | Current or target role |

### RolePredictRequest (`POST /ml/predict-role`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skills` | `list[str]` | required | Extracted skills |
| `project_score_percent` | `float` | `0` | Project score |
| `ats_score_percent` | `float` | `0` | ATS score |
| `structure_score_percent` | `float` | `0` | Structure score |
| `raw_text` | `str` | `""` | Resume text (max 500K chars) |
| `sections_detected` | `list[str]` | `[]` | Detected sections |
| `current_role` | `str` | `""` | Current role for comparison |

### SmartPlanRequest (`POST /ai/smart-plan`)

| Field | Type | Default | Description |
|---|---|---|---|
| `missing_core_skills` | `list[str]` | required | Core skills to learn |
| `missing_optional_skills` | `list[str]` | `[]` | Optional skills to learn |
| `mastered_skills` | `list[str]` | `[]` | Already known skills |
| `daily_hours` | `float` | `2.0` | Study hours per day |
| `deadline` | `str?` | `null` | ISO date (e.g. `"2026-06-15"`) |

### ChatRequest (`POST /ai/study/chat`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill topic |
| `query` | `str` | required | User question (max 10K chars) |
| `history` | `list[dict]` | `[]` | Conversation history |
| `mastered_skills` | `list[str]` | `[]` | Context for personalization |

### InterviewStartRequest (`POST /ai/interview/start`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill to interview on |
| `difficulty` | `str` | `"medium"` | easy / medium / hard |
| `role` | `str` | `""` | Target role |

### InterviewAnswerRequest (`POST /ai/interview/answer`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill context |
| `question` | `str` | required | The question asked |
| `answer` | `str` | required | User's answer |
| `question_number` | `int` | `1` | Question number in session |
| `difficulty` | `str` | `"medium"` | Difficulty level |
| `history` | `list[dict]` | `[]` | Session history |

### EvaluateRequest (`POST /interview/evaluate`)

| Field | Type | Default | Description |
|---|---|---|---|
| `role` | `str` | required | Role context |
| `question_id` | `str` | required | Question identifier |
| `answer` | `str` | required | User's answer text |

### ProjectRequest (`POST /projects/generate`)

| Field | Type | Default | Description |
|---|---|---|---|
| `role` | `str` | required | Target role |
| `skills` | `list[str]` | required | Skills to acquire |

### VerifyRequest (`POST /projects/verify`)

| Field | Type | Default | Description |
|---|---|---|---|
| `github_url` | `str` | required | GitHub repository URL |
| `project_markdown` | `str` | required | Original project spec (max 100K chars) |
| `required_skills` | `list[str]` | required | Skills to demonstrate |
| `role` | `str` | required | Target role |

### FeedbackRequest (`POST /feedback`)

| Field | Type | Default | Description |
|---|---|---|---|
| `predicted_role` | `str` | required | What the model predicted |
| `correct_role` | `str?` | `null` | What it should have been |
| `score_feedback` | `str?` | `null` | too_high / too_low / accurate |
| `comment` | `str?` | `null` | Free-text feedback |
| `analysis_id` | `int?` | `null` | Associated analysis ID |

### ContentFeedbackRequest (`POST /content-feedback`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill being rated |
| `section_idx` | `int?` | `null` | Section index |
| `feedback_type` | `str` | required | rating / error_report / suggestion / quality_issue |
| `rating` | `int?` | `null` | 1-5 stars |
| `comment` | `str?` | `null` | Free-text |
| `content_type` | `str` | `"section"` | section / overview / quiz |

---

## Supported Roles

| Role | Core Skills | Optional Skills |
|---|---|---|
| Software Developer | python, java, git, sql, docker, testing | kubernetes, aws, ci-cd, agile |
| Frontend Developer | javascript, react, html, css, typescript | next.js, vue, svelte, testing, figma |
| Backend Developer | python, sql, docker, rest, git | redis, aws, kubernetes, graphql, testing |
| Full Stack Developer | javascript, react, python, sql, docker, git | typescript, aws, redis, testing, ci-cd |
| Data Scientist | python, sql, statistics, machine-learning, pandas | deep-learning, nlp, spark, tensorflow, r |
| ML Engineer | python, machine-learning, deep-learning, docker, mlops | kubernetes, tensorflow, pytorch, spark, onnx |
| DevOps Engineer | docker, kubernetes, linux, ci-cd, aws | terraform, ansible, monitoring, gcp, security |

---

## Scoring Formula

```
Final Score = (Core Coverage    x 0.35) +
              (Optional Coverage x 0.10) +
              (Project Score     x 0.25) +
              (ATS Score         x 0.20) +
              (Structure Score   x 0.10)
```

**Readiness Categories:**

| Category | Score Range |
|---|---|
| Job Ready | >= 75 |
| Improving | >= 45 |
| Needs Development | < 45 |

**Weighted Skill Coverage:** Skills marked as `high` importance in `scoring.json` count 1.5x, `medium` 1.0x, `low` 0.7x.

---

## Request Body Schemas

### ResumeInput (`POST /predict`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skills` | `list[str]` | required | Extracted skills (lowercase) |
| `project_score_percent` | `float` | `0` | Project quality score (0-100) |
| `ats_score_percent` | `float` | `0` | ATS compliance score (0-100) |
| `structure_score_percent` | `float` | `0` | Resume structure score (0-100) |
| `raw_text` | `str` | `""` | Full resume text |
| `sections_detected` | `list[str]` | `[]` | Resume sections found |
| `current_role` | `str` | `""` | Current or target role |

### RolePredictRequest (`POST /ml/predict-role`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skills` | `list[str]` | required | Extracted skills |
| `project_score_percent` | `float` | `0` | Project score |
| `ats_score_percent` | `float` | `0` | ATS score |
| `structure_score_percent` | `float` | `0` | Structure score |
| `raw_text` | `str` | `""` | Resume text (max 500K chars) |
| `sections_detected` | `list[str]` | `[]` | Detected sections |
| `current_role` | `str` | `""` | Current role for comparison |

### SmartPlanRequest (`POST /ai/smart-plan`)

| Field | Type | Default | Description |
|---|---|---|---|
| `missing_core_skills` | `list[str]` | required | Core skills to learn |
| `missing_optional_skills` | `list[str]` | `[]` | Optional skills to learn |
| `mastered_skills` | `list[str]` | `[]` | Already known skills |
| `daily_hours` | `float` | `2.0` | Study hours per day |
| `deadline` | `str?` | `null` | ISO date (e.g. `"2026-06-15"`) |

### ChatRequest (`POST /ai/study/chat`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill topic |
| `query` | `str` | required | User question (max 10K chars) |
| `history` | `list[dict]` | `[]` | Conversation history |
| `mastered_skills` | `list[str]` | `[]` | Context for personalization |

### InterviewStartRequest (`POST /ai/interview/start`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill to interview on |
| `difficulty` | `str` | `"medium"` | easy / medium / hard |
| `role` | `str` | `""` | Target role |

### InterviewAnswerRequest (`POST /ai/interview/answer`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill context |
| `question` | `str` | required | The question asked |
| `answer` | `str` | required | User's answer |
| `question_number` | `int` | `1` | Question number in session |
| `difficulty` | `str` | `"medium"` | Difficulty level |
| `history` | `list[dict]` | `[]` | Session history |

### EvaluateRequest (`POST /interview/evaluate`)

| Field | Type | Default | Description |
|---|---|---|---|
| `role` | `str` | required | Role context |
| `question_id` | `str` | required | Question identifier |
| `answer` | `str` | required | User's answer text |

### ProjectRequest (`POST /projects/generate`)

| Field | Type | Default | Description |
|---|---|---|---|
| `role` | `str` | required | Target role |
| `skills` | `list[str]` | required | Skills to acquire |

### VerifyRequest (`POST /projects/verify`)

| Field | Type | Default | Description |
|---|---|---|---|
| `github_url` | `str` | required | GitHub repository URL |
| `project_markdown` | `str` | required | Original project spec (max 100K chars) |
| `required_skills` | `list[str]` | required | Skills to demonstrate |
| `role` | `str` | required | Target role |

### FeedbackRequest (`POST /feedback`)

| Field | Type | Default | Description |
|---|---|---|---|
| `predicted_role` | `str` | required | What the model predicted |
| `correct_role` | `str?` | `null` | What it should have been |
| `score_feedback` | `str?` | `null` | too_high / too_low / accurate |
| `comment` | `str?` | `null` | Free-text feedback |
| `analysis_id` | `int?` | `null` | Associated analysis ID |

### ContentFeedbackRequest (`POST /content-feedback`)

| Field | Type | Default | Description |
|---|---|---|---|
| `skill` | `str` | required | Skill being rated |
| `section_idx` | `int?` | `null` | Section index |
| `feedback_type` | `str` | required | rating / error_report / suggestion / quality_issue |
| `rating` | `int?` | `null` | 1-5 stars |
| `comment` | `str?` | `null` | Free-text |
| `content_type` | `str` | `"section"` | section / overview / quiz |

---

## Supported Roles

| Role | Core Skills | Optional Skills |
|---|---|---|
| Software Developer | python, java, git, sql, docker, testing | kubernetes, aws, ci-cd, agile |
| Frontend Developer | javascript, react, html, css, typescript | next.js, vue, svelte, testing, figma |
| Backend Developer | python, sql, docker, rest, git | redis, aws, kubernetes, graphql, testing |
| Full Stack Developer | javascript, react, python, sql, docker, git | typescript, aws, redis, testing, ci-cd |
| Data Scientist | python, sql, statistics, machine-learning, pandas | deep-learning, nlp, spark, tensorflow, r |
| ML Engineer | python, machine-learning, deep-learning, docker, mlops | kubernetes, tensorflow, pytorch, spark, onnx |
| DevOps Engineer | docker, kubernetes, linux, ci-cd, aws | terraform, ansible, monitoring, gcp, security |

---

## Scoring Formula

```
Final Score = (Core Coverage    x 0.35) +
              (Optional Coverage x 0.10) +
              (Project Score     x 0.25) +
              (ATS Score         x 0.20) +
              (Structure Score   x 0.10)
```

**Readiness Categories:**

| Category | Score Range |
|---|---|
| Job Ready | >= 75 |
| Improving | >= 45 |
| Needs Development | < 45 |

**Weighted Skill Coverage:** Skills marked as `high` importance in `scoring.json` count 1.5x, `medium` 1.0x, `low` 0.7x.
