"""
ItineraryService business logic.
"""
import os
import uuid
import threading

from sqlalchemy.orm import Session

import app.repositories as repo
import app.destination_repository as dest_repo
from app import rabbitmq

ADMIN_USERNAME = "admin"


def _publish_sync(coroutine_fn, *args, **kwargs):
    """Run an async RabbitMQ publish coroutine in a background thread."""
    def runner():
        import asyncio
        try:
            asyncio.run(coroutine_fn(*args, **kwargs))
        except Exception as exc:  # pragma: no cover
            print(f"[rabbitmq] background publish failed: {exc}")

    t = threading.Thread(target=runner, daemon=True)
    t.start()


def it_share_link(it, base_url: str = "") -> str:
    if not it.share_token:
        return None
    base = base_url or os_share_base()
    return f"{base}/itineraries/shared/{it.share_token}"


def os_share_base() -> str:
    return os.environ.get("SHARE_BASE_URL", "http://localhost:8000")


def create_itinerary(db: Session, username: str, data: dict) -> dict:
    data = {
        "title": data.get("title", "").strip(),
        "destinations": data.get("destinations", []),
        "start_date": data.get("start_date", ""),
        "end_date": data.get("end_date", ""),
        "notes": data.get("notes", ""),
        "share_token": str(uuid.uuid4()),
    }
    it = repo.create_itinerary(db, username, data)
    _publish_sync(
        rabbitmq.publish_itinerary_created, username, it.id, it.destinations
    )
    return serialize_itinerary(it)


def serialize_itinerary(it) -> dict:
    return {
        "id": it.id,
        "username": it.username,
        "title": it.title,
        "destinations": it.destinations or [],
        "start_date": it.start_date or "",
        "end_date": it.end_date or "",
        "notes": it.notes or "",
        "share_link": it_share_link(it),
        "created_at": it.created_at,
        "updated_at": it.updated_at,
    }


def update_itinerary(db: Session, itinerary_id: str, username: str,
                     data: dict) -> dict | None:
    it = repo.get_itinerary(db, itinerary_id)
    if not it or (it.username != username and username != ADMIN_USERNAME):
        return None
    repo.update_itinerary(db, it, data)
    return serialize_itinerary(it)


def delete_itinerary(db: Session, itinerary_id: str, username: str) -> bool:
    it = repo.get_itinerary(db, itinerary_id)
    if not it or (it.username != username and username != ADMIN_USERNAME):
        return False
    repo.delete_itinerary(db, it)
    _publish_sync(rabbitmq.publish_itinerary_deleted, username, itinerary_id)
    return True


def get_shared(db: Session, token: str) -> dict | None:
    it = repo.get_by_share_token(db, token)
    if not it:
        return None
    return serialize_itinerary(it)


def get_stats(db: Session, ddb: Session) -> dict:
    reviews = repo.get_all_reviews(db)
    proposals = repo.get_all_proposals(db)
    destinations = dest_repo.get_all(ddb)
    itineraries = db.query(repo.Itinerary).all()
    return {
        "total_itineraries": len(itineraries),
        "total_destinations": len(destinations),
        "total_proposals": len(proposals),
        "pending_proposals": len([p for p in proposals if p.status == "pending"]),
        "approved_proposals": len([p for p in proposals if p.status == "approved"]),
        "total_reviews": len(reviews),
    }
