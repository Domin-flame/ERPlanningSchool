"""
Shared JWT utilities for all GlobeTrotter microservices.

Services validate tokens signed with the same SECRET_KEY so a user can
authenticate once (via the gateway / user service) and be recognised by
every service.
"""
import os
import datetime
from functools import wraps

import jwt
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Single source of truth for the secret key. In production this MUST be
# overridden via the environment variable on every service.
def get_secret() -> str:
    return os.environ.get("SECRET_KEY", "globetrotter-secret-change-in-prod")


def create_token(username: str, extra: dict | None = None) -> str:
    """Return a signed JWT for *username* valid for 24 hours."""
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": username,
        "iat": now,
        "exp": now + datetime.timedelta(hours=24),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, get_secret(), algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and verify *token*. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, get_secret(), algorithms=["HS256"])


def get_current_username(request: Request) -> str | None:
    """Extract and validate the JWT from the Authorization header.

    Returns the username (subject claim) or None if missing/invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


bearer_scheme = HTTPBearer(auto_error=False)


async def require_user(credentials: HTTPAuthorizationCredentials | None) -> str:
    """FastAPI dependency that returns the authenticated username.

    Raises 401 if the token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        payload = decode_token(credentials.credentials)
        return payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")


def require_admin(credentials: HTTPAuthorizationCredentials | None) -> str:
    """FastAPI dependency that requires the admin role."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        payload = decode_token(credentials.credentials)
        username = payload.get("sub")
        if username != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
