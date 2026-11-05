# AI Career & Recruitment Intelligence 2.0 — API Reference

## Base URL
- **Production (Render Backend):** `https://ai-carrer-inteligence-1.onrender.com`
- **Local Development:** `http://localhost:8000`

---

## 1. Authentication & Session Management

### `POST /api/auth/register`
Creates a new candidate or recruiter account.

- **Request Body (`application/json`):**
  ```json
  {
    "email": "candidate@example.com",
    "password": "SecurePassword123!",
    "full_name": "Faiz Khatri",
    "role": "candidate"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "user": {
      "id": "usr_94a7e3",
      "email": "candidate@example.com",
      "full_name": "Faiz Khatri",
      "role": "candidate"
    }
  }
  ```

### `POST /api/auth/login`
Authenticates a user and returns a signed JWT.

- **Request Body (`application/json`):**
  ```json
  {
    "email": "candidate@example.com",
    "password": "SecurePassword123!"
  }
  ```

---

## 2. Candidates & Resume Processing

### `POST /api/candidates/upload`
Uploads and parses a PDF, DOCX, or TXT resume with entity extraction and capability inference.

- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `file`: Resume document (`.pdf`, `.docx`, `.txt`)
  - `user_id`: Unique identifier of user
- **Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "profile": {
      "name": "Alex Mercer",
      "email": "alex.mercer@dev.io",
      "phone": "+1-555-0199",
      "experience_years": 4.5,
      "explicit_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
      "inferred_skills": [
        {
          "skill": "RESTful API Design",
          "category": "architecture_concepts",
          "confidence": 0.95,
          "source": "experience_evidence"
        }
      ],
      "overall_readiness_score": 86.4
    }
  }
  ```

### `GET /api/candidates/profile/{user_id}`
Retrieves the parsed profile, skills radar, and career history for a candidate.

---

## 3. Screening & Multi-Resume Ranking

### `POST /api/screening/upload-batch`
Bulk uploads up to 250 resumes against a specific job specification.

- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `job_id`: Target Job ID
  - `files`: Array of resume files
- **Response (`200 OK`):**
  ```json
  {
    "batch_id": "bch_a9821f",
    "total_files": 25,
    "status": "processing",
    "message": "Bulk queue initiated. Polling available via /api/screening/batch-status/{batch_id}"
  }
  ```

### `GET /api/screening/batch-status/{batch_id}`
Returns real-time processing counts (total, parsed, duplicates, errors).

### `GET /api/screening/candidates/{job_id}`
Returns candidate ranking table with scores (0–100), breakdown by dimension, and optional fair screening anonymization.

---

## 4. Job Requisitions

### `GET /api/jobs`
Lists active recruiter job requisitions.

### `POST /api/jobs`
Creates a new requisition with custom scoring weights.

- **Request Body:**
  ```json
  {
    "title": "Senior AI Systems Engineer",
    "department": "Engineering",
    "location": "Remote",
    "min_experience_years": 5,
    "required_skills": ["Python", "PyTorch", "FastAPI", "Docker", "Vector Search"],
    "preferred_skills": ["Kubernetes", "Redis", "LangChain"],
    "scoring_weights": {
      "required_skills": 25,
      "experience": 20,
      "project_impact": 15,
      "preferred_skills": 10,
      "education": 10,
      "tooling_ecosystem": 10,
      "domain_experience": 5,
      "role_stability": 5
    }
  }
  ```

---

## 5. Resume Studio & Optimization

### `POST /api/resume/improve`
Analyzes resume bullet points and generates action-verb, metrics-driven suggestions using the Google X-Y-Z formula.

### `POST /api/resume/download-pdf`
Generates a downloadable, ATS-compliant formatted PDF using ReportLab.

---

## 6. System & Observability

### `GET /health`
Production health check returning status 200:
```json
{
  "status": "healthy",
  "version": "2.0.0"
}
```

### `GET /ready`
Readiness probe verifying database connectivity and collection access.
