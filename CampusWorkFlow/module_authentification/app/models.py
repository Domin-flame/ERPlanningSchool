from datetime import datetime
from typing import Optional, Literal

from sqlmodel import SQLModel, Field


# Rôles valides de l'application
VALID_ROLES = frozenset({"academic", "professeur", "student", "rh", "finance", "marketing"})

RoleType = Literal["academic", "professeur", "student", "rh", "finance", "marketing"]


class UserAccount(SQLModel, table=True):
    __tablename__ = "user_account"

    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: str = Field(default="student")
    is_active: bool = Field(default=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)


class UserCreate(SQLModel):
    """Payload for user registration."""
    full_name: str
    email: str
    password: str
    role: RoleType = "student"


class LoginRequest(SQLModel):
    """Payload for user login."""
    email: str
    password: str


class RefreshRequest(SQLModel):
    """Payload for token refresh via JSON body."""
    refresh_token: str


class UserRead(SQLModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None


class PasswordResetRequest(SQLModel):
    email: str


class PasswordResetConfirm(SQLModel):
    token: str
    new_password: str
