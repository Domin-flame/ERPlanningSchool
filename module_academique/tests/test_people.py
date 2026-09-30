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


def _create_program(client):
    faculty = client.post("/faculties/", json={"name": "Lettres", "code": "FAC-LET"}).json()
    department = client.post("/departments/", json={"name": "Langues", "faculty_id": faculty["faculty_id"]}).json()
    resp = client.post(
        "/programs/",
        json={"name": "Licence Anglais", "level": "L1", "department_id": department["department_id"]},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_register_student_creates_user_and_student(client):
    program = _create_program(client)
    payload = {
        "name": "Awa Ndiaye",
        "email": "Awa.Ndiaye@Example.com",
        "matricule": "MAT-2026-001",
        "program_id": program["program_id"],
        "enrollment_date": "2026-09-01",
        "status": "active",
    }
    resp = client.post("/students/register", json=payload)
    assert resp.status_code == 201, resp.text
    student = resp.json()
    assert student["name"] == "Awa Ndiaye"
    assert student["email"] == "awa.ndiaye@example.com"
    assert student["status"] == "ACTIVE"
    assert student["program_name"] == "Licence Anglais"

    user = client.get(f"/users/{student['user_id']}").json()
    assert user["role"] == "Student"

    listed = client.get("/students/").json()
    assert any(s["matricule"] == "MAT-2026-001" and s["name"] == "Awa Ndiaye" for s in listed)

    # Même email ou même matricule → conflit explicite
    assert client.post("/students/register", json={**payload, "matricule": "MAT-2026-002"}).status_code == 409
    assert client.post("/students/register", json={**payload, "email": "autre@example.com"}).status_code == 409


def test_register_student_validation(client):
    program = _create_program(client)
    base = {
        "name": "Test",
        "email": "t@example.com",
        "matricule": "MAT-X",
        "program_id": program["program_id"],
        "enrollment_date": "2026-09-01",
    }
    assert client.post("/students/register", json={**base, "program_id": 9999}).status_code == 404
    assert client.post("/students/register", json={**base, "status": "GRADUATED"}).status_code == 422

    create_user(client, email="staff@example.com", role="Teacher")
    assert client.post("/students/register", json={**base, "email": "staff@example.com"}).status_code == 409
