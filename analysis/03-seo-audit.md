# SEO Audit — CampusSync Edge

**Date:** 2026-05-30
**Auditor:** SEO Audit Skill (claude-forge)
**Site:** https://campussync.ai
**Stack:** React SPA (Vite) + FastAPI, deployed on Render

---

## SEO Score: 2/10

| Category | Score | Status |
|----------|-------|--------|
| Technical SEO | 2/10 | SPA crawlability critical, no SSR |
| On-Page SEO | 1/10 | No per-page meta, no keyword targeting |
| Structured Data | 0/10 | Zero JSON-LD markup |
| Content | 1/10 | 1 blog post, no content strategy |
| Performance | 5/10 | Good code splitting, but 79MB ONNX WASM |
| **Overall** | **2/10** | **Invisible to search engines** |

---

## 1. Technical SEO Audit

### 1.1 SPA Crawlability — CRITICAL

**Finding:** CampusSync is a client-side rendered React SPA. Googlebot can render JavaScript, but with significant limitations:

- **Rendering delay:** Googlebot queues JS pages for deferred rendering. Pages may not be indexed for days/weeks.
- **No SSR/SSG:** No server-side rendering. The HTML sent to crawlers is just `<div id="root"></div>` with a script tag.
- **Impact:** High. Google may fail to index dynamic content, especially on deeper pages.

**Evidence (from `frontend/index.html`):**
```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

**Fix priority:** CRITICAL
**Recommended fix:** Implement pre-rendering for the 5 public pages (landing, login, signup, privacy, terms) using `react-snap` or `prerender.io`. For long-term, consider migrating to a framework with SSR (Next.js, Remix).

---

### 1.2 Sitemap — HIGH PRIORITY

**Finding:** `sitemap.xml` exists but is severely incomplete.

**Current sitemap URLs (6 total):**
| URL | Status | Priority |
|-----|--------|----------|
| `/` | ✅ Included | 1.0 |
| `/login` | ⚠️ Should not be indexed | 0.6 |
| `/signup` | ⚠️ Should not be indexed | 0.6 |
| `/privacy` | ✅ Included | 0.3 |
| `/terms` | ✅ Included | 0.3 |
| `/docs` | ✅ Included | 0.5 |

**Missing from sitemap (should be added):**
| URL | Keyword Potential | Recommended Priority |
|-----|------------------|---------------------|
| `/skill-gap` | "skill gap analysis tool" (720/mo) | 0.9 |
| `/resume-analyzer` | "resume analyzer" (2,400/mo) | 0.9 |
| `/interview-readiness` | "interview practice AI" (880/mo) | 0.8 |
| `/readiness-score` | "career readiness score" | 0.8 |
| `/improvement-plan` | "career improvement plan" | 0.7 |
| `/industry-alignment` | "industry alignment tool" | 0.6 |

**Fix:** Update sitemap.xml to include all public-facing pages. Remove `/login` and `/signup` (or set `noindex`). Add `<lastmod>` dates.

---

### 1.3 Robots.txt — OK

**Finding:** `robots.txt` exists and is correctly configured.

```
User-agent: *
Allow: /
Sitemap: https://campussync.ai/sitemap.xml
```

**Issues:**
- No `Disallow` rules for admin routes (`/admin`)
- No `Disallow` for API endpoints

**Fix:** Add `Disallow: /admin` and `Disallow: /api/` (if API is on same domain).

---

### 1.4 Meta Tags — CRITICAL

**Finding:** Only ONE set of meta tags exists, in `index.html`. These are global and apply to ALL 19 pages.

```html
<title>CampusSync Edge AI — Career Readiness Intelligence</title>
<meta name="description" content="AI-powered job readiness intelligence for engineering students..." />
```

**Problems:**
- Every page has the same title and description
- No keyword-specific titles per page
- No `react-helmet` or equivalent for dynamic meta tags
- Canonical URL is hardcoded to `https://campussync.ai` (not per-page)

**Per-page title recommendations:**

| Page | Current Title | Recommended Title |
|------|--------------|-------------------|
| Landing | CampusSync Edge AI — Career Readiness Intelligence | CampusSync Edge AI — Career Readiness Intelligence |
| Resume Analyzer | (same) | Free Resume Analyzer for Engineering Students — CampusSync |
| Skill Gap | (same) | Skill Gap Analysis Tool — Identify Missing Skills | CampusSync |
| Interview | (same) | AI Interview Practice for Campus Placements — CampusSync |
| Readiness Score | (same) | Career Readiness Score — Check Your Placement Readiness | CampusSync |
| Dashboard | (same) | Dashboard — CampusSync Edge AI |

**Fix priority:** CRITICAL. Install `react-helmet-async` and add per-page `<Helmet>` components.

---

### 1.5 Open Graph Tags — HIGH PRIORITY

**Finding:** OG tags exist in `index.html` but are global (same for all pages).

```html
<meta property="og:title" content="CampusSync Edge AI — Career Readiness Intelligence" />
<meta property="og:description" content="Upload your resume, get AI-powered readiness scores..." />
<meta property="og:image" content="/og-image.png" />
<meta property="og:url" content="https://campussync.ai" />
```

**Problems:**
- Same OG tags for every page (social shares always show the same preview)
- `og:image` is 549KB (too large, should be <100KB)
- `og:url` is hardcoded to homepage

**Fix:** Implement per-page OG tags via `react-helmet-async`. Compress `og-image.png`. Create dynamic OG images.

---

### 1.6 Canonical Tags — MEDIUM PRIORITY

**Finding:** Single canonical URL in `index.html` pointing to `https://campussync.ai`.

**Problem:** All pages inherit the same canonical tag, telling Google that every page is the same as the homepage. This actively hurts indexing.

**Fix:** Each page needs its own canonical URL. Implement via `react-helmet-async`.

---

### 1.7 URL Structure — GOOD

**Finding:** Clean, readable URL paths.

| Route | SEO Quality |
|-------|------------|
| `/` | ✅ Perfect |
| `/resume-analyzer` | ✅ Good, keyword-rich |
| `/skill-gap` | ✅ Good |
| `/interview-readiness` | ✅ Good |
| `/readiness-score` | ✅ Good |
| `/improvement-plan` | ✅ Good |
| `/progress-tracking` | ✅ Good |
| `/privacy` | ✅ Good |
| `/terms` | ✅ Good |

**No issues.** URL structure is SEO-friendly.

---

## 2. On-Page SEO Audit

### 2.1 Title Tags — CRITICAL

**Finding:** No per-page title tags. Single global title for all 19 pages.

**Impact:** Google cannot differentiate between pages. All pages compete for the same keywords.

**Fix:** Implement `react-helmet-async` with per-page titles. Target keywords per page:

| Page | Primary Keyword | Title Template |
|------|----------------|----------------|
| Landing | career readiness platform | {keyword} for Engineering Students — CampusSync |
| Resume Analyzer | resume analyzer | Free {keyword} — AI-Powered Resume Scoring | CampusSync |
| Skill Gap | skill gap analysis | {keyword} Tool — Find Missing Skills Instantly | CampusSync |
| Interview | interview practice | AI {keyword} for Campus Placements — CampusSync |
| Readiness Score | readiness score | Check Your {keyword} — CampusSync |

---

### 2.2 Meta Descriptions — CRITICAL

**Finding:** No per-page meta descriptions.

**Recommended descriptions (150-160 chars each):**

| Page | Meta Description |
|------|-----------------|
| Landing | "AI-powered career readiness platform for engineering students. Upload your resume, identify skill gaps, and get placed faster. Free to start." |
| Resume Analyzer | "Get instant AI-powered resume analysis trained on 57,100 real resumes. Identify weaknesses, optimize for ATS, and improve your chances of getting shortlisted." |
| Skill Gap | "Discover exactly which skills you're missing for your target role. Our dependency-aware analysis shows you what to learn first and why." |
| Interview | "Practice technical interviews with our AI voice simulator. Get real-time feedback on concept coverage and verbal clarity. Browser-native, privacy-first." |
| Readiness Score | "Get your career readiness score in 60 seconds. AI analysis across 7 job roles shows exactly where you stand and what to improve." |

---

### 2.3 H1 Tags — HIGH PRIORITY

**Finding:** Landing page has no clear H1 with target keywords. Uses branded jargon.

**Current landing page headings (from `Landing.tsx`):**
- "Resume & Skill Diagnostics" (step title)
- "Requirement Gap Analysis" (step title)
- "Vocal Arena Sandbox" (step title)
- "Originality Signatures" (step title)

**Problems:**
- No mention of "resume analyzer", "skill gap", "campus placement" in headings
- Uses branded jargon ("Vocal Arena", "Originality Signatures") instead of searchable terms

**Recommended H1 for landing page:**
```html
<h1>AI Resume Analyzer & Skill Gap Tool for Engineering Students</h1>
```

**Recommended H1 per page:**

| Page | H1 |
|------|-----|
| Landing | AI Resume Analyzer & Skill Gap Tool for Engineering Students |
| Resume Analyzer | Free AI Resume Analyzer — Instant Scoring for Engineering Resumes |
| Skill Gap | Skill Gap Analysis — Find Exactly What You're Missing |
| Interview | AI Interview Practice — Voice-Powered Technical Interview Simulator |
| Readiness Score | Career Readiness Score — Measure Your Placement Readiness |

---

### 2.4 Structured Data (JSON-LD) — CRITICAL

**Finding:** ZERO structured data markup on any page. No `application/ld+json` found anywhere in the codebase.

**Recommended schema types:**

**Landing page — SoftwareApplication + FAQPage:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CampusSync Edge AI",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "description": "AI-powered career readiness platform for engineering students",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  }
}
```

**FAQPage schema for landing page (high CTR potential):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does CampusSync analyze my resume?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CampusSync uses a 3-layer analysis engine combining deterministic scoring, ML inference trained on 57,100 real resumes, and generative AI for personalized feedback."
      }
    }
  ]
}
```

---

## 3. Performance Audit

### 3.1 Code Splitting — GOOD

**Finding:** All 19 pages are lazy-loaded via `React.lazy()` in `App.tsx`. This is excellent for performance.

```typescript
const Landing = lazy(() => import('./pages/Landing'))
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'))
// ... 17 more
```

**Impact:** Initial bundle is small. Each page loads its own chunk on demand.

---

### 3.2 ONNX Runtime Impact — HIGH PRIORITY

**Finding:** ONNX Runtime WASM files are loaded from `/public/ort/`.

| File | Size |
|------|------|
| `ort-wasm-simd-threaded.asyncify.wasm` | **26 MB** |
| `ort-wasm-simd-threaded.jsep.wasm` | **24 MB** |
| `ort-wasm-simd-threaded.jspi.wasm` | **17 MB** |
| `ort-wasm-simd-threaded.wasm` | **12 MB** |
| **Total** | **79 MB** |

**Impact:**
- If loaded eagerly, this destroys Core Web Vitals (LCP, FCP)
- Mobile users on 3G/4G will time out
- Google PageSpeed score will be terrible

**Current mitigation:** The code uses dynamic import (`import * as ort from 'onnxruntime-web'`), so WASM only loads when the user triggers ML inference. This is good.

**Additional recommendations:**
1. Only load ONE WASM variant (not all 4). Use feature detection to pick the best one.
2. Add a service worker to cache WASM files after first load.
3. Add a "loading model" UI state to manage user expectations.

---

### 3.3 Image Optimization — MEDIUM PRIORITY

**Finding:** Images are oversized.

| File | Size | Recommended |
|------|------|------------|
| `og-image.png` | 549 KB | < 100 KB |
| `logo.png` | 504 KB | < 50 KB |

**Fix:** Compress images. Convert to WebP format. Add `loading="lazy"` to non-critical images.

---

### 3.4 Font Loading — MEDIUM PRIORITY

**Finding:** Three font families loaded from external CDNs.

```html
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@..." rel="stylesheet" />
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@..." rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=DM+Mono@..." rel="stylesheet" />
```

**Issues:**
- FontShare API may be slow for Indian users
- Loading 3 font families with many weights (12+ font files)
- No `font-display: swap` fallback for slow connections

**Fix:** Self-host fonts. Subset to only the weights used. Add `font-display: swap`.

---

## 4. Content Audit

### 4.1 Blog Content — CRITICAL

**Finding:** Only 1 blog post exists (`blog-voice-interview-simulator.md`), and it's NOT integrated into the app. It's a standalone markdown file at the repo root. No `/blog` route exists in the app.

**Impact:** Zero organic content traffic. No keyword-targeted articles.

**Recommended first 10 blog posts (with target keywords):**

| # | Title | Target Keyword | Est. Monthly Searches |
|---|-------|---------------|----------------------|
| 1 | How to Analyze Your Resume for Campus Placements (Free Tool) | resume analyzer for campus placement | 260 |
| 2 | 5 Resume Mistakes That Get Engineering Students Rejected | resume mistakes engineering students | 480 |
| 3 | Skill Gap Analysis: What Top Companies Actually Want | skill gap analysis tool | 720 |
| 4 | Free ATS Resume Checker vs ChatGPT: Which Is Better? | ATS resume checker | 3,600 |
| 5 | How to Prepare for Campus Placements: A Data-Driven Guide | campus placement preparation | 5,400 |
| 6 | AI Interview Practice: Why Speaking Out Loud Beats Silent Prep | interview practice AI | 880 |
| 7 | Data Scientist vs ML Engineer: Career Path Comparison India | data scientist career path India | 1,200 |
| 8 | Tier 2/3 College? How to Compete with IIT/NIT Students | tier 2 college placement tips | 320 |
| 9 | Privacy-First Career Tools: Why Your Resume Data Should Stay Local | privacy-first career tools | 110 |
| 10 | How to Build a Portfolio That Gets You Shortlisted | engineering portfolio tips | 590 |

**Fix priority:** CRITICAL. Implement a `/blog` route, integrate the existing post, and write 5 more within 30 days.

---

### 4.2 Landing Page Content — HIGH PRIORITY

**Finding:** Landing page uses generic, product-centric language instead of keyword-rich, user-centric language.

**Current copy (from `Landing.tsx`):**
- "Resume & Skill Diagnostics"
- "Requirement Gap Analysis"
- "Vocal Arena Sandbox"
- "Originality Signatures"

**Problems:**
- No mention of "resume analyzer", "skill gap", "campus placement" in headings
- Uses branded jargon ("Vocal Arena", "Originality Signatures") instead of searchable terms
- No FAQ section
- No social proof section

**Recommended keyword integration:**
- H1: "AI Resume Analyzer & Skill Gap Tool for Engineering Students"
- H2: "Get Your Career Readiness Score in 60 Seconds"
- H2: "Practice Interviews with Our AI Voice Simulator"
- H2: "Trained on 57,100 Real Resumes — 95% Accuracy"
- FAQ section with structured data

---

### 4.3 Comparison Pages — MISSING

**Finding:** No competitor comparison pages. These are high-intent SEO pages.

**Recommended pages:**

| Page | Target Keyword | Monthly Searches |
|------|---------------|-----------------|
| `/vs/resumeworded` | "ResumeWorded alternative" | 1,900 |
| `/vs/jobscan` | "Jobscan alternative" | 1,400 |
| `/vs/enhancv` | "EnhanCV alternative" | 720 |
| `/alternatives` | "resume checker alternatives" | 880 |

---

## 5. Programmatic SEO Opportunities

### 5.1 Role-Specific Landing Pages

Auto-generate pages for each career role:

| URL | Target Keyword | Est. Traffic |
|-----|---------------|--------------|
| `/resume-analyzer/software-developer` | resume analyzer for software developer | 140 |
| `/resume-analyzer/data-scientist` | resume analyzer for data scientist | 210 |
| `/resume-analyzer/frontend-developer` | resume analyzer for frontend developer | 90 |
| `/resume-analyzer/backend-developer` | resume analyzer for backend developer | 110 |
| `/resume-analyzer/full-stack-developer` | full stack developer resume | 390 |
| `/resume-analyzer/ml-engineer` | machine learning engineer resume | 260 |
| `/resume-analyzer/devops-engineer` | devops engineer resume | 170 |

**Total addressable traffic:** ~1,370/month from 7 pages.

---

### 5.2 Company-Specific Placement Pages

| URL | Target Keyword | Est. Traffic |
|-----|---------------|--------------|
| `/placements/tcs` | TCS resume requirements | 2,400 |
| `/placements/infosys` | Infosys resume format | 1,800 |
| `/placements/wipro` | Wipro placement preparation | 1,200 |
| `/placements/accenture` | Accenture resume tips | 880 |
| `/placements/cognizant` | Cognizant placement prep | 720 |
| `/placements/hcl` | HCL placement preparation | 590 |
| `/placements/tech-mahindra` | Tech Mahindra placement | 480 |

**Total addressable traffic:** ~8,070/month from 7 pages.

---

### 5.3 Skill-Specific Learning Pages

| URL | Target Keyword | Est. Traffic |
|-----|---------------|--------------|
| `/learn/python` | python for placements | 1,600 |
| `/learn/react` | react for campus placements | 480 |
| `/learn/java` | java for placements | 2,100 |
| `/learn/sql` | sql for placement interviews | 880 |
| `/learn/system-design` | system design for freshers | 1,200 |
| `/learn/data-structures` | data structures for placements | 3,200 |

**Total addressable traffic:** ~9,460/month from 6 pages.

---

## 6. Schema Markup Opportunities

| Schema Type | Where | Impact |
|------------|-------|--------|
| `SoftwareApplication` | Landing page | Rich snippets in search |
| `FAQPage` | Landing page | FAQ rich results (high CTR) |
| `Course` | Skill pages | Course rich results |
| `Organization` | All pages | Knowledge panel |
| `BreadcrumbList` | All pages | Breadcrumb rich results |
| `HowTo` | Blog posts | HowTo rich results |

---

## 7. Critical Fix Priority List

### CRITICAL (Fix within 1 week)

1. **Install `react-helmet-async`** — Add per-page `<title>`, `<meta description>`, `<link rel="canonical">`, and OG tags.
2. **Update `sitemap.xml`** — Add all public pages, remove auth pages, add `<lastmod>`.
3. **Add FAQ schema to landing page** — High CTR potential, low effort.
4. **Rewrite landing page H1/H2** — Use target keywords, not branded jargon.
5. **Implement pre-rendering** — Use `react-snap` or `prerender.io` for public pages.

### HIGH PRIORITY (Fix within 1 month)

6. **Add structured data** — SoftwareApplication, Organization, BreadcrumbList.
7. **Implement `/blog` route** — Integrate existing post, write 5 more.
8. **Create comparison pages** — `/vs/resumeworded`, `/vs/jobscan`, etc.
9. **Add per-page canonical tags** — Each page needs its own canonical URL.
10. **Optimize ONNX loading** — Load only 1 WASM variant, add service worker caching.

### MEDIUM PRIORITY (Fix within 3 months)

11. **Programmatic SEO pages** — Role-specific, company-specific, skill-specific.
12. **Self-host fonts** — Reduce dependency on external CDNs.
13. **Compress images** — Convert to WebP, lazy load non-critical images.
14. **Add breadcrumb navigation** — With BreadcrumbList schema.
15. **Submit to Google Search Console** — Monitor indexing, fix crawl errors.

---

## 8. Competitive SEO Comparison

| Metric | CampusSync | ResumeWorded | Jobscan | PrepInsta | GFG |
|--------|-----------|-------------|---------|-----------|-----|
| Domain Authority | ~0 | ~55 | ~60 | ~45 | ~75 |
| Monthly Organic Traffic | ~0 | ~200K | ~350K | ~500K | ~15M |
| Blog Posts | 1 | 100+ | 200+ | 500+ | 5,000+ |
| Structured Data | None | Yes | Yes | Yes | Yes |
| SSR/SSG | No | Yes | Yes | Yes | Yes |
| Backlinks | ~0 | ~50K | ~80K | ~30K | ~500K |

**Bottom line:** CampusSync has ZERO organic presence. The SEO gap between CampusSync and even mid-tier competitors is 6-12 months of consistent content production.

---

## 9. Quick Wins (Implementable Today)

1. **Add `react-helmet-async`** — 30 minutes to install, 2 hours to add per-page meta tags.
2. **Update `robots.txt`** — 5 minutes. Add `Disallow: /admin`.
3. **Rewrite landing page H1** — 15 minutes. Change from generic to keyword-rich.
4. **Add FAQ section to landing page** — 1 hour. 5 questions with schema markup.
5. **Fix canonical tags** — 30 minutes with `react-helmet-async`.

**Total time for quick wins:** ~4 hours. Expected impact: +2-3 SEO score points within 30 days.

---

*Audit conducted on 2026-05-30 using code analysis, sitemap inspection, and content review. Traffic estimates based on Google Keyword Planner data for India market.*
