# CampusWorkflow — ERP universitaire (microservices)

Système de gestion universitaire complet : académique, finance/marketing,
RH, messagerie et notifications, exposé au frontend React via une seule
API Gateway. Ce document explique l'architecture, comment lancer le
système, les comptes de test, le workflow asynchrone RabbitMQ, et les
mesures de sécurité mises en place.

> Ce projet a été audité et complété pour être **fonctionnel de bout en
> bout** : le frontend consomme désormais réellement chaque module via le
> gateway (plus aucune page en donnée simulée), un vrai flux asynchrone
> RabbitMQ relie inscription et facturation, et une couche RBAC
> centralisée protège les écritures sensibles. Voir `CHANGES.md` pour le
> détail de ce qui a été corrigé/ajouté.

---

## 1. Architecture

```
                         ┌──────────────────────┐
                         │   Frontend (React)   │  :5173
                         │  13 pages / 6 rôles   │
                         └──────────┬───────────┘
                                    │ HTTPS/JSON (Bearer JWT)
                         ┌──────────▼───────────┐
                         │     API Gateway       │  :3000
                         │ JWT verify • RBAC     │
                         │ Rate limiting • CORS  │
                         └───┬───┬───┬───┬───┬───┘
             ┌───────────────┘   │   │   │   └───────────────┐
             │                   │   │   │                   │
      ┌──────▼─────┐   ┌────────▼┐ ┌▼───────┐ ┌──────────┐  ┌▼──────────────┐
      │Auth service│   │Academic │ │Finance/│ │HR service│  │Message /      │
      │   :8001    │   │ :8002   │ │Marketing│ │  :8004   │  │Notification   │
      │  FastAPI   │   │ FastAPI │ │ :8003   │ │ FastAPI  │  │ :8005 / :8006 │
      └──────┬─────┘   └────┬────┘ │ FastAPI │ └────┬─────┘  └───┬───────┬───┘
             │              │      └────┬────┘      │            │       │
             │              │           │            │            │       │
             └──────────────┴───────────┴────────────┴────────────┘       │
                     PostgreSQL 15 (une base par service)                 │
                                                                           │
                 RabbitMQ (exchange topic `campus.events`) ◄──────────────┘
                 Redis (cache / websocket pub-sub)
```

**Services et ports par défaut** (voir `.env`) :

| Service | Port | Rôle |
|---|---|---|
| `frontend` | 5173 | React (Vite), seul point d'entrée navigateur |
| `gateway` | 3000 | Reverse proxy + JWT + RBAC + rate limiting |
| `auth-service` | 8001 | Comptes, login, JWT, refresh tokens |
| `academic-service` | 8002 | Programmes, cours, inscriptions, notes, examens, calendrier |
| `finance-service` | 8003 | Facturation, paiements MoMo, campagnes marketing, leads |
| `hr-service` | 8004 | Employés, congés, paie, actifs |
| `message-service` | 8005 | Conversations et messagerie interne |
| `notification-service` | 8006 | Centre de notifications (alimenté par RabbitMQ) |
| `rabbitmq` | 5672 / 15672 (UI) | Message broker |
| `redis` | 6379 | Cache + websockets |
| PostgreSQL ×6 | 5432 (interne) | Une base par service, isolées |

Chaque microservice a sa **propre base de données** — aucune table
partagée entre services, uniquement des échanges via API ou événements
RabbitMQ, ce qui garantit l'indépendance déjà annoncée dans le projet.

---

## 2. Démarrage

### Prérequis
- Docker + Docker Compose v2

### Lancer tout le système

```bash
cp .env.example .env   # si .env n'existe pas déjà (il est déjà fourni ici)
docker compose up --build -d
docker compose logs -f     # optionnel : suivre le démarrage
```

Le démarrage prend 30 à 90 secondes (healthchecks PostgreSQL/RabbitMQ
avant que chaque service ne parte). Une fois prêt :

- **Frontend** : http://localhost:5173
- **Gateway / API** : http://localhost:3000/api
- **RabbitMQ management UI** : http://localhost:15672 (identifiants dans `.env`)

### Arrêter / réinitialiser

```bash
docker compose down            # arrêt (les données persistent dans les volumes)
docker compose down -v         # arrêt + suppression des volumes (repart de zéro)
```

---

## 3. Comptes de test

**Aucune donnée fictive n'est pré-remplie**, à l'exception des **6 comptes
de démonstration ci-dessous** (un par rôle du système — le projet définit
6 rôles, pas 4, chacun correspondant à un module métier). Tout le reste
(étudiants, cours, factures, employés, messages...) se construit au fur et
à mesure de l'utilisation réelle de l'application.

| Email | Mot de passe | Rôle | Accès |
|---|---|---|---|
| `academic@campus.edu` | `password123` | Direction académique | Accès large (académique, RH lecture, finance/marketing en écriture avec Finance/Marketing) |
| `professeur@campus.edu` | `password123` | Enseignant | Cours, inscriptions, notes |
| `student@campus.edu` | `password123` | Étudiant | Son propre tableau de bord, cours, calendrier, messagerie |
| `rh@campus.edu` | `password123` | Responsable RH | Employés, congés, paie |
| `finance@campus.edu` | `password123` | Responsable financier | Factures, paiements, campagnes |
| `marketing@campus.edu` | `password123` | Responsable marketing | Campagnes, leads |

Ces comptes sont créés automatiquement au premier démarrage par
`module_authentification/docker-entrypoint.sh` (activé via
`DB_AUTO_SEED=true` dans `.env`). Les mots de passe sont hachés en bcrypt
en base, jamais stockés en clair.

---

## 4. Workflow asynchrone RabbitMQ — "un étudiant s'inscrit → une facture est créée"

C'est l'événement métier choisi pour la démonstration du découplage
asynchrone demandé par le cahier des charges.

### Ce qui se passe

1. Un utilisateur autorisé (`academic` ou `professeur`) inscrit un
   étudiant à une offre de cours : `POST /api/academic/enrollments/`.
2. **`academic-service` (Service A)** enregistre l'inscription en base,
   **répond immédiatement** au frontend (`201 Created`), puis publie —
   *après* avoir répondu, via `BackgroundTasks` FastAPI — un événement
   `academic.enrollment.created` sur l'exchange topic `campus.events`
   (voir `module_academique/app/events.py`). **Il n'attend jamais** que
   Finance ait traité le message.
3. **`finance-service` (Service B)** consomme cet événement en tâche de
   fond (`module_finance_marketing/finance-service/app/rabbitmq.py`) :
   - met à jour son cache local `student_ref` (upsert idempotent) ;
   - calcule le montant des frais de scolarité (`crédits du cours ×
     prix/crédit`, configurable via `FINANCE_PRICE_PER_CREDIT`) ;
   - crée automatiquement une **facture** (`Invoice` + `InvoiceLine`),
     avec un numéro déterministe `FAC-ENR-<enrollment_id>` garantissant
     l'**idempotence** (un message re-livré ne crée jamais de doublon) ;
   - republie un événement `finance.invoice.created`.
4. **`notification-service`** consomme ce dernier événement et crée une
   notification pour l'étudiant concerné (déjà implémenté dans le projet
   d'origine, `module_notification/app/rabbitmq_consumer.py`).

### Pourquoi c'est vraiment asynchrone

- Le temps de réponse de `POST /academic/enrollments/` ne dépend **jamais**
  de la charge ou de la disponibilité de `finance-service` : si RabbitMQ
  ou Finance est indisponible, l'inscription reste valide (l'échec de
  publication est loggé, pas propagé au client).
- Vérifiable en pratique : couper `finance-service`
  (`docker compose stop finance-service`), créer une inscription → la
  requête répond normalement. Redémarrer Finance
  (`docker compose start finance-service`) → RabbitMQ (queue durable) lui
  délivre le message en attente dès sa reconnexion, et la facture est
  créée a posteriori.
- Le script de charge `load-testing/k6-load-test.js` mesure explicitement
  cette latence (`enrollment_post_latency`) pour prouver qu'elle ne se
  dégrade pas sous forte charge.

---

## 5. Sécurité — OWASP Top 10

Voir **[`SECURITY.md`](./SECURITY.md)** pour l'analyse complète (3 risques
détaillés + mesures bonus) : *Broken Access Control*, *Cryptographic
Failures*, *Injection (SQL)*, plus rate limiting dédié à l'authentification,
RLS PostgreSQL, CORS restreint, en-têtes de sécurité `helmet`.

Résumé express :
- **RBAC centralisé côté gateway** (`gateway/server.js`) — bloque les
  écritures non autorisées avant même d'atteindre les microservices.
- **JWT + bcrypt** pour l'authentification (`module_authentification`).
- **Row-Level Security PostgreSQL** côté `finance-service`.
- **Rate limiting** global (100 req/15 min) + limiteur dédié et strict sur
  `/api/auth/login` (10 req/15 min) contre le brute force.
- **ORM partout** (SQLAlchemy / SQLModel), aucune concaténation SQL avec
  une entrée utilisateur.

---

## 6. Tests de charge (vitesse & robustesse sous forte charge)

Voir **[`load-testing/README.md`](./load-testing/README.md)**.

```bash
docker compose up -d
k6 run load-testing/k6-load-test.js
```

Le script mesure la latence de lecture (académique/finance/RH), la
latence du endpoint d'inscription (pour prouver le découplage
asynchrone), et vérifie fonctionnellement que les factures sont bien
créées après une inscription — même sous charge simultanée.

---

## 7. Structure du dépôt

```
CampusWorkflow/
├── docker-compose.yml         # orchestration complète
├── .env / .env.example        # configuration (secrets, ports)
├── SECURITY.md                # analyse OWASP Top 10
├── CHANGES.md                 # journal des corrections/ajouts de cet audit
├── load-testing/              # script k6 + instructions
├── gateway/                   # API Gateway Express (JWT, RBAC, rate limiting, proxy)
├── frontend/                  # React + Vite (13 pages, 6 rôles)
├── module_authentification/   # Auth service (FastAPI)
├── module_academique/         # Academic service (FastAPI) — cours, inscriptions, calendrier
├── module_finance_marketing/  # Finance + Marketing service (FastAPI/SQLModel)
├── module_rh/                 # HR service (FastAPI)
├── module_message/            # Message service (FastAPI + WebSocket)
├── module_notification/       # Notification service (FastAPI, consumer RabbitMQ)
├── postgres/                  # scripts d'init SQL
├── docs/                      # design system, guides complémentaires
└── QUICK_START.md             # démarrage express (Windows/macOS/Linux)
```

Documentation complémentaire déjà présente dans le projet et conservée
telle quelle : `QUICK_START.md` (démarrage rapide), `docs/DESIGN_SYSTEM.md`
(charte graphique), `README.legacy.md` (ancienne version de ce document,
conservée pour historique).

---

## 8. Limites connues / pistes d'amélioration

- Le modèle d'identité "utilisateur académique" (`module_academique.User`)
  et le compte d'authentification (`module_authentification`) sont deux
  tables distinctes, comme conçu à l'origine dans le projet ; la
  correspondance entre les deux n'est pas systématiquement réconciliée
  pour toutes les fonctionnalités (limitation pré-existante, non
  introduite par cet audit).
- Les factures ne sont pas filtrées par étudiant côté API (`GET
  /finance/invoices` renvoie l'ensemble des factures aux rôles
  autorisés) — à affiner avec un filtrage par `id_person` si un portail
  étudiant self-service dédié aux factures est développé.
- Le prix par crédit ECTS utilisé pour la facturation automatique est une
  valeur de configuration simple (`FINANCE_PRICE_PER_CREDIT`), pas une
  grille tarifaire par programme — suffisant pour la démonstration du
  workflow, à enrichir si besoin métier réel.
