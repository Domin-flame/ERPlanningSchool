"""UserService visited-destinations routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import repositories
from app.schemas import VisitedAdd, Message
from shared.jwt_utils import HTTPBearer, decode_token

router = APIRouter(prefix="/visited", tags=["Visited"])
bearer = HTTPBearer(auto_error=False)


def _current_user(credentials) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        return decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


@router.get("", response_model=list[str], summary="List visited destinations")
def list_visited(credentials=Depends(bearer), db: Session = Depends(get_db)):
    username = _current_user(credentials)
    return repositories.get_visited(db, username)


@router.post("", response_model=Message, status_code=200,
             summary="Mark a destination as visited")
def mark_visited(body: VisitedAdd, credentials=Depends(bearer),
                 db: Session = Depends(get_db)):
    username = _current_user(credentials)
    repositories.add_visited(db, username, body.destination_name)
    return {"message": "Destination marked as visited",
            "destination_name": body.destination_name}


@router.delete("/{destination_name}", response_model=Message,
               summary="Remove a destination from visited")
def unmark_visited(destination_name: str, credentials=Depends(bearer),
                   db: Session = Depends(get_db)):
    username = _current_user(credentials)
    repositories.remove_visited(db, username, destination_name)
    return {"message": "Destination removed from visited"}
