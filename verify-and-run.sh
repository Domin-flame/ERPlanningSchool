#!/bin/sh
# verify-and-run.sh — démarrage rapide de CampusWorkflow (macOS/Linux).
# Équivalent de start.bat pour les machines non-Windows.
#
# Usage :
#   chmod +x verify-and-run.sh
#   ./verify-and-run.sh            # démarrage normal (données conservées)
#   ./verify-and-run.sh --reset    # démarrage + suppression de TOUTES les données
set -eu

echo "============================================================"
echo "  CampusWorkflow — Démarrage"
echo "============================================================"

# 1. Vérifier que .env existe
if [ ! -f ".env" ]; then
  echo "[ERREUR] Fichier .env introuvable."
  echo "Copier .env.example vers .env :"
  echo "  cp .env.example .env"
  echo "Puis définir JWT_SECRET (voir .env.example) avant de relancer."
  exit 1
fi

# 2. Vérifier Docker
if ! docker info > /dev/null 2>&1; then
  echo "[ERREUR] Docker n'est pas démarré (ou permissions insuffisantes)."
  exit 1
fi

if ! docker compose version > /dev/null 2>&1; then
  echo "[ERREUR] Docker Compose v2 introuvable (commande 'docker compose')."
  echo "Ce projet nécessite Docker Compose v2 (intégré à Docker Desktop"
  echo "récent, ou plugin 'docker-compose-plugin' sous Linux)."
  exit 1
fi

echo "[1/3] Arrêt des conteneurs existants (les données persistent)..."
docker compose down --remove-orphans

if [ "${1:-}" = "--reset" ]; then
  echo "[!] Option --reset : suppression de TOUTES les données (volumes) !"
  docker compose down -v --remove-orphans
fi

echo "[2/3] Construction et démarrage de tous les services..."
if ! docker compose up --build -d; then
  echo "[ERREUR] Échec du démarrage. Logs :"
  docker compose logs --tail=50
  exit 1
fi

echo "[3/3] Attente de l'initialisation des services (60 secondes)..."
sleep 60

echo
echo "============================================================"
echo "  Services disponibles :"
echo "============================================================"
echo "  Frontend          : http://localhost:5173"
echo "  API Gateway       : http://localhost:3000"
echo "  Swagger Docs      : http://localhost:3000/api/docs"
echo "  RabbitMQ Console  : http://localhost:15672"
echo "    (identifiants : voir RABBITMQ_USER / RABBITMQ_PASS dans .env)"
echo "============================================================"
echo
echo "  6 comptes de démonstration sont créés automatiquement"
echo "  (DB_AUTO_SEED=true dans .env). Voir README.md section 3"
echo "  ou QUICK_START.md pour la liste complète."
echo "============================================================"

# Ouvre le navigateur si possible (macOS: open, Linux: xdg-open)
if command -v open > /dev/null 2>&1; then
  open http://localhost:5173
elif command -v xdg-open > /dev/null 2>&1; then
  xdg-open http://localhost:5173
fi
