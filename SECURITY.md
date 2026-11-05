# Security, Fairness & Data Privacy Policy

## 1. Ethical AI & Bias Elimination Standards
AI Career & Recruitment Intelligence 2.0 is engineered in compliance with EEOC, NYC Local Law 144, and GDPR Article 22 ethical AI employment guidance.

### Fair Screening Mode
- **Zero Demographic Weight**: All protected attributes (`name`, `gender`, `age`, `ethnicity`, `religion`, `marital_status`, `home_address`, `photos`) are excluded from feature vectors used by the ML matching engine.
- **SHA-256 Pseudonymization**: When recruiters toggle Fair Screening, candidate profiles are masked using deterministic SHA-256 hashes (e.g., `Candidate #7A3F19`), and contact details are withheld until an interview stage is triggered.
- **Explainable Scores**: Every candidate score (0–100) provides transparent category breakdowns (Required Skills, Experience, Projects, Tooling, Education, Stability).

---

## 2. Data Protection & Encryption
- **In Transit**: All API communication requires TLS 1.3 encryption.
- **At Rest**: MongoDB Atlas storage volumes are encrypted via AES-256.
- **Session Tokens**: Passwords are salted and hashed using `bcrypt` (work factor 12). JWT authorization tokens are cryptographically signed with `HS256`.

---

## 3. Reporting a Vulnerability
We welcome responsible security disclosures. If you discover a vulnerability or security flaw, please report it directly via GitHub issues or email `security@career-intelligence.ai`. We commit to acknowledging reports within 48 hours and deploying remediations expeditiously.
