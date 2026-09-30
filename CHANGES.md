# Journal des modifications — audit de fonctionnalité et de sécurité

Résumé de ce qui a été corrigé/ajouté par rapport au zip original, sans
casser la structure existante (aucun module supprimé, aucune techno
remplacée).

## Corrections de bugs (frontend ↔ gateway ↔ backend)

- **Calendrier cassé** : `Calendar.jsx` appelait `GET /academic/events`,
  endpoint inexistant. Ajouté dans
  `module_academique/app/routers/calendar.py` (agrège examens et séances
  de cours du mois demandé, validation stricte du paramètre `month`).
- **Messagerie 100% simulée** : `Messages.jsx` utilisait des données
  factices en dur alors que `module_message` (conversations, messages,
  WebSocket) était déjà pleinement implémenté côté backend mais jamais
  appelé. Réécrit pour consommer les vraies routes
  (`/messages/conversations/`, `/messages/messages/...`) via de nouvelles
  fonctions `loadMessages`/`sendMessage` dans `DataContext.jsx`.
- **`PATCH /finance/invoices/{id}` manquant** : appelé par
  `DataContext.markInvoicePaid` mais absent du backend. Ajouté dans
  `module_finance_marketing/finance-service/app/main.py` avec validation
  stricte des statuts acceptés.

## Workflow asynchrone RabbitMQ (nouveau)

- `module_academique/app/events.py` — producteur (publication non
  bloquante via `BackgroundTasks`) des événements
  `academic.student.created` et `academic.enrollment.created`.
- `module_academique/app/routers/people.py`,
  `module_academique/app/routers/records.py` — déclenchement des
  événements ci-dessus à la création d'un étudiant / d'une inscription.
- `module_finance_marketing/finance-service/app/rabbitmq.py` — consumer
  qui synchronise le cache `student_ref` et **crée automatiquement une
  facture** à chaque inscription, de façon idempotente
  (`FAC-ENR-<enrollment_id>`), puis republie `finance.invoice.created`
  (déjà consommé par `notification-service`, aucune modification requise
  côté notifications).
- Démarrage du consumer intégré au cycle de vie FastAPI de
  `finance-service` (`main.py`, tâche de fond asyncio).
- Dépendances ajoutées : `pika` (academic-service, producteur simple),
  `aio-pika` (finance-service, consumer asynchrone) — cohérent avec ce qui
  est déjà utilisé dans `module_message`/`module_notification`.
- `RABBITMQ_URL` était déjà présent dans `docker-compose.yml` pour ces
  deux services : aucune modification d'infrastructure nécessaire, le
  projet anticipait déjà cette fonctionnalité.

## Sécurité — RBAC centralisé (nouveau)

- `gateway/server.js` : middleware `rbacGuard` + table `RBAC_RULES`,
  restreignant les écritures (`POST`/`PUT`/`PATCH`/`DELETE`) vers
  `/api/academic`, `/api/finance`, `/api/marketing`, `/api/hr` aux rôles
  pertinents. Auparavant, seule la présence d'un JWT valide était
  vérifiée par ces trois premiers services (aucun contrôle de rôle),
  ce qui permettait en théorie à n'importe quel compte authentifié
  d'écrire n'importe où.
- Limiteur de débit dédié et plus strict sur `/api/auth/login`,
  `/api/auth/register`, `/api/auth/password/reset` (10 req/15 min),
  indépendant du quota global de l'API (100 req/15 min).
- Frontend aligné : `Courses.jsx` et `Students.jsx` masquent désormais les
  actions d'écriture pour les rôles qui n'y ont plus droit côté API
  (`rh`, `finance`, `student` selon la page), pour éviter d'exposer un
  bouton dont l'appel échouerait en `403`.
- Voir `SECURITY.md` pour l'analyse complète (3 risques OWASP détaillés +
  mesures bonus déjà présentes dans le projet original : bcrypt, RLS
  PostgreSQL, CORS restreint, `helmet`).

## Tests de charge (nouveau)

- `load-testing/k6-load-test.js` + `load-testing/README.md` : scénario k6
  couvrant lecture multi-module, latence du endpoint d'inscription, et
  vérification fonctionnelle que le workflow asynchrone aboutit bien à
  une facture sous charge concurrente.

## Documentation

- `README.md` réécrit pour refléter l'état réel du système (6 rôles / 6
  services, et non 4/5 comme l'ancienne version) — l'ancien fichier est
  conservé sous `README.legacy.md`.
- `SECURITY.md` (nouveau) — analyse OWASP Top 10.
- `CHANGES.md` (ce fichier).

## Ce qui n'a **pas** été touché

- Aucune base de données, aucun schéma de table existant modifié (hormis
  l'usage normal des modèles déjà définis, ex. `Invoice`/`InvoiceLine`/
  `StudentRef` en finance).
- Aucune dépendance majeure remplacée ; uniquement des ajouts ciblés
  (`pika`, `aio-pika`) cohérents avec l'existant.
- L'authentification, le RLS PostgreSQL de `finance-service`, la gestion
  RH (déjà dotée de son propre RBAC interne), et le design system
  frontend n'ont pas été modifiés en profondeur — seulement complétés
  là où des liens frontend↔backend manquaient.

---

## Audit complémentaire — sécurité, tests, CI/CD, documentation (session 2)

### Sécurité — Authentification (`module_authentification`)
- Verrouillage de compte après 5 échecs de connexion (fenêtre 15 min).
- Rotation à usage unique des refresh tokens (`jti` + révocation Redis) ;
  `logout` révoque désormais access **et** refresh token.

### Tests automatisés (84 tests ajoutés, tous vérifiés en exécution réelle)
- `module_authentification` (12), `module_finance_marketing` (8, momo.py),
  `module_rh` (26, paie CNPS/PAYE + QR + API employés), `module_message`
  (7), `module_notification` (7), `gateway` Jest/Supertest (12),
  `frontend` Vitest (12).

### CI/CD
- `.github/workflows/ci.yml` — tests Python (matrice 6 services), tests
  Gateway, tests Frontend, build des 9 images Docker, sur chaque push/PR
  vers `main`.

### Sauvegarde & PITR
- `postgres/backup/{backup,restore,pg_basebackup}.sh` + service
  `db-backup` dans `docker-compose.yml` (pg_dump quotidien, rétention 7j).
- WAL archiving activé sur les 6 bases PostgreSQL (prérequis PITR).
- `docs/BACKUP_ET_PITR.md` — procédure complète.

### Bug critique découvert et corrigé — schéma DB incohérent
En faisant tourner la vraie pile (PostgreSQL/Redis/RabbitMQ + les 4
services Python + le gateway, hors Docker mais avec les vrais binaires),
il a été découvert que les scripts SQL bruts
(`postgres/{academic,finance,hr}_schema_tables.sql`, montés via
`docker-entrypoint-initdb.d`) créent des tables **complètement
différentes** de celles utilisées par le code ORM réel de ces 3 services
(noms singulier/pluriel différents pour academic/hr, colonnes
anglais/français sans aucun recoupement pour finance). Conséquence en
production réelle : `finance-service` plante sur toute requête touchant
les factures ; `academic-service` et `hr-service` tournent silencieusement
sur des tables auto-créées **vides**, ignorant les données de seed.

**Correction** : `docker-compose.yml` pointe désormais ces 3 services vers
leur schéma auto-créé réel (`DATABASE_SCHEMA: public`, `DB_AUTO_INIT`
ajusté), les montages SQL obsolètes ont été retirés, et trois nouveaux
scripts de seed **basés sur les modèles ORM réels**
(`scripts/seed_academic.py`, `seed_finance.py`, `seed_hr.py`) remplacent
les anciennes données de démo. Vérifié fonctionnel de bout en bout via de
vrais appels API à travers le gateway. Détail complet :
`docs/BUG_TRACKING.md` #16.

### Documentation
- `docs/SRS.md` — spécification des exigences alignée ISO/IEC/IEEE 29148.
- `docs/uml/` — cas d'utilisation, classes, 2 diagrammes de séquence (dont
  le workflow asynchrone inscription→facture), ERD par service,
  déploiement (diagrammes Mermaid).
- `SECURITY.md` étendu de 3 à 6 risques OWASP explicitement documentés.
- `docs/BUG_TRACKING.md` — board de suivi (10 tickets résolus, 4 ouverts).
- `load-testing/RESULTS.md` — résultats k6 réellement exécutés.
- `QUICK_START.md` réécrit (comptes de démo corrigés, liens morts
  supprimés) ; `verify-and-run.sh` créé (équivalent macOS/Linux de
  `start.bat`, qui manquait) ; `start.bat` corrigé (volumes/identifiants).
