# Sécurité — Analyse OWASP Top 10 (CampusWorkflow)

Ce document mappe explicitement **6 risques distincts du Top 10 OWASP**
(au-delà du minimum de 5 exigé), avec pour chacun : le risque, ce qui
existait déjà, la mitigation concrète apportée, et comment la vérifier.

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

## 4. A07:2021 — Identification and Authentication Failures

**Risque.** Un attaquant peut deviner un mot de passe par force brute
(essais répétés automatisés), ou rejouer un token de rafraîchissement volé
pour prolonger indéfiniment une session compromise.

**Constat de l'audit.** `auth-service` émettait déjà des JWT à durée de vie
courte (24h) avec refresh token (7 jours), mais **sans aucune limite sur le
nombre de tentatives de connexion échouées**, et le refresh token pouvait
être **réutilisé indéfiniment** jusqu'à son expiration naturelle (pas de
révocation à l'usage) — un token volé restait donc valable pendant 7 jours
complets.

**Mitigation apportée.**
- **Verrouillage de compte** (`module_authentification/app/redis_client.py`,
  fonctions `record_failed_login` / `lock_account` / `get_lock_ttl`) : après
  5 échecs de connexion sur un même email dans une fenêtre de 15 minutes, le
  compte est verrouillé 15 minutes — `POST /auth/login` répond alors `429`
  **même avec le bon mot de passe**. Le compteur est remis à zéro dès une
  connexion réussie, et ne pénalise jamais un autre compte (isolation par
  email).
- **Rotation réelle des refresh tokens** (`app/main.py`, endpoint
  `POST /auth/refresh`) : chaque refresh token porte un identifiant unique
  (`jti`). Dès qu'il est utilisé pour obtenir de nouveaux tokens, il est
  marqué "consommé" dans Redis (`mark_refresh_jti_used`) — toute tentative
  de le réutiliser (ex : token volé et rejoué par un attaquant après que
  l'utilisateur légitime a déjà rafraîchi sa session) est rejetée avec
  `401`, alors même qu'il n'est pas encore expiré.
- `POST /auth/logout` révoque désormais **à la fois** l'access token
  (blacklist immédiate) et le refresh token fourni, pour qu'une
  déconnexion explicite ne puisse jamais être "ressuscitée".
- Mots de passe hachés en **bcrypt**, jamais en clair ni en MD5/SHA1 (voir
  §2).
- Testé par `module_authentification/tests/test_account_lockout.py` et
  `test_refresh_rotation.py` (12 tests, tous verts).

---

## 5. A05:2021 — Security Misconfiguration

**Risque.** Une configuration par défaut trop permissive (CORS ouvert à
tous les domaines, en-têtes HTTP par défaut sans durcissement, secrets
codés en dur dans le dépôt Git) expose l'application à des attaques qui
n'exploitent aucune faille de code, seulement une mauvaise configuration.

**Mitigation en place.**
- `helmet()` actif sur le gateway (`gateway/server.js`) : en-têtes de
  sécurité HTTP standards (`X-Content-Type-Options`, `X-Frame-Options`,
  désactivation de `X-Powered-By`, etc.), qui évitent d'exposer inutilement
  la nature de la stack technique et durcissent le navigateur contre
  certaines classes d'attaques (clickjacking, MIME sniffing).
- **CORS restreint à une liste blanche** (`ALLOWED_ORIGINS` dans `.env`) —
  jamais `Access-Control-Allow-Origin: *`. Une requête cross-origin depuis
  un domaine non listé est rejetée par le navigateur avant même d'atteindre
  la logique métier.
- Aucun secret (mots de passe DB, `JWT_SECRET`, identifiants RabbitMQ) n'est
  codé en dur dans le code source : tout provient de `.env`
  (`.env.example` fournit un modèle, `.env` réel est listé dans
  `.gitignore` — voir `QUICK_START.md`).
- Chaque microservice tourne dans son propre conteneur, sur son propre
  réseau Docker interne : seuls le `gateway` (port 3000) et le `frontend`
  (port 5173) sont exposés à l'hôte ; les 6 bases PostgreSQL, Redis et
  RabbitMQ ne sont **jamais** directement accessibles depuis l'extérieur du
  réseau Docker.

---

## 6. Autres risques du Top 10 pris en compte par la conception

Ces deux risques, cités explicitement dans l'énoncé de l'examen (XSS,
CSRF), ne forment plus des catégories numérotées séparées dans OWASP Top
10:2021 (absorbées dans des catégories plus larges), mais sont traités
explicitement ici par souci de complétude.

### Cross-Site Scripting (XSS)
- Le frontend est en **React**, qui échappe par défaut tout contenu inséré
  dans le DOM via `{variable}` en JSX — aucune injection de balise HTML/JS
  n'est possible par ce chemin.
- **Vérifié** : `dangerouslySetInnerHTML` (l'unique mécanisme React qui
  désactive cet échappement) n'est utilisé **nulle part** dans
  `frontend/src` (`grep -r "dangerouslySetInnerHTML" frontend/src` → aucun
  résultat).
- Toutes les entrées utilisateur affichées ailleurs (notifications,
  messages) sont rendues comme texte brut, jamais interprétées comme HTML.

### Cross-Site Request Forgery (CSRF)
- CSRF exploite l'envoi **automatique** de cookies de session par le
  navigateur vers un domaine tiers. Cette application n'utilise **aucun
  cookie d'authentification** : les tokens JWT sont stockés côté client
  (`localStorage`, voir `frontend/src/api/client.js`) et envoyés
  explicitement dans l'en-tête `Authorization: Bearer ...` à chaque appel.
- Un site tiers malveillant ne peut donc **jamais** forcer le navigateur de
  la victime à envoyer une requête authentifiée à son insu : il n'y a pas
  d'"ambiant" à voler, contrairement à un cookie de session classique. Le
  risque est structurellement écarté par ce choix d'architecture, renforcé
  par la liste blanche CORS (§5).

### A08:2021 — Software and Data Integrity Failures (désérialisation)
- Toutes les entrées API sont désérialisées via des schémas **strictement
  typés** (Pydantic pour les services FastAPI, SQLModel pour
  finance/HR) — jamais via un mécanisme générique et dangereux comme
  `pickle.loads` ou `eval()`. Un payload dont un champ ne correspond pas au
  type déclaré (ex : une chaîne où un entier est attendu) est rejeté avec
  `422 Unprocessable Entity` **avant** d'atteindre la logique métier,
  jamais silencieusement coercé ou exécuté.

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
- **Verrouillage de compte** : envoyer 5 fois `POST /auth/login` avec un
  mauvais mot de passe pour un même email → la 5ᵉ réponse est `429`, et le
  reste même avec le bon mot de passe pendant 15 minutes.
- **Rotation du refresh token** : appeler `POST /auth/refresh` deux fois de
  suite avec le **même** refresh token → la seconde tentative est `401`.
