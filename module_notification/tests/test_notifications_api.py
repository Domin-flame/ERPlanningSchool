"""Tests API du service Notification."""
from tests.conftest import make_token


def auth(user_id: int) -> dict:
    return {"Authorization": f"Bearer {make_token(user_id)}"}


def _create(client, user_id=1, title="Titre", category="academic"):
    return client.post(
        "/api/v1/notifications/",
        headers=auth(user_id),
        json={"user_id": user_id, "title": title, "message": "Contenu", "category": category},
    )


def test_create_and_list_notification(client):
    resp = _create(client, user_id=1)
    assert resp.status_code == 201
    assert resp.json()["read"] is False

    listing = client.get("/api/v1/notifications/", headers=auth(1))
    assert listing.status_code == 200
    assert listing.json()["total"] == 1


def test_notifications_are_isolated_per_user(client):
    _create(client, user_id=1)
    _create(client, user_id=2)

    listing1 = client.get("/api/v1/notifications/", headers=auth(1))
    assert listing1.json()["total"] == 1

    listing2 = client.get("/api/v1/notifications/", headers=auth(2))
    assert listing2.json()["total"] == 1


def test_unread_count_reflects_read_state(client):
    _create(client, user_id=1)
    _create(client, user_id=1)

    count = client.get("/api/v1/notifications/unread-count", headers=auth(1))
    assert count.json() == 2

    mark = client.post("/api/v1/notifications/read", headers=auth(1), json={"ids": []})
    assert mark.status_code == 200

    count_after = client.get("/api/v1/notifications/unread-count", headers=auth(1))
    assert count_after.json() == 0


def test_archived_notifications_excluded_by_default(client):
    created = _create(client, user_id=1).json()

    archive_resp = client.patch(
        f"/api/v1/notifications/{created['id']}/archive", headers=auth(1)
    )
    assert archive_resp.status_code == 200
    assert archive_resp.json()["archived"] is True

    listing_default = client.get("/api/v1/notifications/", headers=auth(1))
    assert listing_default.json()["total"] == 0

    listing_with_archived = client.get(
        "/api/v1/notifications/?include_archived=true", headers=auth(1)
    )
    assert listing_with_archived.json()["total"] == 1


def test_filter_by_category(client):
    _create(client, user_id=1, category="finance")
    _create(client, user_id=1, category="academic")

    resp = client.get("/api/v1/notifications/?category=finance", headers=auth(1))
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["category"] == "finance"


def test_delete_notification_requires_ownership(client):
    created = _create(client, user_id=1).json()

    resp_other = client.delete(f"/api/v1/notifications/{created['id']}", headers=auth(2))
    assert resp_other.status_code == 404

    resp_owner = client.delete(f"/api/v1/notifications/{created['id']}", headers=auth(1))
    assert resp_owner.status_code == 204


def test_endpoints_require_authentication(client):
    resp = client.get("/api/v1/notifications/")
    assert resp.status_code == 401
