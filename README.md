<p align="center">
  <img src="https://img.shields.io/badge/⚡-CampusSync_Edge_AI-blue?style=for-the-badge&labelColor=0a0f1a" alt="CampusSync Edge AI" />
</p>
<h2><a href="https://campussync-edge.onrender.com/"> Deployed Link</a></h2>
---
<h1 align="center">CampusSync Edge AI</h1>

<p align="center">
  <b>AI-Powered Career Intelligence Platform for Engineering Students</b><br/>
  <i>Know your readiness. Close every gap. Land the role.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" />
  <img src="https://img.shields.io/badge/ONNX_Runtime-005CED?style=flat-square&logo=onnx&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
</p>

---

## 🚀 What is CampusSync Edge?

CampusSync Edge is a **full-stack career intelligence platform** purpose-built for engineering students. Upload your resume, get a granular readiness score for your target role, identify precise skill gaps with dependency-aware learning paths, practice interviews with real-time concept analysis, build AI-generated projects, and track your growth — all powered by on-device ML and generative AI.

> **Not a resume scanner. A career intelligence system.**

---

## ✨ Features

### 📄 Smart Resume Analysis
- Upload **PDF** or **DOCX** resumes — AI extracts skills, sections, links, and metadata instantly
- **Deterministic weighted scoring** across core skill coverage, optional skills, project quality, ATS compliance, and resume structure
- Supports **resume comparison** across multiple uploads to track improvements

### 🧠 Skill Graph Engine
- Builds a **personal skill dependency graph** from your resume using **React Flow** visualization
- Maps missing skills, their prerequisites, and the optimal learning order
- Node-level interactivity — click any skill to see related resources and status

### 📊 Readiness Score & Role Matching
- Calculates a **job readiness percentage** for your target role with full breakdown
- **ML Role Prediction** — a RandomForest model (82.1% accuracy, RMSE ≈ 1.04) trained on 2,000+ real + synthetic resumes predicts your best-fit role
- Tracks **6 tech roles**: Software Developer, Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, ML Engineer, DevOps Engineer

### 🎯 Skill Gap Analysis
- Compares your resume against **role-specific core and optional skill requirements**
- Generates **prioritized recommendations** (HIGH/MEDIUM) with reasons
- Feeds directly into the Improvement Plan

### 📚 AI Improvement Plan & Study Hub
- **RAG-powered study material generation** — retrieves context from a PGVector knowledge base, generates structured tutorials with Gemini AI
- Each tutorial includes: concept explanations, runnable code examples, key takeaways, mini-challenges, and interview patterns
- **Judge validation pass** — a secondary LLM checks generated content against source material for factual consistency
- **Redis caching** with 24-hour TTL for instant repeat access

### 🎙️ Interview Readiness & Simulator
- **30+ role-specific technical interview questions** across all tracked roles
- **On-device concept matching** — type or speak your answers, the engine scores technical depth against expected concepts
- Structured feedback with grade (Excellent → Needs Practice), missing concept highlights, and pro tips
- **Diagnostic learning paths** auto-generated for knowledge gaps (score < 70%)
- **Web Speech API** integration for voice-based interview practice

### 🛠️ AI Project Generator & GitHub Verifier
- **AI-generated capstone project specs** tailored to your target role and missing skills
- **GitHub Project Verification** — submit a repo URL, the system fetches commit history, languages, file tree, and README via GitHub API, then uses Gemini AI to cross-reference against the project spec
- Scores across 5 criteria: skill coverage, spec alignment, code authenticity, documentation, and completeness
- Verdicts: `VERIFIED` | `PARTIAL` | `INSUFFICIENT` | `SUSPICIOUS` — with rule-based fallback when AI is unavailable

### 📈 Progress Tracking
- Every resume upload and analysis is **logged to Supabase** with timestamps
- **Historical readiness chart** — watch your score grow week-over-week
- Visual trend lines and month-over-month comparison

### 🏭 Industry Alignment
- Maps your current skill set against **real industry requirements** for your target role
- Shows how your profile aligns with what companies are looking for today

### 🔐 Privacy & Security
- **AES encryption** available for stored resume data
- Resume content stays in your browser session — no file stored on external servers
- JWT-based authentication with Supabase Auth
- Rate limiting via SlowAPI to prevent abuse

### 🛡️ Admin Dashboard
- Admin-only analytics panel with user metrics, system health, and analysis stats
- Role-based access control with configurable admin email allowlist

### 🤖 AI Character Assistant
- In-app AI assistant for contextual help and career guidance
- Dual LLM provider support: **Gemini 2.0 Flash** (primary) + **Bytez** (fallback)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript + Vite)        │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │ Dashboard │ │ Resume   │ │ Skill Gap  │ │ Interview       │  │
│  │          │ │ Analyzer │ │ + Graph    │ │ Simulator       │  │
│  └──────────┘ └──────────┘ └────────────┘ └─────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │ Progress │ │ Industry │ │ My         │ │ Study Hub       │  │
│  │ Tracking │ │Alignment │ │ Projects   │ │ (RAG Tutorials) │  │
│  └──────────┘ └──────────┘ └────────────┘ └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     BACKEND (FastAPI + Python)                  │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────────┐  │
│  │ Resume Parser │  │ Scoring Engine │  │ ML Pipeline       │  │
│  │ (PDF/DOCX)    │  │ (Deterministic)│  │ (RandomForest v2) │  │
│  └───────────────┘  └────────────────┘  └───────────────────┘  │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────────┐  │
│  │ RAG Service   │  │ Interview      │  │ Project Verifier  │  │
│  │ (PGVector)    │  │ Engine         │  │ (GitHub API + AI) │  │
│  └───────────────┘  └────────────────┘  └───────────────────┘  │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────────┐  │
│  │ Gemini AI     │  │ Bytez Fallback │  │ Encryption Layer  │  │
│  │ Service       │  │ Service        │  │ (AES)             │  │
│  └───────────────┘  └────────────────┘  └───────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     DATA LAYER                                  │
│  ┌──────────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │ Supabase         │  │ PGVector    │  │ Redis (Optional)  │  │
│  │ (PostgreSQL +    │  │ (Embeddings │  │ (Cache Layer)     │  │
│  │  Auth + RLS)     │  │  + RAG)     │  │                   │  │
│  └──────────────────┘  └─────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, React Router v6, React Flow, Lucide Icons, DOMPurify, React Markdown |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, SlowAPI (rate limiting), Python 3.11+ |
| **ML / AI** | Scikit-Learn (RandomForest), ONNX Runtime, Google Gemini 2.0 Flash, Gemini Embeddings, Bytez SDK, LangChain Text Splitters |
| **Database** | Supabase (PostgreSQL), PGVector (vector similarity search), Redis (optional caching) |
| **Auth** | Supabase Auth, PyJWT, AES Encryption (cryptography) |
| **Document Parsing** | pdfplumber (PDF), python-docx (DOCX) |
| **Search** | DuckDuckGo Search, Wikipedia API |
| **CI/CD** | GitHub Actions (lint → test → build → deploy) |
| **Deployment** | Render Blueprint (static site + web service) |

---

## 📁 Project Structure

```
CampusSync-Edge/
├── frontend/                    # React + TypeScript SPA
│   ├── src/
│   │   ├── pages/               # 16 page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ResumeAnalyzer.tsx
│   │   │   ├── SkillGap.tsx
│   │   │   ├── ImprovementPlan.tsx
│   │   │   ├── InterviewReadiness.tsx
│   │   │   ├── MyProjects.tsx
│   │   │   ├── ProgressTracking.tsx
│   │   │   ├── IndustryAlignment.tsx
│   │   │   ├── ReadinessScore.tsx
│   │   │   ├── ResumeComparison.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ...
│   │   ├── components/          # Reusable UI components
│   │   │   ├── InterviewSimulator.tsx
│   │   │   ├── StudyHub.tsx
│   │   │   ├── SkillGraphViz.tsx
│   │   │   ├── ReactFlowSkillGraph.tsx
│   │   │   ├── ProjectGeneratorModal.tsx
│   │   │   ├── ProjectVerifier.tsx
│   │   │   └── ...
│   │   ├── context/             # Auth, Resume, Toast providers
│   │   ├── api/                 # API client functions
│   │   └── utils/               # Helpers
│   └── package.json
│
├── backend/                     # FastAPI + ML backend
│   ├── app/
│   │   ├── main.py              # App entry point + lifespan
│   │   ├── routers/             # API route handlers
│   │   │   ├── analyze.py       # /upload, /roles
│   │   │   ├── data.py          # /history, /compare, /analytics
│   │   │   ├── ml.py            # /ml/* (similarity, impact)
│   │   │   ├── inference.py     # /health, /predict
│   │   │   ├── interview.py     # Interview Q&A endpoints
│   │   │   ├── ai_insight.py    # AI-powered insights
│   │   │   ├── feedback.py      # User feedback collection
│   │   │   └── project_generator.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── resume_parser.py
│   │   │   ├── scoring_engine.py
│   │   │   ├── skill_gap_engine.py
│   │   │   ├── interview_engine.py
│   │   │   ├── rag_service.py
│   │   │   ├── project_verifier_service.py
│   │   │   ├── gemini_service.py
│   │   │   ├── bytez_service.py
│   │   │   ├── encryption_service.py
│   │   │   └── ...
│   │   ├── ml_pipeline/         # ML training & inference
│   │   │   ├── train_v2.py      # Production training script
│   │   │   ├── feature_engineering.py
│   │   │   ├── model_registry.py
│   │   │   ├── evaluation.py
│   │   │   └── ...
│   │   ├── core/                # Config, auth, cache, rate limiter
│   │   └── models/              # Pydantic models
│   ├── models/                  # Trained ML artifacts (.pkl, .onnx)
│   ├── knowledge_base/          # RAG source documents
│   ├── supabase_schema.sql      # Full database schema
│   └── requirements.txt
│
├── render.yaml                  # Render deployment blueprint
└── .github/workflows/ci.yml    # CI pipeline
```

---

## ⚡ Quick Start

### Prerequisites

- **Python 3.11+** and **Node.js 20+**
- **Supabase** project (free tier works)
- **Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))
- **Redis** (optional — caching layer)

### 1. Clone & Setup

```bash
git clone https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai.git
cd Campus-Sync-Edge-Ai
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-key
BYTEZ_API_KEY=your-bytez-key          # optional
REDIS_URL=redis://localhost:6379       # optional
```

Run the database schema:
```sql
-- Execute backend/supabase_schema.sql in Supabase SQL Editor
```

Train ML models (first-time setup):
```bash
python -m app.ml_pipeline.train_v2 --seed 42
```

Start the API:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the dev server:
```bash
npm run dev
```

Open **http://localhost:5173** and you're live! 🎉

---

## 📊 ML Pipeline

| Model | Algorithm | Accuracy | Dataset |
|---|---|---|---|
| **Role Classifier** v2 | RandomForest (n=300, depth=20) | **82.1%** (F1 Macro) | 2,000+ real + synthetic records |
| **Score Regressor** v2 | RandomForest (n=300, depth=20) | **RMSE ≈ 1.04** | Same dataset, weighted sampling |

- **Feature Engineering**: Binary skill vector (30+ skills) + 5 numeric features (core coverage, optional coverage, project score, ATS score, structure score)
- **ONNX Export**: Score model exported to ONNX for cross-platform edge inference
- **Model Versioning**: v1 and v2 artifacts coexist — v1 is never overwritten

---

## 🌐 Deployment

### Render (One-Click)

The project includes a `render.yaml` blueprint:

1. Push to GitHub
2. Render Dashboard → **New Blueprint** → Connect repo
3. Render auto-creates:
   - `campussync-edge-api` — Python web service (FastAPI)
   - `campussync-edge` — Static site (Vite build)
4. Set environment variables in the Render dashboard

### CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):
- **Frontend**: TypeScript check → Vitest unit tests → Vite build
- **Backend**: Ruff lint → Pytest unit tests
- **Deploy**: Triggered on `main` push after all checks pass

---

## 🗄️ Database Schema

8 tables in Supabase (PostgreSQL):

| Table | Purpose |
|---|---|
| `resumes` | Uploaded resume metadata and extracted data |
| `role_analyses` | Per-role analysis results with detailed scoring |
| `resume_analysis_synthetic` | v1 synthetic training data |
| `resume_analysis_synthetic_v2` | v2 high-ambiguity training data |
| `knowledge_chunks` | RAG knowledge base with PGVector embeddings (3072-dim) |
| `prediction_feedback` | User corrections on ML predictions |
| `knowledge_cache` | Cached knowledge lookups |
| `contributions` | Community-submitted content (pending/approved/rejected) |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_KEY` | ✅ | Supabase service role key |
| `SUPABASE_JWT_SECRET` | ✅ | JWT secret for auth verification |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `BYTEZ_API_KEY` | Optional | Bytez SDK key (LLM fallback) |
| `REDIS_URL` | Optional | Redis connection URL for caching |
| `GITHUB_TOKEN` | Optional | GitHub PAT for higher API rate limits |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins |
| `APP_VERSION` | Optional | Version string (default: `4.2.0`) |

---

## 👥 Team

Built with ❤️ by the CampusSync team.

---

<p align="center">
  <b>⚡ CampusSync Edge AI — From Resume to Ready.</b>
</p>
