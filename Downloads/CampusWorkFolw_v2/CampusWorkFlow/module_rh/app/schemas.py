"""Schémas Pydantic (payload / réponses) du service RH."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models import LeaveStatus, LeaveType


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------
class EmployeeCreate(BaseModel):
    auth_user_id: str
    matricule: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    department: str
    position: str
    hire_date: date
    base_salary: float
    cnps_number: Optional[str] = None


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    auth_user_id: str
    matricule: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    department: str
    position: str
    hire_date: date
    base_salary: float
    cnps_number: Optional[str] = None
    is_active: bool
    created_at: datetime


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[date] = None
    base_salary: Optional[float] = None
    cnps_number: Optional[str] = None


# ---------------------------------------------------------------------------
# Leave
# ---------------------------------------------------------------------------
class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: LeaveStatus
    approved_by: Optional[str] = None
    created_at: datetime


class LeaveDecision(BaseModel):
    approve: bool


# ---------------------------------------------------------------------------
# Attendance
# ---------------------------------------------------------------------------
class QRScanRequest(BaseModel):
    qr_token: str


class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    method: str


# ---------------------------------------------------------------------------
# Payroll
# ---------------------------------------------------------------------------
class PayslipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    period_month: int
    period_year: int
    base_salary: float
    cnps_employee: float
    cnps_employer_total: float
    cfc_employee: float
    cfc_employer: float
    fne_employer: float
    taxable_base: float
    irpp: float
    cac: float
    total_employee_deductions: float
    net_salary: float
    total_employer_cost: float
    generated_at: datetime
