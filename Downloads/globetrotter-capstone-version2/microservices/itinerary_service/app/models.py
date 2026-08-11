"""
ItineraryService ORM models (itinerary_db).

Owns the "itineraries" data domain:
  - Itinerary : trip itineraries/schedules
  - Booking   : trips/bookings
  - Review    : public reviews on destinations
  - Proposal  : user destination proposals
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Text, JSON, Boolean

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    destinations = Column(JSON, default=list)
    start_date = Column(String, default="")
    end_date = Column(String, default="")
    notes = Column(Text, default="")
    share_token = Column(String, default="")
    created_at = Column(String, default=_now)
    updated_at = Column(String, default=_now, onupdate=_now)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String, index=True, nullable=False)
    itinerary_id = Column(String, default="")
    destination_name = Column(String, nullable=False)
    booking_date = Column(String, default="")
    status = Column(String, default="confirmed")
    details = Column(Text, default="")
    created_at = Column(String, default=_now)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=_uuid)
    username = Column(String, index=True, nullable=False)
    destination_name = Column(String, nullable=False)
    rating = Column(Float, nullable=False)
    comment = Column(Text, default="")
    created_at = Column(String, default=_now)
    updated_at = Column(String, default=_now, onupdate=_now)


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(String, primary_key=True, default=_uuid)
    submitted_by = Column(String, index=True, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    name = Column(String, nullable=False)
    country = Column(String, default="")
    continent = Column(String, default="")
    city = Column(String, default="")
    description = Column(Text, default="")
    tags = Column(JSON, default=list)
    avg_cost_per_day = Column(Float, default=0)
    image = Column(String, default="placeholder.jpg")
    submitted_at = Column(String, default=_now)
    reviewed_at = Column(String, default="")
    admin_comment = Column(Text, default="")
