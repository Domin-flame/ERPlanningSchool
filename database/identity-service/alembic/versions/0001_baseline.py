"""baseline: schema + RLS identity_db

Revision ID: 0001_baseline
Revises:
Create Date: 2026-07-24

NOTE D'INTÉGRATION :
- Si la base a déjà été initialisée par docker-entrypoint-initdb.d (premier
  démarrage du conteneur identity-db), NE PAS lancer `alembic upgrade head` :
  lance plutôt `alembic stamp 0001_baseline` pour marquer ce baseline comme
  déjà appliqué, puis les migrations SUIVANTES passeront par `upgrade head`.
- Si tu pars d'une base vierge (ex. environnement de test CI sans les
  scripts d'init), `alembic upgrade head` exécute réellement le schéma.
- Les GRANT de rôles (02_roles.sh) restent du ressort du superuser au
  démarrage du conteneur — volontairement PAS gérés par Alembic, qui
  tourne avec le rôle applicatif à privilège minimal.
"""
from pathlib import Path

from alembic import op

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None

SQL_DIR = Path(__file__).resolve().parents[2] / "init"


def _exec_sql_file(filename: str) -> None:
    sql_text = (SQL_DIR / filename).read_text(encoding="utf-8")
    op.execute(sql_text)


def upgrade() -> None:
    _exec_sql_file("01_schema.sql")
    _exec_sql_file("03_rls.sql")


def downgrade() -> None:
    op.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
