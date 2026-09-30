"""Fixtures partagées pour les tests API du service RH (SQLite isolée)."""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_hr.db"
os.environ["JWT_SECRET"] = "test-secret-for-ci"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from jose import jwt  # noqa: E402

from app.config import JWT_ALGORITHM, JWT_SECRET  # noqa: E402
from app.database import Base, engine  # noqa: E402
from main import app as fastapi_app  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(fastapi_app) as test_client:
        yield test_client


def make_token(role: str, user_id: int = 1, sub: str = "user@example.com") -> str:
    return jwt.encode({"sub": sub, "role": role, "user_id": user_id}, JWT_SECRET, algorithm=JWT_ALGORITHM)


@pytest.fixture
def rh_headers():
    return {"Authorization": f"Bearer {make_token('rh', user_id=1, sub='rh@example.com')}"}


@pytest.fixture
def student_headers():
    return {"Authorization": f"Bearer {make_token('student', user_id=99, sub='student@example.com')}"}


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    db_file = "test_hr.db"
    if os.path.exists(db_file):
        os.remove(db_file)
