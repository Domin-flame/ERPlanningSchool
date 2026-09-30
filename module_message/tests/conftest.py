"""
Fixtures partagées pour les tests du service Message.

- Base de données : SQLite isolée (les modèles utilisent des colonnes
  UUID/JSON génériques compatibles SQLite, contrairement au service
  Finance qui utilise des colonnes PostgreSQL générées).
- RabbitMQ : la publication d'événements (`publish_message_event`) est
  remplacée par un no-op pour ne pas dépendre d'un broker réel — le
  service continue de fonctionner normalement même si l'événement échoue
  (try/except dans app/rabbitmq.py), mais on évite ainsi tout délai de
  connexion inutile pendant les tests.
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_message.db"
os.environ["JWT_SECRET"] = "test-secret-for-ci"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from jose import jwt  # noqa: E402

import app.routers.messages as messages_router  # noqa: E402


@pytest.fixture(autouse=True)
def _mock_rabbitmq(monkeypatch):
    async def _noop_publish(*args, **kwargs):
        return None

    monkeypatch.setattr(messages_router, "publish_message_event", _noop_publish)


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
    db_file = "test_message.db"
    if os.path.exists(db_file):
        os.remove(db_file)
