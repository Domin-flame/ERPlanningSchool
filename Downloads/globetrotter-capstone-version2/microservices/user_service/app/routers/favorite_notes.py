"""UserService favorite-notes routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import repositories
from app.schemas import FavoriteNoteIn, Message
from shared.jwt_utils import HTTPBearer, decode_token

router = APIRouter(prefix="/favorite-notes", tags=["Favorite Notes"])
bearer = HTTPBearer(auto_error=False)


def _current_user(credentials) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        return decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


@router.get("", response_model=dict, summary="List all favorite notes")
def list_notes(credentials=Depends(bearer), db: Session = Depends(get_db)):
    username = _current_user(credentials)
    return repositories.get_notes(db, username)


@router.get("/{destination_name}", response_model=dict,
            summary="Get note for a destination")
def get_note(destination_name: str, credentials=Depends(bearer),
             db: Session = Depends(get_db)):
    username = _current_user(credentials)
    note = repositories.get_note(db, username, destination_name)
    return note or {}


@router.post("", response_model=Message, summary="Create/update a favorite note")
def save_note(body: FavoriteNoteIn, credentials=Depends(bearer),
              db: Session = Depends(get_db)):
    username = _current_user(credentials)
    data = {
        "note": body.note,
        "visit_date": body.visit_date,
        "companions": body.companions,
        "budget": body.budget,
    }
    repositories.save_note(db, username, body.destination_name, data)
    return {"message": "Note saved", "destination_name": body.destination_name}


@router.delete("/{destination_name}", response_model=Message,
               summary="Delete a favorite note")
def delete_note(destination_name: str, credentials=Depends(bearer),
                db: Session = Depends(get_db)):
    username = _current_user(credentials)
    repositories.delete_note(db, username, destination_name)
    return {"message": "Note deleted"}
