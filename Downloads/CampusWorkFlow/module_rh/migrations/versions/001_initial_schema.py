"""Initial HR schema placeholder

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import os

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    sql_path = os.path.join(root, 'postgres', 'hr_schema_tables.sql')
    if os.path.exists(sql_path):
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql = f.read()
        op.execute(sa.text(sql))


def downgrade():
    op.execute(sa.text('DROP SCHEMA IF EXISTS hr CASCADE'))
