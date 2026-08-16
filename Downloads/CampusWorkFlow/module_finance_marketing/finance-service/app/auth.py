from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

bearer_scheme = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


class CurrentUser:
    def __init__(self, sub: str, role: str, user_id: int = None):
        self.sub = sub
        self.role = role
        self.user_id = user_id


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    sub = payload.get("sub")
    role = payload.get("role")
    user_id = payload.get("user_id")
    return CurrentUser(sub=sub, role=role, user_id=user_id)


def require_roles(allowed_roles: List[str]):
    allowed_set = {r.lower() for r in allowed_roles}

    def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role is None or user.role.lower() not in allowed_set:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rôle non autorisé pour cette action")
        return user

    return checker
