import os
from urllib.parse import quote_plus

from sqlmodel import create_engine, Session, SQLModel

# On importe les modèles pour que leurs classes soient enregistrées dans
# SQLModel.metadata avant l'appel à create_all().
from app import models  # noqa: F401


def _build_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL", "").strip()
    if explicit_url:
        return explicit_url

    db_user = os.getenv("DB_USER", "postgres")
    db_password = quote_plus(os.getenv("DB_PASSWORD", "ernis"))
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "postgres")
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


DATABASE_URL = _build_database_url()
DATABASE_SCHEMA = os.getenv("DATABASE_SCHEMA", "public")

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif DATABASE_SCHEMA:
    connect_args = {"options": f"-csearch_path={DATABASE_SCHEMA}"}
else:
    connect_args = {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)


def create_db_and_tables() -> None:
    """Crée la table user_account (et toute autre table SQLModel du service)
    si elle n'existe pas encore. Utile en dev/démo ; en production on
    utiliserait plutôt Alembic (migrations/), mais ce projet ne fournit pas
    de script de migration réel pour l'instant."""
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
