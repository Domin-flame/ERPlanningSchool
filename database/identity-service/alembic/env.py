"""
Alembic env.py — identity-service

Ce baseline gère le schéma via des migrations SQL brutes (op.execute),
car les policies RLS et les GRANT de rôles ne sont PAS capturés par
l'autogenerate SQLAlchemy. Une fois le baseline appliqué, tu peux
définir des modèles SQLAlchemy déclaratifs pour les besoins CRUD de
l'API et générer les migrations suivantes normalement — ne touche
juste pas aux policies RLS via autogenerate (fais-le à la main).
"""
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# L'URL vient de l'environnement (docker-compose / .env), jamais en dur.
# Utiliser le rôle app_identity_service (privilège minimal), PAS le superuser.
db_url = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://app_identity_service:changeme@localhost:5433/identity_db",
)
config.set_main_option("sqlalchemy.url", db_url)

target_metadata = None  # baseline en SQL brut ; pas d'autogenerate sur ce projet


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
