from datetime import date

from app import models
from scripts.seed_academic import run as seed_academic

STUDENT = {"X-User-ID": "3", "X-User-Role": "student", "X-User-Email": "student@campus.edu"}


def test_seed_is_idempotent_and_opens_current_semester(client, db_session):
    seed_academic()
    seed_academic()

    assert db_session.query(models.Faculty).count() == 1
    today = date.today().isoformat()
    semesters = client.get("/semesters/").json()
    current = [s for s in semesters if s["start_date"] <= today <= s["end_date"] and not s["is_locked"]]
    assert len(current) == 1
    offerings = client.get("/course-offerings/").json()
    assert [o["semester_id"] for o in offerings] == [current[0]["semester_id"]]


def test_course_created_by_direction_can_be_opened_and_joined_by_student(client, db_session):
    seed_academic()
    today = date.today().isoformat()
    module = client.get("/modules/").json()[0]
    semester = next(s for s in client.get("/semesters/").json() if s["start_date"] <= today <= s["end_date"])
    campus = client.get("/campuses/").json()[0]
    teacher = client.get("/teachers/").json()[0]

    course = client.post(
        "/courses/",
        json={"code": "WEB301", "title": "Développement Web", "credits": 4, "module_id": module["module_id"]},
    )
    assert course.status_code == 201

    offering = client.post(
        "/course-offerings/",
        json={
            "name": "WEB301 — Groupe A",
            "course_id": course.json()["course_id"],
            "semester_id": semester["semester_id"],
            "campus_id": campus["campus_id"],
            "teacher_id": teacher["teacher_id"],
        },
    )
    assert offering.status_code == 201
    offering_id = offering.json()["course_offering_id"]

    overview = client.get("/student/me/overview", headers=STUDENT)
    assert overview.status_code == 200
    student_id = overview.json()["student"]["student_id"]

    enrollment = client.post(
        "/enrollments/",
        json={
            "status": "Active",
            "enrollment_date": today,
            "student_id": student_id,
            "course_offering_id": offering_id,
        },
        headers=STUDENT,
    )
    assert enrollment.status_code == 201

    courses = client.get("/student/me/overview", headers=STUDENT).json()["courses"]
    assert offering_id in [c["course_offering_id"] for c in courses]


def test_course_with_sessions_cannot_be_deleted(client, db_session):
    seed_academic()
    course = client.get("/courses/").json()[0]

    response = client.delete(f"/courses/{course['course_id']}")

    assert response.status_code == 409
    assert "session" in response.json()["detail"]
