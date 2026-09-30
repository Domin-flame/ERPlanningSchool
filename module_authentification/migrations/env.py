import os
from logging.config import fileConfig

from sqlalchemy import pool
from alembic import context
from sqlmodel import SQLModel, create_engine

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# import your models so that 'SQLModel.metadata' is populated
try:
    import module_authentification.app.models as models  # noqa: F401
except Exception:
    # fallback: try relative import
    try:
        import app.models as models  # noqa: F401
    except Exception:
        pass

target_metadata = SQLModel.metadata


def get_url():
    return os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")


def run_migrations_offline():
    url = get_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = create_engine(get_url(), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
