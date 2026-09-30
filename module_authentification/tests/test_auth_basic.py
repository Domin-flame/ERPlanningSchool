"""Tests de base : inscription, connexion, accès protégé /auth/me."""


def register(client, email="etudiant@example.com", password="Passw0rd!", role="student"):
    resp = client.post(
        "/auth/register",
        json={"full_name": "Test User", "email": email, "password": password, "role": role},
    )
    return resp


def test_register_creates_user(client):
    resp = register(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "etudiant@example.com"
    assert body["role"] == "student"


def test_register_rejects_duplicate_email(client):
    register(client, email="dup@example.com")
    resp = register(client, email="dup@example.com")
    assert resp.status_code == 409


def test_register_rejects_invalid_role(client):
    # Le rôle est un Literal Pydantic : une valeur hors de VALID_ROLES est
    # rejetée dès la validation du payload (422), avant même d'atteindre
    # la vérification métier dans le handler.
    resp = client.post(
        "/auth/register",
        json={"full_name": "X", "email": "x@example.com", "password": "Passw0rd!", "role": "superadmin"},
    )
    assert resp.status_code == 422


def test_login_success_returns_tokens(client):
    register(client, email="login@example.com", password="Passw0rd!")
    resp = client.post("/auth/login", json={"email": "login@example.com", "password": "Passw0rd!"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body and "refresh_token" in body
    assert body["user"]["email"] == "login@example.com"


def test_login_wrong_password_rejected(client):
    register(client, email="wrongpw@example.com", password="Passw0rd!")
    resp = client.post("/auth/login", json={"email": "wrongpw@example.com", "password": "bad"})
    assert resp.status_code == 401


def test_me_requires_valid_token(client):
    register(client, email="me@example.com", password="Passw0rd!")
    login = client.post("/auth/login", json={"email": "me@example.com", "password": "Passw0rd!"})
    token = login.json()["access_token"]

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"

    resp_no_token = client.get("/auth/me")
    assert resp_no_token.status_code == 401
