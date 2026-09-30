"""
scripts/seed_academic.py — Peuple academic-service avec des données de
démonstration cohérentes, via les MODÈLES SQLAlchemy réels de l'app
(app/models.py) plutôt qu'un script SQL brut.

Pourquoi ce script existe : l'ancien fichier `postgres/academic_schema_tables.sql`
créait un schéma "academic" avec des tables au singulier (Course, Student...)
qui ne correspondent PAS aux tables réellement utilisées par ce service
(schéma "public", tables au pluriel : courses, students...) — voir
docs/BUG_TRACKING.md #16. Ce script cible donc directement les VRAIES
tables, garantissant la cohérence par construction.

Usage :
  docker compose exec academic-service python scripts/seed_academic.py
"""
from datetime import date, time

from app.database import SessionLocal
from app.models import (
    AcademicYear,
    Building,
    Campus,
    Course,
    CourseOffering,
    Department,
    Enrollment,
    Faculty,
    Group,
    ModuleUE,
    Programs,
    Room,
    Semester,
    Student,
    Teacher,
    User,
)


def run():
    db = SessionLocal()
    try:
        if db.query(Faculty).count() > 0:
            print("[seed_academic] Des données existent déjà — rien à faire.")
            return

        faculty = Faculty(name="Faculté des Sciences et Technologies", code="FST")
        db.add(faculty)
        db.flush()

        dept = Department(name="Génie Logiciel", faculty_id=faculty.faculty_id)
        db.add(dept)
        db.flush()

        program = Programs(name="Bachelor Génie Logiciel", level="Licence", department_id=dept.department_id)
        db.add(program)
        db.flush()

        module = ModuleUE(code="UE-ALGO1", title="Algorithmique et Structures de Données", credits_ects=6)
        db.add(module)
        db.flush()
        db.add(Group(program_id=program.program_id, module_id=module.module_id))

        course = Course(code="CS201", title="Algorithmique Avancée", credits=6, module_id=module.module_id)
        db.add(course)
        db.flush()

        year = AcademicYear(start_date=date(2026, 9, 1), end_date=date(2027, 7, 31), year_label="2026-2027")
        db.add(year)
        db.flush()

        semester = Semester(
            term_name="Semestre 1",
            start_date=date(2026, 9, 1),
            end_date=date(2027, 1, 15),
            is_locked=False,
            academic_year_id=year.academic_year_id,
        )
        db.add(semester)
        db.flush()

        campus = Campus(name="Campus Principal", city="Yaoundé", adress="Rue de l'Université")
        db.add(campus)
        db.flush()
        building = Building(name="Bâtiment A", code="A", campus_id=campus.campus_id)
        db.add(building)
        db.flush()
        db.add(Room(room_number="A101", capacity=60, room_type="Amphithéâtre", building_id=building.building_id))

        teacher_user = User(name="Dr. Awa Ngono", email="professeur@campus.edu", role="Teacher")
        db.add(teacher_user)
        db.flush()
        teacher = Teacher(employee_code="ENS-001", speciality="Génie Logiciel", user_id=teacher_user.user_id)
        db.add(teacher)
        db.flush()

        student_user = User(name="Jean Mballa", email="student@campus.edu", role="Student")
        db.add(student_user)
        db.flush()
        student = Student(
            matricule="ETU2026-001",
            enrollment_date=date(2026, 9, 1),
            status="active",
            program_id=program.program_id,
            user_id=student_user.user_id,
        )
        db.add(student)
        db.flush()

        offering = CourseOffering(
            name="CS201 — Groupe A",
            campus_id=campus.campus_id,
            teacher_id=teacher.teacher_id,
            course_id=course.course_id,
            semester_id=semester.semester_id,
        )
        db.add(offering)
        db.flush()

        db.add(
            Enrollment(
                status="active",
                enrollment_date=date(2026, 9, 5),
                student_id=student.student_id,
                course_offering_id=offering.course_offering_id,
            )
        )

        db.commit()
        print("[seed_academic] Données de démonstration créées avec succès.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
