import os

from sqlalchemy import text
from sqlmodel import Session, create_engine

# finance_db est une base DEDIEE a ce service (database-per-service).
# Le schema (tables, CHECK constraints, colonnes generees, policies RLS)
# est cree par database/finance-service/init/*.sql au demarrage du
# conteneur Postgres - PAS par SQLModel.metadata.create_all().

DATABASE_URL = os.getenv(
    "FINANCE_DATABASE_URL",
    "postgresql://app_finance_service:change_me_app@localhost:5435/finance_db",
)

engine = create_engine(DATABASE_URL, echo=False)


def get_session():
    """
    ⚠️ TEMPORAIRE — le schéma RLS (03_rls.sql) exige que la variable de
    session Postgres `app.current_roles` soit définie pour autoriser
    les écritures (voir invoice_owner_or_finance_staff, etc.).

    Tant que la propagation du JWT identity-service -> rôle Postgres
    n'est pas décidée en équipe (mapping Admin/Student -> admin/
    finance_staff/super_admin, et User.id -> id_student), on fixe le
    contexte à 'finance_staff' pour permettre le développement et les
    tests de ce service isolément.

    On utilise SET (portée session/connexion) plutôt que SET LOCAL
    (portée transaction) car certains endpoints font plusieurs
    commits successifs dans une même requête HTTP (ex: create_invoice
    commit la facture puis chaque ligne séparément) — SET LOCAL serait
    perdu après le premier commit. SET reste valable pour toute la
    durée où cette connexion est empruntée au pool par cette session.

    À REMPLACER par un contexte dérivé du token JWT (SET LOCAL, par
    requête) dès que le groupe aura tranché ce mapping (Semaine 3/4) —
    voir le commentaire dans app_is_finance_staff_or_admin() côté SQL.
    """
    with Session(engine) as session:
        session.exec(text("SET app.current_roles = 'finance_staff'"))
        yield session