"""
Ce service NE génère PAS de tokens — il fait confiance au service Auth
(Week 1) qui les a émis, et se contente de les VÉRIFIER (même secret,
même algorithme). C'est le principe même d'une architecture microservices
avec JWT : chaque service vérifie localement, sans rappeler le service Auth.
"""
from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import JWT_SECRET, JWT_ALGORITHM

bearer_scheme = HTTPBearer()


class CurrentUser:
    def __init__(self, sub: str, role: str, email: str = None):
        self.sub = sub          # auth_user_id
        self.role = role        # ex: "admin", "hr", "student"
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
    return CurrentUser(sub=sub, role=role, email=payload.get("email"))


def require_roles(allowed_roles: List[str]):
    """Dépendance factory pour le RBAC — ex: require_roles(['Admin', 'Staff'])
    (comparaison insensible à la casse, pour matcher les rôles émis par le
    service d'authentification : 'Super Admin', 'Admin', 'Staff', 'Student')."""
    allowed_normalized = {r.lower() for r in allowed_roles}

    def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role.lower() not in allowed_normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rôle '{user.role}' non autorisé pour cette action",
            )
        return user

    return checker
