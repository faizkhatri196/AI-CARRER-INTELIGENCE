import re
import numpy as np
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.schemas import ParsedResume, JobCreate

FEATURE_NAMES = [
    "required_skill_coverage",       # 1
    "preferred_skill_coverage",      # 2
    "tfidf_similarity",              # 3
    "total_experience_years",        # 4
    "experience_requirement_ratio",  # 5
    "project_count",                 # 6
    "project_with_metrics_ratio",    # 7
    "action_verb_count",             # 8
    "quantified_metric_count",       # 9
    "ats_formatting_score",          # 10
    "content_quality_score",         # 11
    "degree_level_code",             # 12
    "cs_field_relevance",            # 13
    "inferred_skills_count",         # 14
    "transferable_skills_count",     # 15
    "domain_title_overlap",          # 16
    "has_github",                    # 17
    "has_linkedin",                  # 18
    "has_contact_details",           # 19
    "evidence_density_score"         # 20
]

class FeatureExtractor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words="english", max_features=1000)

    def extract_features(self, resume: ParsedResume, job: JobCreate) -> np.ndarray:
        cand_skills_lower = {s.lower() for s in resume.explicit_skills}
        for inf in resume.inferred_skills:
            cand_skills_lower.add(inf.skill.lower())

        # 1. Required skills coverage
        req = job.required_skills or []
        req_matched = sum(1 for r in req if r.lower() in cand_skills_lower or any(r.lower() in s for s in cand_skills_lower))
        req_cov = req_matched / max(len(req), 1) if req else 1.0

        # 2. Preferred skills coverage
        pref = job.preferred_skills or []
        pref_matched = sum(1 for p in pref if p.lower() in cand_skills_lower or any(p.lower() in s for s in cand_skills_lower))
        pref_cov = pref_matched / max(len(pref), 1) if pref else 1.0

        # 3. TF-IDF Similarity
        try:
            job_str = f"{job.title} {job.description} {' '.join(req)}"
            res_str = resume.raw_text
            mat = self.vectorizer.fit_transform([job_str, res_str])
            sim = float(cosine_similarity(mat[0:1], mat[1:2])[0][0])
        except Exception:
            sim = 0.5

        # 4 & 5. Experience
        exp_years = float(resume.total_experience_years)
        min_exp = float(job.min_experience_years or 0.0)
        exp_ratio = min(exp_years / min_exp, 2.0) if min_exp > 0 else 1.0

        # 6 & 7. Projects
        proj_count = float(len(resume.projects))
        proj_metrics = sum(1 for p in resume.projects if p.has_metrics)
        proj_metrics_ratio = proj_metrics / max(proj_count, 1.0)

        # 8 & 9. Verbs and Metrics
        action_verbs = float(resume.action_verb_count)
        metric_count = float(resume.metric_count)

        # 10 & 11. ATS & Quality
        ats_score = float(resume.ats_formatting_score) / 100.0
        quality_score = float(resume.content_quality_score) / 100.0

        # 12 & 13. Education
        degree_code = 1.0  # default Bachelor
        cs_field = 1.0
        for edu in resume.education:
            deg_lower = (edu.degree or "").lower()
            if "ph" in deg_lower or "doctor" in deg_lower:
                degree_code = 3.0
            elif "master" in deg_lower or "m.s" in deg_lower or "m.tech" in deg_lower:
                degree_code = 2.0
            elif "bachelor" in deg_lower or "b.s" in deg_lower or "b.tech" in deg_lower:
                degree_code = 1.0

            field_lower = (edu.field_of_study or "").lower()
            if any(k in field_lower for k in ["computer", "data", "software", "information", "ai", "intelligence"]):
                cs_field = 1.0

        # 14 & 15. Inferred & Transferable
        inf_count = float(len(resume.inferred_skills))
        trans_count = float(len(resume.transferable_skills))

        # 16. Title overlap
        title_tokens = [w for w in job.title.lower().split() if len(w) > 3]
        res_lower = resume.raw_text.lower()
        title_overlap = sum(1 for t in title_tokens if t in res_lower) / max(len(title_tokens), 1)

        # 17, 18, 19. Contact info
        has_gh = 1.0 if resume.contact.github_url else 0.0
        has_li = 1.0 if resume.contact.linkedin_url else 0.0
        has_contact = 1.0 if (resume.contact.email and resume.contact.phone) else 0.5

        # 20. Evidence density
        word_count = max(len(resume.raw_text.split()), 1)
        evidence_density = min((action_verbs + metric_count + inf_count) / (word_count / 100.0), 5.0)

        feature_vector = np.array([
            req_cov, pref_cov, sim, exp_years, exp_ratio,
            proj_count, proj_metrics_ratio, action_verbs, metric_count,
            ats_score, quality_score, degree_code, cs_field,
            inf_count, trans_count, title_overlap,
            has_gh, has_li, has_contact, evidence_density
        ], dtype=np.float32)

        return feature_vector

feature_extractor = FeatureExtractor()

