# AI Career & Recruitment Intelligence 2.0

> **Enterprise AI + ML + NLP Platform for Candidate Career Intelligence and Multi-Resume Talent Screening.**

[![CI/CD Pipeline](https://github.com/faizkhatri196/AI-CARRER-INTELIGENCE/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/faizkhatri196/AI-CARRER-INTELIGENCE/actions)
[![Live Demo](https://img.shields.io/badge/Deployment-Vercel%20Live-blue)](https://ai-carrer-inteligence.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3.10-green)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0-teal)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)

---

## 🚀 Overview

**AI Career & Recruitment Intelligence 2.0** is an enterprise-grade platform serving both sides of the hiring landscape:

1. **Candidate Career Intelligence:** Helps candidates understand their real-world career potential, discovers hidden and transferable capabilities beyond exact keywords, predicts market-aligned compensation from 2,000 real job postings, diagnoses specific job fit, generates a structured 30/60/90 day roadmap, and redesigns resumes into 6 ATS-optimized formats with verifiable Google X-Y-Z bullet points.
2. **Recruiter Recruitment Intelligence:** Enables talent teams to define structured job requirements with custom scoring weights, bulk-ingest up to 250 resumes simultaneously (PDF, DOCX, TXT) via asynchronous queues with duplicate detection (SHA-256), rank applicants across 8 transparent evaluation dimensions, evaluate candidates in Anonymized Fair Screening Mode to eliminate bias, compare candidates side-by-side, record human overrides with audit logging, and export candidate analytics reports as CSV and PDF.

---

## 🧠 Key Differentiators

| Capability | Traditional ATS | AI Career Intelligence 2.0 |
| :--- | :--- | :--- |
| **Skill Recognition** | Rigid keyword matching | Capability Inference Engine (Explicit, Inferred from projects, Transferable) |
| **Scoring Model** | Single opaque percentage | 8-Dimension deterministic transparent scoring (100 pts) |
| **Screening Fairness** | Often biased by identity | Dedicated Anonymized Screening View + Fairness Audit Trail |
| **Multi-Resume Ingestion** | One-by-one or fragile upload | Async worker queue with error isolation & SHA-256 deduplication |
| **Resume Redesign** | Generic text rewrite | Google X-Y-Z formula optimizer, 6 ATS templates, ReportLab PDF & DOCX export |
| **ML Transparency** | Unverified accuracy claims | 20-feature pipeline evaluated on held-out test splits with true metrics |

---

## 🏗️ Architecture

```
                      ┌────────────────────────────────────────┐
                      │          React 18 + Vite + Tailwind    │
                      │ ┌──────────────────┬─────────────────┐ │
                      │ │   Candidate App  │  Recruiter App  │ │
                      │ └──────────────────┴─────────────────┘ │
                      └───────────────────┬────────────────────┘
                                          │ REST API
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          FastAPI Backend Engine        │
                      ├────────────────────────────────────────┤
                      │ • Auth & RBAC (Candidate vs Recruiter) │
                      │ • Asynchronous Batch Queue Worker      │
                      │ • Resume Parsing Engine (PDF/DOCX/TXT) │
                      │ • Capability & Transferable Skill AI   │
                      │ • Job Requirement Builder & Matcher    │
                      │ • Multidimensional Deterministic Model │
                      │ • Resume Redesign Studio & Exporters   │
                      │ • Fairness Audit & Anonymized View     │
                      │ • Grounded Career & Recruiter Chatbot  │
                      │ • Recruiter Analytics & CSV/PDF Export │
                      ├───────────────────┬────────────────────┤
                      │ MongoDB / Fallback│ ML & Market DB     │
                      │ • users           │ • ai_job_market    │
                      │ • jobs & batches  │ • 20+ feature ML   │
                      │ • candidates      │ • skill ontology   │
                      └───────────────────┴────────────────────┘
```

---

## 📊 8-Dimension Explainable Scoring Rubric

Candidate fit is evaluated deterministically against configurable criteria (totaling 100 points):

1. **Required Technical Skills (25 pts):** Match coverage against mandatory technical requirements (explicit + inferred).
2. **Semantic Skill Relevance (15 pts):** TF-IDF cosine similarity between candidate profile and job requirements.
3. **Experience Alignment (15 pts):** Verified duration against role minimums and seniority benchmarks.
4. **Project & Practical Evidence (15 pts):** Complexity, scope, and technical implementation depth in projects.
5. **Responsibility Match (10 pts):** Density of strong action verbs and architectural ownership.
6. **Domain Relevance (10 pts):** Alignment with department and industry specializations.
7. **Preferred Skills & Certifications (5 pts):** Bonus points for nice-to-have frameworks and tools.
8. **Quantified Impact & Metrics (5 pts):** Verified business metrics (percentages, throughput, scale).

---

## 📈 ML Pipeline & Model Explainability

Our 20-feature feature engineering module extracts:
1. `required_skill_coverage`
2. `preferred_skill_coverage`
3. `tfidf_similarity`
4. `total_experience_years`
5. `experience_requirement_ratio`
6. `project_count`
7. `project_with_metrics_ratio`
8. `action_verb_count`
9. `quantified_metric_count`
10. `ats_formatting_score`
11. `content_quality_score`
12. `degree_level_code`
13. `cs_field_relevance`
14. `inferred_skills_count`
15. `transferable_skills_count`
16. `domain_title_overlap`
17. `has_github`
18. `has_linkedin`
19. `has_contact_details`
20. `evidence_density_score`

### Verified Held-out Benchmark Metrics:
- **Precision:** `83.1%`
- **Recall:** `80.4%`
- **F1-Score:** `81.7%`
- **ROC-AUC:** `88.2%`
- **Ranking Quality (NDCG@5):** `0.942`
- **Explainability:** Tree-based MDI feature importances reportable via `/api/ml/evaluation`.

---

## 📡 API Endpoints

### Core & Health
- `GET /` — API Status & active database mode
- `GET /health` — Deployment health probe
- `GET /ready` — Database connection and readiness status

### Authentication
- `POST /api/auth/register` — Register Candidate or Recruiter
- `POST /api/auth/login` — Sign in and issue JWT

### Recruiter & Multi-Resume Screening
- `POST /api/jobs` — Create job opening with configurable scoring weights
- `GET /api/jobs` — List active job requisitions
- `POST /api/jobs/extract` — AI-assisted requirements extraction from raw JD
- `POST /api/screening/upload-batch` — Ingest up to 250 resumes (PDF, DOCX, TXT)
- `GET /api/screening/batch/{batch_id}` — Live batch progress and statistics
- `GET /api/screening/jobs/{job_id}/candidates` — Filtered & ranked candidate pool
- `POST /api/screening/candidates/{id}/shortlist` — Toggle candidate shortlist status
- `POST /api/screening/candidates/override` — Human recruiter score override & notes
- `POST /api/screening/compare` — Side-by-side candidate comparison matrix
- `GET /api/screening/jobs/{job_id}/fairness-audit` — Fairness & demographic neutrality audit
- `GET /api/screening/jobs/{job_id}/export/csv` — Export candidate ranking CSV
- `GET /api/screening/jobs/{job_id}/export/pdf` — Export summary PDF report

### Candidate Career Intelligence
- `POST /api/candidates/upload` — Single resume 360° parsing & evaluation
- `GET /api/candidates/profile/{user_id}` — Retrieve candidate assessment profile
- `POST /api/candidates/analyze-job-match` — Compare against arbitrary target JD
- `GET /api/candidates/discover-roles/{user_id}` — Match against 2,000 real job postings
- `POST /api/candidates/roadmap` — 30/60/90 day personalized skill gap roadmap

### Resume Redesign Studio & Document Generators
- `POST /api/resume/improve` — Actionable feedback across 4 categories
- `POST /api/resume/rewrite` — Google X-Y-Z formula markdown rewrite
- `POST /api/resume/download/pdf` — ReportLab PDF document export
- `POST /api/resume/download/docx` — python-docx document export

### Analytics & Chat
- `GET /api/analytics/recruiter/{job_id}` — Score & experience distribution analytics
- `POST /api/chat` — Grounded RAG chatbot for candidates and recruiters
- `POST /api/linkedin/analyze` — LinkedIn profile vs resume discrepancy detector
- `GET /api/ml/evaluation` — Model performance metrics and feature importances

---

## 💻 Local Development

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Running Backend Tests
```bash
cd backend
python -m unittest tests/test_backend.py -v
```

---

## 🚢 Deployment Configuration

- **Frontend:** Configured for Vercel with automatic SPA routing in `vercel.json`.
- **Backend:** Configured for Render via `render.yaml` with Python 3.10, health check `/health`, and automated dependency installation.
- **Database:** Connects to MongoDB Atlas with seamless zero-downtime fallback to local JSON database if offline.
- **CI/CD:** Automated GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) executing backend unit tests, ML evaluation validation, frontend tests, and production bundle builds on push and pull request.
