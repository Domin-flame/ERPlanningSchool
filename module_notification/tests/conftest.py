"""Fixtures partagées pour les tests API du service Notification (SQLite isolée)."""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_notification.db"
os.environ["JWT_SECRET"] = "test-secret-for-ci"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from jose import jwt  # noqa: E402

import app.main as notification_main  # noqa: E402


@pytest.fixture(autouse=True)
def _mock_consumer(monkeypatch):
    """Le consumer RabbitMQ démarre normalement au 'startup' de l'app ; on
    le remplace par un no-op pour ne pas dépendre d'un vrai broker durant
    les tests (le service continue de fonctionner sans lui, comme en
    production quand RabbitMQ est temporairement indisponible)."""
    async def _noop_consumer():
        return None

    monkeypatch.setattr(notification_main, "start_consumer", _noop_consumer)


from app.database import Base, engine  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(fastapi_app) as test_client:
        yield test_client


def make_token(user_id: int, role: str = "student") -> str:
    secret = os.environ["JWT_SECRET"]
    return jwt.encode({"sub": f"user{user_id}@example.com", "user_id": user_id, "role": role}, secret, algorithm="HS256")


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    db_file = "test_notification.db"
    if os.path.exists(db_file):
        os.remove(db_file)
