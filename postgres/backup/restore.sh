#!/bin/sh
# postgres/backup/restore.sh
#
# Restaure UNE base à partir d'un dump produit par backup.sh.
#
# Usage :
#   docker compose run --rm db-backup /scripts/restore.sh <db_name> <db_host> <chemin_du_dump.sql.gz>
#
# Exemple :
#   docker compose run --rm db-backup /scripts/restore.sh \
#       finance_db finance-db /backups/finance_db/finance_db_20260926_020000.sql.gz
set -eu

DB_NAME="${1:?Usage: restore.sh <db_name> <db_host> <dump.sql.gz>}"
DB_HOST="${2:?Usage: restore.sh <db_name> <db_host> <dump.sql.gz>}"
DUMP_FILE="${3:?Usage: restore.sh <db_name> <db_host> <dump.sql.gz>}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "Fichier de sauvegarde introuvable : $DUMP_FILE" >&2
  exit 1
fi

echo "⚠️  Ceci va ÉCRASER le contenu actuel de la base '$DB_NAME' sur '$DB_HOST'."
echo "    Restauration depuis : $DUMP_FILE"
printf "Confirmer ? (oui/non) "
read -r confirm
if [ "$confirm" != "oui" ]; then
  echo "Annulé."
  exit 1
fi

echo "[restore] Fermeture des connexions actives sur $DB_NAME..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

echo "[restore] Suppression et recréation de la base $DB_NAME..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "[restore] Import du dump..."
gunzip -c "$DUMP_FILE" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME"

echo "[restore] Terminé. Base '$DB_NAME' restaurée depuis $DUMP_FILE."
