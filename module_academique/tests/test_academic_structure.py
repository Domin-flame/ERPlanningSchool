def create_faculty(client, code="FAC-SCI"):
    resp = client.post("/faculties/", json={"name": "Sciences", "code": code})
    assert resp.status_code == 201
    return resp.json()


def create_department(client, faculty_id):
    resp = client.post(
        "/departments/", json={"name": "Informatique", "faculty_id": faculty_id}
    )
    assert resp.status_code == 201
    return resp.json()


def create_program(client, department_id):
    resp = client.post(
        "/programs/",
        json={"name": "Licence Info", "level": "L3", "department_id": department_id},
    )
    assert resp.status_code == 201
    return resp.json()


def create_module(client, code="MOD-101"):
    resp = client.post(
        "/modules/", json={"code": code, "title": "Bases de données", "credits_ects": 6}
    )
    assert resp.status_code == 201
    return resp.json()


def create_course(client, module_id, code="CRS-101"):
    resp = client.post(
        "/courses/",
        json={"code": code, "title": "SQL avancé", "credits": 3, "module_id": module_id},
    )
    assert resp.status_code == 201
    return resp.json()


def test_faculty_crud(client):
    faculty = create_faculty(client)
    assert faculty["name"] == "Sciences"

    resp = client.get(f"/faculties/{faculty['faculty_id']}")
    assert resp.status_code == 200

    resp = client.put(f"/faculties/{faculty['faculty_id']}", json={"name": "Sciences et Techniques"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Sciences et Techniques"

    resp = client.delete(f"/faculties/{faculty['faculty_id']}")
    assert resp.status_code == 204

    resp = client.get(f"/faculties/{faculty['faculty_id']}")
    assert resp.status_code == 404


def test_department_requires_existing_faculty(client):
    resp = client.post("/departments/", json={"name": "Physique", "faculty_id": 9999})
    assert resp.status_code == 404


def test_program_full_chain(client):
    faculty = create_faculty(client)
    department = create_department(client, faculty["faculty_id"])
    program = create_program(client, department["department_id"])
    assert program["level"] == "L3"

    resp = client.get("/programs/")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_module_and_course(client):
    module = create_module(client)
    course = create_course(client, module["module_id"])
    assert course["module_id"] == module["module_id"]

    resp = client.get(f"/modules/{module['module_id']}")
    assert resp.status_code == 200


def test_group_link_program_module(client):
    faculty = create_faculty(client)
    department = create_department(client, faculty["faculty_id"])
    program = create_program(client, department["department_id"])
    module = create_module(client)

    resp = client.post(
        "/groups/", json={"program_id": program["program_id"], "module_id": module["module_id"]}
    )
    assert resp.status_code == 201

    # Duplicate link must be rejected
    resp = client.post(
        "/groups/", json={"program_id": program["program_id"], "module_id": module["module_id"]}
    )
    assert resp.status_code == 400

    resp = client.get("/groups/")
    assert len(resp.json()) == 1

    resp = client.delete(f"/groups/{program['program_id']}/{module['module_id']}")
    assert resp.status_code == 204


def test_prerequisite_course(client):
    module = create_module(client)
    course_a = create_course(client, module["module_id"], code="CRS-A")
    course_b = create_course(client, module["module_id"], code="CRS-B")

    resp = client.post(
        "/prerequisites/",
        json={"course_id": course_b["course_id"], "course_id_1": course_a["course_id"]},
    )
    assert resp.status_code == 201

    # A course cannot be its own prerequisite
    resp = client.post(
        "/prerequisites/",
        json={"course_id": course_a["course_id"], "course_id_1": course_a["course_id"]},
    )
    assert resp.status_code == 400
