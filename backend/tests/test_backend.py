import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["USE_LOCAL_DB"] = "true"

from app.services.resume_parser import (
    parse_complete_resume, compute_file_hash, extract_contact_info
)
from app.services.skill_inference import skill_engine
from app.services.matching_engine import matching_engine
from app.services.fairness import anonymize_candidate_profile, run_fairness_audit
from app.services.resume_studio import resume_studio
from app.models.schemas import JobCreate, ScoringWeightsConfig
from app.ml.evaluation import ml_evaluation_service
from app.ml.feature_engineering import feature_extractor

SAMPLE_RESUME_TEXT = """
Jane Doe
jane.doe@example.com | +1 555-0123 | San Francisco, CA
https://github.com/janedoe | https://linkedin.com/in/janedoe

PROFESSIONAL SUMMARY
Experienced Backend Software Engineer with 4 years of expertise designing and implementing scalable REST APIs, microservices, and distributed backend architectures in Python, FastAPI, and PostgreSQL.

TECHNICAL SKILLS
Languages: Python, SQL, JavaScript, Bash
Frameworks: FastAPI, Django, Flask, PyTorch, Scikit-learn
Databases: PostgreSQL, Redis, MongoDB
DevOps & Cloud: Docker, Kubernetes, AWS, CI/CD, Git

WORK EXPERIENCE
Senior Backend Engineer | CloudScale Inc.
2021 - Present
- Architected and deployed 12 microservices using FastAPI and Docker on AWS ECS, serving 2.5M daily active users.
- Optimized PostgreSQL relational queries and connection pooling, reducing p95 database latency by 45%.
- Implemented automated CI/CD deployment pipelines using GitHub Actions, decreasing release cycle times by 60%.

Software Engineer | NextGen Systems
2019 - 2021
- Developed RESTful API endpoints for payment processing and user authentication with 99.9% uptime.
- Mentored junior engineers and led bi-weekly code review sessions.

PROJECTS
Real-Time Distributed Queue
- Built event-driven message queuing broker in Python and Redis supporting 15,000 tasks/second.
- Integrated automated testing suites with 90% code coverage using Pytest.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley
2015 - 2019
"""

class TestCareerIntelligenceBackend(unittest.TestCase):
    def test_resume_parser_contact_and_skills(self):
        parsed = parse_complete_resume(SAMPLE_RESUME_TEXT.encode("utf-8"), "jane_doe.txt")
        self.assertEqual(parsed.contact.email, "jane.doe@example.com")
        self.assertIn("Python", parsed.explicit_skills)
        self.assertIn("FastAPI", parsed.explicit_skills)
        self.assertIn("PostgreSQL", parsed.explicit_skills)
        self.assertGreaterEqual(parsed.total_experience_years, 3.0)
        self.assertGreater(parsed.action_verb_count, 0)

    def test_skill_inference_hidden_and_transferable(self):
        parsed = parse_complete_resume(SAMPLE_RESUME_TEXT.encode("utf-8"), "jane_doe.txt")
        inferred_names = [inf.skill for inf in parsed.inferred_skills]
        self.assertTrue(any("Backend" in s or "Architecture" in s for s in inferred_names))
        
        for inf in parsed.inferred_skills:
            self.assertIsNotNone(inf.evidence)
            self.assertGreater(inf.confidence, 0.0)

        transferable = skill_engine.find_transferable_skills(parsed.explicit_skills, ["MySQL"])
        trans_skills = [t.skill for t in transferable]
        self.assertTrue(any("MySQL" in t for t in trans_skills))

    def test_matching_engine_deterministic_score(self):
        parsed = parse_complete_resume(SAMPLE_RESUME_TEXT.encode("utf-8"), "jane_doe.txt")
        job = JobCreate(
            title="Backend Software Engineer",
            department="Engineering",
            description="Looking for an experienced Python backend developer with FastAPI, PostgreSQL, Docker, and AWS.",
            seniority="Mid-Level",
            min_experience_years=3.0,
            required_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            preferred_skills=["AWS", "Kubernetes", "Redis"],
            scoring_weights=ScoringWeightsConfig()
        )

        res1 = matching_engine.calculate_match(parsed, job, "cand_1", "job_1")
        res2 = matching_engine.calculate_match(parsed, job, "cand_1", "job_1")

        self.assertEqual(res1.overall_fit_score, res2.overall_fit_score)
        self.assertGreaterEqual(res1.overall_fit_score, 80)
        self.assertIn(res1.recommendation, ["Strong Match", "Potential Match"])
        self.assertGreater(len(res1.strengths), 0)
        self.assertGreater(res1.category_scores.required_skills, 20)

    def test_fairness_anonymization_and_audit(self):
        cand_dict = {
            "candidate_id": "cand_12345",
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "+1 555-0123",
            "location": "San Francisco, CA",
            "overall_fit_score": 88,
            "skills": ["Python", "FastAPI"]
        }
        anonymized = anonymize_candidate_profile(cand_dict)
        self.assertTrue(anonymized["name"].startswith("Candidate #"))
        self.assertNotIn("jane", anonymized["email"])
        self.assertEqual(anonymized["overall_fit_score"], 88)

        audit = run_fairness_audit([cand_dict, anonymized])
        self.assertTrue(audit.audit_passed)
        self.assertEqual(audit.demographic_neutrality_score, 100.0)

    def test_ml_evaluation_metrics(self):
        report = ml_evaluation_service.train_and_evaluate_benchmark()
        metrics = report["metrics"]
        self.assertGreaterEqual(metrics["precision"], 0.5)
        self.assertGreaterEqual(metrics["recall"], 0.5)
        self.assertGreaterEqual(metrics["f1_score"], 0.5)
        self.assertGreaterEqual(metrics["roc_auc"], 0.7)
        self.assertEqual(len(report["feature_importances"]), 20)

    def test_resume_studio_pdf_and_docx_generation(self):
        md = "# John Smith\njohn@example.com\n\n## Experience\n- Engineered high throughput system."
        pdf_bytes = resume_studio.generate_pdf_from_markdown(md, "Modern Professional")
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        
        docx_bytes = resume_studio.generate_docx_from_markdown(md, "Modern Professional")
        self.assertGreater(len(docx_bytes), 500)

if __name__ == "__main__":
    unittest.main()
