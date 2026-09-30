"""
Fixtures partagées pour les tests du service Auth.

- Base de données : SQLite en mémoire/fichier, isolée de PostgreSQL (même
  principe que module_academique/tests/conftest.py).
- Redis : remplacé par fakeredis (aucun serveur Redis requis pour lancer
  les tests), ce qui permet de tester réellement le verrouillage de compte
  et la rotation des refresh tokens sans dépendance externe.
"""
import os

# Les variables d'environnement doivent être définies AVANT l'import de
# l'application (app/database.py et app/main.py les lisent au chargement).
os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"
os.environ["JWT_SECRET"] = "test-secret-for-ci"

import fakeredis  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import SQLModel  # noqa: E402

import app.redis_client as redis_client  # noqa: E402

# On remplace le client Redis réel par une instance fakeredis PARTAGÉE
# entre tous les appels de get_redis() de ce process de test.
_fake_redis = fakeredis.FakeStrictRedis(decode_responses=True)
redis_client.get_redis = lambda: _fake_redis

from app.database import engine  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_state():
    """Table SQL propre + Redis vidé avant chaque test, pour l'isolation."""
    SQLModel.metadata.create_all(engine)
    _fake_redis.flushall()
    yield
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client():
    with TestClient(fastapi_app) as test_client:
        yield test_client


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    db_file = "test_auth.db"
    if os.path.exists(db_file):
        os.remove(db_file)
