import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name)
    except Exception:
        # If the logging configuration in alembic.ini is incomplete or
        # does not define the expected logger sections (e.g. logger_sqlalchemy),
        # fileConfig will raise a KeyError. Ignore logging config errors so
        # that migrations can still run in environments where alembic.ini
        # logging sections are not fully populated (common in trimmed repo files).
        pass

# import application metadata
try:
    from app.database import Base  # noqa: F401
except Exception:
    try:
        import module_academique.app.database as database  # noqa: F401
        Base = database.Base
    except Exception:
        Base = None

# target_metadata for 'autogenerate'
if Base is not None:
    target_metadata = Base.metadata
else:
    target_metadata = None


def get_url():
    return os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")


def run_migrations_offline():
    url = get_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
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
