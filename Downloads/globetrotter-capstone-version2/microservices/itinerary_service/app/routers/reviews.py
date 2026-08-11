"""Review routes (public reviews on destinations)."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_itinerary_db
from app import repositories
from app.schemas import ReviewIn, ReviewUpdate, Message
from shared.jwt_utils import HTTPBearer, decode_token

router = APIRouter(prefix="/reviews", tags=["Reviews"])
bearer = HTTPBearer(auto_error=False)


def _current_user(credentials) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        return decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


def serialize(r) -> dict:
    return {
        "id": r.id,
        "username": r.username,
        "destination_name": r.destination_name,
        "rating": r.rating,
        "comment": r.comment,
        "created_at": r.created_at,
        "updated_at": r.updated_at,
    }


@router.get("", response_model=list[dict], summary="List reviews")
def list_reviews(destination: Optional[str] = None,
                 db: Session = Depends(get_itinerary_db)):
    if destination:
        reviews = repositories.get_reviews_for_destination(db, destination)
    else:
        reviews = repositories.get_all_reviews(db)
    return [serialize(r) for r in reviews]


@router.post("", response_model=dict, status_code=201,
             summary="Create a review")
def create_review(body: ReviewIn, credentials=Depends(bearer),
                  db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    data = {"destination_name": body.destination_name, "rating": body.rating,
            "comment": body.comment.strip()}
    r = repositories.create_review(db, username, data)
    return serialize(r)


@router.put("/{review_id}", response_model=dict, summary="Edit a review")
def edit_review(review_id: str, body: ReviewUpdate,
                credentials=Depends(bearer),
                db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    r = repositories.get_review(db, review_id)
    if not r or (r.username != username and username != "admin"):
        raise HTTPException(status_code=404,
                            detail="Review not found or unauthorized")
    repositories.update_review(db, r, body.model_dump(exclude_unset=True))
    return serialize(r)


@router.delete("/{review_id}", response_model=Message,
               summary="Delete a review")
def delete_review(review_id: str, credentials=Depends(bearer),
                  db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    r = repositories.get_review(db, review_id)
    if not r or (r.username != username and username != "admin"):
        raise HTTPException(status_code=404,
                            detail="Review not found or unauthorized")
    repositories.delete_review(db, r)
    return {"message": "Review deleted"}
