"""
JWT & RLS Context Management
============================

Module partagé pour:
1. Décoder et valider les JWT émis par identity-service
2. Mapper les rôles identity vers les rôles RLS Postgres  
3. Gérer le contexte RLS par requête (SET LOCAL app.current_roles, app.current_student_id)

À utiliser dans:
- gateway: décoder le JWT et le passer via X-User-* headers
- finance-service, academic-service, etc: lire le JWT et configurer le contexte RLS
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Request, Depends
from sqlmodel import Session
from sqlalchemy import text


# Configuration JWT (identique à identity-service)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


class JWTContext:
    """Contexte d'authentification extrait d'un JWT"""
    
    def __init__(
        self,
        user_id: int,
        email: str,
        role: str,  # Rôle identity: 'super_admin', 'admin', 'staff', 'student'
        student_id: Optional[int] = None,  # Mappé depuis user_id si disponible
    ):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.student_id = student_id
    
    @property
    def rls_roles(self) -> str:
        """
        Convertit le rôle identity en rôle RLS Postgres (minuscules).
        
        Mapping (À DÉCIDER en équipe — c'est un exemple):
        - super_admin -> super_admin  (all access)
        - admin -> admin              (tenant access, all departments)
        - staff -> finance_staff      (si staff = staff finance; à raffiner)
        - student -> student          (own data only)
        """
        mapping = {
            "super_admin": "super_admin",
            "admin": "admin",
            "staff": "finance_staff",
            "student": "student",
        }
        return mapping.get(self.role.lower(), "student")


def decode_jwt(token: str) -> JWTContext:
    """
    Décode et valide un JWT émis par identity-service.
    
    Payload attendu:
    {
        "user_id": 123,
        "email": "user@example.com", 
        "role": "student",
        "student_id": 456,  # Optionnel
        "exp": 1234567890
    }
    
    Raises:
        HTTPException: 401 si token invalide/expiré
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    user_id = payload.get("user_id")
    email = payload.get("email")
    role = payload.get("role", "student")
    student_id = payload.get("student_id")
    
    if not user_id or not email:
        raise HTTPException(status_code=401, detail="Token incomplet")
    
    return JWTContext(
        user_id=user_id,
        email=email,
        role=role,
        student_id=student_id,
    )


def extract_jwt_from_request(request: Request) -> Optional[str]:
    """Extrait le JWT du header Authorization"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:]  # Retire "Bearer "


def get_jwt_context(request: Request) -> JWTContext:
    """
    Dépendance FastAPI pour injecter le contexte JWT dans les endpoints.
    
    Usage:
        @app.get("/invoices")
        def list_invoices(jwt_context: JWTContext = Depends(get_jwt_context)):
            # jwt_context.user_id, jwt_context.rls_roles, etc.
    """
    token = extract_jwt_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Pas de token Authorization")
    return decode_jwt(token)


def apply_rls_context(session: Session, jwt_context: JWTContext) -> None:
    """
    Configure le contexte RLS Postgres pour la transaction en cours (SET LOCAL).
    
    À appeler en début de requête pour limiter l'accès aux données
    conformément au rôle et aux permissions RLS.
    
    Usage dans un service:
        @app.get("/invoices")
        def list_invoices(
            session: Session = Depends(get_session),
            jwt_context: JWTContext = Depends(get_jwt_context),
        ):
            apply_rls_context(session, jwt_context)
            # Requêtes RLS vont s'exécuter avec SET LOCAL app.current_roles = 'student'
    
    Note: SET LOCAL = portée transaction (annulée après commit/rollback).
          À choisir entre SET (session/connexion) et SET LOCAL selon le cas.
    """
    rls_roles = jwt_context.rls_roles
    
    # SET LOCAL — valide pour la transaction en cours seulement
    # (ce qui correspond à 1 requête HTTP puisque get_session() commence une txn)
    session.exec(text(f"SET LOCAL app.current_roles = '{rls_roles}'"))
    
    # Si student_id est connu, on peut aussi le passer au RLS
    # pour les policies qui vérifient id_student == app.current_student_id
    if jwt_context.student_id is not None:
        session.exec(text(f"SET LOCAL app.current_student_id = {jwt_context.student_id}"))


def create_jwt_token(
    user_id: int,
    email: str,
    role: str,
    student_id: Optional[int] = None,
) -> str:
    """
    Crée un JWT (utilisé par identity-service lors du login).
    
    Args:
        user_id: ID de l'utilisateur (identity_db.user_account.id)
        email: Email de l'utilisateur
        role: Rôle (super_admin, admin, staff, student)
        student_id: ID étudiant mappé (optionnel)
    
    Returns:
        Token JWT signé
    """
    now = datetime.utcnow()
    expiration = now + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": expiration,
        "iat": now,
    }
    
    if student_id is not None:
        payload["student_id"] = student_id
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ============================================================================
# QUESTIONS À TRANCHER EN ÉQUIPE (Semaine 3/4)
# ============================================================================

"""
Question 1: Mapping rôles identity → rôles RLS Postgres

Actuellement hardcodé en `JWTContext.rls_roles`:
  super_admin (identity) → super_admin (RLS)  ✓ Clear
  admin (identity) → admin (RLS)              ✓ Clear
  staff (identity) → finance_staff (RLS)      ? À clarifier
    - Est-ce que "staff" = "staff finance" ou d'autres départements ?
    - Y a-t-il un "academic_staff" distinct de "finance_staff" ?
  student (identity) → student (RLS)          ✓ Clear

Action: Valider ce mapping avec l'équipe & mettre à jour `JWTContext.rls_roles`


Question 2: User.id (identity) ↔ id_student (finance/academic)

Actuellement: student_id est dans le JWT payload (supposé explicite).
Alternatives:
  a) Lookup table user_ref dans identity_db pour traduire User.id → id_student
  b) Cache côté finance-service (comme StudentRef actuellement)
  c) Passer directement dans le JWT au login (simple mais moins flexible)

Action: Décider avant Semaine 4 car ça impacte:
  - La création du JWT lors du login (identity-service)
  - L'endpoint POST /student-ref (à remplacer ou à garder pour sync manuelle)
  - La configuration RLS (SET LOCAL app.current_student_id)


Question 3: Consumer RabbitMQ student_ref (Semaine 4)

Actuellement: POST /student-ref endpoint manuel.
Semaine 4: Remplacer par consumer d'événements academic-service:
  - Academic publie academic.student.created / academic.student.updated
  - Finance service écoute et met à jour StudentRef cache local
  - Permet la synchronisation automatique sans endpoint manuel

Action: Planifier l'architecture RabbitMQ (exchanges, queues, routing keys)
        au cours de Semaine 3 pour être prêt en Semaine 4.
"""
