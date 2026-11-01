from fastapi import APIRouter, HTTPException
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/recruiter/{job_id}")
async def get_recruiter_analytics(job_id: str):
    return await analytics_service.get_recruiter_analytics(job_id)
