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
