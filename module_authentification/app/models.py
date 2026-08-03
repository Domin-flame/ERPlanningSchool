from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class UserAccount(SQLModel, table=True):
    __tablename__ = "user_account"

    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: Optional[str] = "Student"
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)


class UserCreate(SQLModel):
    """Payload for user registration."""
    full_name: str
    email: str
    password: str
    role: str = "Student"


class LoginRequest(SQLModel):
    """Payload for user login (email + password only)."""
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
    phone: str = ""
    department: str = ""
    is_active: bool = True
    created_at: Optional[datetime] = None
