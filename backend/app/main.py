from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from .database import create_db_and_tables, engine, get_session
from .models import Token, User, UserCreate, UserLogin, UserRead, UserRole
from .security import create_access_token, decode_access_token, hash_password, verify_password


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def seed_users(session: Session) -> None:
    existing_admin = session.exec(select(User).where(User.email == "admin@campus.local")).first()
    existing_student = session.exec(select(User).where(User.email == "student@campus.local")).first()

    if not existing_admin:
        session.add(
            User(
                name="Campus Admin",
                email="admin@campus.local",
                hashed_password=hash_password("Admin123!"),
                role=UserRole.admin,
            )
        )

    if not existing_student:
        session.add(
            User(
                name="Campus Student",
                email="student@campus.local",
                hashed_password=hash_password("Student123!"),
                role=UserRole.student,
            )
        )

    session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    with Session(engine) as session:
        seed_users(session)
    yield


app = FastAPI(title="CampusWorkflow Auth API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.exec(select(User).where(User.email == email)).first()


def to_user_read(user: User) -> UserRead:
    return UserRead(id=user.id, name=user.name, email=user.email, role=user.role)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expire",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token incomplet")

    user = get_user_by_email(session, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces reserve aux Admins",
        )
    return current_user


@app.get("/")
def health_check():
    return {"status": "ok", "service": "auth"}


@app.post("/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, session: Session = Depends(get_session)):
    existing_user = get_user_by_email(session, payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email deja utilise")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return to_user_read(user)


@app.post("/auth/login", response_model=Token)
def login(payload: UserLogin, session: Session = Depends(get_session)):
    user = get_user_by_email(session, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    access_token = create_access_token(subject=user.email, role=user.role.value, user_id=user.id)
    return Token(access_token=access_token, user=to_user_read(user))


@app.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return to_user_read(current_user)


@app.get("/student/profile")
def student_profile(current_user: User = Depends(get_current_user)):
    return {
        "message": f"Bienvenue {current_user.name}",
        "role": current_user.role,
    }


@app.get("/admin/secret")
def admin_secret(current_user: User = Depends(require_admin)):
    return {
        "message": "Page protegee visible uniquement par les Admins",
        "admin": current_user.email,
    }
