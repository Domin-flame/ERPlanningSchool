"""
Vérifie la rotation réelle des refresh tokens : un refresh token ne peut
être utilisé qu'une seule fois, et logout révoque access + refresh token.
"""


def _register_and_login(client, email="rotation@example.com", password="Passw0rd!"):
    client.post(
        "/auth/register",
        json={"full_name": "Rotation Test", "email": email, "password": password, "role": "student"},
    )
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()


def test_refresh_issues_new_tokens(client):
    tokens = _register_and_login(client)
    resp = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert resp.status_code == 200
    new_tokens = resp.json()
    assert new_tokens["access_token"] != tokens["access_token"]
    assert new_tokens["refresh_token"] != tokens["refresh_token"]


def test_reusing_old_refresh_token_is_rejected(client):
    """Cœur de la rotation : une fois le refresh token utilisé, il devient
    invalide — même s'il n'est pas encore expiré."""
    tokens = _register_and_login(client, email="reuse@example.com")

    first_refresh = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert first_refresh.status_code == 200

    # Rejouer le MÊME refresh token (ex: token volé et réutilisé) doit échouer
    replay = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert replay.status_code == 401

    # Le nouveau refresh token émis, lui, doit fonctionner
    new_refresh_token = first_refresh.json()["refresh_token"]
    second_refresh = client.post("/auth/refresh", json={"refresh_token": new_refresh_token})
    assert second_refresh.status_code == 200


def test_logout_revokes_access_and_refresh_token(client):
    tokens = _register_and_login(client, email="logout@example.com")
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    logout_resp = client.post(
        "/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_resp.status_code == 200

    # L'access token révoqué ne doit plus donner accès à /auth/me
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_resp.status_code == 401

    # Le refresh token révoqué ne doit plus permettre de renouveler la session
    refresh_resp = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_resp.status_code == 401
