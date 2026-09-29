import enum
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Integer, Float, Date, DateTime, ForeignKey,
    Enum, Boolean, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class LeaveType(str, enum.Enum):
    ANNUAL = "annual"          # congé annuel
    SICK = "sick"               # congé maladie
    MATERNITY = "maternity"     # congé maternité
    UNPAID = "unpaid"           # sans solde


class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Employee(Base):
    """Table principale RH. Le champ auth_user_id relie cet employé
    au compte créé par le service Auth (Week 1) — l'identité/le login
    reste géré par Auth, ce service ne gère QUE les données RH."""
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    auth_user_id = Column(String(64), unique=True, nullable=False, index=True)
    matricule = Column(String(20), unique=True, nullable=False, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    department = Column(String(80), nullable=False)   # ex: Academic, Finance, HR, IT
    position = Column(String(80), nullable=False)      # ex: Comptable, Enseignant
    hire_date = Column(Date, nullable=False)
    base_salary = Column(Float, nullable=False)         # salaire brut mensuel (XAF)
    cnps_number = Column(String(30), unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    leave_requests = relationship("LeaveRequest", back_populates="employee")
    leave_balances = relationship("LeaveBalance", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")
    payslips = relationship("Payslip", back_populates="employee")


class LeaveBalance(Base):
    """Solde de congés par employé, par type, par année.
    Séparée de Employee pour respecter la 3NF (pas de colonnes répétées
    par type de congé dans la table employee)."""
    __tablename__ = "leave_balances"
    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type", "year", name="uq_leave_balance"),
    )

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    employee_id = Column(UUID(as_uuid=False), ForeignKey("employees.id"), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    year = Column(Integer, nullable=False)
    days_allocated = Column(Float, nullable=False, default=0)
    days_used = Column(Float, nullable=False, default=0)

    employee = relationship("Employee", back_populates="leave_balances")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    employee_id = Column(UUID(as_uuid=False), ForeignKey("employees.id"), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    approved_by = Column(String(64), nullable=True)  # auth_user_id de l'admin qui a validé
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="leave_requests")


class Attendance(Base):
    """Une ligne = un pointage (entrée ou sortie) via QR code."""
    __tablename__ = "attendance"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    employee_id = Column(UUID(as_uuid=False), ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    method = Column(String(20), default="qr")

    employee = relationship("Employee", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_attendance_per_day"),
    )


class Payslip(Base):
    """Bulletin de paie généré pour un employé / un mois donné.
    Stocke le résultat du calcul CNPS/PAYE pour traçabilité et audit."""
    __tablename__ = "payslips"
    __table_args__ = (
        UniqueConstraint("employee_id", "period_month", "period_year", name="uq_payslip_period"),
    )

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    employee_id = Column(UUID(as_uuid=False), ForeignKey("employees.id"), nullable=False, index=True)
    period_month = Column(Integer, nullable=False)  # 1-12
    period_year = Column(Integer, nullable=False)

    base_salary = Column(Float, nullable=False)

    cnps_employee = Column(Float, nullable=False)
    cnps_employer_total = Column(Float, nullable=False)
    cfc_employee = Column(Float, nullable=False)
    cfc_employer = Column(Float, nullable=False)
    fne_employer = Column(Float, nullable=False)

    taxable_base = Column(Float, nullable=False)
    irpp = Column(Float, nullable=False)
    cac = Column(Float, nullable=False)

    total_employee_deductions = Column(Float, nullable=False)
    net_salary = Column(Float, nullable=False)
    total_employer_cost = Column(Float, nullable=False)

    generated_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="payslips")
