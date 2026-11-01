import re
from typing import Dict, Any, List
from app.services.skill_inference import skill_engine

class LinkedInIntelligenceService:
    def analyze_profile_vs_resume(self, linkedin_text: str, resume_text: str, resume_skills: List[str]) -> Dict[str, Any]:
        """
        Compares candidate's LinkedIn profile details with their uploaded resume
        to discover positioning gaps, missing skills, and consistency discrepancies.
        """
        li_clean = linkedin_text.strip()
        li_lower = li_clean.lower()
        res_lower = resume_text.lower()
        
        # 1. Extract skills from LinkedIn
        li_skills = skill_engine.extract_explicit_skills(li_clean)
        res_skill_set = {s.lower() for s in resume_skills}
        
        skills_on_linkedin_not_in_resume = [s for s in li_skills if s.lower() not in res_skill_set]
        skills_in_resume_not_on_linkedin = [s for s in resume_skills if s.lower() not in {ls.lower() for ls in li_skills}]

        # 2. Headline and Summary positioning analysis
        headline_match = re.search(r'(headline|title)[:\-]?\s*(.+)', li_clean, re.IGNORECASE)
        has_clear_headline = bool(headline_match) or len(li_clean.split("\n")[0]) < 80
        
        has_metrics_in_linkedin = bool(re.search(r'\d+%', li_clean) or re.search(r'\$\d+', li_clean))
        has_metrics_in_resume = bool(re.search(r'\d+%', resume_text) or re.search(r'\$\d+', resume_text))
        
        # 3. Discrepancy checks
        discrepancies = []
        if skills_on_linkedin_not_in_resume:
            discrepancies.append(f"Found {len(skills_on_linkedin_not_in_resume)} capabilities on LinkedIn missing from your resume: {', '.join(skills_on_linkedin_not_in_resume[:4])}.")
            
        if not has_metrics_in_linkedin and has_metrics_in_resume:
            discrepancies.append("Your resume has quantified business metrics, but your LinkedIn profile lacks numeric proof points.")
            
        # 4. Actionable recommendations
        recommendations = [
            "Synchronize your technical skills across LinkedIn and your resume to maximize both recruiter searches and ATS indexing.",
            "Craft a value-driven LinkedIn Headline including your top 3 stack competencies (e.g. 'Backend Engineer | Python • FastAPI • Distributed Systems').",
            "Turn LinkedIn About section into an executive narrative focusing on problems solved and architectures scaled."
        ]
        
        if skills_on_linkedin_not_in_resume:
            recommendations.append(f"Add '{skills_on_linkedin_not_in_resume[0]}' to your resume's technical skills section.")

        return {
            "linkedin_skills_count": len(li_skills),
            "skills_on_linkedin_not_in_resume": skills_on_linkedin_not_in_resume,
            "skills_in_resume_not_on_linkedin": skills_in_resume_not_on_linkedin,
            "profile_consistency_score": 85 if not discrepancies else max(90 - (len(discrepancies) * 15), 50),
            "discrepancies": discrepancies,
            "positioning_recommendations": recommendations
        }

linkedin_service = LinkedInIntelligenceService()
