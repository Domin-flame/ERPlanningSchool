from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models import LeaveType, LeaveStatus


# ---------------- Employee ----------------
class EmployeeCreate(BaseModel):
    auth_user_id: str
    matricule: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department: str
    position: str
    hire_date: date
    base_salary: float
    cnps_number: Optional[str] = None


class EmployeeOut(BaseModel):
    id: str
    matricule: str
    first_name: str
    last_name: str
    email: EmailStr
    department: str
    position: str
    hire_date: date
    base_salary: float
    is_active: bool

    class Config:
        from_attributes = True


# ---------------- Leave ----------------
class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveRequestOut(BaseModel):
    id: str
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    status: LeaveStatus
    reason: Optional[str]

    class Config:
        from_attributes = True


class LeaveDecision(BaseModel):
    approve: bool  # True = approuver, False = rejeter


# ---------------- Attendance / QR ----------------
class QRScanRequest(BaseModel):
    qr_token: str  # contenu décodé du QR code scanné


class AttendanceOut(BaseModel):
    id: str
    employee_id: str
    date: date
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]

    class Config:
        from_attributes = True


# ---------------- Payroll ----------------
class PayslipOut(BaseModel):
    id: str
    employee_id: str
    period_month: int
    period_year: int
    base_salary: float
    cnps_employee: float
    cfc_employee: float
    irpp: float
    cac: float
    total_employee_deductions: float
    net_salary: float
    total_employer_cost: float

    class Config:
        from_attributes = True
