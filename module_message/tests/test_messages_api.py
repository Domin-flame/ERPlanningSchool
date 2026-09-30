"""Tests API du service Message : conversations et messages."""
from tests.conftest import make_token


def auth(user_id: int, role: str = "student") -> dict:
    return {"Authorization": f"Bearer {make_token(user_id, role)}"}


def test_create_conversation_adds_creator_and_participants(client):
    resp = client.post(
        "/api/v1/conversations/",
        headers=auth(1),
        json={"name": "Groupe Projet", "is_group": True, "participant_ids": [2, 3]},
    )
    assert resp.status_code == 201
    conv_id = resp.json()["id"]

    # Le créateur (user 1) doit voir la conversation dans sa liste
    listing = client.get("/api/v1/conversations/", headers=auth(1))
    assert listing.status_code == 200
    assert any(c["id"] == conv_id for c in listing.json()["items"])

    # Un participant ajouté (user 2) doit aussi la voir
    listing2 = client.get("/api/v1/conversations/", headers=auth(2))
    assert any(c["id"] == conv_id for c in listing2.json()["items"])


def test_stranger_does_not_see_conversation(client):
    resp = client.post(
        "/api/v1/conversations/",
        headers=auth(1),
        json={"name": "Privé", "participant_ids": []},
    )
    conv_id = resp.json()["id"]

    listing = client.get("/api/v1/conversations/", headers=auth(99))
    assert not any(c["id"] == conv_id for c in listing.json()["items"])


def test_send_and_list_messages(client):
    conv = client.post(
        "/api/v1/conversations/",
        headers=auth(1),
        json={"name": "Discussion", "participant_ids": [2]},
    ).json()
    conv_id = conv["id"]

    send = client.post(
        "/api/v1/messages/",
        headers=auth(1),
        json={"conversation_id": conv_id, "content": "Bonjour !"},
    )
    assert send.status_code == 201
    assert send.json()["content"] == "Bonjour !"

    listing = client.get(f"/api/v1/messages/conversation/{conv_id}", headers=auth(2))
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["content"] == "Bonjour !"


def test_non_participant_cannot_send_message(client):
    conv = client.post(
        "/api/v1/conversations/",
        headers=auth(1),
        json={"name": "Fermée", "participant_ids": []},
    ).json()

    resp = client.post(
        "/api/v1/messages/",
        headers=auth(2),
        json={"conversation_id": conv["id"], "content": "Intrusion"},
    )
    assert resp.status_code == 403


def test_author_can_edit_own_message_but_not_others(client):
    conv = client.post(
        "/api/v1/conversations/",
        headers=auth(1),
        json={"name": "Édition", "participant_ids": [2]},
    ).json()

    msg = client.post(
        "/api/v1/messages/",
        headers=auth(1),
        json={"conversation_id": conv["id"], "content": "Original"},
    ).json()

    edit_by_author = client.patch(
        f"/api/v1/messages/{msg['id']}", headers=auth(1), json={"content": "Corrigé"}
    )
    assert edit_by_author.status_code == 200
    assert edit_by_author.json()["content"] == "Corrigé"

    edit_by_other = client.patch(
        f"/api/v1/messages/{msg['id']}", headers=auth(2), json={"content": "Piraté"}
    )
    assert edit_by_other.status_code == 403


def test_author_can_delete_own_message(client):
    conv = client.post(
        "/api/v1/conversations/",
        headers=auth(1),
        json={"name": "Suppression", "participant_ids": [2]},
    ).json()

    msg = client.post(
        "/api/v1/messages/",
        headers=auth(1),
        json={"conversation_id": conv["id"], "content": "À supprimer"},
    ).json()

    delete_by_other = client.delete(f"/api/v1/messages/{msg['id']}", headers=auth(2))
    assert delete_by_other.status_code == 403

    delete_by_author = client.delete(f"/api/v1/messages/{msg['id']}", headers=auth(1))
    assert delete_by_author.status_code == 204


def test_endpoints_require_authentication(client):
    resp = client.get("/api/v1/conversations/")
    assert resp.status_code == 401
