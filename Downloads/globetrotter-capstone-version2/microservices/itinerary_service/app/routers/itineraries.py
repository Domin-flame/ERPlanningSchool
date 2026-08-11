"""Itinerary CRUD + sharing routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_itinerary_db
from app import services, repositories
from app.schemas import ItineraryIn, ItineraryOut, Message
from shared.jwt_utils import HTTPBearer, decode_token

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])
bearer = HTTPBearer(auto_error=False)


def _current_user(credentials) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        return decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


@router.get("", response_model=list[ItineraryOut],
            summary="List my itineraries")
def list_itineraries(credentials=Depends(bearer),
                     db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    items = repositories.get_user_itineraries(db, username)
    return [services.serialize_itinerary(it) for it in items]


@router.post("", response_model=ItineraryOut, status_code=201,
             summary="Create an itinerary")
def create_itinerary(body: ItineraryIn, credentials=Depends(bearer),
                     db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    return services.create_itinerary(db, username, body.model_dump())


@router.get("/shared/{token}", response_model=ItineraryOut,
            summary="View an itinerary via public share link")
def get_shared(token: str, db: Session = Depends(get_itinerary_db)):
    item = services.get_shared(db, token)
    if not item:
        raise HTTPException(status_code=404, detail="Shared itinerary not found")
    return item


@router.put("/{itinerary_id}", response_model=ItineraryOut,
            summary="Update an itinerary")
def update_itinerary(itinerary_id: str, body: ItineraryIn,
                     credentials=Depends(bearer),
                     db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    result = services.update_itinerary(
        db, itinerary_id, username, body.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(status_code=404,
                            detail="Itinerary not found or unauthorized")
    return result


@router.delete("/{itinerary_id}", response_model=Message,
               summary="Delete an itinerary")
def delete_itinerary(itinerary_id: str, credentials=Depends(bearer),
                     db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    ok = services.delete_itinerary(db, itinerary_id, username)
    if not ok:
        raise HTTPException(status_code=404,
                            detail="Itinerary not found or unauthorized")
    return {"message": "Itinerary deleted successfully"}
