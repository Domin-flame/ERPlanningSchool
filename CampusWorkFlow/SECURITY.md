# Sécurité — Analyse OWASP Top 10 (CampusWorkflow)

Ce document liste les risques retenus (au moins 3, comme demandé), ce qui
était déjà en place dans le projet, et ce qui a été ajouté pour combler les
manques identifiés pendant l'audit.

---

## 1. A01:2021 — Broken Access Control

**Risque.** Un utilisateur authentifié mais avec un rôle insuffisant (ex :
un compte `student`) pourrait appeler directement l'API pour créer,
modifier ou supprimer des ressources qui ne relèvent pas de son rôle (créer
un cours, modifier une facture, supprimer un employé RH...), même si
l'interface ne propose pas ce bouton — car **rien n'empêchait l'appel HTTP
direct**.

**Constat de l'audit.** Les services `academic-service`, `finance-service`
et le volet marketing vérifiaient uniquement la présence et la validité du
JWT (authentification), mais **jamais le rôle** de l'appelant
(autorisation) avant d'exécuter une écriture. Seul `hr-service` faisait
déjà ce contrôle correctement en interne (`require_roles(...)` dans
`module_rh/app/auth.py`).

**Mitigation apportée.** Ajout d'un middleware RBAC centralisé dans le
gateway (`gateway/server.js`, fonction `rbacGuard` + table `RBAC_RULES`) :
toute requête d'écriture (`POST`/`PUT`/`PATCH`/`DELETE`) vers
`/api/academic`, `/api/finance`, `/api/marketing` ou `/api/hr` est
comparée au rôle porté par le JWT ; si le rôle n'est pas autorisé pour ce
domaine, le gateway répond `403` **avant même d'atteindre le
microservice**. Centraliser ce contrôle à un seul endroit (plutôt que de le
dupliquer dans chaque service) le rend plus simple à auditer et à faire
évoluer.

Le frontend a été aligné en conséquence : les boutons de
création/suppression sont masqués pour les rôles qui n'ont plus les droits
côté API (`Courses.jsx`, `Students.jsx`), pour éviter d'exposer une action
qui échouerait silencieusement.

---

## 2. A02:2021 — Cryptographic Failures (exposition de données sensibles)

**Risque.** Mots de passe stockés en clair ou avec un hachage faible,
secrets JWT codés en dur dans le code source, ou fuite d'informations
sensibles (mots de passe, tokens) dans les logs/réponses d'erreur.

**Ce qui était déjà en place.**
- Les mots de passe sont hachés avec **bcrypt** (`passlib.context.CryptContext`,
  `module_authentification/app/main.py`) — jamais stockés en clair, jamais
  comparés par égalité simple.
- Le secret JWT (`JWT_SECRET`) est injecté **exclusivement via variable
  d'environnement** (`.env`, jamais commité avec une vraie valeur de prod)
  et partagé entre le gateway et chaque service pour la vérification de
  signature — jamais codé en dur dans un fichier source.
- `finance-service` applique en plus une politique **Row-Level Security
  PostgreSQL** (`SET app.current_roles = ...` selon le rôle du JWT décodé) :
  même en cas de faille applicative laissant passer une requête, la base
  elle-même filtre les lignes visibles par rôle.
- Communication interne uniquement sur le réseau Docker interne ; seul le
  gateway est exposé publiquement.

**Ce qui a été vérifié/renforcé.**
- Les nouveaux événements RabbitMQ (`app/events.py`, `app/rabbitmq.py`) ne
  transportent que des identifiants et des données déjà considérées comme
  internes à l'établissement (matricule, nom, montant) — aucun mot de
  passe ni jeton d'authentification ne transite jamais par le message
  broker.
- Le endpoint `PATCH /finance/invoices/{id}` ajouté valide strictement la
  valeur de `status` reçue (liste blanche) avant écriture, pour éviter
  d'accepter une valeur arbitraire non prévue par le modèle de données.

---

## 3. A03:2021 — Injection (SQL Injection)

**Risque.** Construction de requêtes SQL par concaténation de chaînes à
partir d'une entrée utilisateur (ex : `f"SELECT * FROM x WHERE id={id}"`),
permettant à un attaquant d'altérer la requête exécutée.

**Ce qui était déjà en place.** Tous les accès base de données du projet
passent par un ORM avec requêtes paramétrées :
- `academic-service`, `message-service`, `notification-service` :
  SQLAlchemy ORM (`db.query(Model).filter(...)`), jamais de SQL brut avec
  interpolation de variables utilisateur.
- `finance-service`, `hr-service` : SQLModel (au-dessus de SQLAlchemy),
  même garantie.
- `auth-service` utilise `text()` avec des **paramètres liés** (`:email`,
  `:id`, ...), jamais de f-string SQL avec une entrée utilisateur brute.

**Point de vigilance corrigé.** Le nouveau endpoint `GET /academic/events`
accepte un paramètre `month` en requête libre : il est validé par une
expression régulière stricte (`^\d{4}-\d{2}$`) et converti en objets
`date` typés **avant** toute utilisation dans une requête SQLAlchemy
(comparaisons sur colonnes `Date`, jamais de concaténation de chaîne) —
aucune valeur texte brute n'atteint la couche SQL.

---

## Risques complémentaires déjà couverts (bonus, au-delà du minimum de 3)

### A04:2021 — Insecure Design / A07:2021 — Identification & Authentication Failures
- Rate limiting global du gateway (`express-rate-limit`, 100 req/15min par
  IP sur `/api/*`) contre les abus et les attaques par déni de service
  applicatif.
- **Nouveau** : un rate limiter **dédié et plus strict** (10 req/15min) a
  été ajouté spécifiquement sur `/api/auth/login`, `/api/auth/register` et
  `/api/auth/password/reset`, pour ralentir le brute force / credential
  stuffing indépendamment du quota global de l'API.
- JWT à durée de vie courte + refresh token, révocation possible côté
  `auth-service`.

### A05:2021 — Security Misconfiguration
- `helmet()` actif sur le gateway (en-têtes de sécurité HTTP standards :
  `X-Content-Type-Options`, `X-Frame-Options`, etc.).
- CORS restreint à une liste blanche d'origines (`ALLOWED_ORIGINS`), pas de
  `Access-Control-Allow-Origin: *`.
- Toutes les données de configuration sensibles (mots de passe DB, secrets
  JWT, identifiants RabbitMQ) proviennent du fichier `.env`, jamais du code
  source — `.env` doit être exclu du contrôle de version en production
  (voir `.gitignore`).

---

## Tester ces protections

- **Broken Access Control** : se connecter avec `student@campus.edu` puis
  tenter `POST /api/academic/courses/` avec le token obtenu → `403`.
- **Rate limiting** : lancer le script k6 fourni (`load-testing/`) avec un
  grand nombre de VUs concentrés sur le login → apparition de réponses
  `429` passé le quota.
- **Injection SQL** : tenter `GET /api/academic/events?month=2026-08';--`
  → `400 Bad Request` (rejeté par la validation de format), jamais
  d'erreur SQL ni de comportement inattendu.
