from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_roles, get_current_user
from app import models, schemas
from app.services.qr_service import generate_attendance_qr, validate_qr_token

router = APIRouter(prefix="/api/v1/hr/attendance", tags=["Attendance"])


@router.get("/qr/{employee_id}")
def get_attendance_qr(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    employee = db.get(models.Employee, employee_id)
    if not employee:
        raise HTTPException(404, "Employé introuvable")
    if user.role.lower() not in ("super admin", "admin", "staff") and employee.auth_user_id != user.sub:
        raise HTTPException(403, "Accès non autorisé")

    qr_image_base64 = generate_attendance_qr(employee_id)
    return {"employee_id": employee_id, "qr_code_png_base64": qr_image_base64}


@router.post("/scan", response_model=schemas.AttendanceOut)
def scan_qr(
    data: schemas.QRScanRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        employee_id = validate_qr_token(data.qr_token)
    except ValueError as e:
        raise HTTPException(400, str(e))

    today = date.today()
    record = db.query(models.Attendance).filter_by(
        employee_id=employee_id, date=today
    ).first()

    now = datetime.utcnow()
    if record is None:
        # Premier scan du jour = check-in
        record = models.Attendance(employee_id=employee_id, date=today, check_in_time=now)
        db.add(record)
    elif record.check_out_time is None:
        # Deuxième scan du jour = check-out
        record.check_out_time = now
    else:
        raise HTTPException(400, "Pointage déjà complet pour aujourd'hui (entrée et sortie enregistrées)")

    db.commit()
    db.refresh(record)
    return record


@router.get("/{employee_id}", response_model=list[schemas.AttendanceOut])
def get_attendance_history(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.lower() not in ("super admin", "admin", "staff"):
        employee = db.get(models.Employee, employee_id)
        if not employee or employee.auth_user_id != user.sub:
            raise HTTPException(403, "Accès non autorisé")
    return db.query(models.Attendance).filter_by(employee_id=employee_id).all()
