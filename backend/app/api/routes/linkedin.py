from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.connection import db
from app.services.linkedin_service import linkedin_service

router = APIRouter(prefix="/api/linkedin", tags=["linkedin"])

class LinkedInReq(BaseModel):
    user_id: str
    linkedin_text: str

@router.post("/analyze")
async def analyze_linkedin(request: LinkedInReq):
    profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
    if not profile:
        raise HTTPException(status_code=404, detail="Please upload a resume first to compare your LinkedIn profile.")

    resume_text = profile.get("resume_text", "")
    resume_skills = profile.get("skills", [])

    analysis = linkedin_service.analyze_profile_vs_resume(
        request.linkedin_text, resume_text, resume_skills
    )
    return analysis
