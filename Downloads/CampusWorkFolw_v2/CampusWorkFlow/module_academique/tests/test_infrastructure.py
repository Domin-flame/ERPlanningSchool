def create_campus(client):
    resp = client.post(
        "/campuses/", json={"name": "Campus Principal", "city": "Yaoundé", "adress": "Rue 123"}
    )
    assert resp.status_code == 201
    return resp.json()


def create_building(client, campus_id):
    resp = client.post(
        "/buildings/", json={"name": "Bâtiment A", "code": "BAT-A", "campus_id": campus_id}
    )
    assert resp.status_code == 201
    return resp.json()


def test_campus_crud(client):
    campus = create_campus(client)
    resp = client.get(f"/campuses/{campus['campus_id']}")
    assert resp.status_code == 200

    resp = client.put(f"/campuses/{campus['campus_id']}", json={"city": "Douala"})
    assert resp.status_code == 200
    assert resp.json()["city"] == "Douala"


def test_building_requires_campus(client):
    resp = client.post("/buildings/", json={"name": "Bâtiment X", "code": "BAT-X", "campus_id": 9999})
    assert resp.status_code == 404


def test_room_full_chain(client):
    campus = create_campus(client)
    building = create_building(client, campus["campus_id"])

    resp = client.post(
        "/rooms/",
        json={
            "room_number": "101",
            "capacity": 40,
            "room_type": "Amphi",
            "room_name": "Amphi A",
            "building_id": building["building_id"],
        },
    )
    assert resp.status_code == 201
    room = resp.json()
    assert room["capacity"] == 40

    resp = client.delete(f"/rooms/{room['room_id']}")
    assert resp.status_code == 204
