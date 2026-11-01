from fastapi import APIRouter
from app.models.schemas import ChatRequest
from app.database.connection import db
from app.services.chatbot_service import career_recruiter_chatbot
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

@router.post("")
async def chat_handler(request: ChatRequest):
    context = {}
    if request.mode == "candidate":
        profile = await db.profiles.find_one({"user_id": request.user_id}, sort=[("timestamp", -1)])
        if profile:
            context = profile
    else:
        # Recruiter mode
        if request.job_id:
            job = await db.jobs.find_one({"_id": request.job_id})
            candidates = await db.candidates.find({"job_id": request.job_id})
            top_3 = sorted(candidates, key=lambda x: x.get("overall_fit_score", 0), reverse=True)[:3]
            top_summary = "; ".join([f"{c.get('name', 'Cand')} ({c.get('overall_fit_score', 0)}/100, {c.get('experience_years', 0)}y exp)" for c in top_3])
            context = {
                "job_title": job.get("title", "Role") if job else "Role",
                "required_skills": job.get("required_skills", []) if job else [],
                "total_candidates": len(candidates),
                "top_candidates_summary": top_summary
            }

    reply = career_recruiter_chatbot.respond(request.query, context, mode=request.mode)

    # Persist chat message
    await db.chats.insert_one({
        "user_id": request.user_id,
        "query": request.query,
        "response": reply,
        "mode": request.mode,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"response": reply}
