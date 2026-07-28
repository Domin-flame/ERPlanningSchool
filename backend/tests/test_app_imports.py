import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, ROOT)


class AppImportsTest(unittest.TestCase):
    def test_main_module_imports(self) -> None:
        from app.main import app

        self.assertIsNotNone(app)

    def test_models_package_exports_token(self) -> None:
        from app.models import Token

        self.assertTrue(hasattr(Token, "__fields__"))


if __name__ == "__main__":
    unittest.main()
