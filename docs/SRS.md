# Spécification des Exigences Logicielles (SRS)
## CampusWorkflow — Système ERP universitaire (édition microservices)

**Document aligné sur ISO/IEC/IEEE 29148:2018** (Systems and software
engineering — Life cycle processes — Requirements engineering)

**Cours :** SEN4121 — Large System Environment, ICT University, Summer 2026
**Version :** 1.0
**Statut :** Document vivant — à adapter par l'équipe avant soumission finale

---

## 1. Introduction

### 1.1 Objet du document
Ce document spécifie les exigences fonctionnelles et non fonctionnelles du
système **CampusWorkflow**, une plateforme ERP universitaire multi-tenant
composée de microservices indépendants couvrant trois domaines : Académique,
Marketing & Finance, et Administration & Ressources Humaines. Il sert de
référence contractuelle entre l'équipe de développement et le jury
d'évaluation, et de base à la traçabilité entre exigences, conception et
tests.

### 1.2 Périmètre du produit
CampusWorkflow permet à un établissement universitaire de gérer :
- l'authentification et le contrôle d'accès de son personnel et de ses
  étudiants (`auth-service`) ;
- la gestion académique : programmes, cours, inscriptions, notes,
  emplois du temps (`academic-service`) ;
- la gestion financière et marketing : facturation, paiements mobiles,
  campagnes (`finance-service`) ;
- la gestion des ressources humaines : employés, paie, congés, présence
  (`hr-service`) ;
- la messagerie interne et les notifications transverses
  (`message-service`, `notification-service`) ;
- un assistant conversationnel de support (`chatbot-service`, hors
  périmètre noté du cahier des charges — module bonus).

Le tout est exposé au client web (`frontend`, React) via un point d'entrée
unique, l'**API Gateway** (`gateway`, Node/Express), qui centralise
l'authentification, le contrôle d'accès par rôle (RBAC) et la limitation de
débit (rate limiting).

### 1.3 Définitions, acronymes et abréviations

| Terme | Définition |
|---|---|
| RBAC | Role-Based Access Control — contrôle d'accès basé sur les rôles |
| JWT | JSON Web Token — jeton d'authentification signé |
| SRS | Software Requirements Specification |
| ERD | Entity-Relationship Diagram — diagramme entité-association |
| CNPS | Caisse Nationale de Prévoyance Sociale (Cameroun) |
| PAYE / IRPP | Impôt sur le Revenu des Personnes Physiques (retenue à la source) |
| MoMo | Mobile Money (MTN Mobile Money / Orange Money) |
| PITR | Point-In-Time Recovery — restauration à un instant précis |
| RLS | Row-Level Security (PostgreSQL) |
| VU | Virtual User (utilisateur virtuel, terminologie k6) |

### 1.4 Références
- Énoncé d'examen : *Large System Environment, SEN4121, Summer 2026 Final
  Examination* (ICT University, Faculté des Technologies de l'Information
  et de la Communication)
- `SECURITY.md` — analyse des risques OWASP Top 10 et mitigations
- `docs/BACKUP_ET_PITR.md` — stratégie de sauvegarde et de restauration
- `README.md` — vue d'ensemble de l'architecture et guide de déploiement

### 1.5 Vue d'ensemble du document
La section 2 décrit le produit dans son ensemble (perspective, fonctions
principales, utilisateurs, contraintes). La section 3 détaille les
exigences fonctionnelles par module et les exigences non fonctionnelles.
La section 4 couvre les hypothèses. La section 5 fait la traçabilité avec
le barème.

---

## 2. Description générale

### 2.1 Perspective du produit
CampusWorkflow est un système **greenfield**, sans intégration à un
système existant de l'établissement. Il suit une architecture
microservices avec **une base de données par service** (pattern
*database-per-service*), communication synchrone via l'API Gateway pour
les requêtes utilisateur, et communication **asynchrone par messages**
(RabbitMQ) pour au moins un flux inter-services critique : la création
automatique d'une facture lorsqu'un étudiant s'inscrit à un cours.

```
Navigateur ──> Frontend (React) ──> API Gateway ──> {auth, academic, finance, hr, message, notification}-service
                                                              │
                                                    (académique) ──event bus (RabbitMQ)──> (finance)
```

### 2.2 Fonctions principales du produit
1. Authentification sécurisée, gestion de session, contrôle d'accès par
   rôle (rôles : academic, professeur, student, rh, finance, marketing).
2. Gestion du cycle de vie académique complet : programmes → cours →
   offres de cours → inscriptions → notes → transcripts.
3. Facturation étudiante et suivi des paiements, avec intégration à un
   simulateur de paiement mobile (MTN MoMo / Orange Money).
4. Gestion RH : dossier employé, paie conforme à la réglementation
   camerounaise (CNPS, IRPP/PAYE), congés, présence par QR code.
5. Messagerie interne et notifications transverses entre modules.
6. Journalisation centralisée, health-checks, sauvegarde automatisée.

### 2.3 Caractéristiques des utilisateurs

| Rôle | Description | Modules principaux utilisés |
|---|---|---|
| **Academic** (Direction académique) | Administre programmes, cours, semestres | academic-service |
| **Professeur** | Consulte ses offres de cours, saisit les notes | academic-service |
| **Student** (Étudiant) | Consulte son cursus, ses factures, ses notes | academic-service, finance-service |
| **RH** | Gère les employés, la paie, les congés | hr-service |
| **Finance** | Gère factures, paiements, budgets | finance-service |
| **Marketing** | Gère campagnes et prospects | finance-service |

Chaque utilisateur possède un compte unique dans `auth-service`, avec un
rôle unique qui détermine ses permissions via le RBAC du Gateway.

### 2.4 Contraintes générales
- **Contrainte technologique imposée par l'énoncé** : au moins 3
  microservices indépendants avec base de données propre, API Gateway,
  au moins un flux asynchrone, conteneurisation Docker, pipeline CI/CD.
- **Contrainte réglementaire** : les calculs de paie doivent respecter les
  taux CNPS et barèmes IRPP en vigueur au Cameroun.
- **Contrainte d'infrastructure** : déploiement local via
  `docker compose` (Kubernetes en bonus, non requis).
- **Contrainte de langue** : interface et documentation en français
  (équipe et établissement francophones).

### 2.5 Hypothèses et dépendances
Voir section 4.

---

## 3. Exigences spécifiques

### 3.1 Exigences fonctionnelles

#### FR-1 — Authentification et autorisation (`auth-service`)
- **FR-1.1** Le système DOIT permettre l'inscription d'un compte avec un
  rôle parmi une liste fermée (`academic`, `professeur`, `student`, `rh`,
  `finance`, `marketing`), un mot de passe haché en bcrypt.
- **FR-1.2** Le système DOIT authentifier un utilisateur par email/mot de
  passe et émettre un couple *access token* (JWT, 24h) / *refresh token*
  (JWT, 7 jours).
- **FR-1.3** Le système DOIT verrouiller un compte pendant 15 minutes après
  5 échecs de connexion consécutifs dans une fenêtre de 15 minutes.
- **FR-1.4** Le système DOIT permettre le renouvellement de l'access token
  via le refresh token, et DOIT invalider le refresh token utilisé
  (rotation à usage unique) — toute réutilisation d'un refresh token déjà
  consommé DOIT être rejetée.
- **FR-1.5** Le système DOIT permettre la déconnexion explicite, révoquant
  immédiatement l'access token et le refresh token associés.
- **FR-1.6** Le système DOIT exposer un endpoint `/auth/me` retournant le
  profil de l'utilisateur authentifié.

#### FR-2 — Contrôle d'accès centralisé (`gateway`)
- **FR-2.1** Le Gateway DOIT vérifier la validité du JWT sur toute route
  protégée avant de transmettre la requête au microservice cible.
- **FR-2.2** Le Gateway DOIT appliquer des règles RBAC par route et par
  méthode HTTP (ex : `student` ne peut pas écrire sur `/api/academic/*`).
- **FR-2.3** Le Gateway DOIT limiter le débit des requêtes par IP (global
  et, plus strictement, sur les endpoints d'authentification).
- **FR-2.4** Le Gateway DOIT documenter l'API via une spécification
  OpenAPI/Swagger accessible sur `/api/docs`.

#### FR-3 — Gestion académique (`academic-service`)
- **FR-3.1** Le système DOIT permettre le CRUD des facultés, départements,
  programmes, modules (UE) et cours, avec gestion des prérequis.
- **FR-3.2** Le système DOIT permettre l'inscription d'un étudiant à une
  offre de cours (`course_offering`), en empêchant une double inscription
  active à la même offre.
- **FR-3.3** Le système DOIT permettre la saisie des notes et la
  génération d'un relevé de notes.
- **FR-3.4** Le système DOIT permettre la planification des examens avec
  détection de conflit (même étudiant/salle sur le même créneau).
- **FR-3.5** Lorsqu'une inscription est créée avec succès, le système
  DOIT publier un événement asynchrone (`academic.enrollment.created`)
  sur RabbitMQ, sans attendre de réponse d'un autre service (couplage
  faible).
- **FR-3.6** Le système DOIT signaler un étudiant "à risque" selon une
  règle documentée (assiduité < 75 % ou deux échecs consécutifs).

#### FR-4 — Finance & Marketing (`finance-service`)
- **FR-4.1** Le système DOIT créer automatiquement une facture lorsqu'il
  reçoit l'événement `academic.enrollment.created`, de façon **idempotente**
  (un message redélivré ne doit jamais créer de facture en double).
- **FR-4.2** Le système DOIT permettre le paiement d'une facture via un
  simulateur de paiement mobile (MTN MoMo / Orange Money), avec un statut
  transitoire `EN_ATTENTE` avant confirmation asynchrone.
- **FR-4.3** Le système DOIT permettre la gestion de campagnes marketing
  et le suivi de prospects (leads) rattachés à une campagne.
- **FR-4.4** Le système DOIT produire un rapport financier mensuel agrégé
  en FCFA.

#### FR-5 — Ressources Humaines (`hr-service`)
- **FR-5.1** Le système DOIT permettre le CRUD des employés (matricule
  unique, email unique), avec désactivation (soft-delete) plutôt que
  suppression physique.
- **FR-5.2** Le système DOIT calculer une fiche de paie mensuelle
  intégrant : cotisation CNPS salariale (plafonnée) et patronale, CFC
  salariale et patronale, FNE patronal, IRPP progressif par tranches, et
  CAC (10 % de l'IRPP).
- **FR-5.3** Le système DOIT gérer les soldes de congés par type et par
  année, et le workflow de demande/approbation de congé.
- **FR-5.4** Le système DOIT générer un jeton de pointage par QR code à
  usage unique et à durée de vie limitée, lié à un employé.
- **FR-5.5** L'accès aux données d'un employé DOIT être restreint à ce
  même employé ou au personnel RH (jamais à un tiers).

#### FR-6 — Messagerie & Notifications
- **FR-6.1** Le système DOIT permettre la création de conversations
  (individuelles ou de groupe) et l'envoi de messages entre participants.
- **FR-6.2** Seuls les participants d'une conversation DOIVENT pouvoir y
  lire ou y écrire ; seul l'auteur d'un message DOIT pouvoir le modifier
  ou le supprimer.
- **FR-6.3** Le système DOIT permettre la création de notifications par
  catégorie, leur archivage, et le comptage des notifications non lues
  par utilisateur.

### 3.2 Exigences non fonctionnelles

#### NFR-1 — Performance
- **NFR-1.1** 95 % des requêtes de lecture DOIVENT répondre en moins de
  500 ms sous une charge de référence (voir `load-testing/RESULTS.md` —
  mesuré : p95 = 15 à 165 ms selon la charge, largement conforme).
- **NFR-1.2** Le temps de réponse de la création d'inscription (Service
  Académique) NE DOIT PAS se dégrader si Finance est occupé à traiter la
  file RabbitMQ — preuve du découplage asynchrone (mesuré : p95 = 6,85 à
  16,5 ms).

#### NFR-2 — Sécurité
- **NFR-2.1** Le système DOIT mitiger au moins 5 risques du OWASP Top 10 —
  voir `SECURITY.md` pour le détail (6 risques couverts : Broken Access
  Control, Cryptographic Failures, Injection, Authentication Failures,
  Security Misconfiguration, Software/Data Integrity Failures).
- **NFR-2.2** Aucun mot de passe NE DOIT être stocké en clair ou haché
  avec un algorithme obsolète (MD5/SHA1) — bcrypt exclusivement.
- **NFR-2.3** Toute communication inter-service authentifiée DOIT
  transporter un JWT dont la signature est vérifiable par chaque service.

#### NFR-3 — Fiabilité et disponibilité
- **NFR-3.1** Chaque base de données DOIT disposer d'une sauvegarde
  automatisée quotidienne avec rétention configurable (par défaut 7
  jours) — voir `docs/BACKUP_ET_PITR.md`.
- **NFR-3.2** Le système DOIT permettre une restauration Point-In-Time via
  l'archivage continu des journaux WAL PostgreSQL.
- **NFR-3.3** Chaque service DOIT exposer un endpoint `/health` utilisé
  par les *healthchecks* Docker pour la supervision.

#### NFR-4 — Maintenabilité
- **NFR-4.1** Chaque service DOIT disposer d'une suite de tests
  automatisés couvrant sa logique métier critique, exécutée par le
  pipeline CI/CD à chaque push sur `main` (voir `.github/workflows/ci.yml`).
- **NFR-4.2** Chaque service DOIT être conteneurisé indépendamment
  (Dockerfile propre) et démarrable via une seule commande
  (`docker compose up`).

#### NFR-5 — Scalabilité (documentée, non nécessairement démontrée)
- **NFR-5.1** Chaque service, étant sans état (l'état de session vit dans
  le JWT et dans Redis/PostgreSQL, jamais en mémoire locale du processus),
  PEUT être répliqué horizontalement derrière le Gateway sans
  modification de code.
- **NFR-5.2** Le découplage asynchrone (RabbitMQ) permet d'absorber des
  pics de charge sur `academic-service` sans propager la latence à
  `finance-service`.

### 3.3 Exigences d'interface externe

#### 3.3.1 Interfaces utilisateur
Application web responsive (React), servie sur le port 5173 en
développement, consommant exclusivement l'API du Gateway (aucun appel
direct du frontend vers un microservice interne).

#### 3.3.2 Interfaces logicielles
- **API REST** exposée par chaque microservice, documentée en
  OpenAPI/Swagger, versionnée sous `/api/` au niveau du Gateway.
- **Bus de messages** RabbitMQ (AMQP 0-9-1), exchange de type `topic`,
  pour les événements inter-services asynchrones.
- **Cache/état partagé** Redis, utilisé par `auth-service` pour la
  liste noire de tokens et le verrouillage de compte.

#### 3.3.3 Interfaces matérielles
Aucune — système purement logiciel, déployé sur infrastructure
conteneurisée générique (pas de dépendance matérielle spécifique).

---

## 4. Hypothèses et dépendances

- On suppose que l'établissement dispose d'une seule instance
  (mono-tenant en pratique, bien que l'architecture soit compatible
  multi-tenant) pour la durée du projet académique.
- On suppose que les taux CNPS/IRPP camerounais utilisés
  (`module_rh/app/config.py`) restent ceux en vigueur au moment de la
  démonstration ; toute évolution réglementaire nécessiterait une mise à
  jour de configuration, pas de code.
- Le simulateur de paiement mobile (MoMo/Orange Money) n'appelle aucune
  API bancaire réelle — c'est un mock explicitement autorisé par
  l'énoncé en l'absence d'accès à un environnement sandbox.
- La disponibilité de RabbitMQ, PostgreSQL et Redis est supposée assurée
  par l'orchestration Docker Compose (`depends_on` + `healthcheck`) ; en
  cas d'indisponibilité prolongée d'un service, le comportement de repli
  n'est pas spécifié au-delà du découplage asynchrone déjà en place.

---

## 5. Traçabilité avec le barème de l'examen

| Critère du barème | Section de ce SRS |
|---|---|
| Authentification & RBAC | FR-1, FR-2, NFR-2 |
| Base de données | NFR-3 |
| Microservices & API | 2.1, FR-2.4 |
| Exigences non fonctionnelles | NFR-1 à NFR-5 |
| Tests & QA | NFR-4.1 |
| DevOps | NFR-4.2 |
| Module Académique | FR-3 |
| Module Finance & Marketing | FR-4 |
| Module RH | FR-5 |
| Documentation & UML | Ce document + `docs/uml/` |

Voir `docs/uml/` pour la suite de diagrammes UML (cas d'utilisation,
classes, séquences, ERD, déploiement) correspondant à ces exigences.
