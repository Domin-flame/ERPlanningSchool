"""
ItineraryService repositories (itinerary_db): itineraries, bookings, reviews, proposals.
"""
import uuid

from sqlalchemy.orm import Session

from app.models import Itinerary, Booking, Review, Proposal


# ---------------------------------------------------------------------------
# Itineraries
# ---------------------------------------------------------------------------

def get_user_itineraries(db: Session, username: str) -> list[Itinerary]:
    return (db.query(Itinerary)
            .filter(Itinerary.username == username)
            .order_by(Itinerary.created_at.desc())
            .all())


def get_itinerary(db: Session, itinerary_id: str) -> Itinerary | None:
    return db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()


def get_by_share_token(db: Session, token: str) -> Itinerary | None:
    return db.query(Itinerary).filter(Itinerary.share_token == token).first()


def create_itinerary(db: Session, username: str, data: dict) -> Itinerary:
    it = Itinerary(username=username, **data)
    db.add(it)
    db.commit()
    db.refresh(it)
    return it


def update_itinerary(db: Session, itinerary: Itinerary, data: dict) -> bool:
    for key in ("title", "destinations", "start_date", "end_date", "notes"):
        if key in data:
            setattr(itinerary, key, data[key])
    db.commit()
    db.refresh(itinerary)
    return True


def delete_itinerary(db: Session, itinerary: Itinerary) -> None:
    db.delete(itinerary)
    db.commit()


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------

def get_user_bookings(db: Session, username: str) -> list[Booking]:
    return (db.query(Booking)
            .filter(Booking.username == username)
            .order_by(Booking.created_at.desc())
            .all())


def get_booking(db: Session, booking_id: str) -> Booking | None:
    return db.query(Booking).filter(Booking.id == booking_id).first()


def create_booking(db: Session, username: str, data: dict) -> Booking:
    b = Booking(username=username, **data)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


def delete_booking(db: Session, booking: Booking) -> None:
    db.delete(booking)
    db.commit()


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

def get_all_reviews(db: Session) -> list[Review]:
    return db.query(Review).order_by(Review.created_at.desc()).all()


def get_reviews_for_destination(db: Session, destination_name: str) -> list[Review]:
    return (db.query(Review)
            .filter(Review.destination_name == destination_name)
            .order_by(Review.created_at.desc())
            .all())


def get_review(db: Session, review_id: str) -> Review | None:
    return db.query(Review).filter(Review.id == review_id).first()


def create_review(db: Session, username: str, data: dict) -> Review:
    r = Review(username=username, **data)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def update_review(db: Session, review: Review, data: dict) -> None:
    if "rating" in data and data["rating"] is not None:
        review.rating = data["rating"]
    if data.get("comment"):
        review.comment = data["comment"]
    db.commit()
    db.refresh(review)


def delete_review(db: Session, review: Review) -> None:
    db.delete(review)
    db.commit()


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------

def get_all_proposals(db: Session) -> list[Proposal]:
    return db.query(Proposal).order_by(Proposal.submitted_at.desc()).all()


def get_user_proposals(db: Session, username: str) -> list[Proposal]:
    return (db.query(Proposal)
            .filter(Proposal.submitted_by == username)
            .order_by(Proposal.submitted_at.desc())
            .all())


def get_proposal(db: Session, proposal_id: str) -> Proposal | None:
    return db.query(Proposal).filter(Proposal.id == proposal_id).first()


def create_proposal(db: Session, username: str, data: dict) -> Proposal:
    p = Proposal(submitted_by=username, **data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def update_proposal_status(db: Session, proposal: Proposal, status: str,
                           comment: str = "") -> None:
    proposal.status = status
    proposal.admin_comment = comment
    from datetime import datetime, timezone
    proposal.reviewed_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(proposal)


def delete_proposal(db: Session, proposal: Proposal) -> None:
    db.delete(proposal)
    db.commit()
