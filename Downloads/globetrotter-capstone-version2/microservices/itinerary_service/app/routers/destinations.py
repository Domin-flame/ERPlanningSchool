"""Destination search + admin add routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_destinations_db
from app import destination_repository
from app.schemas import DestinationOut
from shared.jwt_utils import HTTPBearer, decode_token

router = APIRouter(prefix="/destinations", tags=["Destinations"])
bearer = HTTPBearer(auto_error=False)


def serialize(dest) -> dict:
    return {
        "id": dest.id,
        "name": dest.name,
        "country": dest.country or "",
        "continent": dest.continent or "",
        "city": dest.city or "",
        "description": dest.description or "",
        "tags": dest.tags or [],
        "avg_cost_per_day": dest.avg_cost_per_day or 0,
        "image": dest.image or "g1.jpg",
        "rating": dest.rating or 4.0,
        "category": dest.category or "",
    }


@router.get("", response_model=list[DestinationOut],
            summary="Search destinations")
def search_destinations(
    q: Optional[str] = "",
    tag: Optional[str] = "",
    continent: Optional[str] = "",
    max_cost: Optional[int] = None,
    db: Session = Depends(get_destinations_db),
):
    results = destination_repository.search(
        db, q or "", tag or "", continent or "", max_cost
    )
    return [serialize(d) for d in results]


@router.get("/internal", response_model=list[DestinationOut],
            summary="[Internal] Full catalogue for RecommendationService")
def internal_all(db: Session = Depends(get_destinations_db)):
    results = destination_repository.get_all(db)
    return [serialize(d) for d in results]


@router.post("", status_code=201, summary="[Admin] Add a destination",
             response_model=DestinationOut)
def admin_add(body: dict, credentials=Depends(bearer),
              db: Session = Depends(get_destinations_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        username = decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    if username != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    name = body.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    dest = destination_repository.add_destination(db, body)
    return serialize(dest)
