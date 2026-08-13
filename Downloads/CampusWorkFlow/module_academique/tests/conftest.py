import os

# Base de données SQLite dédiée aux tests (isolée de PostgreSQL) : la variable
# d'environnement doit être définie AVANT l'import de l'application.
os.environ["DATABASE_URL"] = "sqlite:///./test_academic.db"

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine, SessionLocal, get_db


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    db_file = "test_academic.db"
    if os.path.exists(db_file):
        os.remove(db_file)
