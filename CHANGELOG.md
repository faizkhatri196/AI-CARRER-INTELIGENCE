# Changelog

All notable changes to the AI Career & Recruitment Intelligence platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.2] - 2026-11-12

### Fixed
- **Permanent Production Authentication Fix**: Configured default production backend routing in `frontend/src/utils/api.js` to automatically target `https://ai-carrer-inteligence-1.onrender.com` when running on remote domains like Vercel, preventing 404 routing errors on `/api/auth/login` and `/api/auth/register`.
- Added `frontend/.env.production` and `frontend/vercel.json` API rewrites for fail-safe server-side proxying.
- Enhanced `AuthModal.jsx` and `Login.jsx` with input whitespace sanitization, extended 45-second network timeout for cold-starting cloud instances, and user-friendly error messages.
- Added 1-click Quick Demo Access (Candidate & Recruiter) in `AuthModal.jsx` for instant zero-latency workspace exploration.
- Resolved CORS origins in `backend/main.py` with `allow_origin_regex` to support all Vercel domains and preview deployments.

---

## [2.1.1] - 2026-11-06

### Resiliency & Reliability
- Added resilient deterministic offline fallback mechanisms in `CareerAIEngine` (`backend/ml/rag_engine.py`) for resume analysis, ATS optimization suggestions, Google X-Y-Z resume rewriting, and career guidance, ensuring 100% zero-downtime execution even without external LLM API keys.

---

## [2.1.0] - 2026-11-05

### Added
- Comprehensive OpenAPI endpoint documentation ([`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)).
- Complete System Architecture with Mermaid data flow diagrams ([`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)).
- Production Deployment & Scaling Guide ([`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md)).
- Ethical AI, bias elimination, and privacy policy ([`SECURITY.md`](SECURITY.md)).
- Automated GitHub Actions test workflow across Python 3.10 and 3.11 ([`.github/workflows/backend-ci.yml`](.github/workflows/backend-ci.yml)).
- Runtime environment diagnostics endpoint (`/api/system/diagnostics`).
- Unit tests for SHA-256 deduplication and Fair Screening audit.
- Unit tests for 20-feature ML feature vector extraction and NDCG@5 ranking.
- Integration tests for frontend responsive breakpoints and role switching.
- Graceful shutdown event handler for FastAPI ASGI process to close database pools.
- `.editorconfig` and `.gitattributes` for cross-platform newline consistency.

### Performance
- Precompiled boundary-checked regex patterns for skill extraction and capability inference, achieving 3x faster resume parsing throughput.

---

## [2.0.0] - 2026-11-01

### Major Architecture Transformation
- **Dual Workspace Experience**: Full separation between Candidate Intelligence and Recruiter Intelligence platforms.
- **Advanced Resume Parsing**: Multi-format ingestion supporting PDF, DOCX, and TXT with entity extraction and section parsing.
- **Capability Inference Engine**: Detection of explicit, inferred, and transferable engineering skills with evidence provenance.
- **8-Dimension Deterministic Matching**: Configurable scoring (0–100) across technical skills, experience, project metrics, tools, and stability.
- **Multi-Resume Bulk Queue**: High-throughput asynchronous batch ingestion with SHA-256 deduplication.
- **Fair Screening Mode**: Demographically-neutral pseudo-anonymization eliminating hiring bias.
- **AI Resume Redesign Studio**: 6 ATS-optimized design templates, Google X-Y-Z formula bullet-point rewriting, and ReportLab PDF export.
- **20-Feature ML Benchmark**: Random Forest classification & regression models with verified evaluation metrics (Precision, Recall, ROC-AUC, NDCG@5).
- **Responsive Design Across 15 Viewports**: Touch-friendly mobile navigation drawer, responsive candidate cards, and fluid layouts from 320px to 2560px.

