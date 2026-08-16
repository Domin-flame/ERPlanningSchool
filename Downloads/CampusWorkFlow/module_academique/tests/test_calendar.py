def test_semester_crud(client):
    # Create semester directly; SQL stores academic_year as a string field
    resp = client.post(
        "/semesters/",
        json={
            "academic_year": "2025-2026",
            "term_name": "Semestre 1",
            "start_date": "2025-09-01",
            "end_date": "2026-01-31",
            "is_locked": False,
        },
    )
    assert resp.status_code == 201
    semester = resp.json()

    resp = client.put(f"/semesters/{semester['semester_id']}", json={"is_locked": True})
    assert resp.status_code == 200
    assert resp.json()["is_locked"] is True

    resp = client.delete(f"/semesters/{semester['semester_id']}")
    assert resp.status_code == 204
