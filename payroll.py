from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_roles
from app import models, schemas
from app.services.payroll_calculator import calculate_payslip

router = APIRouter(prefix="/api/v1/hr/payroll", tags=["Payroll"])


@router.post("/generate/{employee_id}", response_model=schemas.PayslipOut, status_code=201)
def generate_payslip(
    employee_id: str,
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "hr"])),
):
    employee = db.get(models.Employee, employee_id)
    if not employee:
        raise HTTPException(404, "Employé introuvable")

    existing = db.query(models.Payslip).filter_by(
        employee_id=employee_id, period_month=month, period_year=year
    ).first()
    if existing:
        raise HTTPException(409, "Un bulletin existe déjà pour cette période")

    result = calculate_payslip(employee.base_salary)

    payslip = models.Payslip(
        employee_id=employee_id,
        period_month=month,
        period_year=year,
        **result,
    )
    db.add(payslip)
    db.commit()
    db.refresh(payslip)
    return payslip


@router.get("/{employee_id}", response_model=list[schemas.PayslipOut])
def list_payslips(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_roles(["admin", "hr"])),
):
    return db.query(models.Payslip).filter_by(employee_id=employee_id).all()
