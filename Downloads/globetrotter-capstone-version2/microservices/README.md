# GlobeTrotter — Phase 2 : Architecture Microservices

Décomposition du monolithe en **trois services indépendants** communiquant via
**REST** (synchrone) et **RabbitMQ** (asynchrone), avec **PostgreSQL** pour le
stockage et une **API Gateway** comme point d'entrée unique.

---

## 🏗️ Architecture

```
                        ┌──────────────────────────────┐
                        │       API GATEWAY (8000)     │
                        │   Point d'entrée + Swagger   │
                        └──────────────┬───────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        │              │               │               │              │
   ┌────▼────┐   ┌─────▼─────┐   ┌─────▼──────┐   ┌────▼─────────┐   │
   │ User svc│   │Itin svc   │   │Recommend svc│   │  RabbitMQ    │   │
   │  (8001) │   │  (8002)   │   │   (8003)    │   │  (5672)      │   │
   └────┬────┘   └────┬──────┘   └────┬────────┘   └──────────────┘   │
        │             │               │                                │
   user_db     itinerary_db/     lit via REST &                       │
   (5433)      destinations_db   consomme events RabbitMQ ────────────┘
   Postgres    (5434/5435)
```

| Service | Port | DB | Rôle |
|---------|------|----|------|
| `api-gateway` | 8000 | — | Proxy + Swagger + health |
| `user-service` | 8001 | `user_db` | Auth, profils, préférences, visited, favorite-notes |
| `itinerary-service` | 8002 | `itinerary_db` + `destinations_db` | Itinéraires, bookings, reviews, proposals, destinations |
| `recommendation-service` | 8003 | — | Recommandations (REST + RabbitMQ consumer) |
| `rabbitmq` | 5672/15672 | — | Bus d'événements asynchrone |
| `user-db` | 5433 | — | PostgreSQL |
| `itinerary-db` | 5434 | — | PostgreSQL |
| `destinations-db` | 5435 | — | PostgreSQL |

---

## 🔄 Communication Inter-Services

### Synchrone (REST)
- **RecommendationService → UserService** : `GET /internal/users/{username}`
  (préférences utilisateur)
- **RecommendationService → ItineraryService** : `GET /destinations/internal`
  (catalogue complet)

### Asynchrone (RabbitMQ)
- **UserService publie** sur `user.events` :
  - `user.registered`
  - `user.preferences.updated`
- **ItineraryService publie** sur `itinerary.events` :
  - `itinerary.created`
  - `itinerary.deleted`
- **RecommendationService consomme** ces événements et maintient un cache en
  mémoire (préférences, statistiques) pour réduire les appels synchrones.

---

## 🔑 Authentification (JWT partagé)

Tous les services valident les tokens avec la même `SECRET_KEY`
(`shared/jwt_utils.py`). Un utilisateur s'authentifie une fois (via le gateway /
user-service) et son token est accepté partout.

---

## 🚀 Démarrage (Docker Compose)

```bash
cd microservices
docker-compose up --build
```

### Swagger UI
| Service | URL |
|---------|-----|
| API Gateway | http://localhost:8000/docs |
| User Service | http://localhost:8001/docs |
| Itinerary Service | http://localhost:8002/docs |
| Recommendation Service | http://localhost:8003/docs |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |

---

## 🧪 Tests rapides (via gateway 8000)

```bash
# 1. Inscription
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret","preferences":["nature","food"]}'

# 2. Connexion
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}'
# → { "token": "..." }

# 3. Recommandations (avec le token)
curl -X GET http://localhost:8000/recommendations \
  -H "Authorization: Bearer <TOKEN>"

# 4. Destinations
curl -X GET "http://localhost:8000/destinations?q=mer&tag=nature"
```

---

## 🗂️ Structure

```
microservices/
├── docker-compose.yml
├── shared/                    # Package partagé (JWT)
├── gateway/                   # API Gateway (proxy + swagger)
├── user_service/              # UserService
├── itinerary_service/         # ItineraryService (+ seed destinations)
├── recommendation_service/    # RecommendationService
└── README.md
```

Chaque service suit une architecture en couches :
- `app/models.py` — modèles SQLAlchemy ORM
- `app/schemas.py` — Pydantic v2
- `app/repositories.py` — accès données
- `app/services.py` — logique métier
- `app/routers/` — endpoints FastAPI
- `app/rabbitmq.py` — publisher d'événements (ou consumer)

---

## 🛠️ Remarques

- **Data consistency** : chaque service possède **sa propre base de données**
  (propriété des données). Les données transverses sont échangées via REST ou
  événements.
- **Service discovery** : les URLs des services sont injectées via variables
  d'environnement dans `docker-compose.yml`.
- **Seed** : le catalogue de destinations est importé depuis `data/pois.json`
  dans `destinations_db` au démarrage du `itinerary-service`.
