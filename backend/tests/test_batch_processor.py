import os
import sys
import unittest

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import hashlib
from app.services.resume_parser import compute_file_hash
from app.services.fairness import anonymize_candidate_profile, run_fairness_audit

class TestBatchIngestionAndFairness(unittest.TestCase):
    def test_sha256_file_hashing_consistency(self):
        content_a = b"%PDF-1.4 Mock Resume Document A"
        content_b = b"%PDF-1.4 Mock Resume Document A"
        content_c = b"%PDF-1.4 Mock Resume Document B Different"
        
        hash_a = compute_file_hash(content_a)
        hash_b = compute_file_hash(content_b)
        hash_c = compute_file_hash(content_c)
        
        self.assertEqual(hash_a, hash_b)
        self.assertNotEqual(hash_a, hash_c)
        self.assertEqual(len(hash_a), 64)

    def test_candidate_anonymization(self):
        raw_candidate = {
            "candidate_id": "cand_xyz987",
            "name": "Jane Doe",
            "email": "jane.doe@techcorp.com",
            "phone": "+1-800-555-0199",
            "location": "San Francisco, CA",
            "gender": "Female",
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "overall_fit_score": 92.5
        }
        
        anonymized = anonymize_candidate_profile(raw_candidate)
        
        self.assertTrue(anonymized["name"].startswith("Candidate #"))
        self.assertNotIn("Jane", anonymized["name"])
        self.assertNotIn("jane.doe", anonymized["email"])
        self.assertEqual(anonymized["phone"], "XXX-XXX-XXXX")
        self.assertEqual(anonymized["overall_fit_score"], 92.5)
        self.assertTrue(anonymized.get("is_anonymized"))

    def test_fairness_audit_neutrality(self):
        candidates = [
            {"candidate_id": "c1", "overall_fit_score": 88.0},
            {"candidate_id": "c2", "overall_fit_score": 75.5},
            {"candidate_id": "c3", "overall_fit_score": 94.0}
        ]
        
        audit = run_fairness_audit(candidates)
        self.assertEqual(audit.total_evaluated, 3)
        self.assertEqual(audit.anonymized_variance, 0.0)
        self.assertEqual(audit.demographic_neutrality_score, 100.0)
        self.assertTrue(audit.audit_passed)

if __name__ == "__main__":
    unittest.main()
