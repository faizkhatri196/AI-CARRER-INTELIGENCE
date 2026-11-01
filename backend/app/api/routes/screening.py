import asyncio
import io
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, BackgroundTasks
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from app.database.connection import db
from app.models.schemas import (
    BatchStatus, CandidateRankItem, HumanOverrideRequest,
    FairnessAuditReport, JobCreate, ScoringWeightsConfig
)
from app.services.batch_processor import batch_processor
from app.services.fairness import anonymize_candidate_profile, run_fairness_audit
from app.services.export_service import export_service
from app.services.matching_engine import matching_engine
from app.services.resume_parser import ParsedResume, ContactInfo

router = APIRouter(prefix="/api/screening", tags=["screening"])

@router.post("/upload-batch")
async def upload_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    job_id: str = Form(...)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
        
    job = await db.jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job opening not found.")

    # Read all uploaded files into memory
    files_data = []
    for f in files:
        lower_name = f.filename.lower()
        if not (lower_name.endswith(".pdf") or lower_name.endswith(".docx") or lower_name.endswith(".txt")):
            continue
        content = await f.read()
        files_data.append((f.filename, content))

    if not files_data:
        raise HTTPException(status_code=400, detail="None of the uploaded files are supported (.pdf, .docx, .txt).")

    # Create batch tracking document
    batch_id = await batch_processor.create_batch_record(job_id, len(files_data))

    # Launch background ingestion worker
    background_tasks.add_task(
        batch_processor.run_batch_in_background,
        batch_id,
        job_id,
        files_data
    )

    return {
        "message": f"Successfully received {len(files_data)} resumes for ingestion.",
        "batch_id": batch_id,
        "job_id": job_id,
        "total_files": len(files_data),
        "status": "processing"
    }

@router.get("/batch/{batch_id}", response_model=BatchStatus)
async def get_batch_status(batch_id: str):
    batch = await db.batches.find_one({"batch_id": batch_id})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch job not found.")

    created_at_dt = datetime.fromisoformat(batch["created_at"]) if isinstance(batch.get("created_at"), str) else datetime.utcnow()
    completed_at_dt = datetime.fromisoformat(batch["completed_at"]) if batch.get("completed_at") else None

    return BatchStatus(
        batch_id=batch["batch_id"],
        job_id=batch["job_id"],
        status=batch.get("status", "processing"),
        total_files=batch.get("total_files", 0),
        received=batch.get("received", 0),
        parsed=batch.get("parsed", 0),
        ocr_processed=batch.get("ocr_processed", 0),
        failed=batch.get("failed", 0),
        duplicates=batch.get("duplicates", 0),
        error_details=batch.get("error_details", []),
        created_at=created_at_dt,
        completed_at=completed_at_dt
    )

@router.get("/jobs/{job_id}/candidates")
async def get_ranked_candidates(
    job_id: str,
    min_score: int = Query(0, ge=0, le=100),
    max_score: int = Query(100, ge=0, le=100),
    min_exp: float = Query(0.0, ge=0.0),
    skill: Optional[str] = None,
    recommendation: Optional[str] = None,
    shortlisted_only: bool = False,
    anonymize: bool = False,
    search: Optional[str] = None,
    sort_by: str = Query("overall_fit_score"),
    sort_order: str = Query("desc")
):
    query: Dict[str, Any] = {"job_id": job_id}
    if shortlisted_only:
        query["shortlisted"] = True

    candidates = await db.candidates.find(query)

    # In-memory filtering and ranking
    filtered = []
    for c in candidates:
        fit = c.get("overall_fit_score", 0)
        exp = c.get("experience_years", 0.0)
        rec = c.get("recommendation", "")
        skills = [s.lower() for s in c.get("skills", [])]

        if fit < min_score or fit > max_score:
            continue
        if exp < min_exp:
            continue
        if recommendation and rec.lower() != recommendation.lower():
            continue
        if skill and not any(skill.lower() in s for s in skills):
            continue
        if search:
            search_lower = search.lower()
            name_match = search_lower in c.get("name", "").lower()
            email_match = search_lower in c.get("email", "").lower()
            skill_match = any(search_lower in s for s in skills)
            if not (name_match or email_match or skill_match):
                continue

        cand_view = dict(c)
        if anonymize:
            cand_view = anonymize_candidate_profile(cand_view)
        filtered.append(cand_view)

    # Sorting
    reverse = True if sort_order == "desc" else False
    if sort_by == "experience_years":
        filtered.sort(key=lambda x: x.get("experience_years", 0.0), reverse=reverse)
    elif sort_by == "ats_score":
        filtered.sort(key=lambda x: x.get("ats_score", 0), reverse=reverse)
    elif sort_by == "name":
        filtered.sort(key=lambda x: x.get("name", "").lower(), reverse=reverse)
    else:
        # Default: overall_fit_score
        filtered.sort(key=lambda x: x.get("overall_fit_score", 0), reverse=reverse)

    return {
        "job_id": job_id,
        "total_count": len(filtered),
        "candidates": filtered
    }

@router.post("/candidates/{candidate_id}/shortlist")
async def toggle_shortlist(candidate_id: str):
    cand = await db.candidates.find_one({"candidate_id": candidate_id})
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    new_state = not cand.get("shortlisted", False)
    await db.candidates.update_one(
        {"candidate_id": candidate_id},
        {"$set": {"shortlisted": new_state}}
    )
    return {"candidate_id": candidate_id, "shortlisted": new_state}

@router.post("/candidates/override")
async def human_override(override: HumanOverrideRequest):
    cand = await db.candidates.find_one({"candidate_id": override.candidate_id})
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    update_fields: Dict[str, Any] = {
        "shortlisted": override.shortlist_status,
        "human_override": {
            "adjusted_score": override.adjusted_score,
            "review_notes": override.review_notes,
            "reviewed_at": datetime.utcnow().isoformat()
        }
    }
    if override.adjusted_score is not None:
        update_fields["overall_fit_score"] = override.adjusted_score

    await db.candidates.update_one(
        {"candidate_id": override.candidate_id},
        {"$set": update_fields}
    )

    # Record in audit log
    await db.audit_logs.insert_one({
        "action": "human_override",
        "candidate_id": override.candidate_id,
        "job_id": override.job_id,
        "details": update_fields["human_override"],
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"message": "Human override successfully recorded in audit log."}

class CompareRequest(BaseModel):
    candidate_ids: List[str]

@router.post("/compare")
async def compare_candidates(body: CompareRequest):
    candidate_ids = body.candidate_ids
    if not candidate_ids:
        raise HTTPException(status_code=400, detail="Provide candidate_ids to compare.")

    candidates = []
    for cid in candidate_ids[:4]: # compare up to 4
        c = await db.candidates.find_one({"candidate_id": cid})
        if c:
            candidates.append(c)

    return {"candidates": candidates}

@router.get("/jobs/{job_id}/fairness-audit", response_model=FairnessAuditReport)
async def get_job_fairness_audit(job_id: str):
    candidates = await db.candidates.find({"job_id": job_id})
    return run_fairness_audit(candidates)

@router.get("/jobs/{job_id}/export/csv")
async def export_job_candidates_csv(job_id: str):
    job = await db.jobs.find_one({"_id": job_id})
    job_title = job.get("title", "Engineering Role") if job else "Role"
    candidates = await db.candidates.find({"job_id": job_id}, sort=[("overall_fit_score", -1)])
    
    csv_data = export_service.export_candidates_csv(candidates, job_title)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="candidates_{job_id[:8]}.csv"'}
    )

@router.get("/jobs/{job_id}/export/pdf")
async def export_job_candidates_pdf(job_id: str):
    job = await db.jobs.find_one({"_id": job_id})
    job_title = job.get("title", "Engineering Role") if job else "Role"
    candidates = await db.candidates.find({"job_id": job_id}, sort=[("overall_fit_score", -1)])
    
    pdf_bytes = export_service.export_candidates_pdf(candidates, job_title)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="screening_report_{job_id[:8]}.pdf"'}
    )
