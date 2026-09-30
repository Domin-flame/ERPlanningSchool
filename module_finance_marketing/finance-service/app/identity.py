"""Résolution de l'identité « étudiant » d'un utilisateur authentifié.

Le gateway transmet X-User-ID (id du compte auth-service) et X-User-Email.
Le cache student_ref, lui, contient l'id_person de l'academic-service :
les deux identifiants ne correspondent pas. academic-service est la source
de vérité (il identifie l'étudiant par email), on l'interroge donc pour
obtenir l'id_student de l'utilisateur connecté.
"""
import json
import logging
import os
import urllib.error
import urllib.request
from typing import Optional

logger = logging.getLogger(__name__)

ACADEMIC_SERVICE_URL = os.getenv("ACADEMIC_SERVICE_URL", "http://academic-service:8002").rstrip("/")


def resolve_student_id(email: Optional[str], user_id: Optional[int], timeout: float = 3.0) -> Optional[int]:
    """Retourne l'id_student académique de l'utilisateur, ou None si inconnu."""
    if not email:
        return None
    request = urllib.request.Request(
        f"{ACADEMIC_SERVICE_URL}/student/me/overview",
        headers={
            "X-User-Email": email,
            "X-User-Role": "student",
            "X-User-ID": str(user_id or ""),
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 (URL interne configurée)
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        logger.warning("[FINANCE] Résolution étudiant impossible pour %s : %s", email, exc)
        return None
    student = payload.get("student") if isinstance(payload, dict) else None
    student_id = student.get("student_id") if isinstance(student, dict) else None
    return int(student_id) if student_id is not None else None
