from fastapi import FastAPI, Depends, HTTPException, status, Request, Header, Body
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime, timedelta
from sqlmodel import Session
from sqlalchemy import text
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional
import os

from app.database import create_db_and_tables, get_session
from app.models import UserCreate, LoginRequest, RefreshRequest, UserRead

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="module_authentification")

# CORS : permet au frontend/gateway d'appeler ce service directement en dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    try:
        body = (await request.body()).decode("utf-8", errors="replace")
    except Exception:
        body = "<could not read body>"
    logging.error("Validation error for %s %s - body=%s - errors=%s", request.method, request.url, body, exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health")
def health():
    return {"status": "healthy", "service": "module_authentification"}


def _verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str):
    """Décoder et valider un token JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def _get_current_user(authorization: Optional[str] = Header(None), session: Session = Depends(get_session)):
    """Extraire l'utilisateur courant du token Bearer."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authorization header")

    token = authorization[7:]
    payload = _decode_token(token)
    user_id = payload.get("user_id")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    row = session.execute(
        text("SELECT id, full_name, email, role FROM user_account WHERE id = :id"), {"id": user_id}
    ).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserRead(id=int(row[0]), full_name=row[1], email=row[2], role=row[3], phone="", department="", is_active=True, created_at=None)


@app.post("/api/auth/register", response_model=UserRead)
def register(payload: UserCreate, session: Session = Depends(get_session)):
    existing = session.execute(
        text("SELECT id FROM user_account WHERE LOWER(email) = LOWER(:email) LIMIT 1"), {"email": payload.email}
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    hashed = _hash_password(payload.password)
    row = session.execute(
        text(
            "INSERT INTO user_account (full_name, email, hashed_password, role) "
            "VALUES (:full_name, :email, :hashed, :role) "
            "RETURNING id, full_name, email, role, created_at"
        ),
        {"full_name": payload.full_name, "email": payload.email, "hashed": hashed, "role": payload.role},
    ).first()
    session.commit()
    return UserRead(id=int(row[0]), full_name=row[1], email=row[2], role=row[3], phone="", department="", is_active=True, created_at=row[4])


@app.post("/auth/register", response_model=UserRead)
def register_alias(payload: UserCreate, session: Session = Depends(get_session)):
    return register(payload, session)


@app.post("/api/auth/login")
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    row = session.execute(
        text("SELECT id, full_name, email, hashed_password, role FROM user_account WHERE LOWER(email) = LOWER(:email) LIMIT 1"),
        {"email": payload.email},
    ).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not _verify_password(payload.password, row[3]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user_id = int(row[0])
    access_token = _create_access_token({"sub": row[2], "user_id": user_id, "role": row[4]})
    refresh_token = _create_refresh_token({"sub": row[2], "user_id": user_id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserRead(id=user_id, full_name=row[1], email=row[2], role=row[4], phone="", department="", is_active=True, created_at=None)
    }


@app.post("/auth/login")
def login_alias(payload: LoginRequest, session: Session = Depends(get_session)):
    return login(payload, session)


@app.get("/api/auth/me", response_model=UserRead)
def get_current_user_info(authorization: Optional[str] = Header(None), session: Session = Depends(get_session)):
    """Get current user info from token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authorization header")
    token = authorization[7:]
    payload = _decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    row = session.execute(
        text("SELECT id, full_name, email, role FROM user_account WHERE id = :id"), {"id": user_id}
    ).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserRead(id=int(row[0]), full_name=row[1], email=row[2], role=row[3], phone="", department="", is_active=True, created_at=None)


@app.get("/auth/me", response_model=UserRead)
def get_current_user_info_alias(authorization: Optional[str] = Header(None), session: Session = Depends(get_session)):
    return get_current_user_info(authorization, session)


@app.post("/api/auth/refresh")
def refresh_token(payload: RefreshRequest, session: Session = Depends(get_session)):
    """Refresh access token using refresh token sent in JSON body."""
    token = payload.refresh_token
    p = _decode_token(token)

    if p.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not a refresh token")

    user_id = p.get("user_id")
    email = p.get("sub")

    row = session.execute(text("SELECT role FROM user_account WHERE id = :id"), {"id": user_id}).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    role = row[0]
    new_access_token = _create_access_token({"sub": email, "user_id": user_id, "role": role})
    new_refresh_token = _create_refresh_token({"sub": email, "user_id": user_id})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@app.post("/auth/refresh")
def refresh_token_alias(payload: RefreshRequest, session: Session = Depends(get_session)):
    return refresh_token(payload, session)


@app.post("/api/auth/logout")
def logout(user: UserRead = Depends(_get_current_user)):
    """Logout endpoint (token invalidation would be handled client-side or with token blacklist)."""
    return {"message": "Logged out successfully"}


@app.post("/auth/logout")
def logout_alias(user: UserRead = Depends(_get_current_user)):
    return logout(user)


@app.post("/api/auth/password/change")
def change_password(
    old_password: str = Body(...),
    new_password: str = Body(...),
    user: UserRead = Depends(_get_current_user),
    session: Session = Depends(get_session)
):
    """Change password for current user."""
    row = session.execute(
        text("SELECT hashed_password FROM user_account WHERE id = :id"), {"id": user.id}
    ).first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not _verify_password(old_password, row[0]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid current password")

    if len(new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    new_hash = _hash_password(new_password)
    session.execute(
        text("UPDATE user_account SET hashed_password = :hashed WHERE id = :id"),
        {"hashed": new_hash, "id": user.id}
    )
    session.commit()

    return {"message": "Password changed successfully"}


@app.post("/auth/password/change")
def change_password_alias(
    old_password: str = Body(...),
    new_password: str = Body(...),
    user: UserRead = Depends(_get_current_user),
    session: Session = Depends(get_session)
):
    return change_password(old_password, new_password, user, session)


@app.post("/api/auth/password/reset")
def reset_password_request(email: str = Body(..., embed=True), session: Session = Depends(get_session)):
    """Request password reset (sends email link - simulated)."""
    row = session.execute(
        text("SELECT id FROM user_account WHERE LOWER(email) = LOWER(:email)"), {"email": email}
    ).first()

    if not row:
        # Don't reveal if email exists (security best practice)
        return {"message": "If email exists, reset link will be sent"}

    # In production: generate reset token, store in DB, send email
    return {"message": "Password reset link sent to email"}


@app.post("/auth/password/reset")
def reset_password_request_alias(email: str = Body(..., embed=True), session: Session = Depends(get_session)):
    return reset_password_request(email, session)
