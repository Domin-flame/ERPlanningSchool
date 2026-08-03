#!/usr/bin/env bash
# ============================================================================
# CampusWorkflow — Script de seed des données de test
# ============================================================================
# Crée les 4 comptes de test (un par rôle) ET quelques données d'exemple
# (faculté, référence étudiant, employé, campagne) en passant PAR L'API
# GATEWAY (pas en accès direct base de données), ce qui sert aussi de test
# de bout en bout de la communication Frontend/Gateway/Services.
#
# Prérequis : les services doivent déjà tourner (`docker compose up`),
# curl et node doivent être installés sur la machine hôte (node est de toute
# façon nécessaire pour le frontend/gateway de ce projet).
#
# Usage :
#   ./scripts/seed-test-data.sh
#   GATEWAY_URL=http://localhost:3000 ./scripts/seed-test-data.sh
# ============================================================================
set -uo pipefail

GATEWAY_URL="${GATEWAY_URL:-http://localhost:3000}"

if ! command -v node &> /dev/null; then
  echo "❌ 'node' est requis mais introuvable (utilisé ici seulement pour parser du JSON)."
  exit 1
fi

# Petit helper pour extraire un champ JSON sans dépendre de jq.
json_field() {
  node -e "try { const d = JSON.parse(require('fs').readFileSync(0, 'utf8')); const v = d?.$1; if (v !== undefined && v !== null) console.log(v); } catch (e) {}"
}

echo "🔎 Attente de la gateway sur $GATEWAY_URL ..."
ready=false
for i in $(seq 1 30); do
  if curl -sf "$GATEWAY_URL/health" > /dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done

if [ "$ready" != "true" ]; then
  echo "❌ La gateway ne répond pas sur $GATEWAY_URL après 60s."
  echo "   Vérifie 'docker compose ps' et 'docker compose logs -f gateway'."
  exit 1
fi
echo "✅ Gateway disponible."
echo ""

register() {
  local full_name="$1" email="$2" password="$3" role="$4"
  echo "→ Compte $role ($email)"
  local http_code
  http_code=$(curl -s -o /tmp/cw_seed_resp.json -w "%{http_code}" -X POST "$GATEWAY_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"full_name\":\"$full_name\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"$role\"}")
  case "$http_code" in
    200|201) echo "  ✅ créé" ;;
    409)     echo "  ↷  déjà existant (OK)" ;;
    *)       echo "  ⚠️  HTTP $http_code : $(cat /tmp/cw_seed_resp.json)" ;;
  esac
}

echo "📋 Création des comptes de test (un par rôle)..."
register "Super Admin User" "super@campus.local"   "Super123!"   "Super Admin"
register "Admin User"       "admin@campus.local"   "Admin123!"   "Admin"
register "Staff User"       "staff@campus.local"   "Staff123!"   "Staff"
register "Student User"     "student@campus.local" "Student123!" "Student"
echo ""

echo "🔑 Connexion en tant que Super Admin pour obtenir un token..."
LOGIN_RESP=$(curl -s -X POST "$GATEWAY_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"super@campus.local","password":"Super123!"}')
TOKEN=$(echo "$LOGIN_RESP" | json_field access_token)

if [ -z "$TOKEN" ]; then
  echo "❌ Impossible d'obtenir un token. Réponse de la gateway :"
  echo "$LOGIN_RESP"
  exit 1
fi
echo "✅ Token obtenu."
echo ""

echo "🌱 Création de données d'exemple à travers la gateway (académique, finance, RH, marketing)..."

curl -s -o /dev/null -w "  api/academic/faculties  → HTTP %{http_code}\n" \
  -X POST "$GATEWAY_URL/api/academic/faculties/" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Faculté des Sciences","code":"FS"}'

curl -s -o /dev/null -w "  api/finance/student-ref → HTTP %{http_code}\n" \
  -X POST "$GATEWAY_URL/api/finance/student-ref" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"id_student":1,"id_person":1,"matricule":"ETU-0001","nom_complet_cache":"Etudiant Demo"}'

curl -s -o /dev/null -w "  api/hr/employees        → HTTP %{http_code}\n" \
  -X POST "$GATEWAY_URL/api/hr/employees/" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"auth_user_id":"seed-1","matricule":"EMP-0001","first_name":"Jean","last_name":"Dupont","email":"jean.dupont@campus.local","department":"Informatique","position":"Enseignant","hire_date":"2024-09-01","base_salary":650000}'

curl -s -o /dev/null -w "  api/marketing/campaigns → HTTP %{http_code}\n" \
  -X POST "$GATEWAY_URL/api/marketing/campaigns" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nom":"Campagne Rentrée 2026","canal":"EMAIL","date_debut":"2026-09-01"}'

echo ""
echo "🎉 Terminé ! Comptes de test disponibles (voir aussi la page de connexion) :"
echo "   Super Admin : super@campus.local   / Super123!"
echo "   Admin       : admin@campus.local   / Admin123!"
echo "   Staff       : staff@campus.local   / Staff123!"
echo "   Student     : student@campus.local / Student123!"
echo ""
echo "👉 Ouvre http://localhost:5173, connecte-toi, puis utilise la page"
echo "   /diagnostics (Admin/Super Admin) pour tester la communication"
echo "   Frontend → Gateway → Services en direct."
