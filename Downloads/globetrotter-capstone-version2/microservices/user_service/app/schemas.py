"""UserService Pydantic v2 schemas for request/response validation."""
from typing import Optional, List
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)
    preferences: List[str] = Field(default_factory=list)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    token: str
    username: str
    is_admin: bool = False


class ProfileUpdate(BaseModel):
    preferences: Optional[List[str]] = None
    avatar: Optional[str] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    preferences: List[str] = []
    avatar: str = ""
    is_admin: bool = False


class VisitedAdd(BaseModel):
    destination_name: str


class FavoriteNoteIn(BaseModel):
    destination_name: str
    note: str = ""
    visit_date: Optional[str] = None
    companions: str = ""
    budget: Optional[float] = None


class FavoriteNoteOut(BaseModel):
    note: str = ""
    visit_date: Optional[str] = None
    companions: str = ""
    budget: Optional[float] = None
    updated_at: str = ""


class Message(BaseModel):
    message: str
