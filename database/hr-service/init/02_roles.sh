#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE app_hr_service WITH LOGIN PASSWORD '${HR_DB_APP_PASSWORD}';

    REVOKE ALL ON SCHEMA public FROM PUBLIC;
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO app_hr_service;
    GRANT USAGE ON SCHEMA public TO app_hr_service;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_hr_service;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_hr_service;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_hr_service;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO app_hr_service;

    CREATE ROLE app_hr_event_consumer WITH LOGIN PASSWORD '${HR_DB_CONSUMER_PASSWORD}';
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO app_hr_event_consumer;
    GRANT USAGE ON SCHEMA public TO app_hr_event_consumer;
    GRANT SELECT, INSERT, UPDATE ON organization_unit_ref TO app_hr_event_consumer;

    CREATE ROLE app_hr_readonly WITH LOGIN PASSWORD '${HR_DB_READONLY_PASSWORD}';
    GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO app_hr_readonly;
    GRANT USAGE ON SCHEMA public TO app_hr_readonly;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_hr_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_hr_readonly;
EOSQL
echo "hr_db: rôles applicatifs créés."
