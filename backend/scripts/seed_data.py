"""
Script de peuplement de la base PostgreSQL — Academic + HR + Finance (Semaine 2).

Installation :
    pip install faker sqlmodel psycopg2-binary --break-system-packages

Utilisation :
    export DATABASE_URL="postgresql://user:password@localhost:5432/erp_db"
    python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import random
from datetime import date, timedelta

from faker import Faker
from sqlmodel import SQLModel, Session, create_engine

# Adaptez ces imports au chemin réel de vos modèles dans le repo
from app.models.shared import User, UserRole
from app.models.academic import Student, Program, Department, Faculty
from app.models.hr import Employee, Position
from app.models.finance import FeeStructure, Invoice, Payment

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/erp_db"
)
NB_STUDENTS = 5000
NB_EMPLOYEES = 2000
NB_INVOICES_PER_STUDENT = 2   # -> ~10 000 factures, ~7 500 paiements (75% payées)

fake = Faker()
engine = create_engine(DATABASE_URL, echo=False)


def seed():
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # --- Données de base indispensables (FK) ---
        faculty = Faculty(name="Faculty of ICT")
        session.add(faculty)
        session.commit()
        session.refresh(faculty)

        department = Department(name="Software Engineering", faculty_id=faculty.faculty_id)
        session.add(department)
        session.commit()
        session.refresh(department)

        program = Program(name="Software Engineering", level="L2", department_id=department.department_id)
        session.add(program)
        session.commit()
        session.refresh(program)

        position = Position(title="Developer", salary_grade="A", department_id=department.department_id)
        session.add(position)
        session.commit()
        session.refresh(position)

        fee_structure = FeeStructure(academic_year="2026-2027", tuition_amount=450000)
        session.add(fee_structure)
        session.commit()
        session.refresh(fee_structure)

        # --- Students + leurs factures/paiements ---
        print(f"Seeding {NB_STUDENTS} students (+ invoices + payments)...")
        for i in range(NB_STUDENTS):
            user = User(
                name=fake.name(),
                email=f"student{i}_{fake.user_name()}@ictu.cm",
                hashed_password="not_a_real_hash",
                role=UserRole.student,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            student = Student(
                matricule=f"ICTU{2026}{i:05d}",
                enrollment_date=date(2026, 9, 1),
                status="active",
                program_id=program.program_id,
                user_id=user.id,
            )
            session.add(student)
            session.commit()
            session.refresh(student)

            for _ in range(NB_INVOICES_PER_STUDENT):
                issue = date.today() - timedelta(days=random.randint(1, 300))
                invoice = Invoice(
                    issue_date=issue,
                    due_date=issue + timedelta(days=30),
                    status=random.choice(["paid", "paid", "paid", "pending"]),  # ~75% payées
                    fee_structure_id=fee_structure.fee_structure_id,
                    student_id=student.student_id,
                )
                session.add(invoice)
                session.commit()
                session.refresh(invoice)

                if invoice.status == "paid":
                    payment = Payment(
                        amount_paid=fee_structure.tuition_amount,
                        payment_date=invoice.issue_date + timedelta(days=random.randint(0, 15)),
                        payment_method=random.choice(["mobile_money", "bank_transfer", "cash"]),
                        transaction_ref=f"TXN-{i:05d}-{invoice.invoice_id}",
                        invoice_id=invoice.invoice_id,
                    )
                    session.add(payment)

            if i % 500 == 0:
                session.commit()
                print(f"  {i}/{NB_STUDENTS}")
        session.commit()

        # --- Employees ---
        print(f"Seeding {NB_EMPLOYEES} employees...")
        for i in range(NB_EMPLOYEES):
            user = User(
                name=fake.name(),
                email=f"staff{i}_{fake.user_name()}@ictu.cm",
                hashed_password="not_a_real_hash",
                role=UserRole.admin,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            employee = Employee(
                department_id=department.department_id,
                user_id=user.id,
                position_id=position.position_id,
                hired_date=date.today() - timedelta(days=random.randint(30, 3000)),
                employment_status="active",
            )
            session.add(employee)

            if i % 500 == 0:
                session.commit()
                print(f"  {i}/{NB_EMPLOYEES}")
        session.commit()

    print("Terminé. Lancez maintenant ANALYZE en base, puis test_indexes.sql :")
    print("  psql $DATABASE_URL -c 'ANALYZE;'")


if __name__ == "__main__":
    seed()