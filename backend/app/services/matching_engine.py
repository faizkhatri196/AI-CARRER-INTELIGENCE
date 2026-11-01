import math
import re
from typing import Dict, Any, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.schemas import (
    ParsedResume, JobCreate, CandidateMatchResult,
    ScoreCategoryBreakdown, ScoringWeightsConfig
)
from app.services.skill_inference import skill_engine

class JobMatchingEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english", lowercase=True)

    def calculate_match(
        self,
        resume: ParsedResume,
        job: JobCreate,
        candidate_id: str,
        job_id: str
    ) -> CandidateMatchResult:
        weights = job.scoring_weights or ScoringWeightsConfig()
        
        # 1. Required Technical Skills Match (Weight: default 25)
        candidate_skills_lower = {s.lower() for s in resume.explicit_skills}
        for inf in resume.inferred_skills:
            candidate_skills_lower.add(inf.skill.lower())
            
        required_skills = job.required_skills or []
        preferred_skills = job.preferred_skills or []
        
        matched_required = []
        missing_required = []
        
        for req in required_skills:
            req_clean = req.strip()
            # Check explicit or inferred
            if req_clean.lower() in candidate_skills_lower or any(req_clean.lower() in s for s in candidate_skills_lower):
                matched_required.append(req_clean)
            else:
                missing_required.append(req_clean)
                
        req_ratio = len(matched_required) / max(len(required_skills), 1) if required_skills else 1.0
        required_skills_score = round(req_ratio * weights.required_skills, 1)

        # 2. Semantic Skill & Content Relevance via TF-IDF Cosine Sim (Weight: default 15)
        semantic_sim = 0.5
        try:
            combined_job_text = f"{job.title} {job.description} {' '.join(required_skills)} {' '.join(preferred_skills)}"
            combined_resume_text = resume.raw_text
            tfidf_mat = self.vectorizer.fit_transform([combined_job_text, combined_resume_text])
            sim = cosine_similarity(tfidf_mat[0:1], tfidf_mat[1:2])[0][0]
            semantic_sim = float(sim)
        except Exception:
            semantic_sim = 0.5
            
        semantic_score = round(min(max(semantic_sim * 1.5, 0.2), 1.0) * weights.semantic_relevance, 1)

        # 3. Relevant Experience Score (Weight: default 15)
        # Compare candidate years vs min_experience_years
        min_exp = job.min_experience_years or 0.0
        cand_exp = resume.total_experience_years
        
        if cand_exp >= min_exp:
            exp_ratio = 1.0
        elif min_exp > 0:
            exp_ratio = max(cand_exp / min_exp, 0.3)
        else:
            exp_ratio = 1.0
        experience_score = round(exp_ratio * weights.experience, 1)

        # 4. Project & Practical Evidence Score (Weight: default 15)
        proj_count = len(resume.projects)
        has_proj_metrics = sum(1 for p in resume.projects if p.has_metrics)
        proj_quality = min((proj_count * 0.4) + (has_proj_metrics * 0.3), 1.0)
        if not resume.projects and resume.experience:
            # Experience accounts for practical execution
            proj_quality = 0.8
        project_score = round(proj_quality * weights.projects, 1)

        # 5. Responsibility Alignment (Weight: default 10)
        # Check action verbs and duties
        action_verb_factor = min(resume.action_verb_count / 6.0, 1.0)
        responsibility_score = round(action_verb_factor * weights.responsibilities, 1)

        # 6. Domain Relevance (Weight: default 10)
        # Check if job title or department keywords are in resume
        domain_keywords = job.title.lower().split() + (job.department or "").lower().split()
        resume_lower = resume.raw_text.lower()
        domain_matches = sum(1 for kw in domain_keywords if len(kw) > 3 and kw in resume_lower)
        domain_ratio = min(domain_matches / max(len(domain_keywords), 1), 1.0)
        domain_score = round(max(domain_ratio, 0.5) * weights.domain_relevance, 1)

        # 7. Preferred Skills & Certifications (Weight: default 5)
        matched_preferred = []
        for pref in preferred_skills:
            if pref.lower() in candidate_skills_lower or any(pref.lower() in s for s in candidate_skills_lower):
                matched_preferred.append(pref)
        pref_ratio = len(matched_preferred) / max(len(preferred_skills), 1) if preferred_skills else 1.0
        preferred_score = round(pref_ratio * weights.preferred_skills, 1)

        # 8. Achievement Evidence / Quantified Outcomes (Weight: default 5)
        metrics_factor = min(resume.metric_count / 3.0, 1.0)
        achievement_score = round(metrics_factor * weights.achievements, 1)

        # Total Calculation
        total_raw = (
            required_skills_score +
            semantic_score +
            experience_score +
            project_score +
            responsibility_score +
            domain_score +
            preferred_score +
            achievement_score
        )
        total_fit = int(min(max(round(total_raw), 0), 100))

        # Distinct Sub-scores
        skills_coverage = int(round(req_ratio * 100))
        evidence_strength = int(min(round((action_verb_factor * 50) + (metrics_factor * 50)), 100))
        
        # Transferable skills specifically relevant to this job's missing requirements
        transferable_items = skill_engine.find_transferable_skills(resume.explicit_skills, missing_required)
        transferable_caps = [t.skill for t in transferable_items]

        # Recommendation Tier
        if total_fit >= 82:
            recommendation = "Strong Match"
        elif total_fit >= 68:
            recommendation = "Potential Match"
        elif total_fit >= 50:
            recommendation = "Partial Match"
        else:
            recommendation = "Low Evidence"

        # Generate Strengths
        strengths = []
        if matched_required:
            strengths.append(f"Demonstrated core skills: {', '.join(matched_required[:4])}")
        if cand_exp >= min_exp and min_exp > 0:
            strengths.append(f"Meets seniority target with {cand_exp} years verified experience")
        if resume.projects:
            strengths.append(f"{len(resume.projects)} structured projects with technical implementation details")
        if resume.metric_count > 0:
            strengths.append(f"Quantifiable business metrics & impact points verified ({resume.metric_count} metrics)")
        if resume.inferred_skills:
            top_inf = [inf.skill for inf in resume.inferred_skills[:2]]
            strengths.append(f"Demonstrated hidden capabilities: {', '.join(top_inf)}")

        category_breakdown = ScoreCategoryBreakdown(
            required_skills=required_skills_score,
            semantic_relevance=semantic_score,
            experience=experience_score,
            projects=project_score,
            responsibilities=responsibility_score,
            domain_relevance=domain_score,
            preferred_skills=preferred_score,
            achievements=achievement_score
        )

        return CandidateMatchResult(
            candidate_id=candidate_id,
            job_id=job_id,
            overall_fit_score=total_fit,
            category_scores=category_breakdown,
            ats_score=resume.ats_formatting_score,
            quality_score=resume.content_quality_score,
            skills_coverage_percent=skills_coverage,
            evidence_strength_score=evidence_strength,
            strengths=strengths,
            missing_requirements=missing_required,
            transferable_capabilities=transferable_caps,
            recommendation=recommendation
        )

matching_engine = JobMatchingEngine()
