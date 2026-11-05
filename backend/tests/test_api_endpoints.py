import os
import sys
import unittest

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import read_root, health_check, system_diagnostics

class TestAPIEndpoints(unittest.TestCase):
    def test_read_root(self):
        res = read_root()
        self.assertIn("version", res)
        self.assertIn("status", res)

    def test_health_check(self):
        res = health_check()
        self.assertEqual(res["status"], "healthy")
        self.assertIn("version", res)

    def test_system_diagnostics(self):
        res = system_diagnostics()
        self.assertEqual(res["status"], "healthy")
        self.assertIn("runtime", res)
        self.assertIn("features", res)

if __name__ == "__main__":
    unittest.main()
