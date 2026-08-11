"""
UserService ORM models.

UserService owns the "users" data domain:
  - User            : identity, authentication, profile, preferences
  - VisitedDestination : destinations a user has visited
  - FavoriteNote    : personal notes on favourite destinations
"""
import uuid

from sqlalchemy import Column, String, Float, Text, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    preferences = Column(JSON, default=list)
    avatar = Column(String, default="")
    is_admin = Column(String, default="false")
    created_at = Column(String, default=_now)
    updated_at = Column(String, default=_now, onupdate=_now)


class VisitedDestination(Base):
    __tablename__ = "visited_destinations"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String, index=True, nullable=False)
    destination_name = Column(String, nullable=False)
    visited_at = Column(String, default=_now)


class FavoriteNote(Base):
    __tablename__ = "favorite_notes"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String, index=True, nullable=False)
    destination_name = Column(String, nullable=False)
    note = Column(Text, default="")
    visit_date = Column(String, default="")
    companions = Column(String, default="")
    budget = Column(Float, nullable=True)
    updated_at = Column(String, default=_now, onupdate=_now)
