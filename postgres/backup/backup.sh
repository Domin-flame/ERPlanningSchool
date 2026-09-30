#!/bin/sh
# postgres/backup/backup.sh
#
# Sauvegarde logique automatisée (pg_dump) des 6 bases PostgreSQL de
# CampusWorkflow. Exécuté en boucle par le service `db-backup` du
# docker-compose (voir docs/BACKUP_ET_PITR.md pour la procédure complète).
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"   # 24h par défaut

# "nom_de_base:hôte_docker-compose"
DATABASES="identity_db:identity-db academic_db:academic-db finance_db:finance-db hr_db:hr-db message_db:message-db notification_db:notification-db"

run_backup_once() {
  timestamp="$(date +%Y%m%d_%H%M%S)"
  echo "[backup] === Démarrage de la sauvegarde $timestamp ==="

  for entry in $DATABASES; do
    db_name="${entry%%:*}"
    db_host="${entry##*:}"
    out_dir="$BACKUP_DIR/$db_name"
    mkdir -p "$out_dir"
    out_file="$out_dir/${db_name}_${timestamp}.sql.gz"

    echo "[backup] Dump de $db_name (hôte: $db_host) -> $out_file"
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$db_host" -U "$DB_USER" -d "$db_name" \
        --no-owner --no-privileges | gzip > "$out_file"; then
      echo "[backup]   OK ($(du -h "$out_file" | cut -f1))"
    else
      echo "[backup]   ÉCHEC pour $db_name" >&2
    fi
  done

  echo "[backup] Purge des sauvegardes de plus de $RETENTION_DAYS jour(s)"
  find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime "+$RETENTION_DAYS" -print -delete || true

  echo "[backup] === Sauvegarde $timestamp terminée ==="
}

# Mode "once" : déclenche UNE sauvegarde immédiate puis quitte. Pratique
# pour tester ou pour un appel manuel/cron externe :
#   docker compose run --rm db-backup /scripts/backup.sh once
if [ "${1:-}" = "once" ]; then
  run_backup_once
  exit 0
fi

# Mode boucle (comportement par défaut du service `db-backup`) : une
# sauvegarde toutes les INTERVAL_SECONDS secondes, indéfiniment.
echo "[backup] Service de sauvegarde démarré — intervalle: ${INTERVAL_SECONDS}s, rétention: ${RETENTION_DAYS}j"
while true; do
  run_backup_once
  sleep "$INTERVAL_SECONDS"
done
