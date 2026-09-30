"""Tests API du module employés RH — CRUD + RBAC (HR_ADMIN_ROLES / HR_READ_ROLES)."""


def _create_employee(client, headers, matricule="EMP-001", email="jean@example.com", auth_user_id="1"):
    return client.post(
        "/api/v1/hr/employees/",
        headers=headers,
        json={
            "auth_user_id": auth_user_id,
            "matricule": matricule,
            "first_name": "Jean",
            "last_name": "Dupont",
            "email": email,
            "phone": "+237600000000",
            "department": "Finance",
            "position": "Comptable",
            "hire_date": "2024-01-15",
            "base_salary": 300000,
            "cnps_number": "CNPS-001",
        },
    )


def test_rh_can_create_employee(client, rh_headers):
    resp = _create_employee(client, rh_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["matricule"] == "EMP-001"
    assert body["is_active"] is True


def test_student_cannot_create_employee(client, student_headers):
    resp = _create_employee(client, student_headers)
    assert resp.status_code == 403


def test_duplicate_matricule_or_email_rejected(client, rh_headers):
    _create_employee(client, rh_headers, matricule="EMP-002", email="dup@example.com")
    resp = _create_employee(client, rh_headers, matricule="EMP-002", email="autre@example.com")
    assert resp.status_code == 409


def test_rh_can_list_employees_filtered_by_department(client, rh_headers):
    _create_employee(client, rh_headers, matricule="EMP-010", email="a@example.com", auth_user_id="10")
    resp = client.post(
        "/api/v1/hr/employees/",
        headers=rh_headers,
        json={
            "auth_user_id": "11",
            "matricule": "EMP-011",
            "first_name": "Awa",
            "last_name": "Nkeng",
            "email": "b@example.com",
            "department": "HR",
            "position": "Chargée RH",
            "hire_date": "2024-02-01",
            "base_salary": 250000,
        },
    )
    assert resp.status_code == 201

    resp = client.get("/api/v1/hr/employees/?department=Finance", headers=rh_headers)
    assert resp.status_code == 200
    departments = {e["department"] for e in resp.json()}
    assert departments == {"Finance"}


def test_student_cannot_list_employees(client, student_headers):
    resp = client.get("/api/v1/hr/employees/", headers=student_headers)
    assert resp.status_code == 403


def test_employee_can_view_own_record(client, rh_headers):
    created = _create_employee(client, rh_headers, matricule="EMP-020", email="self@example.com", auth_user_id="20")
    employee_id = created.json()["id"]

    from tests.conftest import make_token
    own_headers = {"Authorization": f"Bearer {make_token('student', user_id=20, sub='self@example.com')}"}

    resp = client.get(f"/api/v1/hr/employees/{employee_id}", headers=own_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "self@example.com"


def test_employee_cannot_view_others_record(client, rh_headers, student_headers):
    created = _create_employee(client, rh_headers, matricule="EMP-030", email="other@example.com", auth_user_id="30")
    employee_id = created.json()["id"]

    resp = client.get(f"/api/v1/hr/employees/{employee_id}", headers=student_headers)
    assert resp.status_code == 403


def test_rh_can_deactivate_employee(client, rh_headers):
    created = _create_employee(client, rh_headers, matricule="EMP-040", email="deact@example.com", auth_user_id="40")
    employee_id = created.json()["id"]

    resp = client.delete(f"/api/v1/hr/employees/{employee_id}", headers=rh_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/hr/employees/{employee_id}", headers=rh_headers)
    assert resp.json()["is_active"] is False


def test_update_employee_rejects_negative_salary(client, rh_headers):
    created = _create_employee(client, rh_headers, matricule="EMP-050", email="sal@example.com", auth_user_id="50")
    employee_id = created.json()["id"]

    resp = client.patch(
        f"/api/v1/hr/employees/{employee_id}",
        headers=rh_headers,
        json={"base_salary": -1000},
    )
    assert resp.status_code == 400
