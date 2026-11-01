from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# ----------------- AUTH -----------------
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "candidate"  # "candidate" or "recruiter"
    organization: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str
    user_id: str
    name: str
    email: str
    role: str
    organization: Optional[str] = None

# ----------------- PARSED RESUME DETAILS -----------------
class ContactInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class EducationItem(BaseModel):
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[str] = None
    grade_or_gpa: Optional[str] = None

class ExperienceItem(BaseModel):
    job_title: str
    company: Optional[str] = None
    duration_months: int = 0
    duration_str: Optional[str] = None
    responsibilities: List[str] = []
    achievements: List[str] = []
    technologies: List[str] = []
    has_metrics: bool = False

class ProjectItem(BaseModel):
    title: str
    description: Optional[str] = None
    technologies: List[str] = []
    outcomes: List[str] = []
    has_metrics: bool = False

class SkillProvenance(BaseModel):
    skill: str
    category: str = "technical" # language, framework, database, cloud, tool, concept, soft
    source: str = "explicit"    # explicit, inferred, transferable, unverified
    evidence: Optional[str] = None
    confidence: float = 1.0     # 0.0 to 1.0

class ParsedResume(BaseModel):
    raw_text: str
    file_hash: str
    contact: ContactInfo
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    explicit_skills: List[str] = []
    inferred_skills: List[SkillProvenance] = []
    transferable_skills: List[SkillProvenance] = []
    unverified_skills: List[str] = []
    total_experience_years: float = 0.0
    action_verb_count: int = 0
    metric_count: int = 0
    ats_formatting_score: int = 80
    content_quality_score: int = 75

# ----------------- JOB & REQUIREMENTS -----------------
class ScoringWeightsConfig(BaseModel):
    required_skills: float = 25.0
    semantic_relevance: float = 15.0
    experience: float = 15.0
    projects: float = 15.0
    responsibilities: float = 10.0
    domain_relevance: float = 10.0
    preferred_skills: float = 5.0
    achievements: float = 5.0

class JobCreate(BaseModel):
    title: str
    department: Optional[str] = "Engineering"
    description: str
    seniority: Optional[str] = "Mid-Level"  # Intern, Entry, Mid-Level, Senior, Lead
    min_experience_years: float = 0.0
    max_experience_years: Optional[float] = 10.0
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    education_requirements: Optional[str] = "Bachelor's Degree in Computer Science or related field"
    location: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"
    scoring_weights: ScoringWeightsConfig = Field(default_factory=ScoringWeightsConfig)

class JobResponse(JobCreate):
    id: str
    created_by: str
    created_at: datetime
    candidate_count: int = 0
    shortlisted_count: int = 0

class JobExtractRequest(BaseModel):
    description: str

class JobExtractResponse(BaseModel):
    title: str
    department: str
    seniority: str
    min_experience_years: float
    required_skills: List[str]
    preferred_skills: List[str]
    education: str
    employment_type: str

# ----------------- MATCHING & SCORING -----------------
class ScoreCategoryBreakdown(BaseModel):
    required_skills: float
    semantic_relevance: float
    experience: float
    projects: float
    responsibilities: float
    domain_relevance: float
    preferred_skills: float
    achievements: float

class CandidateMatchResult(BaseModel):
    candidate_id: str
    job_id: str
    overall_fit_score: int
    category_scores: ScoreCategoryBreakdown
    ats_score: int
    quality_score: int
    skills_coverage_percent: int
    evidence_strength_score: int
    strengths: List[str] = []
    missing_requirements: List[str] = []
    transferable_capabilities: List[str] = []
    recommendation: str  # "Strong Match", "Potential Match", "Partial Match", "Low Evidence"
    fairness_anonymized_id: Optional[str] = None

# ----------------- BATCH & RECRUITER -----------------
class BatchStatus(BaseModel):
    batch_id: str
    job_id: str
    status: str  # "processing", "completed", "failed", "partially_completed"
    total_files: int
    received: int
    parsed: int
    ocr_processed: int
    failed: int
    duplicates: int
    error_details: List[Dict[str, str]] = []
    created_at: datetime
    completed_at: Optional[datetime] = None

class CandidateRankItem(BaseModel):
    id: str
    candidate_id: str
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: float
    job_id: str
    overall_fit_score: int
    category_scores: ScoreCategoryBreakdown
    ats_score: int
    skills: List[str] = []
    missing_skills: List[str] = []
    inferred_skills: List[str] = []
    recommendation: str
    shortlisted: bool = False
    human_override: Optional[Dict[str, Any]] = None
    created_at: datetime

class HumanOverrideRequest(BaseModel):
    candidate_id: str
    job_id: str
    adjusted_score: Optional[int] = None
    shortlist_status: bool
    review_notes: str

class FairnessAuditReport(BaseModel):
    total_evaluated: int
    anonymized_variance: float
    demographic_neutrality_score: float
    protected_features_used: List[str] = []
    audit_passed: bool

# ----------------- CANDIDATE INTELLIGENCE & REDESIGN -----------------
class RoadmapRequest(BaseModel):
    target_role: Optional[str] = None
    target_level: Optional[str] = "SDE1"

class ResumeImprovementRequest(BaseModel):
    target_role: Optional[str] = None

class ResumeRewriteRequest(BaseModel):
    target_role: str
    template_name: str = "Modern Professional"

class DownloadPDFRequest(BaseModel):
    markdown: Optional[str] = None
    resume_data: Optional[Dict[str, Any]] = None
    template_name: str = "Modern Professional"
    filename: str = "optimized_resume"

class LinkedInAnalysisRequest(BaseModel):
    profile_text: Optional[str] = None
    profile_url: Optional[str] = None

# ----------------- CHAT -----------------
class ChatRequest(BaseModel):
    query: str
    user_id: str
    job_id: Optional[str] = None
    mode: str = "candidate"  # "candidate" or "recruiter"

