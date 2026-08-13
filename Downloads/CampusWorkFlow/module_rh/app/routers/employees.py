from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_roles, get_current_user, HR_ADMIN_ROLES, HR_READ_ROLES
from app import models, schemas

router = APIRouter(prefix="/api/v1/hr/employees", tags=["Employees"])


@router.post("/", response_model=schemas.EmployeeOut, status_code=201)
def create_employee(
    data: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles(list(HR_ADMIN_ROLES))),
):
    existing = db.query(models.Employee).filter(
        (models.Employee.email == data.email)
        | (models.Employee.matricule == data.matricule)
    ).first()
    if existing:
        raise HTTPException(409, "Un employé avec cet email ou matricule existe déjà")

    employee = models.Employee(**data.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/", response_model=list[schemas.EmployeeOut])
def list_employees(
    department: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles(list(HR_READ_ROLES))),
):
    query = db.query(models.Employee)
    if department:
        query = query.filter(models.Employee.department == department)
    return query.all()


@router.get("/{employee_id}", response_model=schemas.EmployeeOut)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    employee = db.get(models.Employee, employee_id)
    if not employee:
        raise HTTPException(404, "Employé introuvable")
    # Un employé peut voir sa propre fiche ; rh/academic voient tout le monde
    if user.role not in HR_READ_ROLES and str(employee.auth_user_id) != str(user.user_id):
        raise HTTPException(403, "Accès non autorisé à cette fiche")
    return employee


@router.delete("/{employee_id}", status_code=204)
def deactivate_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_roles(list(HR_ADMIN_ROLES))),
):
    employee = db.get(models.Employee, employee_id)
    if not employee:
        raise HTTPException(404, "Employé introuvable")
    employee.is_active = False
    db.commit()
