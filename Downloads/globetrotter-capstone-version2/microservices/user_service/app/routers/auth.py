"""UserService authentication & profile routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import services, repositories
from app.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, ProfileUpdate, UserOut,
    Message,
)
from shared.jwt_utils import require_user, HTTPBearer

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


def to_user_out(user) -> dict:
    return services.serialize_user(user)


@router.post("/register", response_model=dict, status_code=201,
             summary="Register a new user")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = services.register_user(
            db, body.username, body.password, body.preferences
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "user registered successfully", **user}


@router.post("/login", response_model=TokenResponse,
             summary="Authenticate and return a JWT")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    try:
        return services.authenticate(db, body.username, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/admin/login", response_model=TokenResponse,
             summary="Admin login")
def admin_login(body: LoginRequest):
    try:
        return services.admin_login(body.username, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/users/me", response_model=UserOut, summary="Get current profile")
def get_me(credentials=Depends(bearer), db: Session = Depends(get_db)):
    username = None
    if credentials:
        from shared.jwt_utils import decode_token
        try:
            username = decode_token(credentials.credentials).get("sub")
        except Exception:
            username = None
    if not username:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    user = repositories.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return to_user_out(user)


@router.put("/users/me", response_model=dict, summary="Update own profile")
def update_me(body: ProfileUpdate, credentials=Depends(bearer),
              db: Session = Depends(get_db)):
    username = None
    if credentials:
        from shared.jwt_utils import decode_token
        try:
            username = decode_token(credentials.credentials).get("sub")
        except Exception:
            username = None
    if not username:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    data = body.model_dump(exclude_unset=True)
    try:
        return services.update_profile(db, username, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/users", response_model=list[UserOut], summary="List all users (admin)")
def list_users(credentials=Depends(bearer), db: Session = Depends(get_db)):
    from shared.jwt_utils import decode_token
    if not credentials:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    try:
        username = decode_token(credentials.credentials).get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token is missing or invalid")
    if username != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = repositories.get_all_users(db)
    return [to_user_out(u) for u in users]


# ---------------------------------------------------------------------------
# Internal endpoints (used by RecommendationService)
# ---------------------------------------------------------------------------

@router.get("/internal/users/{username}", response_model=dict,
            summary="[Internal] Get user preferences by username")
def internal_get_user(username: str, db: Session = Depends(get_db)):
    user = repositories.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user.username,
        "preferences": user.preferences or [],
        "is_admin": user.is_admin == "true",
    }
