import os
from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, sub: str, role: str, user_id: Optional[int] = None, student_id: Optional[int] = None):
        self.sub = sub
        self.role = role
        self.user_id = user_id
        self.student_id = student_id


def decode_jwt_token(token: str) -> dict:
    secret = os.getenv("JWT_SECRET") or "dev-secret-change-me"
    alg = os.getenv("JWT_ALGORITHM") or "HS256"
    return jwt.decode(token, secret, algorithms=[alg])


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")
    try:
        payload = decode_jwt_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    sub = payload.get("sub")
    role = payload.get("role")
    user_id = payload.get("user_id")
    student_id = payload.get("student_id")
    return CurrentUser(sub=sub, role=role, user_id=user_id, student_id=student_id)


def require_role(allowed_roles: List[str]):
    def _require(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission refusée")
        return current_user

    return _require
