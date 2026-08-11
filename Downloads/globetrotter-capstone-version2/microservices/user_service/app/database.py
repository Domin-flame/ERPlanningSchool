"""
UserService database configuration.

Uses SQLAlchemy ORM against a PostgreSQL database (user_db).
The connection string is provided via the DATABASE_URL environment variable.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg2://globetrotter:globetrotter@user-db:5432/user_db",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Use Alembic migrations in production."""
    import app.models  # noqa: F401 ensure models are registered
    Base.metadata.create_all(bind=engine)
