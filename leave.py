from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_roles, get_current_user
from app import models, schemas

router = APIRouter(prefix="/api/v1/hr/leave", tags=["Leave"])


@router.post("/requests", response_model=schemas.LeaveRequestOut, status_code=201)
def request_leave(
    data: schemas.LeaveRequestCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    employee = db.get(models.Employee, data.employee_id)
    if not employee:
        raise HTTPException(404, "Employé introuvable")
    if user.role not in ("admin", "hr") and employee.auth_user_id != user.sub:
        raise HTTPException(403, "Vous ne pouvez demander un congé que pour vous-même")
    if data.end_date < data.start_date:
        raise HTTPException(400, "La date de fin doit être après la date de début")

    leave_req = models.LeaveRequest(**data.model_dump())
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)
    return leave_req


@router.get("/requests", response_model=list[schemas.LeaveRequestOut])
def list_leave_requests(
    status_filter: models.LeaveStatus | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "hr"])),
):
    query = db.query(models.LeaveRequest)
    if status_filter:
        query = query.filter(models.LeaveRequest.status == status_filter)
    return query.all()


@router.patch("/requests/{request_id}", response_model=schemas.LeaveRequestOut)
def decide_leave_request(
    request_id: str,
    decision: schemas.LeaveDecision,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "hr"])),
):
    leave_req = db.get(models.LeaveRequest, request_id)
    if not leave_req:
        raise HTTPException(404, "Demande introuvable")
    if leave_req.status != models.LeaveStatus.PENDING:
        raise HTTPException(400, "Cette demande a déjà été traitée")

    if decision.approve:
        leave_req.status = models.LeaveStatus.APPROVED
        days = (leave_req.end_date - leave_req.start_date).days + 1

        balance = db.query(models.LeaveBalance).filter_by(
            employee_id=leave_req.employee_id,
            leave_type=leave_req.leave_type,
            year=leave_req.start_date.year,
        ).first()
        if balance:
            balance.days_used += days
    else:
        leave_req.status = models.LeaveStatus.REJECTED

    leave_req.approved_by = user.sub
    db.commit()
    db.refresh(leave_req)
    return leave_req
