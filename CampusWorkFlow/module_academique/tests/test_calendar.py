def create_academic_year(client):
    resp = client.post(
        "/academic-years/",
        json={"start_date": "2025-09-01", "end_date": "2026-07-31", "year_label": "2025-2026"},
    )
    assert resp.status_code == 201
    return resp.json()


def test_academic_year_crud(client):
    year = create_academic_year(client)
    assert year["year_label"] == "2025-2026"

    resp = client.get(f"/academic-years/{year['academic_year_id']}")
    assert resp.status_code == 200

    resp = client.put(
        f"/academic-years/{year['academic_year_id']}", json={"year_label": "2025-2026-REV"}
    )
    assert resp.status_code == 200
    assert resp.json()["year_label"] == "2025-2026-REV"


def test_semester_requires_existing_academic_year(client):
    resp = client.post(
        "/semesters/",
        json={
            "term_name": "Semestre 1",
            "start_date": "2025-09-01",
            "end_date": "2026-01-31",
            "is_locked": False,
            "academic_year_id": 9999,
        },
    )
    assert resp.status_code == 404


def test_semester_crud(client):
    year = create_academic_year(client)
    resp = client.post(
        "/semesters/",
        json={
            "term_name": "Semestre 1",
            "start_date": "2025-09-01",
            "end_date": "2026-01-31",
            "is_locked": False,
            "academic_year_id": year["academic_year_id"],
        },
    )
    assert resp.status_code == 201
    semester = resp.json()

    resp = client.put(f"/semesters/{semester['semester_id']}", json={"is_locked": True})
    assert resp.status_code == 200
    assert resp.json()["is_locked"] is True

    resp = client.delete(f"/semesters/{semester['semester_id']}")
    assert resp.status_code == 204
