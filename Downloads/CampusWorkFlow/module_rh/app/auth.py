"""
Ce service NE génère PAS de tokens — il fait confiance au service Auth
qui les a émis, et se contente de les VÉRIFIER (même secret, même algorithme).
C'est le principe d'une architecture microservices avec JWT.

Rôles reconnus (alignés avec le frontend et le service auth) :
  academic   — Direction (accès total)
  professeur — Enseignant (accès lecture académique + sa propre fiche RH)
  student    — Étudiant (pas d'accès RH)
  rh         — Responsable RH (accès total module RH)
  finance    — Finance (lecture employés pour calcul paie)
  marketing  — Marketing (pas d'accès RH)
"""
from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import JWT_SECRET, JWT_ALGORITHM

bearer_scheme = HTTPBearer()

# Constantes RBAC partagées entre les routers
HR_ADMIN_ROLES = {"academic", "rh"}
HR_READ_ROLES  = {"academic", "rh", "finance", "professeur"}


class CurrentUser:
    def __init__(self, sub: str, role: str, user_id: int = None, email: str = None):
        self.sub = sub          # email (champ "sub" du JWT)
        self.role = role        # ex: "academic", "rh", "student"…
        self.user_id = user_id
        self.email = email


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
        )

    sub = payload.get("sub")
    role = payload.get("role")
    if sub is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token mal formé (sub/role manquant)",
        )
    return CurrentUser(
        sub=sub,
        role=role,
        user_id=payload.get("user_id"),
        email=sub,
    )


def require_roles(allowed_roles: List[str]):
    """Dépendance factory pour le RBAC.
    Exemple : require_roles(['academic', 'rh'])
    Rôles valides : academic | professeur | student | rh | finance | marketing
    """
    allowed_set = {r.lower() for r in allowed_roles}

    def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role.lower() not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rôle '{user.role}' non autorisé pour cette action",
            )
        return user

    return checker
