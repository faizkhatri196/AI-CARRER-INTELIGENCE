import os
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.database.connection import db
from app.services.resume_parser import parse_complete_resume
from app.services.skill_inference import skill_engine
from app.services.matching_engine import matching_engine
from app.models.schemas import JobCreate, ScoringWeightsConfig
from ml.rag_retriever import job_rag_retriever

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

class TargetJobMatchRequest(BaseModel):
    user_id: str
    job_title: str
    job_description: str
    required_skills: Optional[List[str]] = None

class DynamicRoadmapRequest(BaseModel):
    user_id: str
    target_role: Optional[str] = None
    target_level: Optional[str] = "SDE1"

@router.post("/upload")
async def upload_candidate_resume(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    lower_name = file.filename.lower()
    if not (lower_name.endswith(".pdf") or lower_name.endswith(".docx") or lower_name.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 1. Parse structured resume
    parsed = parse_complete_resume(content, file.filename)
    if not parsed.raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the file.")

    # 2. Retrieve matching jobs from 2000-job market database
    matching_market_jobs = job_rag_retriever.retrieve_matching_jobs(parsed.raw_text, top_k=6)
    stats = job_rag_retriever.get_role_statistics(matching_market_jobs)

    recommended_role = stats["recommended_role"]
    predicted_salary_lpa = stats["avg_salary_lpa"]
    salary_range_lpa = stats["salary_range_lpa"]

    # Level prediction heuristic based on experience
    exp_years = parsed.total_experience_years
    if exp_years < 1.0:
        predicted_level = "Fresher" if exp_years >= 0.5 else "Intern"
    elif exp_years < 3.0:
        predicted_level = "SDE1"
    elif exp_years < 6.0:
        predicted_level = "SDE2"
    else:
        predicted_level = "Senior"

    # Identify missing market skills
    market_required_skills = set()
    for job in matching_market_jobs:
        for s in job.get("skills_required", []):
            if s:
                market_required_skills.add(skill_engine.normalize_skill(s))
    
    cand_skill_set = {s.lower() for s in parsed.explicit_skills}
    missing_skills = [
        s for s in sorted(list(market_required_skills))
        if s.lower() not in cand_skill_set
    ][:6]

    # Calculate match percentage against market postings
    match_percentage = int(min(max(
        (len(parsed.explicit_skills) / max(len(market_required_skills), 1)) * 100, 45
    ), 96))

    suggested_companies = list({j["company_name"] for j in matching_market_jobs if j.get("company_name")})[:5]

    profile_doc = {
        "user_id": user_id,
        "filename": file.filename,
        "name": parsed.contact.name,
        "email": parsed.contact.email,
        "phone": parsed.contact.phone,
        "location": parsed.contact.location,
        "github_url": parsed.contact.github_url,
        "linkedin_url": parsed.contact.linkedin_url,
        "skills": parsed.explicit_skills,
        "inferred_skills": [inf.model_dump() for inf in parsed.inferred_skills],
        "transferable_skills": [t.model_dump() for t in parsed.transferable_skills],
        "experience_years": parsed.total_experience_years,
        "education": [e.model_dump() for e in parsed.education],
        "projects": [p.model_dump() for p in parsed.projects],
        "predicted_level": predicted_level,
        "predicted_salary": predicted_salary_lpa,
        "recommended_role": recommended_role,
        "resume_score": parsed.content_quality_score,
        "ats_score": parsed.ats_formatting_score,
        "salary_range_lpa": salary_range_lpa,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
        "suggested_companies": suggested_companies,
        "matching_jobs": matching_market_jobs,
        "resume_text": parsed.raw_text,
        "file_hash": parsed.file_hash,
        "timestamp": datetime.utcnow().isoformat()
    }

    await db.profiles.insert_one(profile_doc)
    profile_doc.pop("_id", None)

    return {
        "message": "Resume successfully analyzed by Career Intelligence Engine.",
        "profile": profile_doc
    }

@router.get("/profile/{user_id}")
async def get_candidate_profile(user_id: str):
    profile = await db.profiles.find_one({"user_id": user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found for this user.")
    profile.pop("_id", None)
    return profile

@router.post("/analyze-job-match")
async def analyze_specific_job_match(request: TargetJobMatchRequest):
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="Upload a resume first to evaluate job match.")

    # Reconstitute parsed resume
    contact = ContactInfo(
        name=profile.get("name"),
        email=profile.get("email"),
        phone=profile.get("phone"),
        location=profile.get("location"),
        github_url=profile.get("github_url"),
        linkedin_url=profile.get("linkedin_url")
    )
    from app.models.schemas import SkillProvenance
    inferred = [SkillProvenance(**item) for item in profile.get("inferred_skills", [])]
    
    parsed = parse_complete_resume(profile.get("resume_text", "").encode("utf-8"), profile.get("filename", "resume.pdf"))

    # Extract required skills if not supplied
    req_skills = request.required_skills
    if not req_skills:
        extracted = skill_engine.extract_explicit_skills(request.job_description)
        req_skills = extracted[:6]

    target_job = JobCreate(
        title=request.job_title,
        description=request.job_description,
        required_skills=req_skills,
        preferred_skills=[],
        min_experience_years=float(profile.get("experience_years", 1.0))
    )

    match_result = matching_engine.calculate_match(
        parsed, target_job, request.user_id, "ad_hoc_job"
    )

    return match_result.model_dump()

@router.get("/discover-roles/{user_id}")
async def discover_roles(user_id: str):
    profile = await db.profiles.find_one({"user_id": user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found.")

    resume_text = profile.get("resume_text", "")
    top_jobs = job_rag_retriever.retrieve_matching_jobs(resume_text, top_k=5)
    
    cand_skills = {s.lower() for s in profile.get("skills", [])}
    roles = []
    
    for j in top_jobs:
        req = j.get("skills_required", [])
        matched = [r for r in req if r.lower() in cand_skills]
        missing = [r for r in req if r.lower() not in cand_skills]
        
        sim = j.get("similarity_score", 0.5)
        fit_score = int(min(max(sim * 100, 50), 96))
        
        diff = "Low" if len(missing) <= 2 else ("Medium" if len(missing) <= 4 else "High")
        
        roles.append({
            "role_title": j.get("job_title"),
            "industry": j.get("industry"),
            "match_score": fit_score,
            "salary_range_usd": j.get("salary_range_usd"),
            "skills_present": matched,
            "missing_skills": missing,
            "transition_difficulty": diff,
            "experience_level": j.get("experience_level")
        })

    return {"recommended_roles": roles}

@router.post("/roadmap")
async def generate_personalized_roadmap(request: DynamicRoadmapRequest):
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found.")

    target_role = request.target_role or profile.get("recommended_role", "Backend Engineer")
    missing = profile.get("missing_skills", ["Docker", "Kubernetes", "PostgreSQL", "CI/CD"])
    if not missing:
        missing = ["System Design", "Microservices", "Cloud Architecture"]

    p1 = missing[0] if len(missing) > 0 else "Advanced System Design"
    p2 = missing[1] if len(missing) > 1 else "Cloud Infrastructure (AWS/GCP)"
    p3 = missing[2] if len(missing) > 2 else "Production CI/CD & Testing"
    p4 = missing[3] if len(missing) > 3 else "Distributed Data Systems"

    roadmap = {
        "target_role": target_role,
        "target_level": request.target_level or profile.get("predicted_level", "SDE1"),
        "phases": [
            {
                "phase": "Day 1 - 30: Core Fundamentals",
                "priority_skill": p1,
                "learning_goals": [
                    f"Master core architecture & design patterns for {p1}",
                    f"Build hands-on playground projects demonstrating {p1} integration",
                    "Understand error handling, edge cases, and logging"
                ],
                "practical_project": f"Production-ready service implementing {p1} with automated unit tests.",
                "resources": ["Official Documentation", "Interactive Coding Labs", "System Architecture Blueprints"]
            },
            {
                "phase": "Day 31 - 60: System Depth & Scalability",
                "priority_skill": p2,
                "learning_goals": [
                    f"Integrate {p2} with backend database and caching layers",
                    "Profile latency bottlenecks, indexing, and connection pooling",
                    "Implement observability with metrics and dashboards"
                ],
                "practical_project": f"High-throughput pipeline processing async workloads using {p2}.",
                "resources": ["High Performance Architecture Patterns", "Hands-on Cloud Labs"]
            },
            {
                "phase": "Day 61 - 90: Enterprise Production Readiness",
                "priority_skill": f"{p3} & {p4}",
                "learning_goals": [
                    "Implement end-to-end CI/CD delivery pipelines",
                    "Containerize application and deploy with health probes",
                    "Conduct mock technical system design reviews"
                ],
                "practical_project": "Complete portfolio capstone project with live demo URL and GitHub CI workflow.",
                "resources": ["Cloud Native Best Practices", "Engineering Interview Playbook"]
            }
        ]
    }
    return roadmap
