"""
UserService repositories.

Data-access layer: separates SQLAlchemy queries from business logic.
"""
from sqlalchemy.orm import Session

from app.models import User, VisitedDestination, FavoriteNote


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_all_users(db: Session) -> list[User]:
    return db.query(User).all()


def create_user(db: Session, username: str, password_hash: str,
                preferences: list) -> User:
    user = User(username=username, password_hash=password_hash,
                preferences=preferences)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(db: Session, user: User, data: dict) -> User:
    if "preferences" in data and isinstance(data["preferences"], list):
        user.preferences = data["preferences"]
    if "avatar" in data:
        user.avatar = data["avatar"]
    if "password" in data and data["password"]:
        from werkzeug.security import generate_password_hash
        user.password_hash = generate_password_hash(data["password"])
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Visited destinations
# ---------------------------------------------------------------------------

def get_visited(db: Session, username: str) -> list[str]:
    rows = (db.query(VisitedDestination)
            .filter(VisitedDestination.username == username).all())
    return [r.destination_name for r in rows]


def add_visited(db: Session, username: str, destination_name: str) -> None:
    existing = (db.query(VisitedDestination)
                .filter(VisitedDestination.username == username,
                        VisitedDestination.destination_name == destination_name)
                .first())
    if not existing:
        db.add(VisitedDestination(username=username,
                                  destination_name=destination_name))
        db.commit()


def remove_visited(db: Session, username: str, destination_name: str) -> None:
    rows = (db.query(VisitedDestination)
            .filter(VisitedDestination.username == username,
                    VisitedDestination.destination_name == destination_name)
            .all())
    for r in rows:
        db.delete(r)
    db.commit()


# ---------------------------------------------------------------------------
# Favorite notes
# ---------------------------------------------------------------------------

def get_notes(db: Session, username: str) -> dict:
    rows = (db.query(FavoriteNote)
            .filter(FavoriteNote.username == username).all())
    result = {}
    for r in rows:
        result[r.destination_name] = {
            "note": r.note,
            "visit_date": r.visit_date,
            "companions": r.companions,
            "budget": r.budget,
            "updated_at": r.updated_at,
        }
    return result


def _find_note(db: Session, username: str, destination_name: str):
    return (db.query(FavoriteNote)
            .filter(FavoriteNote.username == username,
                    FavoriteNote.destination_name == destination_name)
            .first())


def get_note(db: Session, username: str, destination_name: str) -> dict | None:
    row = _find_note(db, username, destination_name)
    if not row:
        return None
    return {
        "note": row.note,
        "visit_date": row.visit_date,
        "companions": row.companions,
        "budget": row.budget,
        "updated_at": row.updated_at,
    }


def save_note(db: Session, username: str, destination_name: str, data: dict) -> None:
    row = _find_note(db, username, destination_name)
    if row:
        row.note = data.get("note", row.note)
        row.visit_date = data.get("visit_date", row.visit_date)
        row.companions = data.get("companions", row.companions)
        row.budget = data.get("budget", row.budget)
    else:
        db.add(FavoriteNote(username=username,
                            destination_name=destination_name,
                            note=data.get("note", ""),
                            visit_date=data.get("visit_date"),
                            companions=data.get("companions", ""),
                            budget=data.get("budget")))
    db.commit()


def delete_note(db: Session, username: str, destination_name: str) -> None:
    rows = (db.query(FavoriteNote)
            .filter(FavoriteNote.username == username,
                    FavoriteNote.destination_name == destination_name).all())
    for r in rows:
        db.delete(r)
    db.commit()
