import pytest


@pytest.fixture
def full_context(client):
    """Construit une chaîne complète : faculté -> département -> programme,
    module -> cours, campus -> bâtiment -> salle, année -> semestre,
    utilisateur enseignant + utilisateur étudiant."""
    faculty = client.post("/faculties/", json={"name": "Sciences", "code": "FAC-SCI"}).json()
    department = client.post(
        "/departments/", json={"name": "Info", "faculty_id": faculty["faculty_id"]}
    ).json()
    program = client.post(
        "/programs/",
        json={"name": "Licence Info", "level": "L2", "department_id": department["department_id"]},
    ).json()

    module = client.post(
        "/modules/", json={"code": "MOD-DB", "title": "Bases de données", "credits_ects": 6}
    ).json()
    course = client.post(
        "/courses/",
        json={"code": "CRS-DB1", "title": "SQL avancé", "credits": 3, "module_id": module["module_id"]},
    ).json()

    campus = client.post(
        "/campuses/", json={"name": "Campus Principal", "city": "Yaoundé"}
    ).json()
    building = client.post(
        "/buildings/", json={"name": "Bâtiment A", "code": "BAT-A", "campus_id": campus["campus_id"]}
    ).json()
    room = client.post(
        "/rooms/",
        json={"room_number": "101", "capacity": 30, "room_type": "TD", "building_id": building["building_id"]},
    ).json()

    academic_year = client.post(
        "/academic-years/",
        json={"start_date": "2025-09-01", "end_date": "2026-07-31", "year_label": "2025-2026"},
    ).json()
    semester = client.post(
        "/semesters/",
        json={
            "term_name": "Semestre 1",
            "start_date": "2025-09-01",
            "end_date": "2026-01-31",
            "is_locked": False,
            "academic_year_id": academic_year["academic_year_id"],
        },
    ).json()

    teacher_user = client.post(
        "/users/",
        json={"name": "Prof Martin", "email": "prof.martin@example.com", "role": "Teacher"},
    ).json()
    teacher = client.post(
        "/teachers/",
        json={"employee_code": "EMP-100", "speciality": "BDD", "user_id": teacher_user["user_id"]},
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
            "name": "SQL avancé - Groupe A",
            "campus_id": full_context["campus"]["campus_id"],
            "teacher_id": full_context["teacher"]["teacher_id"],
            "course_id": full_context["course"]["course_id"],
            "semester_id": full_context["semester"]["semester_id"],
        },
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "SQL avancé - Groupe A"


def test_student_can_only_enroll_own_profile(client, full_context):
    offering = client.post(
        "/course-offerings/",
        json={
            "name": "SQL avancé - Groupe B",
            "campus_id": full_context["campus"]["campus_id"],
            "teacher_id": full_context["teacher"]["teacher_id"],
            "course_id": full_context["course"]["course_id"],
            "semester_id": full_context["semester"]["semester_id"],
        },
    ).json()
    student = full_context["student"]
    payload = {
        "status": "Active",
        "enrollment_date": "2025-09-05",
        "student_id": student["student_id"],
        "course_offering_id": offering["course_offering_id"],
    }

    other = client.post(
        "/enrollments/",
        json=payload,
        headers={"X-User-ID": str(student["user_id"] + 999), "X-User-Role": "student"},
    )
    assert other.status_code == 403

    marketing = client.post(
        "/enrollments/",
        json=payload,
        headers={"X-User-ID": str(student["user_id"]), "X-User-Role": "marketing"},
    )
    assert marketing.status_code == 403

    # Via la gateway : X-User-ID vient d'auth-service (sans rapport avec
    # users.user_id ici) ; c'est l'e-mail qui identifie l'étudiant.
    other_email = client.post(
        "/enrollments/",
        json=payload,
        headers={"X-User-ID": str(student["user_id"]), "X-User-Role": "student", "X-User-Email": "bob@example.com"},
    )
    assert other_email.status_code == 403

    own = client.post(
        "/enrollments/",
        json=payload,
        headers={"X-User-ID": "4242", "X-User-Role": "student", "X-User-Email": "ALICE@example.com"},
    )
    assert own.status_code == 201


def test_student_overview_resolves_profile_by_email(client, full_context):
    semester = full_context["semester"]
    offering = client.post(
        "/course-offerings/",
        json={
            "name": "SQL avancé - Groupe C",
            "campus_id": full_context["campus"]["campus_id"],
            "teacher_id": full_context["teacher"]["teacher_id"],
            "course_id": full_context["course"]["course_id"],
            "semester_id": semester["semester_id"],
        },
    ).json()
    enrollment = client.post(
        "/enrollments/",
        json={
            "status": "Active",
            "enrollment_date": "2025-09-05",
            "student_id": full_context["student"]["student_id"],
            "course_offering_id": offering["course_offering_id"],
        },
        headers={"X-User-ID": "4242", "X-User-Role": "student", "X-User-Email": "alice@example.com"},
    )
    assert enrollment.status_code == 201

    overview = client.get(
        f"/student/me/overview?semester_id={semester['semester_id']}",
        headers={"X-User-ID": "4242", "X-User-Role": "student", "X-User-Email": "alice@example.com"},
    )
    assert overview.status_code == 200
    body = overview.json()
    assert body["student"]["student_id"] == full_context["student"]["student_id"]
    assert [course["course_offering_id"] for course in body["courses"]] == [offering["course_offering_id"]]

    unknown = client.get(
        "/student/me/overview",
        headers={"X-User-ID": str(full_context["student"]["user_id"]), "X-User-Role": "student", "X-User-Email": "nobody@example.com"},
    )
    assert unknown.status_code == 404

    teacher = client.get(
        "/student/me/overview",
        headers={"X-User-Role": "professeur", "X-User-Email": "alice@example.com"},
    )
    assert teacher.status_code == 403


def test_full_academic_flow_enrollment_grade_attendance(client, full_context):
    teacher_headers = {
        "X-User-Role": "teacher",
        "X-User-Email": "prof.martin@example.com",
    }

    offering = client.post(
        "/course-offerings/",
        json={
            "name": "SQL avancé - Groupe A",
            "campus_id": full_context["campus"]["campus_id"],
            "teacher_id": full_context["teacher"]["teacher_id"],
            "course_id": full_context["course"]["course_id"],
            "semester_id": full_context["semester"]["semester_id"],
        },
    ).json()

    # Emploi du temps
    schedule = client.post(
        "/class-schedules/",
        json={
            "day_of_week": "Monday",
            "start_time": "08:00:00",
            "end_time": "10:00:00",
            "room_id": full_context["room"]["room_id"],
            "course_offering_id": offering["course_offering_id"],
        },
    )
    assert schedule.status_code == 201
    schedule = schedule.json()

    # Refus si start_time >= end_time
    bad_schedule = client.post(
        "/class-schedules/",
        json={
            "day_of_week": "Monday",
            "start_time": "10:00:00",
            "end_time": "08:00:00",
            "room_id": full_context["room"]["room_id"],
            "course_offering_id": offering["course_offering_id"],
        },
    )
    assert bad_schedule.status_code == 400

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
        headers=teacher_headers,
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
        headers=teacher_headers,
    )
    assert grade.status_code == 201
    assert grade.json()["score"] == "15.50"

    # Séance
    session = client.post(
        "/sessions/",
        json={
            "session_date": "2025-09-08",
            "status": "Completed",
            "topic_covered": "Introduction au SQL",
            "schedule_id": schedule["schedule_id"],
        },
        headers=teacher_headers,
    )
    assert session.status_code == 201
    session = session.json()

    # Présence
    attendance = client.post(
        "/attendances/",
        json={
            "status": "Present",
            "session_id": session["session_id"],
            "enrollment_id": enrollment["enrollment_id"],
        },
        headers=teacher_headers,
    )
    assert attendance.status_code == 201
    assert attendance.json()["status"] == "Present"

    # Vérification finale via les listes
    assert len(client.get("/enrollments/").json()) == 1
    assert len(client.get("/grades/").json()) == 1
    assert len(client.get("/attendances/").json()) == 1
