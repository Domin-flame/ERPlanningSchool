"""
Destination catalogue repository (destinations_db).
"""
from sqlalchemy.orm import Session

from app.destination_models import Destination


def get_all(db: Session) -> list[Destination]:
    return db.query(Destination).all()


def get_by_name(db: Session, name: str) -> Destination | None:
    return db.query(Destination).filter(Destination.name == name).first()


def add_destination(db: Session, data: dict) -> Destination:
    dest = Destination(**data)
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


def search(db: Session, q: str = "", tag: str = "", continent: str = "",
           max_cost=None) -> list[Destination]:
    query = db.query(Destination)
    results = query.all()

    q = q.lower().strip()
    tag = tag.lower().strip()
    continent = continent.lower().strip()

    filtered = []
    for dest in results:
        if q:
            searchable = " ".join([
                dest.name or "",
                dest.country or "",
                dest.description or "",
            ]).lower()
            if q not in searchable:
                continue
        if tag and tag not in [t.lower() for t in (dest.tags or [])]:
            continue
        if continent and continent != (dest.continent or "").lower():
            continue
        if max_cost is not None:
            cost = dest.avg_cost_per_day
            if cost is None or cost > max_cost:
                continue
        filtered.append(dest)
    return filtered
