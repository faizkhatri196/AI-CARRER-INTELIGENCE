import uuid
import re
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from app.database.connection import db
from app.models.schemas import (
    JobCreate, JobResponse, JobExtractRequest, JobExtractResponse,
    ScoringWeightsConfig
)
from app.services.skill_inference import skill_engine

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("", response_model=JobResponse)
async def create_job(job: JobCreate):
    job_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    job_doc = {
        "_id": job_id,
        "title": job.title,
        "department": job.department or "Engineering",
        "description": job.description,
        "seniority": job.seniority or "Mid-Level",
        "min_experience_years": float(job.min_experience_years or 0.0),
        "max_experience_years": float(job.max_experience_years or 10.0),
        "required_skills": [skill_engine.normalize_skill(s) for s in job.required_skills],
        "preferred_skills": [skill_engine.normalize_skill(s) for s in job.preferred_skills],
        "education_requirements": job.education_requirements or "Bachelor's Degree in CS",
        "location": job.location or "Remote",
        "employment_type": job.employment_type or "Full-time",
        "scoring_weights": job.scoring_weights.model_dump() if job.scoring_weights else ScoringWeightsConfig().model_dump(),
        "created_by": "recruiter",
        "created_at": now.isoformat(),
        "candidate_count": 0,
        "shortlisted_count": 0
    }
    
    await db.jobs.insert_one(job_doc)
    
    return JobResponse(
        id=job_id,
        title=job.title,
        department=job.department,
        description=job.description,
        seniority=job.seniority,
        min_experience_years=job.min_experience_years,
        max_experience_years=job.max_experience_years,
        required_skills=job_doc["required_skills"],
        preferred_skills=job_doc["preferred_skills"],
        education_requirements=job.education_requirements,
        location=job.location,
        employment_type=job.employment_type,
        scoring_weights=job.scoring_weights or ScoringWeightsConfig(),
        created_by="recruiter",
        created_at=now,
        candidate_count=0,
        shortlisted_count=0
    )

@router.get("", response_model=List[JobResponse])
async def list_jobs():
    jobs_cursor = await db.jobs.find({}, sort=[("created_at", -1)])
    result = []
    for j in jobs_cursor:
        cand_count = await db.candidates.count_documents({"job_id": j.get("_id")})
        short_count = await db.candidates.count_documents({"job_id": j.get("_id"), "shortlisted": True})
        
        created_at_val = j.get("created_at")
        if isinstance(created_at_val, str):
            try:
                dt = datetime.fromisoformat(created_at_val)
            except Exception:
                dt = datetime.utcnow()
        elif isinstance(created_at_val, datetime):
            dt = created_at_val
        else:
            dt = datetime.utcnow()

        weights_data = j.get("scoring_weights") or {}
        scoring_weights = ScoringWeightsConfig(**weights_data) if isinstance(weights_data, dict) else ScoringWeightsConfig()

        result.append(JobResponse(
            id=str(j.get("_id")),
            title=j.get("title", "Engineering Role"),
            department=j.get("department", "Engineering"),
            description=j.get("description", ""),
            seniority=j.get("seniority", "Mid-Level"),
            min_experience_years=float(j.get("min_experience_years", 0.0)),
            max_experience_years=float(j.get("max_experience_years", 10.0)),
            required_skills=j.get("required_skills", []),
            preferred_skills=j.get("preferred_skills", []),
            education_requirements=j.get("education_requirements", ""),
            location=j.get("location", "Remote"),
            employment_type=j.get("employment_type", "Full-time"),
            scoring_weights=scoring_weights,
            created_by=j.get("created_by", "recruiter"),
            created_at=dt,
            candidate_count=cand_count,
            shortlisted_count=short_count
        ))
    return result

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    j = await db.jobs.find_one({"_id": job_id})
    if not j:
        raise HTTPException(status_code=404, detail="Job opening not found.")
        
    cand_count = await db.candidates.count_documents({"job_id": job_id})
    short_count = await db.candidates.count_documents({"job_id": job_id, "shortlisted": True})

    weights_data = j.get("scoring_weights") or {}
    scoring_weights = ScoringWeightsConfig(**weights_data) if isinstance(weights_data, dict) else ScoringWeightsConfig()

    return JobResponse(
        id=str(j.get("_id")),
        title=j.get("title", ""),
        department=j.get("department", "Engineering"),
        description=j.get("description", ""),
        seniority=j.get("seniority", "Mid-Level"),
        min_experience_years=float(j.get("min_experience_years", 0.0)),
        max_experience_years=float(j.get("max_experience_years", 10.0)),
        required_skills=j.get("required_skills", []),
        preferred_skills=j.get("preferred_skills", []),
        education_requirements=j.get("education_requirements", ""),
        location=j.get("location", "Remote"),
        employment_type=j.get("employment_type", "Full-time"),
        scoring_weights=scoring_weights,
        created_by=j.get("created_by", "recruiter"),
        created_at=datetime.utcnow(),
        candidate_count=cand_count,
        shortlisted_count=short_count
    )

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job: JobCreate):
    existing = await db.jobs.find_one({"_id": job_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    update_doc = {
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "seniority": job.seniority,
        "min_experience_years": float(job.min_experience_years or 0.0),
        "max_experience_years": float(job.max_experience_years or 10.0),
        "required_skills": [skill_engine.normalize_skill(s) for s in job.required_skills],
        "preferred_skills": [skill_engine.normalize_skill(s) for s in job.preferred_skills],
        "education_requirements": job.education_requirements,
        "location": job.location,
        "employment_type": job.employment_type,
        "scoring_weights": job.scoring_weights.model_dump() if job.scoring_weights else ScoringWeightsConfig().model_dump()
    }
    await db.jobs.update_one({"_id": job_id}, {"$set": update_doc})
    return await get_job(job_id)

@router.post("/extract", response_model=JobExtractResponse)
async def extract_job_requirements(request: JobExtractRequest):
    """
    Parses a freeform job description text to automatically suggest
    structured title, seniority, min experience, required and preferred skills.
    Recruiter can review and edit before finalizing.
    """
    text = request.description
    extracted_skills = skill_engine.extract_explicit_skills(text)
    
    # Seniority heuristic
    text_lower = text.lower()
    seniority = "Mid-Level"
    if any(k in text_lower for k in ["intern", "internship"]):
        seniority = "Intern"
    elif any(k in text_lower for k in ["junior", "fresher", "entry-level", "graduate"]):
        seniority = "Entry-Level"
    elif any(k in text_lower for k in ["senior", "sr.", "staff", "principal"]):
        seniority = "Senior"
    elif any(k in text_lower for k in ["lead", "architect", "director", "head"]):
        seniority = "Lead / Architect"

    # Experience heuristic
    min_exp = 2.0
    exp_matches = re.findall(r'(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years|yrs)', text_lower)
    if exp_matches:
        min_exp = float(exp_matches[0][0])
    elif seniority == "Intern":
        min_exp = 0.0
    elif seniority == "Entry-Level":
        min_exp = 1.0
    elif seniority == "Senior":
        min_exp = 5.0

    # Title detection
    title = "Software Engineer"
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line.split()) <= 6 and not any(c in first_line for c in [":", ";", "."]):
            title = first_line

    # Divide skills into required (top 60%) and preferred (remaining)
    req_skills = extracted_skills[:6] if len(extracted_skills) > 4 else extracted_skills
    pref_skills = extracted_skills[6:12] if len(extracted_skills) > 6 else []

    return JobExtractResponse(
        title=title,
        department="Engineering",
        seniority=seniority,
        min_experience_years=min_exp,
        required_skills=req_skills,
        preferred_skills=pref_skills,
        education="Bachelor's Degree in Computer Science or equivalent",
        employment_type="Full-time"
    )
