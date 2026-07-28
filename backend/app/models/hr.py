from datetime import date
from sqlmodel import Field, SQLModel


class Position(SQLModel, table=True):
    __tablename__ = "position"

    position_id: int | None = Field(default=None, primary_key=True)
    title: str
    salary_grade: str
    department_id: int = Field(foreign_key="department.department_id", index=True)


class Employee(SQLModel, table=True):
    __tablename__ = "employee"

    employee_id: int | None = Field(default=None, primary_key=True)
    department_id: int = Field(foreign_key="department.department_id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)  # jointure fréquente avec User
    position_id: int = Field(foreign_key="position.position_id", index=True)
    hired_date: date
    employment_status: str


class Contract(SQLModel, table=True):
    __tablename__ = "contract"

    contract_id: int | None = Field(default=None, primary_key=True)
    salary: float
    contract_type: str
    start_date: date
    end_date: date | None = None
    employee_id: int = Field(foreign_key="employee.employee_id", index=True)


class LeaveType(SQLModel, table=True):
    __tablename__ = "leave_type"

    leave_type_id: int | None = Field(default=None, primary_key=True)
    name: str
    default_days: int


class LeaveRequest(SQLModel, table=True):
    __tablename__ = "leave_request"

    leave_request_id: int | None = Field(default=None, primary_key=True)
    start_date: date
    end_date: date
    status: str
    leave_type_id: int = Field(foreign_key="leave_type.leave_type_id", index=True)
    employee_id: int = Field(foreign_key="employee.employee_id", index=True)  # très recherché


class LeaveBalance(SQLModel, table=True):
    __tablename__ = "leave_balance"

    leave_balance_id: int | None = Field(default=None, primary_key=True)
    year: int
    days_remaining: int
    employee_id: int = Field(foreign_key="employee.employee_id", index=True)
    leave_type_id: int = Field(foreign_key="leave_type.leave_type_id", index=True)


class PerformanceReview(SQLModel, table=True):
    __tablename__ = "performance_review"

    perf_review_id: int | None = Field(default=None, primary_key=True)
    review_period: str
    score: float
    comments: str | None = None
    employee_id: int = Field(foreign_key="employee.employee_id", index=True)


class PayrollRun(SQLModel, table=True):
    __tablename__ = "payroll_run"

    payroll_id: int | None = Field(default=None, primary_key=True)
    period_month: int
    period_year: int


class Payslip(SQLModel, table=True):
    __tablename__ = "payslip"

    payslip_id: int | None = Field(default=None, primary_key=True)
    gross_salary: float
    deductions: float
    net_salary: float
    payroll_id: int = Field(foreign_key="payroll_run.payroll_id", index=True)
    employee_id: int = Field(foreign_key="employee.employee_id", index=True)  # recherche fiche de paie par employé


class Asset(SQLModel, table=True):
    __tablename__ = "asset"

    asset_id: int | None = Field(default=None, primary_key=True)
    name: str
    category: str
    location: str


class AssetAssignment(SQLModel, table=True):
    __tablename__ = "asset_assignment"

    assignment_id: int | None = Field(default=None, primary_key=True)
    assignment_date: date
    returned_date: date | None = None
    asset_id: int = Field(foreign_key="asset.asset_id", index=True)
    employee_id: int = Field(foreign_key="employee.employee_id", index=True)


class MaintenanceRequest(SQLModel, table=True):
    __tablename__ = "maintenance_request"

    maintenance_id: int | None = Field(default=None, primary_key=True)
    description: str
    status: str
    reported_date: date
    asset_id: int = Field(foreign_key="asset.asset_id", index=True)