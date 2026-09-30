# CampusWorkflow — Démarrage rapide

## 🎯 Démarrage en une commande

### Windows
```cmd
start.bat
```

### macOS / Linux
```bash
chmod +x verify-and-run.sh
./verify-and-run.sh
```

**Patientez 30 à 60 secondes** que tous les services s'initialisent
(healthchecks PostgreSQL/RabbitMQ), puis ouvrez :
**http://localhost:5173**

> Ces deux scripts vérifient que `.env` existe et que Docker tourne, puis
> lancent `docker compose up --build -d`. Pour repartir de zéro en
> supprimant les données existantes : `start.bat --reset` (Windows) ou
> `./verify-and-run.sh --reset` (macOS/Linux).

### Prérequis
- Docker + Docker Compose v2 (`docker compose version` doit fonctionner)
- Un fichier `.env` à la racine — s'il n'existe pas encore :
  ```bash
  cp .env.example .env
  ```
  Le seul champ à personnaliser est `JWT_SECRET` (voir le commentaire dans
  `.env.example` pour en générer un aléatoire). Toutes les autres variables
  ont une valeur par défaut fonctionnelle.

---

## 🔑 Connexion — comptes de démonstration

**Aucun compte n'est créé manuellement** : les 6 comptes ci-dessous sont
insérés automatiquement au premier démarrage par
`module_authentification/docker-entrypoint.sh` (contrôlé par
`DB_AUTO_SEED=true` dans `.env`). Ce sont les **seuls** identifiants valides
au premier lancement — il n'existe pas de compte `admin@campus.edu` ni
`staff@campus.edu`.

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `academic@campus.edu` | `password123` | Direction académique |
| `professeur@campus.edu` | `password123` | Professeur / Enseignant |
| `student@campus.edu` | `password123` | Étudiant |
| `rh@campus.edu` | `password123` | Responsable RH |
| `finance@campus.edu` | `password123` | Responsable financier |
| `marketing@campus.edu` | `password123` | Responsable marketing |

## 📍 Services exposés

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| API Gateway | http://localhost:3000 | 3000 |
| Swagger / OpenAPI | http://localhost:3000/api/docs | 3000 |
| RabbitMQ Console | http://localhost:15672 | 15672 |
| Auth Service (interne) | http://localhost:8001 | 8001 |
| Academic Service (interne) | http://localhost:8002 | 8002 |
| Finance Service (interne) | http://localhost:8003 | 8003 |
| HR Service (interne) | http://localhost:8004 | 8004 |
| Message Service (interne) | http://localhost:8005 | 8005 |
| Notification Service (interne) | http://localhost:8006 | 8006 |

Les ports "interne" sont exposés sur l'hôte pour le débogage direct, mais
**toutes les requêtes applicatives passent par le Gateway** (`:3000/api/...`)
qui gère JWT, RBAC et rate limiting.

## 🧪 Tester l'API en ligne de commande

### 1. Se connecter et récupérer un token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"academic@campus.edu","password":"password123"}' | jq .
```

Réponse attendue :
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": { "id": 1, "email": "academic@campus.edu", "role": "academic" }
}
```

### 2. Lister les cours
```bash
curl http://localhost:3000/api/academic/courses \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

### 3. Lister les factures
```bash
curl http://localhost:3000/api/finance/invoices \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

### 4. Lister les employés (nécessite le rôle `rh`)
```bash
curl http://localhost:3000/api/hr/employees \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN_RH"
```

## 🛑 Arrêter

```bash
docker compose stop        # arrêt simple, les données persistent
docker compose down        # arrêt + suppression des conteneurs (données persistent dans les volumes)
```

## 🔄 Réinitialisation complète (⚠️ supprime toutes les données)

```bash
docker compose down -v
docker compose up --build -d
```

## ⚠️ Dépannage

### Le frontend ne charge pas alors que tous les conteneurs tournent
- Vérifier l'état des conteneurs : `docker compose ps` (tous en "healthy"
  ou "running" ?)
- Vider le cache du navigateur / rechargement forcé :
  `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)

### Impossible de se connecter
```bash
docker compose logs auth-service --tail=50
docker compose logs gateway --tail=50
```
Vérifier en particulier que `DB_AUTO_SEED=true` était bien présent dans
`.env` **au premier démarrage** (le seed ne s'exécute qu'une fois, à la
création de la base — un `docker compose down -v` puis `up` relance le
seed).

### Un service ne démarre pas / port déjà utilisé
```bash
docker compose ps
docker compose logs <nom-du-service> --tail=50

# Vérifier qu'un port n'est pas déjà occupé (exemple : 5173)
# macOS/Linux :
lsof -i :5173
# Windows :
netstat -ano | findstr :5173
```

### Erreur de connexion à une base de données
```bash
docker compose restart academic-db finance-db hr-db identity-db message-db notification-db
# Attendre ~10s que les healthchecks repassent au vert, puis :
docker compose restart
```

## 📚 Documentation complète

- **`README.md`** — architecture détaillée, workflow asynchrone RabbitMQ,
  structure du dépôt
- **`SECURITY.md`** — analyse OWASP Top 10
- **`docs/BACKUP_ET_PITR.md`** — sauvegarde automatisée et restauration
  Point-In-Time
- **`docs/SRS.md`** — spécification des exigences logicielles (SRS)
- **`docs/uml/`** — suite de diagrammes UML
- **`load-testing/README.md`** — tests de charge (k6)
