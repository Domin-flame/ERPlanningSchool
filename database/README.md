# Bases de données ERP — SEN4121

Implémentation PostgreSQL 16 des 4 bases (`identity_db`, `academic_db`,
`finance_db`, `hr_db`), une par microservice, avec RBAC (rôles/permissions)
+ ABAC (Row-Level Security Postgres), conforme au MCD/MLD précédemment validés.

## 1. Démarrage rapide

```bash
cp .env.example .env        # puis remplir avec de vrais mots de passe (openssl rand -base64 24)
docker compose up -d
docker compose ps           # attendre que les 4 bases soient "healthy"
```

Au premier démarrage, Postgres exécute automatiquement, par ordre alphabétique,
les fichiers de `*/init/` :
1. `01_schema.sql` — tables, contraintes, index (rôle superuser d'init)
2. `02_roles.sh` — crée les rôles applicatifs à privilège minimal
3. `03_rls.sql` — active Row-Level Security + policies ABAC

## 2. Qui possède quelle donnée (important pour la soutenance)

Le pattern *database-per-service* interdit les FK physiques inter-bases.
Chaque donnée a UNE base MASTER ; les autres bases qui en ont besoin gardent
une **table cache en lecture seule**, synchronisée en asynchrone via le
broker (RabbitMQ/Kafka) — c'est ce qui justifie l'exigence "au moins un
workflow asynchrone inter-services" du sujet, appliquée ici à plusieurs cas :

| Donnée | Base MASTER | Bases qui gardent un cache | Topic d'événement |
|---|---|---|---|
| `person` | `identity_db` | — (les autres ne stockent que `id_person`) | `identity.person.events` |
| `organization_unit` | `academic_db` | `hr_db.organization_unit_ref` | `org.unit.events` |
| `student` | `academic_db` | `finance_db.student_ref` | `academic.student.events` |
| `employee` | `hr_db` | `academic_db.teacher_ref` | `hr.employee.events` |

Le workflow métier "inscription → facture" (exigé par le sujet) :
`academic-service` publie `EnrollmentCreated` → `finance-service` consomme
l'événement et génère `Invoice` + `InvoiceLine` automatiquement.

## 3. RBAC + ABAC — comment ça marche de bout en bout

1. **Login** (`identity-service`) : vérifie `password_hash` (Argon2id),
   émet un JWT contenant `sub` (id_person), `roles` (depuis `user_role`/`role`),
   et des claims contextuels (`student_id`, `employee_id`, `unit_id` si pertinent).
2. **Gateway** : valide le JWT, transmet les claims aux services en aval
   (header interne ou JWT repassé tel quel).
3. **Chaque service FastAPI** : un middleware/dependency ouvre une transaction
   et exécute `SET LOCAL app.current_person_id = ...` etc. **avant** toute
   requête métier. Les policies RLS (déjà en place dans `03_rls.sql`)
   filtrent alors automatiquement les lignes visibles/modifiables —
   même si un développeur oublie un `WHERE` dans le code applicatif.

Exemple de dependency FastAPI (SQLAlchemy 2.x, driver `psycopg`) :

```python
# app/db/session.py
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends, Request

def get_db_with_rls(request: Request, db: Session = Depends(get_db)):
    claims = request.state.jwt_claims  # posé par le middleware d'auth
    db.execute(text("SET LOCAL app.current_person_id = :v"), {"v": claims["sub"]})
    db.execute(text("SET LOCAL app.current_roles = :v"), {"v": ",".join(claims["roles"])})
    if claims.get("student_id"):
        db.execute(text("SET LOCAL app.current_student_id = :v"), {"v": claims["student_id"]})
    if claims.get("employee_id"):
        db.execute(text("SET LOCAL app.current_employee_id = :v"), {"v": claims["employee_id"]})
    if claims.get("unit_id"):
        db.execute(text("SET LOCAL app.current_unit_id = :v"), {"v": claims["unit_id"]})
    yield db
```

`SET LOCAL` ne vaut que pour la transaction en cours : donc appelle ça au
début de chaque requête/transaction, pas une seule fois à la connexion
(sinon les valeurs "fuient" vers d'autres requêtes si tu utilises un pool).

## 4. Rôles Postgres créés par service

Chaque base a 3 rôles (jamais le superuser en usage applicatif) :
- `app_<service>_service` — CRUD complet, utilisé par l'API FastAPI (`DATABASE_URL`)
- `app_<service>_event_consumer` — écrit uniquement dans la table cache (`*_ref`)
- `app_<service>_readonly` — SELECT seul, pour un futur reporting/BI

Aucun de ces rôles n'a `BYPASSRLS` : les policies s'appliquent toujours.

## 5. Migrations — Alembic (déjà scaffoldé pour `identity-service`)

Le dossier `identity-service/alembic/` est un template complet et fonctionnel.
Pour les 3 autres services :

```bash
cp -r identity-service/alembic academic-service/alembic
# puis dans academic-service/alembic/env.py : adapter DATABASE_URL par défaut
# et dans versions/0001_baseline.py : rien à changer (il lit déjà ../init/*.sql)
```

Après le premier `docker compose up` (schéma déjà créé par les scripts d'init) :

```bash
cd identity-service/alembic
DATABASE_URL=postgresql+psycopg://app_identity_service:<mdp>@localhost:5433/identity_db \
  alembic stamp 0001_baseline
```

Pour toute évolution future du schéma, crée une vraie migration :

```bash
alembic revision -m "add mfa_backup_codes table"
# édite le fichier généré dans versions/, puis :
alembic upgrade head
```

## 6. Ports exposés (dev local uniquement)

| Base | Port hôte |
|---|---|
| identity_db | 5433 |
| academic_db | 5434 |
| finance_db | 5435 |
| hr_db | 5436 |

À retirer (`ports:` dans docker-compose.yml) avant toute démo publique —
seul le réseau interne `erp-backend` doit y avoir accès en production/démo.

## 7. Ce qui reste à faire côté application (hors scope de cette livraison)

- Définir les modèles SQLAlchemy (pour l'ORM CRUD) miroir des tables SQL.
- Implémenter les consumers RabbitMQ qui alimentent les tables `*_ref`.
- Implémenter le middleware JWT qui peuple `request.state.jwt_claims`.
- Écrire le job de rotation des `refresh_token` expirés (cron ou tâche Celery/APScheduler).
- Documenter les `EXPLAIN ANALYZE` avant/après sur les requêtes lourdes
  (ex. `enrollment` + `grade` pour le dashboard "étudiants à risque") pour le rapport.
