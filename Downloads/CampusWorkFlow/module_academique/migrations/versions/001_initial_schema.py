"""Initial schema from authoritative SQL

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import os

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Execute the authoritative SQL schema file to create the academic schema
    # and tables exactly as provided in the repository. This keeps the SQL
    # scripts as the single source of truth for DDL while letting Alembic
    # manage migrations.
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    sql_path = os.path.join(root, 'postgres', 'academic_schema_tables.sql')
    if os.path.exists(sql_path):
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql = f.read()
        # split statements may be needed; execute as a single batch
        op.execute(sa.text(sql))
    else:
        # Fallback: no SQL file found; do nothing.
        pass


def downgrade():
    # Drop the academic schema if present
    op.execute(sa.text('DROP SCHEMA IF EXISTS academic CASCADE'))
