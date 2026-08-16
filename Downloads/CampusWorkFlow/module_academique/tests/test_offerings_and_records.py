import pytest


@pytest.fixture
def full_context(client):
    """Construit une chaîne complète : faculté -> département -> programme,
    module -> cours, campus -> bâtiment -> salle, année -> semestre,
    utilisateur enseignant + utilisateur étudiant."""
    faculty = client.post("/faculties/", json={"name": "Sciences"}).json()
    department = client.post(
        "/departments/", json={"name": "Info", "faculty_id": faculty["faculty_id"]}
    ).json()
    program = client.post(
        "/programs/",
        json={"name": "Licence Info", "level": "L2", "department_id": department["department_id"]},
    ).json()

    course = client.post(
        "/courses/",
        json={"code": "CRS-DB1", "title": "SQL avancé", "credits": 3},
    ).json()

    # semester stores academic_year as varchar in SQL
    semester = client.post(
        "/semesters/",
        json={
            "academic_year": "2025-2026",
            "term_name": "Semestre 1",
            "start_date": "2025-09-01",
            "end_date": "2026-01-31",
            "is_locked": False,
        },
    ).json()

    teacher_user = client.post(
        "/users/",
        json={"name": "Prof Martin", "email": "prof.martin@example.com", "role": "Teacher"},
    ).json()
    teacher = client.post(
        "/teachers/",
        json={"name": "Prof Martin", "email": "prof.martin@example.com", "user_id": teacher_user["user_id"]},
    ).json()

    student_user = client.post(
        "/users/",
        json={"name": "Alice Etudiante", "email": "alice@example.com", "role": "Student"},
    ).json()
    student = client.post(
        "/students/",
        json={
            "matricule": "MAT-2025-010",
            "enrollment_date": "2025-09-01",
            "status": "Active",
            "program_id": program["program_id"],
            "user_id": student_user["user_id"],
        },
    ).json()

    return {
        "course": course,
        "campus": campus,
        "room": room,
        "semester": semester,
        "teacher": teacher,
        "student": student,
    }


def test_course_offering_creation(client, full_context):
    resp = client.post(
        "/course-offerings/",
        json={
            "room": "101",
            "capacity": 30,
            "teacher_id": full_context["teacher"]["teacher_id"],
            "course_id": full_context["course"]["course_id"],
            "semester_id": full_context["semester"]["semester_id"],
        },
    )
    assert resp.status_code == 201
    assert resp.json()["course_id"] == full_context["course"]["course_id"]


def test_full_academic_flow_enrollment_grade_attendance(client, full_context):
    offering = client.post(
        "/course-offerings/",
        json={
            "room": "101",
            "capacity": 30,
            "teacher_id": full_context["teacher"]["teacher_id"],
            "course_id": full_context["course"]["course_id"],
            "semester_id": full_context["semester"]["semester_id"],
        },
    ).json()
    # Examen
    exam = client.post(
        "/exams/",
        json={
            "exam_type": "Final",
            "exam_date": "2026-01-15",
            "weight_percentage": "60.00",
            "max_score": "20.00",
            "course_offering_id": offering["course_offering_id"],
        },
    )
    assert exam.status_code == 201
    exam = exam.json()

    # Inscription de l'étudiant
    enrollment = client.post(
        "/enrollments/",
        json={
            "status": "Active",
            "enrollment_date": "2025-09-05",
            "student_id": full_context["student"]["student_id"],
            "course_offering_id": offering["course_offering_id"],
        },
    )
    assert enrollment.status_code == 201
    enrollment = enrollment.json()

    # Double inscription refusée
    duplicate = client.post(
        "/enrollments/",
        json={
            "status": "Active",
            "enrollment_date": "2025-09-05",
            "student_id": full_context["student"]["student_id"],
            "course_offering_id": offering["course_offering_id"],
        },
    )
    assert duplicate.status_code == 400

    # Note
    grade = client.post(
        "/grades/",
        json={
            "score": "15.50",
            "letter_grade": "B",
            "submitted_by": full_context["teacher"]["teacher_id"],
            "submitted_at": "2026-01-20T10:00:00",
            "exam_id": exam["exam_id"],
            "enrollment_id": enrollment["enrollment_id"],
        },
    )
    assert grade.status_code == 201
    assert grade.json()["score"] == "15.50"

    # Présence (attendance records session_date + enrollment_id in SQL)
    attendance = client.post(
        "/attendances/",
        json={
            "session_date": "2025-09-08",
            "status": "Present",
            "enrollment_id": enrollment["enrollment_id"],
        },
    )
    assert attendance.status_code == 201
    assert attendance.json()["status"] == "Present"

    # Vérification finale via les listes
    assert len(client.get("/enrollments/").json()) == 1
    assert len(client.get("/grades/").json()) == 1
    assert len(client.get("/attendances/").json()) == 1
