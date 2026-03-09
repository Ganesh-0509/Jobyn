# JanaNaadi — India's Real-Time Public Sentiment Intelligence Platform

> **"JanaNaadi"** = "Pulse of the People" (Jana = People, Naadi = Pulse)
> Alternative names: NagrikDrishti, JanVaani, PulseGov

---

## 🎯 Hackathon Context

**Event:** India Innovates 2026 — World's Largest Civic Tech Hackathon
**Venue:** Bharat Mandapam, New Delhi | 28 March 2026
**Domain:** Digital Democracy (Domain 2)
**Problem Statement:** AI-Driven Sentiment Analysis Engine

> "Public sentiment shifts quickly across social media, news, surveys, and ground feedback, but political teams often lack a system to track it in real time at both mass public level and booth-level micro areas. The challenge is to build an AI-driven Sentiment Analysis Engine that analyzes multi-language data, detects positive/negative/neutral sentiment, identifies key issues and trends, and provides booth-wise + constituency-wise dashboards, heatmaps, and alerts to support faster decision-making and targeted outreach."

---

## 📌 One-Line Pitch

**JanaNaadi is an AI-powered multilingual sentiment intelligence platform that aggregates citizen voice from social media, news, and surveys — and maps it to India's democratic geography (booth → ward → constituency → district → state) with real-time heatmaps, trend detection, and auto-generated policy briefs for governance leaders.**

---

## 🧠 The Big Idea

### The Problem
- India has **543 parliamentary constituencies**, **4,120 assembly segments**, and **10 lakh+ polling booths**
- Citizens express opinions on governance across **22+ languages** on Twitter/X, news comments, WhatsApp forwards, local media, and surveys
- No system exists to **aggregate, geolocate, classify, and visualize** this sentiment in real-time at granular geographic levels
- Leaders rely on **anecdotal feedback**, **delayed surveys**, or **expensive political consultants** — all reactive, not proactive
- By the time a policy failure or citizen anger is detected, it's often too late for course correction

### The Solution
JanaNaadi creates a **living pulse map of India** by:
1. **Ingesting** public text from multiple sources (social media, news, RSS feeds, manual surveys, CSV uploads)
2. **Understanding** it in any Indian language (Gemini API for multilingual NLP)
3. **Classifying** sentiment (positive / negative / neutral) with confidence scores
4. **Extracting** topics/issues (water, roads, corruption, jobs, healthcare, education, etc.)
5. **Geolocating** it to India's democratic geography (booth/ward/constituency/district/state)
6. **Visualizing** it on interactive heatmaps with drill-down capability
7. **Alerting** leaders when sentiment spikes are detected
8. **Generating** AI policy briefs ("Top 3 issues in Ward 42 this week")

### Why It Matters (Civic Impact)
- **Proactive governance:** Don't wait for protests — see anger building in real-time
- **Hyper-local accountability:** Know that Gali #7 in Ward 42 is angry about drainage, not just "the city"
- **Multilingual inclusivity:** Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati — every citizen's voice counts regardless of language
- **Democratic transparency:** Public dashboard shows citizens that their voice is being heard
- **Data-driven policy:** Replace gut-feel with evidence-based decision-making
- **Early warning system:** Detect communal tension, disaster panic, or policy backlash before it escalates

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
│  Twitter/X API │ News RSS │ Reddit │ CSV Upload │ Survey Forms  │
└──────────┬──────────┬──────────┬──────────┬──────────┬──────────┘
           │          │          │          │          │
           ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINE                             │
│  Dedup → Language Detect → Clean → Normalize → Queue            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NLP PROCESSING ENGINE                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Sentiment    │  │  Topic/Issue  │  │  Geo-Location        │   │
│  │  Classifier   │  │  Extractor    │  │  Tagger              │   │
│  │  (Gemini +    │  │  (Gemini +    │  │  (Keyword→Booth      │   │
│  │   ML Model)   │  │   Taxonomy)   │  │   mapping)           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  Urgency      │  │  Duplicate    │                             │
│  │  Scorer       │  │  Detector     │                             │
│  └──────────────┘  └──────────────┘                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                          │
│                                                                   │
│  sentiment_entries │ topics │ locations │ alerts │ reports        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│   PUBLIC PORTAL   │ │  ADMIN DASHBOARD │ │  ALERT ENGINE       │
│   (No login)      │ │  (Auth required) │ │  (Background)       │
│                    │ │                   │ │                     │
│  - National stats  │ │  - Heatmaps      │ │  - Spike detection  │
│  - Top issues      │ │  - Drill-down    │ │  - Threshold alerts │
│  - Transparency    │ │  - Trend analysis │ │  - AI briefs        │
│  - Open data CSV   │ │  - AI briefs     │ │  - Email/webhook    │
└──────────────────┘ └─────────────────┘ └─────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Component | Technology | Why |
|-----------|-----------|-----|
| API Framework | **FastAPI** (Python) | Async, fast, auto-docs, familiar from CampusSync |
| Database | **Supabase** (PostgreSQL) | Free tier, auth built-in, real-time subscriptions |
| LLM/NLP | **Google Gemini 2.0 Flash** | Multilingual understanding (22 Indian languages), fast, cheap |
| ML Model | **scikit-learn** (backup classifier) | Lightweight sentiment model for when Gemini is slow/down |
| Caching | **In-memory TTL cache** | Rate limit Gemini calls, cache frequent queries |
| Background Jobs | **FastAPI BackgroundTasks** | Async ingestion, alert checking |
| Auth | **Supabase Auth** (JWT) | Role-based: admin / analyst / public |

### Frontend
| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | **React 18 + TypeScript** | Familiar from CampusSync |
| Build Tool | **Vite** | Fast builds |
| Maps | **Leaflet.js + React-Leaflet** | Free, open-source India maps with GeoJSON |
| Charts | **Recharts** or **Chart.js** | Trend lines, bar charts, pie charts |
| Heatmaps | **Leaflet heatmap plugin** or **D3.js** | Constituency/ward-level heatmaps |
| UI | **Tailwind CSS** or custom CSS | Fast styling |
| State | **React Context** | Simple, no Redux needed |

### Data Sources (for demo)
| Source | Method | Notes |
|--------|--------|-------|
| **Twitter/X** | API v2 (Academic/Basic) or **snscrape** | Search by location + keywords |
| **News** | RSS feeds (NDTV, TOI, Hindu, regional) | Parse headlines + summaries |
| **Reddit** | Reddit API (r/india, r/chennai, etc.) | City-specific subreddits |
| **CSV Upload** | Manual upload | Offline survey data, ground reports |
| **Synthetic Data** | Script-generated | For demo if APIs are limited |

---

## 📊 Database Schema

### Core Tables

```sql
-- Geographic hierarchy (pre-loaded, India's democratic geography)
CREATE TABLE states (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL  -- e.g., 'TN', 'DL', 'MH'
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    state_id INTEGER REFERENCES states(id),
    name TEXT NOT NULL
);

CREATE TABLE constituencies (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('parliamentary', 'assembly')),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    constituency_id INTEGER REFERENCES constituencies(id),
    name TEXT NOT NULL,
    booth_numbers TEXT[],  -- Array of booth IDs in this ward
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

-- Master topic taxonomy
CREATE TABLE topic_taxonomy (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,           -- e.g., 'Water Supply', 'Roads', 'Corruption'
    category TEXT NOT NULL,       -- e.g., 'Infrastructure', 'Governance', 'Healthcare'
    keywords JSONB NOT NULL,      -- {"en": ["water", "tap", "pipeline"], "hi": ["paani", "nal"], "ta": ["thanni", "kuzhay"]}
    icon TEXT                     -- Emoji or icon name for UI
);

-- Core sentiment data (every processed text entry)
CREATE TABLE sentiment_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source info
    source TEXT NOT NULL CHECK (source IN ('twitter', 'news', 'reddit', 'survey', 'csv', 'manual')),
    source_id TEXT,                -- Original post ID (for dedup)
    source_url TEXT,               -- Link to original
    author_handle TEXT,            -- Anonymized or public handle
    
    -- Content
    original_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,
    language TEXT NOT NULL,         -- ISO 639-1 code: 'hi', 'ta', 'en', 'te', etc.
    translated_text TEXT,          -- English translation (if non-English)
    
    -- NLP Results
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score REAL NOT NULL CHECK (sentiment_score BETWEEN -1.0 AND 1.0),  -- -1 = very negative, +1 = very positive
    confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    
    -- Topic extraction
    primary_topic_id INTEGER REFERENCES topic_taxonomy(id),
    secondary_topics INTEGER[],    -- Array of topic IDs
    extracted_keywords TEXT[],     -- Raw keywords found
    
    -- Geographic mapping
    state_id INTEGER REFERENCES states(id),
    district_id INTEGER REFERENCES districts(id),
    constituency_id INTEGER REFERENCES constituencies(id),
    ward_id INTEGER REFERENCES wards(id),
    geo_confidence TEXT CHECK (geo_confidence IN ('exact', 'inferred', 'estimated', 'unknown')),
    
    -- Metadata
    urgency_score REAL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 1),  -- 0=calm, 1=crisis
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES sentiment_entries(id),
    
    -- Timestamps
    published_at TIMESTAMPTZ,      -- When the original post was made
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Aggregated snapshots (pre-computed for fast dashboard)
CREATE TABLE sentiment_snapshots (
    id SERIAL PRIMARY KEY,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('national', 'state', 'district', 'constituency', 'ward')),
    scope_id INTEGER,              -- ID of the geographic entity
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    total_entries INTEGER NOT NULL DEFAULT 0,
    positive_count INTEGER NOT NULL DEFAULT 0,
    negative_count INTEGER NOT NULL DEFAULT 0,
    neutral_count INTEGER NOT NULL DEFAULT 0,
    avg_sentiment_score REAL,
    
    top_topics JSONB,              -- [{"topic_id": 1, "count": 45}, ...]
    top_keywords JSONB,            -- ["water", "road", "corruption"]
    language_distribution JSONB,   -- {"hi": 40, "en": 30, "ta": 20}
    
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (triggered by spike detection)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    alert_type TEXT NOT NULL CHECK (alert_type IN ('sentiment_spike', 'volume_spike', 'new_issue', 'urgency_high')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    scope_type TEXT NOT NULL,
    scope_id INTEGER,
    
    title TEXT NOT NULL,            -- "Negative sentiment spike in Ward 42"
    description TEXT NOT NULL,      -- AI-generated explanation
    
    related_topic_id INTEGER REFERENCES topic_taxonomy(id),
    sentiment_shift REAL,          -- How much sentiment changed (e.g., -0.4 drop)
    volume_change REAL,            -- % increase in mentions
    
    sample_entries UUID[],         -- 3-5 representative sentiment_entry IDs
    
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    
    triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated policy briefs
CREATE TABLE policy_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    scope_type TEXT NOT NULL,
    scope_id INTEGER,
    period TEXT NOT NULL,           -- 'daily', 'weekly', 'monthly'
    
    title TEXT NOT NULL,
    summary TEXT NOT NULL,          -- 2-3 sentence executive summary
    key_findings JSONB NOT NULL,    -- [{finding, sentiment, topic, evidence_count}]
    recommendations JSONB NOT NULL, -- [{action, priority, rationale}]
    raw_stats JSONB NOT NULL,       -- {total, positive, negative, top_issues, ...}
    
    generated_by TEXT DEFAULT 'gemini-2.0-flash',
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User uploaded surveys / ground reports
CREATE TABLE survey_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID,               -- Supabase auth user ID
    filename TEXT NOT NULL,
    row_count INTEGER,
    processed_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sentiment_entries_state ON sentiment_entries(state_id);
CREATE INDEX idx_sentiment_entries_constituency ON sentiment_entries(constituency_id);
CREATE INDEX idx_sentiment_entries_ward ON sentiment_entries(ward_id);
CREATE INDEX idx_sentiment_entries_sentiment ON sentiment_entries(sentiment);
CREATE INDEX idx_sentiment_entries_topic ON sentiment_entries(primary_topic_id);
CREATE INDEX idx_sentiment_entries_published ON sentiment_entries(published_at DESC);
CREATE INDEX idx_sentiment_entries_source ON sentiment_entries(source);
CREATE INDEX idx_alerts_severity ON alerts(severity, triggered_at DESC);
CREATE INDEX idx_snapshots_scope ON sentiment_snapshots(scope_type, scope_id, period_start);
```

---

## 🔌 API Endpoints

### Public Endpoints (No auth)

```
GET  /api/public/national-pulse
     → { avg_sentiment, total_entries_24h, top_3_issues, top_3_positive, language_breakdown }

GET  /api/public/state-rankings
     → [{ state, avg_sentiment, volume, top_issue }] sorted by sentiment

GET  /api/public/trending-topics
     → [{ topic, mention_count, sentiment_trend, 7_day_change }]

GET  /api/public/open-data?format=csv&period=weekly
     → CSV download of anonymized aggregate data
```

### Analyst Endpoints (Auth required)

```
# Heatmap data
GET  /api/heatmap/states
     → [{ state_id, name, lat, lng, avg_sentiment, volume, dominant_topic }]

GET  /api/heatmap/districts?state_id=X
     → [{ district_id, name, lat, lng, avg_sentiment, volume }]

GET  /api/heatmap/constituencies?district_id=X
     → [{ constituency_id, name, lat, lng, avg_sentiment, volume }]

GET  /api/heatmap/wards?constituency_id=X
     → [{ ward_id, name, lat, lng, avg_sentiment, volume }]

# Drill-down
GET  /api/analysis/constituency/{id}
     → { overview, sentiment_distribution, topic_breakdown, trend_7d, trend_30d, recent_entries, languages }

GET  /api/analysis/ward/{id}
     → { overview, sentiment_distribution, topic_breakdown, recent_entries }

# Trends
GET  /api/trends/sentiment?scope=state&id=X&period=30d
     → [{ date, positive_pct, negative_pct, neutral_pct, volume }]

GET  /api/trends/topics?scope=constituency&id=X&period=30d
     → [{ date, topic, mention_count }]

GET  /api/trends/comparison?scope_ids=[1,2,3]&type=constituency
     → [{ id, name, avg_sentiment, top_issue }] (side-by-side compare)

# Search
GET  /api/search/entries?q=water+problem&state=TN&sentiment=negative&limit=50
     → [{ id, text, sentiment, topic, location, date }]
```

### Admin Endpoints (Admin auth)

```
# Data ingestion
POST /api/ingest/twitter        → Trigger Twitter ingestion job
POST /api/ingest/news           → Trigger RSS news ingestion
POST /api/ingest/csv            → Upload CSV survey data
POST /api/ingest/manual         → Submit single manual entry
GET  /api/ingest/status         → { twitter_last_run, news_last_run, total_today, queue_size }

# Alerts
GET  /api/alerts?severity=high&unread=true
     → [{ id, type, severity, title, description, triggered_at }]

POST /api/alerts/{id}/read
POST /api/alerts/{id}/resolve

# AI Briefs
POST /api/briefs/generate       → { scope_type, scope_id, period } → Generate new brief
GET  /api/briefs?scope=constituency&id=X
     → [{ id, title, summary, generated_at }]
GET  /api/briefs/{id}
     → Full brief with findings + recommendations

# System
GET  /api/admin/stats
     → { total_entries, entries_today, sources_active, avg_processing_time, alert_count }

POST /api/admin/snapshot/generate  → Trigger snapshot re-computation
```

### NLP Processing Endpoints (Internal)

```
POST /api/nlp/analyze
     → { text } → { sentiment, score, confidence, topics, keywords, language, translation }

POST /api/nlp/batch-analyze
     → { entries: [{text, source, metadata}] } → Batch process

POST /api/nlp/geolocate
     → { text, hints } → { state, district, constituency, ward, confidence }
```

---

## 📱 Frontend Pages

### 1. Landing Page (`/`)
- Hero: "The Pulse of India's People" with animated heatmap preview
- Real-time ticker: "23,456 citizen voices analyzed today"
- 3 value props: Real-time | Multilingual | Hyper-local
- Live national sentiment gauge (donut chart: positive/negative/neutral)
- CTA: "View Public Dashboard" + "Admin Login"

### 2. Public Dashboard (`/pulse`) — NO LOGIN REQUIRED
- National sentiment gauge (big donut)
- Top 5 trending issues (cards with sentiment color)
- State-wise ranking table (sortable)
- "This week's most discussed" word cloud
- Open Data download button (CSV)
- Footer: "Powered by JanaNaadi — India's Democratic Pulse"

### 3. Interactive Heatmap (`/map`) — LOGIN REQUIRED
**This is the HERO page for the demo**
- Full-screen India map (Leaflet + GeoJSON)
- Color gradient: Red (negative) → Yellow (neutral) → Green (positive)
- **Zoom levels:**
  - Zoom 0-5: State-level blobs
  - Zoom 5-8: District-level
  - Zoom 8-11: Constituency-level
  - Zoom 11+: Ward/booth-level
- Click any region → slide-over panel with:
  - Sentiment breakdown (pie chart)
  - Top 3 issues here
  - Volume trend (sparkline)
  - "View detailed analysis" button
  - "Generate AI brief" button
- Filters sidebar:
  - Time range picker (last 24h, 7d, 30d, custom)
  - Topic filter (Water, Roads, Healthcare, etc.)
  - Source filter (Twitter, News, Survey, All)
  - Language filter
  - Sentiment filter (show only negative, etc.)

### 4. Constituency/Ward Analysis (`/analysis/:type/:id`) — LOGIN REQUIRED
- Header: Region name + current sentiment score (big number)
- **Sentiment over time** (line chart: 30-day trend)
- **Topic breakdown** (horizontal bar chart)
- **Source distribution** (pie chart: Twitter vs News vs Survey)
- **Language breakdown** (bar chart)
- **Recent voices** (table of recent entries with sentiment color-coding)
- **Comparison mode** (select 2-3 regions to compare side-by-side)
- **AI Brief** section (auto-generated or on-demand)

### 5. Alert Center (`/alerts`) — ADMIN ONLY
- Alert cards stacked by severity (Critical → High → Medium → Low)
- Each alert shows:
  - Type icon (spike, new issue, urgency)
  - Title + description
  - Affected area (with map pin)
  - Sample voices (3 representative texts)
  - "Mark as read" / "Mark as resolved" buttons
- Filter: Unread | All | By severity | By region
- Bell icon in navbar with unread count badge

### 6. AI Policy Briefs (`/briefs`) — ADMIN ONLY
- List of generated briefs (sorted by date)
- Each brief card: Title, scope, date, 2-line summary
- Click → Full brief view:
  - Executive Summary (2-3 sentences)
  - Key Findings (numbered list with sentiment indicators)
  - Recommendations (action items with priority tags)
  - Supporting data (charts + sample voices)
- "Generate New Brief" button → Select scope + period → AI generates

### 7. Data Ingestion (`/admin/ingest`) — ADMIN ONLY
- Ingestion status cards (Twitter, News, Reddit, CSV)
  - Last run time, entries ingested, success rate
  - "Run Now" button per source
- CSV upload zone (drag & drop)
  - Template download link
  - Upload history table
- Manual entry form (paste text + select location + source)

### 8. Login (`/login`)
- Supabase Auth (email + password)
- Role displayed after login (Admin / Analyst)

---

## 🤖 NLP Pipeline Detail

### Step 1: Ingestion
```python
# Each source has an ingester
class TwitterIngester:
    async def fetch(self, keywords, location_bbox, since):
        # Use Twitter API v2 or snscrape
        # Returns: [{text, author, timestamp, location_hint, source_id}]

class NewsIngester:
    async def fetch(self, rss_feeds):
        # Parse RSS feeds (NDTV, TOI, Hindu, regional)
        # Returns: [{title + summary, source_url, timestamp}]

class CSVIngester:
    async def parse(self, file):
        # Expected columns: text, location (optional), date (optional)
        # Returns: [{text, location_hint, timestamp}]
```

### Step 2: Language Detection + Translation
```python
# Gemini handles this natively
prompt = """
Analyze this text:
"{text}"

Return JSON:
{
  "language": "ISO 639-1 code",
  "language_name": "Hindi/Tamil/etc",
  "english_translation": "translation if not English, else null"
}
"""
```

### Step 3: Sentiment Classification
```python
# PRIMARY: Gemini (multilingual, nuanced)
prompt = """
Analyze the sentiment of this citizen feedback about governance/public services:
"{text}"

Context: This is public opinion about government services, infrastructure, or governance in India.

Return JSON:
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentiment_score": float between -1.0 (very negative) and 1.0 (very positive),
  "confidence": float between 0 and 1,
  "reasoning": "brief explanation"
}
"""

# FALLBACK: Lightweight ML model (scikit-learn)
# Pre-trained on Indian public discourse data
# TF-IDF + LogisticRegression (fast, works offline)
```

### Step 4: Topic Extraction
```python
prompt = """
From this citizen feedback, identify the main governance topic(s):
"{text}"

Available topics: Water Supply, Roads & Infrastructure, Healthcare, Education, 
Corruption, Public Safety, Electricity, Sanitation, Employment, Housing, 
Public Transport, Digital Services, Agriculture, Environment, Women's Safety,
Law & Order, Religious/Communal, Economic Policy, Other

Return JSON:
{
  "primary_topic": "topic name",
  "secondary_topics": ["topic2", "topic3"],
  "keywords": ["specific", "extracted", "keywords"],
  "urgency": float 0-1 (0=casual opinion, 1=emergency/crisis)
}
"""
```

### Step 5: Geolocation
```python
# Strategy: Multi-signal geo-matching

def geolocate(text, source_metadata):
    signals = []
    
    # Signal 1: Explicit location in text ("in Chennai", "Delhi road")
    location_from_text = extract_location_mentions(text)  # NER or regex
    
    # Signal 2: Source metadata (Twitter location, news region)
    location_from_source = source_metadata.get('location')
    
    # Signal 3: Keyword matching to known areas
    # "Velachery flooding" → Velachery ward, Chennai South constituency
    location_from_keywords = match_known_areas(text)
    
    # Resolve: Pick highest confidence signal
    # Map to: state → district → constituency → ward
    return best_match(signals)
```

### Step 6: Duplicate Detection
```python
# Simple approach: Cosine similarity on TF-IDF vectors
# If similarity > 0.85 with existing entry from same source within 24h → mark as duplicate
```

---

## 🗺 India Geographic Data

### Pre-loaded data needed:
1. **States GeoJSON** — 28 states + 8 UTs with boundaries (freely available)
2. **Districts GeoJSON** — 766 districts (from data.gov.in or geojson.io)
3. **Constituency data** — 543 parliamentary + 4,120 assembly (from ECI data)
4. **Ward data** — Start with 5-10 major cities for demo (Delhi, Mumbai, Chennai, Bangalore, Hyderabad)

### Sources for geographic data:
- `https://github.com/datameet/maps` — India maps community (open data, CC-BY)
- `data.gov.in` — Official open data portal
- ECI (Election Commission) published constituency lists

### For hackathon demo:
- Pre-load 3-5 states fully (Delhi, Tamil Nadu, Maharashtra, Karnataka, UP)
- Show drill-down works for these states
- Other states show "Coming soon" or aggregate-only data

---

## 🎨 UI/UX Design Direction

### Color System
```
Positive sentiment: #22C55E (green-500)
Neutral sentiment:  #EAB308 (yellow-500)  
Negative sentiment: #EF4444 (red-500)
Critical alert:     #DC2626 (red-600)

Background:   #0F172A (slate-900) — dark theme for command center feel
Surface:      #1E293B (slate-800)
Text primary: #F8FAFC (slate-50)
Text muted:   #94A3B8 (slate-400)
Accent:       #3B82F6 (blue-500)
```

### Design Principles
- **Command center aesthetic** — dark theme, data-dense, professional
- **Military/intelligence feel** — this is a "situation room" for governance
- **Heatmap is the hero** — full-screen map is the first thing judges see
- **Real-time feel** — numbers updating, animated transitions, live data ticker

---

## 📁 Project Structure

```
jananaadi/
├── README.md
├── render.yaml                     # Deployment config
│
├── backend/
│   ├── requirements.txt
│   ├── supabase_schema.sql
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app + CORS + middleware
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── settings.py         # Environment config
│   │   │   ├── auth.py             # Supabase JWT auth + role check
│   │   │   ├── supabase_client.py  # DB client
│   │   │   ├── rate_limiter.py     # Per-endpoint rate limiting
│   │   │   └── cache.py            # TTL cache for snapshots
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── public.py           # /api/public/* — no auth endpoints
│   │   │   ├── heatmap.py          # /api/heatmap/* — map data endpoints
│   │   │   ├── analysis.py         # /api/analysis/* — drill-down endpoints
│   │   │   ├── trends.py           # /api/trends/* — time-series endpoints
│   │   │   ├── search.py           # /api/search/* — full-text search
│   │   │   ├── alerts.py           # /api/alerts/* — alert management
│   │   │   ├── briefs.py           # /api/briefs/* — AI policy briefs
│   │   │   ├── ingest.py           # /api/ingest/* — data ingestion triggers
│   │   │   └── admin.py            # /api/admin/* — system management
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── nlp_service.py      # Gemini sentiment + topic + translation
│   │   │   ├── sentiment_engine.py # Scoring logic + ML fallback
│   │   │   ├── topic_engine.py     # Topic taxonomy matching
│   │   │   ├── geo_engine.py       # Text → geographic location mapping
│   │   │   ├── alert_engine.py     # Spike detection + alert generation
│   │   │   ├── brief_generator.py  # AI policy brief creation (Gemini)
│   │   │   ├── snapshot_service.py # Aggregate snapshot computation
│   │   │   ├── dedup_service.py    # Duplicate detection
│   │   │   └── gemini_service.py   # Gemini API wrapper
│   │   │
│   │   ├── ingesters/
│   │   │   ├── __init__.py
│   │   │   ├── twitter_ingester.py
│   │   │   ├── news_ingester.py
│   │   │   ├── reddit_ingester.py
│   │   │   ├── csv_ingester.py
│   │   │   └── base_ingester.py    # Abstract base class
│   │   │
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── train_sentiment.py  # Train backup ML classifier
│   │   │   └── fallback_model.py   # Lightweight sklearn sentiment
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py          # Pydantic models for all request/response
│   │   │
│   │   └── data/
│   │       ├── topic_taxonomy.json         # Master topic list + multilingual keywords
│   │       ├── india_locations.json        # State/district/constituency lookup
│   │       └── demo_seed_data.json         # Pre-generated demo data
│   │
│   └── config/
│       ├── rss_feeds.json          # News RSS feed URLs
│       ├── twitter_keywords.json   # Search terms per topic
│       └── alert_thresholds.json   # Spike detection config
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   │
│   ├── public/
│   │   └── geojson/
│   │       ├── india_states.geojson
│   │       ├── india_districts.geojson
│   │       └── constituencies/
│   │           ├── delhi.geojson
│   │           ├── tamil_nadu.geojson
│   │           └── ...
│   │
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css               # Global styles + design tokens
│       │
│       ├── api/
│       │   ├── client.ts           # Axios/fetch wrapper
│       │   ├── public.ts           # Public API calls
│       │   ├── heatmap.ts          # Heatmap data calls
│       │   ├── analysis.ts         # Drill-down calls
│       │   ├── alerts.ts           # Alert API calls
│       │   └── admin.ts            # Admin API calls
│       │
│       ├── components/
│       │   ├── Layout.tsx          # App shell (navbar + sidebar)
│       │   ├── PrivateRoute.tsx    # Auth guard
│       │   ├── SentimentGauge.tsx  # Big donut chart component
│       │   ├── HeatmapLegend.tsx   # Color scale legend
│       │   ├── TopicCard.tsx       # Issue card with sentiment
│       │   ├── TrendChart.tsx      # Line chart wrapper
│       │   ├── AlertCard.tsx       # Alert notification card
│       │   ├── BriefViewer.tsx     # Policy brief renderer
│       │   ├── RegionPanel.tsx     # Slide-over detail panel
│       │   ├── FilterSidebar.tsx   # Map filter controls
│       │   ├── VoiceTable.tsx      # Table of citizen voices
│       │   ├── CompareView.tsx     # Side-by-side region comparison
│       │   ├── LiveTicker.tsx      # Scrolling real-time data ticker
│       │   └── StatCard.tsx        # Metric card with icon
│       │
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Login.tsx
│       │   ├── PublicDashboard.tsx
│       │   ├── HeatmapView.tsx     # THE HERO PAGE
│       │   ├── AnalysisView.tsx
│       │   ├── AlertCenter.tsx
│       │   ├── PolicyBriefs.tsx
│       │   ├── DataIngestion.tsx
│       │   └── AdminPanel.tsx
│       │
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   └── FilterContext.tsx    # Global filter state (time, topic, region)
│       │
│       ├── utils/
│       │   ├── colors.ts           # Sentiment → color mapping
│       │   ├── formatters.ts       # Number/date formatting
│       │   └── geo.ts              # GeoJSON helpers
│       │
│       └── hooks/
│           ├── useHeatmapData.ts
│           ├── useAlerts.ts
│           └── useSentimentTrend.ts
│
└── data/
    ├── generate_seed_data.py       # Script to create realistic demo data
    ├── seed_topics.py              # Load topic taxonomy
    └── seed_geography.py           # Load India geographic data
```

---

## 🧪 Demo Strategy (For Hackathon Day)

### The 5-Minute Demo Script

1. **Open Landing Page** (15s)
   - "JanaNaadi — India's first real-time democratic pulse engine"
   - Show live ticker: "47,832 citizen voices analyzed"

2. **Public Dashboard** (30s)
   - National sentiment: 52% positive, 31% negative, 17% neutral
   - Top issue: "Water supply" trending negative in 3 states
   - "This is open data — any citizen can see this"

3. **THE HEATMAP** (2 min) — Star of the show
   - Full India map, color-coded by sentiment
   - Zoom into Tamil Nadu → districts light up
   - Zoom into Chennai → constituencies appear
   - Click one constituency → panel slides in:
     - "Top concern: Road infrastructure (67% negative)"
     - "Languages: Tamil 72%, English 28%"
     - Show actual citizen tweets/feedback
   - Toggle topic filter → show only "Healthcare" → map colors change
   - Show before/after toggle (last week vs this week)

4. **AI Policy Brief** (1 min)
   - Click "Generate Brief" for a constituency
   - AI generates: "Executive Summary: Rising citizen dissatisfaction with water supply in Ward 42. 340 negative mentions in 7 days, 4x normal volume. Primary languages: Tamil (78%), Hindi (12%). Recommendation: Immediate water tanker deployment + public communication on pipeline repair timeline."
   - Show it's multilingual — brief can be generated in Hindi too

5. **Alert System** (30s)
   - Show a critical alert: "Negative spike detected in Constituency X — 300% increase in 'corruption' mentions"
   - "This gives leaders 48 hours of advance warning before a crisis hits news headlines"

6. **Close with Impact** (30s)
   - "Deploy to 543 constituencies → India's first national democratic feedback loop"
   - "Every citizen's voice in every language, mapped to their exact neighborhood"
   - "Open data — transparent — accountable governance"

### Demo Data Strategy
- **Pre-generate 10,000-50,000 realistic entries** using a seed script
- Mix of English, Hindi, Tamil, Telugu, Bengali text
- Distribute across 5 states with realistic geographic clustering
- Plant some "stories" (water crisis in one area, positive road feedback in another)
- Some real tweets (search Twitter for Indian governance topics)

---

## 📦 Dependencies

### Backend (requirements.txt)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
supabase==2.3.0
google-generativeai==0.8.0
pydantic==2.5.3
python-multipart==0.0.6
httpx==0.26.0
feedparser==6.0.11          # RSS feed parsing
scikit-learn==1.4.0          # Fallback ML sentiment
pandas==2.1.4
numpy==1.26.3
python-dotenv==1.0.0
slowapi==0.1.9               # Rate limiting
cachetools==5.3.2             # TTL cache
```

### Frontend (package.json additions)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.10.3",
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.3",
    "lucide-react": "^0.303.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## 🏆 Judging Alignment

| Hackathon Criteria | How JanaNaadi Scores |
|-------------------|---------------------|
| **Civic Impact** | Direct — real-time governance feedback loop across 543 constituencies |
| **Innovation** | Multilingual NLP + hyper-local geo-mapping + AI policy briefs = novel |
| **Technical Depth** | Gemini NLP + ML fallback + real-time aggregation + GIS heatmaps |
| **Scalability** | Architecture scales from 1 ward to all of India |
| **Demo-ability** | Interactive heatmap is visually stunning — impossible to ignore |
| **Policy Relevance** | Directly helps elected leaders, bureaucrats, district collectors |
| **Inclusivity** | Every Indian language included — no citizen left unheard |
| **Open Data** | Public portal with CSV download — transparency by design |
| **Feasibility** | MVP buildable in 19 days with known tech stack |

---

## ⏱ 19-Day Build Plan

### Phase 1: Foundation (Days 1-4)
- [ ] Project scaffold (FastAPI + React + Supabase)
- [ ] Database schema + migrations
- [ ] Auth setup (Supabase)
- [ ] Geographic data loading (states + districts GeoJSON)
- [ ] Topic taxonomy seeding
- [ ] Basic API structure (routers + empty endpoints)
- [ ] Frontend routing + layout shell

### Phase 2: NLP Engine (Days 5-8)
- [ ] Gemini service wrapper (sentiment + topics + translation)
- [ ] Fallback ML sentiment classifier (scikit-learn)
- [ ] Topic extraction + taxonomy matching
- [ ] Geo-location engine (text → state/district/constituency)
- [ ] Processing pipeline (ingest → analyze → store)
- [ ] CSV ingester (easiest source to start with)
- [ ] Demo data seed script (generate 10K+ entries)

### Phase 3: Dashboard (Days 9-13)
- [ ] India heatmap (Leaflet + GeoJSON + sentiment coloring)
- [ ] Zoom-level transitions (state → district → constituency → ward)
- [ ] Region click → detail panel
- [ ] Filter sidebar (time, topic, source, language)
- [ ] Trend charts (sentiment over time)
- [ ] Public dashboard page
- [ ] Landing page

### Phase 4: Intelligence Layer (Days 14-17)
- [ ] Alert engine (spike detection + threshold alerts)
- [ ] Alert center UI
- [ ] AI policy brief generator (Gemini)
- [ ] Brief viewer UI
- [ ] Snapshot aggregation service (pre-compute hourly/daily)
- [ ] Comparison mode (compare 2-3 regions)

### Phase 5: Polish (Days 18-19)
- [ ] Demo data fine-tuning (plant compelling stories)
- [ ] Performance optimization (snapshot caching)
- [ ] Dark theme polish
- [ ] Live ticker animation
- [ ] Demo script rehearsal
- [ ] Edge cases + error handling
- [ ] Deploy to Render/Railway

---

## 💡 Hackathon Tips

1. **Heatmap is EVERYTHING** — Spend 40% of your time making it perfect. Judges will remember the visual.
2. **Plant demo stories** — Seed data should have clear narratives ("Ward 42 water crisis", "Constituency X loves new road")
3. **Show multilingual** — Demo analyzing a Hindi tweet alongside a Tamil news article. This is your differentiator.
4. **The AI brief is the wow moment** — When Gemini generates a professional policy brief from raw citizen data, judges will be impressed.
5. **Open data angle** — "Any citizen can download this data" = transparency = democratic value
6. **Scale pitch** — "Today 5 states, tomorrow 543 constituencies" — show you've designed for national scale even if demo is limited.

---

**This document contains everything needed to build JanaNaadi. Drop it into a new chat session and say "Build this project following this blueprint." Start with Phase 1.**
