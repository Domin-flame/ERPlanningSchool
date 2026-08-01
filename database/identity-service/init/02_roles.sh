#!/bin/bash
# =====================================================================
# Crée un rôle applicatif dédié à identity-service, à privilège minimal.
# Le compte superuser (POSTGRES_USER) ne sert QUE à l'init, jamais à l'appli.
# Exécuté automatiquement par l'image postgres au premier démarrage
# (docker-entrypoint-initdb.d), après 01_schema.sql (ordre alphabétique).
# =====================================================================
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Rôle applicatif : ni CREATEDB, ni CREATEROLE, ni SUPERUSER
    CREATE ROLE app_identity_service WITH LOGIN PASSWORD '${IDENTITY_DB_APP_PASSWORD}';

    REVOKE ALL ON SCHEMA public FROM PUBLIC;
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO app_identity_service;
    GRANT USAGE ON SCHEMA public TO app_identity_service;

    -- CRUD uniquement, pas de DROP/ALTER/TRUNCATE
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_identity_service;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_identity_service;

    -- Les futures tables créées par les migrations Alembic héritent des mêmes droits
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_identity_service;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO app_identity_service;

    -- Rôle en lecture seule pour reporting/BI éventuel (optionnel mais utile pour le défendre en soutenance)
    CREATE ROLE app_identity_readonly WITH LOGIN PASSWORD '${IDENTITY_DB_READONLY_PASSWORD}';
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO app_identity_readonly;
    GRANT USAGE ON SCHEMA public TO app_identity_readonly;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_identity_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_identity_readonly;
EOSQL

echo "identity_db: rôles applicatifs créés (app_identity_service, app_identity_readonly)."
