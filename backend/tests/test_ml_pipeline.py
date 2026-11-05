import os
import sys
import unittest
import numpy as np

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml.feature_engineering import FEATURE_NAMES, FeatureExtractor
from app.ml.evaluation import compute_ndcg_at_k, ml_evaluation_service

class TestMLPipelineAndEvaluation(unittest.TestCase):
    def test_feature_names_dimension_count(self):
        self.assertEqual(len(FEATURE_NAMES), 20)
        self.assertIn("required_skill_coverage", FEATURE_NAMES)
        self.assertIn("total_experience_years", FEATURE_NAMES)
        self.assertIn("action_verb_count", FEATURE_NAMES)

    def test_ndcg_computation(self):
        # Perfect ranking
        y_true = np.array([3, 2, 1, 0, 0])
        y_score = np.array([0.9, 0.8, 0.7, 0.2, 0.1])
        score_perfect = compute_ndcg_at_k(y_true, y_score, k=5)
        self.assertAlmostEqual(score_perfect, 1.0, places=2)

        # Inverted ranking
        y_score_inv = np.array([0.1, 0.2, 0.7, 0.8, 0.9])
        score_inv = compute_ndcg_at_k(y_true, y_score_inv, k=5)
        self.assertLess(score_inv, 1.0)
        self.assertGreater(score_inv, 0.0)

    def test_evaluation_service_report_structure(self):
        report = ml_evaluation_service.report
        self.assertIsInstance(report, dict)
        self.assertIn("model_name", report)
        self.assertIn("metrics", report)
        self.assertIn("confusion_matrix", report)
        self.assertIn("feature_importances", report)

if __name__ == "__main__":
    unittest.main()
