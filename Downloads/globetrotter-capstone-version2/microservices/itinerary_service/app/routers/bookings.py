"""Booking routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_itinerary_db
from app import repositories
from app.schemas import BookingIn, Message
from shared.jwt_utils import HTTPBearer, decode_token

router = APIRouter(prefix="/bookings", tags=["Bookings"])
bearer = HTTPBearer(auto_error=False)


def _current_user(credentials) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        return decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


def serialize(b) -> dict:
    return {
        "id": b.id,
        "username": b.username,
        "itinerary_id": b.itinerary_id,
        "destination_name": b.destination_name,
        "booking_date": b.booking_date,
        "status": b.status,
        "details": b.details,
        "created_at": b.created_at,
    }


@router.get("", response_model=list[dict], summary="List my bookings")
def list_bookings(credentials=Depends(bearer),
                  db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    return [serialize(b) for b in repositories.get_user_bookings(db, username)]


@router.post("", response_model=dict, status_code=201,
             summary="Create a booking")
def create_booking(body: BookingIn, credentials=Depends(bearer),
                   db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    data = {"destination_name": body.destination_name,
            "itinerary_id": body.itinerary_id,
            "booking_date": body.booking_date,
            "details": body.details}
    b = repositories.create_booking(db, username, data)
    return serialize(b)


@router.delete("/{booking_id}", response_model=Message,
               summary="Delete a booking")
def delete_booking(booking_id: str, credentials=Depends(bearer),
                   db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    b = repositories.get_booking(db, booking_id)
    if not b or (b.username != username and username != "admin"):
        raise HTTPException(status_code=404,
                            detail="Booking not found or unauthorized")
    repositories.delete_booking(db, b)
    return {"message": "Booking deleted"}
