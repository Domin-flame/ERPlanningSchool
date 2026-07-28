from enum import Enum

from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    admin = "Admin"
    student = "Student"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: UserRole = Field(default=UserRole.student)


class UserCreate(SQLModel):
    name: str
    email: str
    password: str
    role: UserRole = UserRole.student


class UserLogin(SQLModel):
    email: str
    password: str


class UserRead(SQLModel):
    id: int
    name: str
    email: str
    role: UserRole


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

