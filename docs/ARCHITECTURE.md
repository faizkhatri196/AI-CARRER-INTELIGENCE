# System Architecture & Technical Specifications

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React + Vite + Tailwind)"]
        UI_Candidate["Candidate Portal\n(Scorecard, Capability Explorer, Roadmap)"]
        UI_Recruiter["Recruiter Workspace\n(Job Builder, Batch Screening, Ranking Table)"]
        UI_Studio["Resume Studio\n(6 ATS Templates, Realtime Editor, PDF Export)"]
    end

    subgraph APILayer ["API Layer (FastAPI ASGI)"]
        Router_Auth["/api/auth"]
        Router_Candidates["/api/candidates"]
        Router_Screening["/api/screening"]
        Router_Jobs["/api/jobs"]
        Router_Resume["/api/resume"]
        Router_Chat["/api/chat"]
        Router_ML["/api/ml"]
    end

    subgraph ServiceLayer ["Service & Intelligence Layer"]
        Parser["Resume Parser & Text Extractor\n(PDF, DOCX, TXT)"]
        Inference["Capability Inference Engine\n(Explicit + Inferred Skills)"]
        Matcher["8-Dimension Matching Engine\n(Deterministic 0-100 Score)"]
        Fairness["Fair Screening Service\n(SHA-256 Pseudo-Anonymization)"]
        Batch["Async Ingestion Queue\n(Concurrency Throttling & Deduplication)"]
        RAG["RAG Career Assistant\n(Context-Aware Chatbot)"]
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        Mongo["MongoDB Atlas\n(Production Cluster)"]
        Fallback["Resilient Local Store\n(Auto-Failover Mode)"]
    end

    UI_Candidate --> APILayer
    UI_Recruiter --> APILayer
    UI_Studio --> APILayer

    APILayer --> Parser
    APILayer --> Inference
    APILayer --> Matcher
    APILayer --> Fairness
    APILayer --> Batch
    APILayer --> RAG

    Batch --> Mongo
    Batch -. Failover .-> Fallback
    RAG --> Mongo
    RAG -. Failover .-> Fallback
```

---

## 2. 8-Dimension Job Matching Breakdown

Every candidate is evaluated across an 8-dimensional weighted scoring framework:

| Dimension | Default Weight | Description |
| :--- | :--- | :--- |
| **Required Technical Skills** | 25% | Direct keyword & synonym presence |
| **Experience Fit** | 20% | Total years vs. seniority benchmark |
| **Project & Evidence Impact** | 15% | Metrics, quantifiers, action verbs |
| **Preferred Skills** | 10% | Secondary & bonus competencies |
| **Education & Certifications** | 10% | Degree level and accredited credentials |
| **Tooling & Cloud Ecosystem** | 10% | DevOps, databases, and infra familiarity |
| **Domain Experience** | 5% | Industry context and relevant tenure |
| **Role Stability & Growth** | 5% | Progression trajectory and career momentum |

---

## 3. Resilience & Zero-Downtime Design

The platform uses dual-mode database failover:
1. **Primary**: Asynchronous connection to MongoDB Atlas with non-blocking connection pool.
2. **Fallback**: If network connectivity is interrupted, the system automatically writes to and reads from local transactional storage (`local_db.json`) without throwing 500 errors to end users.

