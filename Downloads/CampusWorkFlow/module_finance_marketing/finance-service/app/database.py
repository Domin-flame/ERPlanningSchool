import os
from functools import lru_cache
from jose import JWTError, jwt

from sqlalchemy import text
from sqlmodel import Session, create_engine

# finance_db est une base DEDIEE a ce service (database-per-service).
# Le schema (tables, CHECK constraints, colonnes generees, policies RLS)
# est cree par database/finance-service/init/*.sql au demarrage du
# conteneur Postgres - PAS par SQLModel.metadata.create_all().

# DATABASE_URL est la variable définie par docker-compose ; on garde
# FINANCE_DATABASE_URL en repli pour compat avec d'anciens déploiements.
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv(
    "FINANCE_DATABASE_URL",
    "postgresql://campus_user:campus_pass@localhost:5432/finance_db",
)
DATABASE_SCHEMA = os.getenv("DATABASE_SCHEMA", "public")

_connect_args = {}
if DATABASE_URL.startswith("postgresql") and DATABASE_SCHEMA:
    _connect_args = {"options": f"-csearch_path={DATABASE_SCHEMA},public"}
elif DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, connect_args=_connect_args)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"


@lru_cache(maxsize=128)
def _get_jwt_secret():
    return JWT_SECRET


def set_rls_context(session: Session, token: str = None):
    """
    Décode le JWT et définit le contexte RLS pour PostgreSQL.
    Si pas de token, utilise un contexte par défaut pour la compatibilité.
    """
    if session.get_bind().dialect.name != "postgresql":
        # Les commandes SET app.* sont des GUC PostgreSQL ; inutiles/invalides
        # sur un autre backend (ex: sqlite en tests).
        return
    if not token:
        session.exec(text("SET app.current_roles = 'finance_staff'"))
        return
    
    try:
        # Décoder le JWT (même secret que le service Auth)
        decoded = jwt.decode(token, _get_jwt_secret(), algorithms=[ALGORITHM])
        user_id = decoded.get("user_id")
        role = decoded.get("role", "student").lower()
        
        # Mapper les rôles app vers les rôles RLS PostgreSQL
        rls_role = "finance_staff"  # Par défaut
        if role in ("admin", "super admin"):
            rls_role = "finance_admin"
        elif role == "staff":
            rls_role = "finance_staff"
        else:
            rls_role = "student"
        
        # Définir le contexte RLS pour cette session
        session.exec(text(f"SET app.current_roles = '{rls_role}'"))
        if user_id:
            session.exec(text(f"SET app.current_user_id = {user_id}"))
    except (JWTError, AttributeError):
        # Token invalide ou manquant : utiliser context par défaut
        session.exec(text("SET app.current_roles = 'student'"))


def get_session(token: str = None):
    """
    Session factory qui accepte un token JWT optionnel.
    Le token est décrypté et utilisé pour configurer le contexte RLS de PostgreSQL.
    """
    with Session(engine) as session:
        set_rls_context(session, token)
        yield session


def get_session_with_context(user_role: str = "student", user_id: int = None):
    """
    Session factory alternative pour les tests : configure le contexte directement
    sans passer par JWT.
    """
    with Session(engine) as session:
        role_map = {
            "admin": "finance_admin",
            "staff": "finance_staff",
            "student": "student"
        }
        rls_role = role_map.get(user_role.lower(), "student")
        session.exec(text(f"SET app.current_roles = '{rls_role}'"))
        if user_id:
            session.exec(text(f"SET app.current_user_id = {user_id}"))
        yield session