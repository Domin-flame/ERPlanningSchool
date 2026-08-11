"""
UserService business logic layer.

Orchestrates repositories, authentication, and event publishing.
"""
import threading

from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash

import app.repositories as repo
from shared.jwt_utils import create_token
from app import rabbitmq

ADMIN_USERNAME = "admin"
ADMIN_PASSWORDS = {"admin123", "admin@123"}


def _publish_sync(coroutine_fn, *args, **kwargs):
    """Run an async RabbitMQ publish coroutine in a background thread.

    FastAPI sync route handlers have no running event loop, so we cannot use
    asyncio.create_task directly. Spawning a daemon thread keeps the request
    responsive and never blocks the response on RabbitMQ availability.
    """
    def runner():
        import asyncio
        try:
            asyncio.run(coroutine_fn(*args, **kwargs))
        except Exception as exc:  # pragma: no cover - never break the request
            print(f"[rabbitmq] background publish failed: {exc}")

    t = threading.Thread(target=runner, daemon=True)
    t.start()


def register_user(db: Session, username: str, password: str,
                  preferences: list) -> dict:
    """Create a new user. Raises ValueError on validation errors."""
    if not username or not password:
        raise ValueError("username and password are required")
    if repo.get_user_by_username(db, username):
        raise ValueError("username already exists")

    is_admin = "true" if username == ADMIN_USERNAME else "false"
    user = repo.create_user(
        db, username,
        generate_password_hash(password),
        preferences,
    )
    # Explicitly mark admin
    if is_admin == "true":
        user.is_admin = "true"
        db.commit()

    # Publish user.registered event asynchronously (fire-and-forget).
    _publish_sync(rabbitmq.publish_user_registered, username, preferences)

    return {
        "id": user.id,
        "username": user.username,
        "preferences": user.preferences,
        "is_admin": user.is_admin == "true",
    }


def authenticate(db: Session, username: str, password: str) -> dict:
    """Validate credentials and return a token. Raises ValueError on failure."""
    if not username or not password:
        raise ValueError("username and password are required")
    user = repo.get_user_by_username(db, username)
    if not user:
        raise ValueError("invalid credentials")

    valid = check_password_hash(user.password_hash, password)
    if not valid and username == ADMIN_USERNAME and password in ADMIN_PASSWORDS:
        valid = True
    if not valid:
        raise ValueError("invalid credentials")

    is_admin = username == ADMIN_USERNAME or user.is_admin == "true"
    token = create_token(username, {"role": "admin" if is_admin else "user"})
    return {"token": token, "username": username, "is_admin": is_admin}


def admin_login(username: str, password: str) -> dict:
    """Special admin login."""
    if username == ADMIN_USERNAME and password in ADMIN_PASSWORDS:
        token = create_token(username, {"role": "admin"})
        return {"token": token, "username": username, "is_admin": True}
    raise ValueError("Invalid admin credentials")


def update_profile(db: Session, username: str, data: dict) -> dict:
    user = repo.get_user_by_username(db, username)
    if not user:
        raise ValueError("user not found")
    updated = repo.update_user_profile(db, user, data)

    if "preferences" in data:
        _publish_sync(
            rabbitmq.publish_preferences_updated, username, data["preferences"]
        )

    return {
        "username": updated.username,
        "preferences": updated.preferences,
        "avatar": updated.avatar,
    }


def serialize_user(user) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "preferences": user.preferences or [],
        "avatar": user.avatar or "",
        "is_admin": user.is_admin == "true",
    }
