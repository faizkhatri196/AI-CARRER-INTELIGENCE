import os
import sys

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 1. Load env variables from .env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.database.connection import db
from app.api.routes import (
    auth, jobs, screening, candidates,
    resume_studio, analytics, chatbot,
    linkedin, ml_metrics
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title="AI Career & Recruitment Intelligence API",
    version="2.0.0",
    description="Enterprise-grade AI, ML, NLP, Multi-Resume screening, Candidate Intelligence and Recruitment Intelligence platform."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modular Routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(screening.router)
app.include_router(candidates.router)
app.include_router(resume_studio.router)
app.include_router(analytics.router)
app.include_router(chatbot.router)
app.include_router(linkedin.router)
app.include_router(ml_metrics.router)

# Root & Health Endpoints for Production Deployment
@app.get("/")
def read_root():
    return {
        "status": "AI Career & Recruitment Intelligence System 2.0 is running",
        "version": settings.VERSION,
        "database_mode": "local_resilient" if db.use_local else "mongodb_live",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": os.environ.get("BUILD_TIME", "2026"),
        "version": settings.VERSION
    }

@app.get("/ready")
async def readiness_check():
    # Verify database read
    try:
        user_count = await db.users.count_documents({})
        return {
            "status": "ready",
            "database": "connected",
            "use_local": db.use_local,
            "user_count": user_count
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database_error": str(e),
            "use_local": True
        }

# Backwards-compatibility aliases for existing endpoints
@app.post("/api/upload")
async def legacy_upload(file: UploadFile = File(...), user_id: str = Form(...)):
    return await candidates.upload_candidate_resume(file=file, user_id=user_id)

@app.get("/api/profile/{user_id}")
async def legacy_get_profile(user_id: str):
    return await candidates.get_candidate_profile(user_id=user_id)

@app.post("/api/roadmap/update")
async def legacy_roadmap_update(request: candidates.DynamicRoadmapRequest):
    return await candidates.generate_personalized_roadmap(request)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
