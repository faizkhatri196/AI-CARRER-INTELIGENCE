import asyncio
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.database.connection import db
from app.models.schemas import BatchStatus, JobCreate
from app.services.resume_parser import parse_complete_resume, compute_file_hash
from app.services.matching_engine import matching_engine

logger = logging.getLogger("batch_processor")

Tuple_File = Any

class BatchIngestionProcessor:
    def __init__(self, max_concurrency: int = 5):
        self.semaphore = asyncio.Semaphore(max_concurrency)

    async def create_batch_record(self, job_id: str, total_files: int) -> str:
        batch_id = str(uuid.uuid4())
        batch_doc = {
            "batch_id": batch_id,
            "job_id": job_id,
            "status": "processing",
            "total_files": total_files,
            "received": total_files,
            "parsed": 0,
            "ocr_processed": 0,
            "failed": 0,
            "duplicates": 0,
            "error_details": [],
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": None
        }
        await db.batches.insert_one(batch_doc)
        return batch_id

    async def process_single_file(
        self,
        batch_id: str,
        job: JobCreate,
        job_id: str,
        file_bytes: bytes,
        filename: str,
        seen_hashes: set
    ) -> Dict[str, Any]:
        async with self.semaphore:
            file_hash = compute_file_hash(file_bytes)
            
            # Check duplicate within this batch or previous uploads for this job
            if file_hash in seen_hashes:
                return {"status": "duplicate", "filename": filename, "hash": file_hash}
            
            existing = await db.candidates.find_one({"job_id": job_id, "file_hash": file_hash})
            if existing:
                return {"status": "duplicate", "filename": filename, "hash": file_hash}
                
            seen_hashes.add(file_hash)

            try:
                # 1. Parse resume
                parsed = parse_complete_resume(file_bytes, filename)
                
                # Check for empty text (scanned PDF without OCR or corrupted)
                if not parsed.raw_text.strip():
                    return {"status": "failed", "filename": filename, "error": "No extractable text found."}

                candidate_id = str(uuid.uuid4())
                
                # 2. Score candidate against job
                match_result = matching_engine.calculate_match(parsed, job, candidate_id, job_id)

                # 3. Save candidate into DB
                candidate_doc = {
                    "candidate_id": candidate_id,
                    "job_id": job_id,
                    "batch_id": batch_id,
                    "name": parsed.contact.name or "Candidate",
                    "email": parsed.contact.email or f"applicant_{candidate_id[:6]}@example.com",
                    "phone": parsed.contact.phone,
                    "location": parsed.contact.location or "Not Specified",
                    "github_url": parsed.contact.github_url,
                    "linkedin_url": parsed.contact.linkedin_url,
                    "experience_years": parsed.total_experience_years,
                    "education": [e.model_dump() for e in parsed.education],
                    "skills": parsed.explicit_skills,
                    "inferred_skills": [inf.model_dump() for inf in parsed.inferred_skills],
                    "transferable_skills": [t.model_dump() for t in parsed.transferable_skills],
                    "overall_fit_score": match_result.overall_fit_score,
                    "category_scores": match_result.category_scores.model_dump(),
                    "ats_score": match_result.ats_score,
                    "quality_score": match_result.quality_score,
                    "skills_coverage_percent": match_result.skills_coverage_percent,
                    "evidence_strength_score": match_result.evidence_strength_score,
                    "strengths": match_result.strengths,
                    "missing_skills": match_result.missing_requirements,
                    "transferable_capabilities": match_result.transferable_capabilities,
                    "recommendation": match_result.recommendation,
                    "shortlisted": False,
                    "human_override": None,
                    "file_hash": file_hash,
                    "filename": filename,
                    "created_at": datetime.utcnow().isoformat()
                }
                await db.candidates.insert_one(candidate_doc)

                return {"status": "success", "filename": filename, "candidate_id": candidate_id}

            except Exception as e:
                logger.error(f"Error processing file '{filename}': {e}")
                return {"status": "failed", "filename": filename, "error": str(e)}

    async def run_batch_in_background(
        self,
        batch_id: str,
        job_id: str,
        files_data: List[Tuple_File] # list of (filename, bytes)
    ):
        try:
            job_dict = await db.jobs.find_one({"_id": job_id})
            if not job_dict:
                await db.batches.update_one(
                    {"batch_id": batch_id},
                    {"$set": {"status": "failed", "completed_at": datetime.utcnow().isoformat()}}
                )
                return

            job_create = JobCreate(
                title=job_dict.get("title", "Engineering Role"),
                department=job_dict.get("department", "Engineering"),
                description=job_dict.get("description", ""),
                seniority=job_dict.get("seniority", "Mid-Level"),
                min_experience_years=float(job_dict.get("min_experience_years", 0.0)),
                max_experience_years=float(job_dict.get("max_experience_years", 10.0)),
                required_skills=job_dict.get("required_skills", []),
                preferred_skills=job_dict.get("preferred_skills", []),
                education_requirements=job_dict.get("education_requirements", ""),
                location=job_dict.get("location", "Remote"),
                employment_type=job_dict.get("employment_type", "Full-time")
            )

            seen_hashes = set()
            tasks = [
                self.process_single_file(batch_id, job_create, job_id, f_bytes, fname, seen_hashes)
                for fname, f_bytes in files_data
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            parsed_count = 0
            failed_count = 0
            duplicate_count = 0
            errors = []

            for res in results:
                if isinstance(res, Exception):
                    failed_count += 1
                    errors.append({"error": str(res)})
                elif isinstance(res, dict):
                    status = res.get("status")
                    if status == "success":
                        parsed_count += 1
                    elif status == "duplicate":
                        duplicate_count += 1
                    elif status == "failed":
                        failed_count += 1
                        errors.append({"filename": res.get("filename", ""), "error": res.get("error", "Unknown error")})

            final_status = "completed"
            if failed_count > 0 and parsed_count == 0:
                final_status = "failed"
            elif failed_count > 0:
                final_status = "partially_completed"

            await db.batches.update_one(
                {"batch_id": batch_id},
                {
                    "$set": {
                        "status": final_status,
                        "parsed": parsed_count,
                        "failed": failed_count,
                        "duplicates": duplicate_count,
                        "error_details": errors,
                        "completed_at": datetime.utcnow().isoformat()
                    }
                }
            )

            # Update job candidate count
            cand_count = await db.candidates.count_documents({"job_id": job_id})
            await db.jobs.update_one({"_id": job_id}, {"$set": {"candidate_count": cand_count}})
            logger.info(f"Batch {batch_id} finished: {parsed_count} parsed, {duplicate_count} duplicates, {failed_count} failed.")

        except Exception as e:
            logger.error(f"Fatal error in batch execution {batch_id}: {e}")
            await db.batches.update_one(
                {"batch_id": batch_id},
                {"$set": {"status": "failed", "completed_at": datetime.utcnow().isoformat()}}
            )

batch_processor = BatchIngestionProcessor(max_concurrency=settings.CONCURRENT_WORKERS)
