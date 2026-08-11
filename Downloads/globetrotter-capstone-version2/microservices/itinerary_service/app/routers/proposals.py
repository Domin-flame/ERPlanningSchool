"""Proposal routes (user submissions + admin review)."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_itinerary_db, get_destinations_db
from app import repositories, destination_repository, services
from app.schemas import ProposalIn, AdminComment, Message
from shared.jwt_utils import HTTPBearer, decode_token

router = APIRouter(tags=["Proposals"])
bearer = HTTPBearer(auto_error=False)

ADMIN = "admin"


def _current_user(credentials) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        return decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


def _require_admin(credentials) -> str:
    username = _current_user(credentials)
    if username != ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return username


def serialize_proposal(p) -> dict:
    return {
        "id": p.id,
        "submitted_by": p.submitted_by,
        "status": p.status,
        "name": p.name,
        "country": p.country,
        "continent": p.continent,
        "city": p.city,
        "description": p.description,
        "tags": p.tags or [],
        "avg_cost_per_day": p.avg_cost_per_day or 0,
        "image": p.image,
        "submitted_at": p.submitted_at,
        "reviewed_at": p.reviewed_at,
        "admin_comment": p.admin_comment,
    }


# ---------------------------------------------------------------------------
# USER ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/proposals", response_model=list[dict],
            summary="List my proposals")
def list_my_proposals(credentials=Depends(bearer),
                      db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    items = repositories.get_user_proposals(db, username)
    return [serialize_proposal(p) for p in items]


@router.post("/proposals", response_model=dict, status_code=201,
             summary="Submit a destination proposal")
def submit_proposal(body: ProposalIn, credentials=Depends(bearer),
                    db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    data = body.model_dump()
    data["status"] = "pending"
    p = repositories.create_proposal(db, username, data)
    return {"message": "Proposal submitted successfully. It will be reviewed "
                       "by an administrator.",
            "proposal": serialize_proposal(p)}


@router.delete("/proposals/{proposal_id}", response_model=Message,
               summary="Delete my proposal")
def delete_proposal(proposal_id: str, credentials=Depends(bearer),
                    db: Session = Depends(get_itinerary_db)):
    username = _current_user(credentials)
    p = repositories.get_proposal(db, proposal_id)
    if not p or (p.submitted_by != username and username != ADMIN):
        raise HTTPException(status_code=404,
                            detail="Proposal not found or unauthorized")
    repositories.delete_proposal(db, p)
    return {"message": "Proposal deleted successfully"}


# ---------------------------------------------------------------------------
# ADMIN ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/admin/proposals", response_model=list[dict],
            summary="[Admin] List all proposals")
def list_all_proposals(status: Optional[str] = None,
                       credentials=Depends(bearer),
                       db: Session = Depends(get_itinerary_db)):
    _require_admin(credentials)
    proposals = repositories.get_all_proposals(db)
    if status:
        proposals = [p for p in proposals if p.status == status]
    return [serialize_proposal(p) for p in proposals]


@router.post("/admin/proposals/{proposal_id}/approve", response_model=dict,
             summary="[Admin] Approve a proposal")
def approve_proposal(proposal_id: str, body: AdminComment,
                     credentials=Depends(bearer),
                     db: Session = Depends(get_itinerary_db),
                     ddb: Session = Depends(get_destinations_db)):
    _require_admin(credentials)
    p = repositories.get_proposal(db, proposal_id)
    if not p or p.status != "pending":
        raise HTTPException(status_code=404,
                            detail="Proposal not found or already reviewed")
    repositories.update_proposal_status(db, p, "approved", body.comment)
    # Add to destinations catalogue
    dest_data = {
        "id": "prop_" + p.id,
        "name": p.name,
        "name_en": p.name,
        "name_fr": p.name,
        "country": p.country,
        "continent": p.continent,
        "city": p.city,
        "description": p.description,
        "tags": p.tags or [],
        "avg_cost_per_day": p.avg_cost_per_day or 0,
        "image": p.image or "placeholder.jpg",
        "category": "proposal",
    }
    destination_repository.add_destination(ddb, dest_data)
    return {"message": "Proposal approved and added to destinations",
            "proposal_id": proposal_id}


@router.post("/admin/proposals/{proposal_id}/reject", response_model=dict,
             summary="[Admin] Reject a proposal")
def reject_proposal(proposal_id: str, body: AdminComment,
                    credentials=Depends(bearer),
                    db: Session = Depends(get_itinerary_db)):
    _require_admin(credentials)
    p = repositories.get_proposal(db, proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    repositories.update_proposal_status(db, p, "rejected", body.comment)
    return {"message": "Proposal rejected", "proposal_id": proposal_id}


@router.get("/admin/stats", response_model=dict, summary="[Admin] System stats")
def admin_stats(credentials=Depends(bearer),
                db: Session = Depends(get_itinerary_db),
                ddb: Session = Depends(get_destinations_db)):
    _require_admin(credentials)
    return services.get_stats(db, ddb)


@router.get("/admin/users", response_model=list[dict],
            summary="[Admin] List registered users")
def admin_users(credentials=Depends(bearer),
                db: Session = Depends(get_itinerary_db)):
    _require_admin(credentials)
    # ItineraryService does not own user data; return proposals authors as a
    # lightweight aggregation for the admin dashboard.
    proposals = repositories.get_all_proposals(db)
    authors = sorted({p.submitted_by for p in proposals})
    return [{"username": u} for u in authors]


@router.post("/admin/destinations", response_model=dict, status_code=201,
             summary="[Admin] Add a custom destination")
def admin_add_destination(body: dict, credentials=Depends(bearer),
                          ddb: Session = Depends(get_destinations_db)):
    _require_admin(credentials)
    name = body.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    dest_data = {
        "name": name.strip(),
        "name_en": name.strip(),
        "name_fr": name.strip(),
        "country": body.get("country", "Cameroun").strip(),
        "continent": body.get("continent", "Afrique").strip(),
        "city": body.get("city", "Yaoundé").strip(),
        "description": body.get("description", "").strip(),
        "tags": body.get("tags", []),
        "avg_cost_per_day": float(body.get("avg_cost_per_day", 50)),
        "image": body.get("image", "g1.jpg"),
        "category": body.get("category", "custom"),
    }
    dest = destination_repository.add_destination(ddb, dest_data)
    return {"message": "Destination added successfully",
            "destination": {
                "id": dest.id,
                "name": dest.name,
                "country": dest.country,
                "continent": dest.continent,
                "city": dest.city,
                "description": dest.description,
                "tags": dest.tags or [],
                "avg_cost_per_day": dest.avg_cost_per_day or 0,
                "image": dest.image,
            }}
