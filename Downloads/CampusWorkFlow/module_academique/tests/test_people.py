def create_user(client, email="jean.dupont@example.com", role="Teacher"):
    resp = client.post(
        "/users/",
        json={"name": "Jean Dupont", "phone": "+237600000000", "email": email, "role": role},
    )
    assert resp.status_code == 201
    return resp.json()


def test_user_crud_and_duplicate_email(client):
    user = create_user(client)
    assert user["role"] == "Teacher"

    resp = client.post(
        "/users/",
        json={"name": "Autre", "email": user["email"], "role": "Student"},
    )
    assert resp.status_code == 400


def test_user_invalid_role_rejected(client):
    resp = client.post(
        "/users/",
        json={"name": "Test", "email": "invalid.role@example.com", "role": "Superviseur"},
    )
    assert resp.status_code == 400


def test_teacher_creation(client):
    user = create_user(client, email="prof@example.com", role="Teacher")
    resp = client.post(
        "/teachers/",
        json={"employee_code": "EMP-001", "speciality": "Bases de données", "user_id": user["user_id"]},
    )
    assert resp.status_code == 201

    # Same user cannot be registered twice as teacher
    resp = client.post(
        "/teachers/",
        json={"employee_code": "EMP-002", "speciality": "Réseaux", "user_id": user["user_id"]},
    )
    assert resp.status_code == 400


def test_student_requires_program(client):
    user = create_user(client, email="etudiant@example.com", role="Student")
    resp = client.post(
        "/students/",
        json={
            "matricule": "MAT-2025-001",
            "enrollment_date": "2025-09-01",
            "status": "Active",
            "program_id": 9999,
            "user_id": user["user_id"],
        },
    )
    assert resp.status_code == 404


def test_student_full_flow(client):
    faculty_resp = client.post("/faculties/", json={"name": "Sciences", "code": "FAC-SCI"})
    department_resp = client.post(
        "/departments/", json={"name": "Info", "faculty_id": faculty_resp.json()["faculty_id"]}
    )
    program_resp = client.post(
        "/programs/",
        json={"name": "Licence Info", "level": "L1", "department_id": department_resp.json()["department_id"]},
    )
    user = create_user(client, email="etudiant2@example.com", role="Student")

    resp = client.post(
        "/students/",
        json={
            "matricule": "MAT-2025-002",
            "enrollment_date": "2025-09-01",
            "status": "Active",
            "program_id": program_resp.json()["program_id"],
            "user_id": user["user_id"],
        },
    )
    assert resp.status_code == 201
    student = resp.json()

    resp = client.get(f"/students/{student['student_id']}")
    assert resp.status_code == 200
    assert resp.json()["matricule"] == "MAT-2025-002"
