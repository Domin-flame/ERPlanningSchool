import logging
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlmodel import Session

from app.database import create_db_and_tables, get_session
from app.email_service import send_password_reset_email
from app.models import (
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    UserCreate,
    UserRead,
    VALID_ROLES,
)
from app.redis_client import (
    blacklist_token,
    clear_failed_login,
    delete_reset_token,
    get_lock_ttl,
    get_reset_email,
    is_refresh_jti_used,
    is_token_blacklisted,
    lock_account,
    mark_refresh_jti_used,
    record_failed_login,
    store_reset_token,
    MAX_FAILED_ATTEMPTS,
)

# ── Configuration ────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24      # 24 h
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="CampusWorkflow — Auth Service",
    version="2.0.0",
    description="JWT auth + RBAC + Redis token blacklist + Email password reset",
)

_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://gateway:3000,http://localhost:5173",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    try:
        body = (await request.body()).decode("utf-8", errors="replace")
    except Exception:
        body = "<unreadable>"
    logger.error("Validation error %s %s — body=%s — %s", request.method, request.url, body, exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# ── Helpers JWT ──────────────────────────────────────────────

def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    # "jti" unique même si deux tokens sont émis dans la même seconde pour
    # le même utilisateur (sinon leur payload — et donc leur signature —
    # serait strictement identique).
    to_encode.update({"exp": expire, "type": "access", "jti": secrets.token_urlsafe(16)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _create_refresh_token(data: dict) -> str:
    """Émet un refresh token portant un identifiant unique ("jti").
    Ce jti est ce qui permet la rotation réelle : /auth/refresh le marque
    consommé dès qu'il est utilisé, empêchant toute réutilisation."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh", "jti": secrets.token_urlsafe(16)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> dict:
    """Decode + validate JWT + check Redis blacklist."""
    if is_token_blacklisted(token):
        raise HTTPException(status_code=401, detail="Token révoqué")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


def _get_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
) -> UserRead:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Header Authorization manquant")
    token = authorization[7:]
    payload = _decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Payload JWT invalide")

    row = session.execute(
        text("SELECT id, full_name, email, role, is_active FROM user_account WHERE id = :id"),
        {"id": user_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if not row[4]:  # is_active
        raise HTTPException(status_code=403, detail="Compte désactivé")

    return UserRead(id=int(row[0]), full_name=row[1], email=row[2], role=row[3])


# ── Health ───────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    return {"status": "healthy", "service": "auth"}

# ajouter des contraintes tels que :
      #le mot de passe doit contenir au moins une majuscule
      #le mot de passe doit contenir au moins une minuscule 
      #le mot de passe doit contenir au moins un signe : /*-@#
      #le mot de passe doit contenir un chiffre 
       

# ── Register ─────────────────────────────────────────────────

@app.post("/auth/register", response_model=UserRead, status_code=201, tags=["Auth"])
@app.post("/api/auth/register", response_model=UserRead, status_code=201, tags=["Auth"], include_in_schema=False)
def register(payload: UserCreate, session: Session = Depends(get_session)):
    # Validation du rôle
    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Rôle invalide. Valeurs autorisées : {sorted(VALID_ROLES)}",
        )
    existing = session.execute(
        text("SELECT id FROM user_account WHERE LOWER(email) = LOWER(:email) LIMIT 1"),
        {"email": payload.email},
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email déjà enregistré")

    hashed = _hash_password(payload.password)
    row = session.execute(
        text(
            "INSERT INTO user_account (full_name, email, hashed_password, role, is_active) "
            "VALUES (:full_name, :email, :hashed, :role, true) "
            "RETURNING id, full_name, email, role, created_at"
        ),
        {"full_name": payload.full_name, "email": payload.email, "hashed": hashed, "role": payload.role},
    ).first()
    session.commit()
    return UserRead(id=int(row[0]), full_name=row[1], email=row[2], role=row[3])


# ── Login ─────────────────────────────────────────────────────

@app.post("/auth/login", tags=["Auth"])
@app.post("/api/auth/login", tags=["Auth"], include_in_schema=False)
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    email = payload.email.lower()

    # ── Verrouillage de compte (OWASP API2:2023 — Broken Authentication) ──
    # On vérifie AVANT toute requête DB/bcrypt : un compte verrouillé refuse
    # systématiquement la connexion, même avec le bon mot de passe, jusqu'à
    # expiration du verrou.
    lock_ttl = get_lock_ttl(email)
    if lock_ttl > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Compte temporairement verrouillé après {MAX_FAILED_ATTEMPTS} "
                f"tentatives échouées. Réessayez dans {lock_ttl // 60 + 1} minute(s)."
            ),
        )

    row = session.execute(
        text(
            "SELECT id, full_name, email, hashed_password, role, is_active "
            "FROM user_account WHERE LOWER(email) = LOWER(:email) LIMIT 1"
        ),
        {"email": payload.email},
    ).first()

    if not row or not _verify_password(payload.password, row[3]):
        # Échec : on incrémente le compteur, et on verrouille si le seuil
        # est atteint. Le message reste générique ("Identifiants invalides")
        # pour ne pas révéler si l'email existe.
        attempts = record_failed_login(email)
        if attempts >= MAX_FAILED_ATTEMPTS:
            lock_account(email)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Compte verrouillé après {MAX_FAILED_ATTEMPTS} tentatives "
                    "échouées. Réessayez dans 15 minutes."
                ),
            )
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    if not row[5]:  # is_active
        raise HTTPException(status_code=403, detail="Compte désactivé")

    # Connexion réussie : on repart avec un compteur d'échecs propre.
    clear_failed_login(email)

    user_id = int(row[0])
    access_token = _create_access_token({"sub": row[2], "user_id": user_id, "role": row[4]})
    refresh_token = _create_refresh_token({"sub": row[2], "user_id": user_id, "role": row[4]})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserRead(id=user_id, full_name=row[1], email=row[2], role=row[4]),
    }


# ── Me ────────────────────────────────────────────────────────

@app.get("/auth/me", response_model=UserRead, tags=["Auth"])
@app.get("/api/auth/me", response_model=UserRead, tags=["Auth"], include_in_schema=False)
def get_me(user: UserRead = Depends(_get_current_user)):
    return user


@app.get("/auth/directory", tags=["Auth"])
@app.get("/api/auth/directory", tags=["Auth"], include_in_schema=False)
def get_directory(
    user: UserRead = Depends(_get_current_user),
    session: Session = Depends(get_session),
):
    """Annuaire minimal utilisé pour choisir un destinataire de message."""
    rows = session.execute(
        text("SELECT id, full_name, email, role FROM user_account WHERE is_active = true ORDER BY full_name")
    ).all()
    return [
        {"id": int(row[0]), "full_name": row[1], "email": row[2], "role": row[3]}
        for row in rows
    ]


@app.get("/auth/users", response_model=list[UserRead], tags=["Auth"])
@app.get("/api/auth/users", response_model=list[UserRead], tags=["Auth"], include_in_schema=False)
def list_users(
    status_filter: Optional[str] = None,
    admin: UserRead = Depends(_get_current_user),
    session: Session = Depends(get_session),
):
    if admin.role not in ("academic", "rh"):
        raise HTTPException(status_code=403, detail="Seuls RH et la Direction peuvent gérer les comptes")
    query = "SELECT id, full_name, email, role, is_active, created_at FROM user_account"
    params = {}
    if status_filter == "pending":
        query += " WHERE false"
    elif status_filter in ("active", "inactive"):
        query += " WHERE is_active = :is_active"
        params["is_active"] = status_filter == "active"
    query += " ORDER BY created_at DESC"
    return [UserRead(id=int(row[0]), full_name=row[1], email=row[2], role=row[3], is_active=row[4], created_at=row[5]) for row in session.execute(text(query), params).all()]


@app.patch("/auth/users/{account_id}", response_model=UserRead, tags=["Auth"])
@app.patch("/api/auth/users/{account_id}", response_model=UserRead, tags=["Auth"], include_in_schema=False)
def manage_user(
    account_id: int,
    action: str = Body(...),
    role: Optional[str] = Body(None),
    admin: UserRead = Depends(_get_current_user),
    session: Session = Depends(get_session),
):
    if admin.role not in ("academic", "rh"):
        raise HTTPException(status_code=403, detail="Seuls RH et la Direction peuvent gérer les comptes")
    if action not in ("approve", "reject", "activate", "deactivate", "change_role"):
        raise HTTPException(status_code=400, detail="Action de compte invalide")
    if action == "change_role" and role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Rôle invalide")
    updates = {"is_active": action in ("approve", "activate")}
    if action == "change_role":
        updates = {"role": role}
    assignments = ", ".join(f"{key} = :{key}" for key in updates)
    params = {**updates, "id": account_id}
    result = session.execute(text(f"UPDATE user_account SET {assignments} WHERE id = :id RETURNING id, full_name, email, role, is_active, created_at"), params).first()
    if not result:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    session.commit()
    return UserRead(id=int(result[0]), full_name=result[1], email=result[2], role=result[3], is_active=result[4], created_at=result[5])


# ── Refresh ───────────────────────────────────────────────────

@app.post("/auth/refresh", tags=["Auth"])
@app.post("/api/auth/refresh", tags=["Auth"], include_in_schema=False)
def refresh_token(payload: RefreshRequest, session: Session = Depends(get_session)):
    # NB: on ne réutilise pas _decode_token() ici, qui ne vérifie que la
    # blacklist des ACCESS tokens — les refresh tokens ont leur propre
    # mécanisme de révocation (rotation par "jti", ci-dessous).
    try:
        p = jwt.decode(payload.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token de refresh invalide ou expiré")

    if p.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresh attendu")

    jti = p.get("jti")
    user_id = p.get("user_id")
    email = p.get("sub")
    exp = p.get("exp", 0)

    # ── Rotation réelle : un refresh token ne peut être utilisé qu'UNE
    # seule fois. S'il a déjà servi (vol/replay), on le rejette — même
    # s'il n'est pas encore expiré.
    if not jti or is_refresh_jti_used(jti):
        raise HTTPException(
            status_code=401,
            detail="Ce refresh token a déjà été utilisé. Veuillez vous reconnecter.",
        )

    row = session.execute(
        text("SELECT role, is_active FROM user_account WHERE id = :id"), {"id": user_id}
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if not row[1]:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    # On marque immédiatement l'ancien refresh token comme consommé, avec
    # un TTL égal à sa durée de vie restante (inutile de le garder au-delà).
    remaining_ttl = max(0, int(exp - datetime.utcnow().timestamp()))
    mark_refresh_jti_used(jti, remaining_ttl or 1)

    new_access = _create_access_token({"sub": email, "user_id": user_id, "role": row[0]})
    new_refresh = _create_refresh_token({"sub": email, "user_id": user_id, "role": row[0]})

    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


# ── Logout (Redis blacklist) ───────────────────────────────────

@app.post("/auth/logout", tags=["Auth"])
@app.post("/api/auth/logout", tags=["Auth"], include_in_schema=False)
def logout(
    user: UserRead = Depends(_get_current_user),
    authorization: Optional[str] = Header(None),
    refresh_token: Optional[str] = Body(None, embed=True),
):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        # Calculer le TTL restant du token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            exp = payload.get("exp", 0)
            ttl = max(0, int(exp - datetime.utcnow().timestamp()))
            if ttl > 0:
                blacklist_token(token, ttl)
        except JWTError:
            pass

    # Le refresh token est optionnel : si le client le fournit au logout,
    # on le révoque aussi immédiatement (même mécanisme que la rotation),
    # pour qu'une session déconnectée ne puisse pas être ressuscitée.
    if refresh_token:
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            jti = payload.get("jti")
            exp = payload.get("exp", 0)
            ttl = max(0, int(exp - datetime.utcnow().timestamp()))
            if jti and ttl > 0:
                mark_refresh_jti_used(jti, ttl)
        except JWTError:
            pass

    return {"message": "Déconnecté avec succès"}


# ── Changement de mot de passe ────────────────────────────────

@app.post("/auth/password/change", tags=["Auth"])
@app.post("/api/auth/password/change", tags=["Auth"], include_in_schema=False)
def change_password(
    old_password: str = Body(...),
    new_password: str = Body(...),
    user: UserRead = Depends(_get_current_user),
    session: Session = Depends(get_session),
):
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit faire au moins 8 caractères")

    row = session.execute(
        text("SELECT hashed_password FROM user_account WHERE id = :id"), {"id": user.id}
    ).first()
    if not row or not _verify_password(old_password, row[0]):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")

    session.execute(
        text("UPDATE user_account SET hashed_password = :h WHERE id = :id"),
        {"h": _hash_password(new_password), "id": user.id},
    )
    session.commit()
    return {"message": "Mot de passe modifié avec succès"}


# ── Reset de mot de passe (email) ─────────────────────────────

@app.post("/auth/password/reset/request", tags=["Auth"])
@app.post("/api/auth/password/reset", tags=["Auth"], include_in_schema=False)
def request_password_reset(
    payload: PasswordResetRequest,
    session: Session = Depends(get_session),
):
    """
    Étape 1 : demande de reset.
    Génère un token sécurisé, le stocke dans Redis (TTL 1h), et envoie un email.
    Retourne toujours 200 pour ne pas révéler si l'email existe (sécurité).
    """
    row = session.execute(
        text("SELECT id, is_active FROM user_account WHERE LOWER(email) = LOWER(:email)"),
        {"email": payload.email},
    ).first()

    if row and row[1]:  # utilisateur existe et est actif
        reset_token = secrets.token_urlsafe(32)
        store_reset_token(payload.email.lower(), reset_token)
        sent = send_password_reset_email(payload.email, reset_token)
        if not sent:
            logger.warning("[RESET] Email non envoyé (SMTP non configuré) pour %s", payload.email)

    return {"message": "Si cet email est enregistré, un lien de réinitialisation a été envoyé"}


@app.post("/auth/password/reset/confirm", tags=["Auth"])
def confirm_password_reset(
    payload: PasswordResetConfirm,
    session: Session = Depends(get_session),
):
    """
    Étape 2 : confirmation du reset avec le token reçu par email.
    """
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit faire au moins 8 caractères")

    email = get_reset_email(payload.token)
    if not email:
        raise HTTPException(status_code=400, detail="Lien de réinitialisation invalide ou expiré")

    row = session.execute(
        text("SELECT id FROM user_account WHERE LOWER(email) = LOWER(:email)"), {"email": email}
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    session.execute(
        text("UPDATE user_account SET hashed_password = :h WHERE id = :id"),
        {"h": _hash_password(payload.new_password), "id": row[0]},
    )
    session.commit()
    delete_reset_token(payload.token)

    return {"message": "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter."}
