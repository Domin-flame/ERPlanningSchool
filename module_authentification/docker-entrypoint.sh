#!/bin/sh
set -e

echo "Waiting for database and running migrations (if any)"
if [ -n "$DATABASE_URL" ] && [ -f "./migrations/alembic.ini" ]; then
  echo "Found migrations; running alembic upgrade head"
  alembic -c migrations/alembic.ini upgrade head || true
else
  echo "No migrations configuration found or DATABASE_URL not set; skipping migrations"
fi

exec "$@"
