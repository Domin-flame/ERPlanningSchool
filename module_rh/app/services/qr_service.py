"""
Pointage par QR code.

Principe :
- Chaque employé a un QR "badge" qui encode un JWT COURT signé
  (employee_id + expiration), différent du token de login.
- L'employé (ou un agent) scanne ce QR avec un lecteur/appli, le texte
  décodé est envoyé à POST /attendance/scan.
- Le service vérifie la signature + l'expiration avant d'enregistrer
  le pointage. Cela empêche quelqu'un de fabriquer un faux QR à la main.
"""
import base64
import io
from datetime import datetime, timedelta

import qrcode
from jose import jwt, JWTError

from app.config import JWT_SECRET, JWT_ALGORITHM

QR_TOKEN_VALIDITY_MINUTES = 5  # le QR "tourne" toutes les 5 minutes


def generate_attendance_qr(employee_id: str) -> str:
    """Retourne une image QR encodée en base64 (PNG), prête à afficher
    dans le frontend ou à imprimer sur un badge."""
    payload = {
        "employee_id": employee_id,
        "purpose": "attendance",
        "exp": datetime.utcnow() + timedelta(minutes=QR_TOKEN_VALIDITY_MINUTES),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    img = qrcode.make(token)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def validate_qr_token(token: str) -> str:
    """Décode et vérifie le token scanné, retourne l'employee_id.
    Lève une ValueError si invalide/expiré."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise ValueError("QR code invalide ou expiré")

    if payload.get("purpose") != "attendance":
        raise ValueError("Ce QR code n'est pas un QR de pointage")

    return payload["employee_id"]
