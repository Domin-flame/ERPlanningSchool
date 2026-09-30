"""
Vérifie le verrouillage de compte après des échecs de connexion répétés
(mitigation OWASP API2:2023 — Broken Authentication / brute force).
"""
from app.redis_client import MAX_FAILED_ATTEMPTS


def _register(client, email="lockout@example.com", password="Passw0rd!"):
    client.post(
        "/auth/register",
        json={"full_name": "Lock Test", "email": email, "password": password, "role": "student"},
    )


def test_account_locks_after_max_failed_attempts(client):
    email = "lockout@example.com"
    _register(client, email=email, password="Passw0rd!")

    # MAX_FAILED_ATTEMPTS - 1 échecs : toujours un 401 "identifiants invalides"
    for _ in range(MAX_FAILED_ATTEMPTS - 1):
        resp = client.post("/auth/login", json={"email": email, "password": "wrong"})
        assert resp.status_code == 401

    # Le dernier échec déclenche le verrouillage
    resp = client.post("/auth/login", json={"email": email, "password": "wrong"})
    assert resp.status_code == 429

    # Même avec le BON mot de passe, le compte reste verrouillé
    resp = client.post("/auth/login", json={"email": email, "password": "Passw0rd!"})
    assert resp.status_code == 429


def test_successful_login_resets_failed_counter(client):
    email = "resetcounter@example.com"
    _register(client, email=email, password="Passw0rd!")

    # Quelques échecs, mais pas assez pour verrouiller
    for _ in range(MAX_FAILED_ATTEMPTS - 2):
        client.post("/auth/login", json={"email": email, "password": "wrong"})

    # Connexion réussie : le compteur doit repartir de zéro
    resp = client.post("/auth/login", json={"email": email, "password": "Passw0rd!"})
    assert resp.status_code == 200

    # On peut donc à nouveau se tromper MAX_FAILED_ATTEMPTS - 1 fois sans
    # être verrouillé (si le compteur n'avait pas été remis à zéro, on
    # serait déjà verrouillé après 1 ou 2 essais ici).
    for _ in range(MAX_FAILED_ATTEMPTS - 1):
        resp = client.post("/auth/login", json={"email": email, "password": "wrong"})
        assert resp.status_code == 401


def test_lockout_does_not_affect_other_accounts(client):
    _register(client, email="victim@example.com", password="Passw0rd!")
    _register(client, email="other@example.com", password="Passw0rd!")

    for _ in range(MAX_FAILED_ATTEMPTS):
        client.post("/auth/login", json={"email": "victim@example.com", "password": "wrong"})

    # "victim" est verrouillé...
    resp = client.post("/auth/login", json={"email": "victim@example.com", "password": "Passw0rd!"})
    assert resp.status_code == 429

    # ... mais "other" peut toujours se connecter normalement.
    resp = client.post("/auth/login", json={"email": "other@example.com", "password": "Passw0rd!"})
    assert resp.status_code == 200
