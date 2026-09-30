"""
scripts/seed_hr.py — Peuple hr-service avec des données de démonstration
cohérentes, via les modèles SQLAlchemy réels de l'app (app/models.py)
plutôt qu'un script SQL brut incompatible — voir docs/BUG_TRACKING.md #16.

Usage :
  docker compose exec hr-service python scripts/seed_hr.py
"""
from datetime import date, datetime

from app.database import SessionLocal
from app.models import Employee, LeaveBalance, LeaveRequest, LeaveStatus, LeaveType, Payslip
from app.services.payroll_calculator import calculate_payslip


def run():
    db = SessionLocal()
    try:
        if db.query(Employee).count() > 0:
            print("[seed_hr] Des données existent déjà — rien à faire.")
            return

        employee = Employee(
            auth_user_id="rh-demo-1",
            matricule="EMP-2026-001",
            first_name="Awa",
            last_name="Nkeng",
            email="rh@campus.edu",
            phone="+237600000002",
            department="RH",
            position="Responsable RH",
            hire_date=date(2024, 1, 15),
            base_salary=350000,
            cnps_number="CNPS-2026-001",
            is_active=True,
        )
        db.add(employee)
        db.flush()

        db.add(
            LeaveBalance(
                employee_id=employee.id,
                leave_type=LeaveType.ANNUAL,
                year=2026,
                days_allocated=30,
                days_used=5,
            )
        )

        db.add(
            LeaveRequest(
                employee_id=employee.id,
                leave_type=LeaveType.ANNUAL,
                start_date=date(2026, 8, 1),
                end_date=date(2026, 8, 5),
                reason="Congés annuels",
                status=LeaveStatus.APPROVED,
                approved_by="rh-demo-1",
            )
        )

        payslip_data = calculate_payslip(employee.base_salary)
        db.add(
            Payslip(
                employee_id=employee.id,
                period_month=9,
                period_year=2026,
                base_salary=payslip_data["base_salary"],
                cnps_employee=payslip_data["cnps_employee"],
                cnps_employer_total=payslip_data["cnps_employer_total"],
                cfc_employee=payslip_data["cfc_employee"],
                cfc_employer=payslip_data["cfc_employer"],
                fne_employer=payslip_data["fne_employer"],
                taxable_base=payslip_data["taxable_base"],
                irpp=payslip_data["irpp"],
                cac=payslip_data["cac"],
                total_employee_deductions=payslip_data["total_employee_deductions"],
                net_salary=payslip_data["net_salary"],
                total_employer_cost=payslip_data["total_employer_cost"],
                generated_at=datetime.utcnow(),
            )
        )

        db.commit()
        print("[seed_hr] Données de démonstration créées avec succès.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
