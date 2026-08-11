"""
ItineraryService database configuration.

Uses two PostgreSQL databases:
  - itinerary_db    : itineraries, bookings, reviews, proposals
  - destinations_db : destinations catalogue
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

ITINERARY_DATABASE_URL = os.environ.get(
    "ITINERARY_DATABASE_URL",
    "postgresql+psycopg2://globetrotter:globetrotter@itinerary-db:5432/itinerary_db",
)
DESTINATIONS_DATABASE_URL = os.environ.get(
    "DESTINATIONS_DATABASE_URL",
    "postgresql+psycopg2://globetrotter:globetrotter@destinations-db:5432/destinations_db",
)

itinerary_engine = create_engine(ITINERARY_DATABASE_URL, pool_pre_ping=True)
destinations_engine = create_engine(DESTINATIONS_DATABASE_URL, pool_pre_ping=True)

ItinerarySessionLocal = sessionmaker(autocommit=False, autoflush=False,
                                     bind=itinerary_engine)
DestinationsSessionLocal = sessionmaker(autocommit=False, autoflush=False,
                                        bind=destinations_engine)

Base = declarative_base()


def get_itinerary_db():
    db = ItinerarySessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_destinations_db():
    db = DestinationsSessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    import app.models  # noqa: F401
    import app.destination_models  # noqa: F401
    Base.metadata.create_all(bind=itinerary_engine)
    Base.metadata.create_all(bind=destinations_engine)
