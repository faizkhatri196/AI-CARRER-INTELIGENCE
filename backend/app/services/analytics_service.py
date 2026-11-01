from typing import Dict, Any, List
from collections import Counter
from app.database.connection import db

class AnalyticsService:
    async def get_recruiter_analytics(self, job_id: str) -> Dict[str, Any]:
        candidates = await db.candidates.find({"job_id": job_id})
        batches = await db.batches.find({"job_id": job_id})
        
        total_applicants = len(candidates)
        total_batches = len(batches)
        
        failed_resumes = sum(b.get("failed", 0) for b in batches)
        duplicate_resumes = sum(b.get("duplicates", 0) for b in batches)

        if total_applicants == 0:
            return {
                "total_applications": 0,
                "successfully_processed": 0,
                "failed_processing": failed_resumes,
                "duplicate_resumes": duplicate_resumes,
                "average_fit_score": 0,
                "strong_matches": 0,
                "potential_matches": 0,
                "shortlisted_count": 0,
                "score_distribution": [
                    {"range": "90-100", "count": 0},
                    {"range": "80-89", "count": 0},
                    {"range": "70-79", "count": 0},
                    {"range": "60-69", "count": 0},
                    {"range": "<60", "count": 0}
                ],
                "experience_distribution": [
                    {"label": "0-1 yr", "count": 0},
                    {"label": "1-3 yrs", "count": 0},
                    {"label": "3-5 yrs", "count": 0},
                    {"label": "5+ yrs", "count": 0}
                ],
                "top_skills_pool": []
            }

        scores = [c.get("overall_fit_score", 0) for c in candidates]
        avg_score = round(sum(scores) / total_applicants, 1)
        
        strong_matches = sum(1 for s in scores if s >= 82)
        potential_matches = sum(1 for s in scores if 68 <= s < 82)
        shortlisted_count = sum(1 for c in candidates if c.get("shortlisted", False))

        # Score buckets
        score_dist = {
            "90-100": sum(1 for s in scores if s >= 90),
            "80-89": sum(1 for s in scores if 80 <= s < 90),
            "70-79": sum(1 for s in scores if 70 <= s < 80),
            "60-69": sum(1 for s in scores if 60 <= s < 70),
            "<60": sum(1 for s in scores if s < 60)
        }

        # Experience buckets
        exps = [c.get("experience_years", 0.0) for c in candidates]
        exp_dist = {
            "0-1 yr": sum(1 for e in exps if e <= 1.0),
            "1-3 yrs": sum(1 for e in exps if 1.0 < e <= 3.0),
            "3-5 yrs": sum(1 for e in exps if 3.0 < e <= 5.0),
            "5+ yrs": sum(1 for e in exps if e > 5.0)
        }

        # Skills frequencies
        all_skills = []
        for c in candidates:
            all_skills.extend(c.get("skills", []))
        top_skills = [
            {"skill": skill, "count": count}
            for skill, count in Counter(all_skills).most_common(8)
        ]

        return {
            "total_applications": total_applicants,
            "successfully_processed": total_applicants,
            "failed_processing": failed_resumes,
            "duplicate_resumes": duplicate_resumes,
            "average_fit_score": avg_score,
            "strong_matches": strong_matches,
            "potential_matches": potential_matches,
            "shortlisted_count": shortlisted_count,
            "score_distribution": [{"range": k, "count": v} for k, v in score_dist.items()],
            "experience_distribution": [{"label": k, "count": v} for k, v in exp_dist.items()],
            "top_skills_pool": top_skills
        }

analytics_service = AnalyticsService()
