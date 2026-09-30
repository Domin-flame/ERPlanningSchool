#!/bin/sh
# postgres/backup/pg_basebackup.sh
#
# Sauvegarde physique (base backup) d'une base — prérequis, avec les WAL
# archivés en continu (voir docker-compose.yml et docs/BACKUP_ET_PITR.md),
# pour une restauration Point-In-Time (PITR).
#
# Usage :
#   docker compose run --rm db-backup /scripts/pg_basebackup.sh <db_host>
#
# Exemple :
#   docker compose run --rm db-backup /scripts/pg_basebackup.sh finance-db
set -eu

DB_HOST="${1:?Usage: pg_basebackup.sh <db_host>}"
TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="/backups/basebackups/${DB_HOST}_${TS}"
mkdir -p "$OUT_DIR"

echo "[basebackup] Sauvegarde physique de $DB_HOST -> $OUT_DIR"
PGPASSWORD="$DB_PASSWORD" pg_basebackup -h "$DB_HOST" -U "$DB_USER" -D "$OUT_DIR" -Fp -Xs -P

echo "[basebackup] Terminé. Combinée aux WAL archivés, cette sauvegarde permet"
echo "[basebackup] une restauration Point-In-Time — voir docs/BACKUP_ET_PITR.md."
