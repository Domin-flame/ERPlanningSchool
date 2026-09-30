"""
Tests unitaires du service de pointage par QR code — app/services/qr_service.py.
"""
import base64
from datetime import datetime, timedelta

import pytest
from jose import jwt

from app.config import JWT_ALGORITHM, JWT_SECRET
from app.services.qr_service import generate_attendance_qr, validate_qr_token


def test_generate_attendance_qr_returns_base64_png_data_uri():
    data_uri = generate_attendance_qr("employee-123")
    assert data_uri.startswith("data:image/png;base64,")
    # Le contenu doit être un base64 valide et non vide
    encoded = data_uri.split(",", 1)[1]
    decoded = base64.b64decode(encoded)
    assert len(decoded) > 0
    assert decoded[:8] == b"\x89PNG\r\n\x1a\n"  # signature PNG


def test_validate_qr_token_roundtrip():
    """Le token encodé DANS le QR doit être décodable et renvoyer le bon
    employee_id (on ne peut pas scanner l'image ici, donc on reproduit
    l'encodage JWT sous-jacent — c'est la même logique que celle utilisée
    par generate_attendance_qr)."""
    payload = {
        "employee_id": "employee-abc",
        "purpose": "attendance",
        "exp": datetime.utcnow() + timedelta(minutes=5),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    assert validate_qr_token(token) == "employee-abc"


def test_validate_qr_token_rejects_expired_token():
    payload = {
        "employee_id": "employee-xyz",
        "purpose": "attendance",
        "exp": datetime.utcnow() - timedelta(minutes=1),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    with pytest.raises(ValueError):
        validate_qr_token(token)


def test_validate_qr_token_rejects_wrong_purpose():
    """Un JWT valide mais émis pour un AUTRE usage (ex: un token de login)
    ne doit jamais être accepté comme QR de pointage."""
    payload = {
        "employee_id": "employee-xyz",
        "purpose": "something_else",
        "exp": datetime.utcnow() + timedelta(minutes=5),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    with pytest.raises(ValueError):
        validate_qr_token(token)


def test_validate_qr_token_rejects_tampered_signature():
    token = jwt.encode(
        {"employee_id": "employee-abc", "purpose": "attendance",
         "exp": datetime.utcnow() + timedelta(minutes=5)},
        "wrong-secret",
        algorithm=JWT_ALGORITHM,
    )
    with pytest.raises(ValueError):
        validate_qr_token(token)
