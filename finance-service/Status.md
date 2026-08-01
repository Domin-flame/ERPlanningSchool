# Service Finance & Marketing — État au 1er août (Semaine 3)

Responsable : Ryan (Dominic) — Trello : "Développer le service Finance & Marketing
(factures, paiements MoMo, campagnes)"

## Architecture

- Microservice FastAPI indépendant, base PostgreSQL dédiée (`finance_db`),
  pattern "database-per-service" comme le reste du projet.
- Le schéma SQL (tables, contraintes, RLS) est défini dans
  `database/finance-service/init/*.sql` — le service NE crée PAS ses
  tables via SQLModel (`create_all()` n'est jamais appelé), pour ne pas
  perdre les colonnes `GENERATED` et les policies RLS déjà écrites.

```
finance-service/
├── Dockerfile
├── requirements.txt
├── STATUS.md              ← ce fichier
├── init-migration/
│   └── 04_add_payment_statut.sql   (voir "Migration en attente" ci-dessous)
└── app/
    ├── database.py         connexion + contexte RLS
    ├── models.py            reflète database/finance-service/init/01_schema.sql
    ├── momo.py               simulation des paiements MoMo
    └── main.py                endpoints FastAPI
```

## Comment lancer le service

```powershell
cd database
docker compose up finance-db finance-service --build
```
Nécessite au préalable un `database/.env` rempli (voir `database/.env.example`),
au minimum les 4 variables `FINANCE_DB_*`.

Service accessible sur **http://localhost:8002/docs** (Swagger).

Pour lancer en arrière-plan (pour ne pas perdre le conteneur en fermant le terminal) :
```powershell
docker compose up finance-db finance-service --build -d
docker compose logs -f finance-service   # pour revoir les logs ensuite
```

## ⚠️ À FAIRE avant de connecter le frontend

### 1. Migration manquante — colonne `payment.statut`
Le schéma original (`01_schema.sql`) n'a pas de colonne `statut` sur
`payment` — il suppose qu'un paiement enregistré est déjà confirmé, ce qui
ne marche pas pour un flux MoMo asynchrone (initié → en attente → confirmé).

**À appliquer** sur une base déjà créée :
```powershell
Get-Content finance-service\init-migration\04_add_payment_statut.sql | docker exec -i finance-db psql -U finance_super -d finance_db
```
**Et** copier ce fichier dans `database/finance-service/init/` pour que les
prochaines recréations de la base (volume vide) l'incluent dès le départ.

⚠️ Ce changement touche le schéma d'un coéquipier — à valider/annoncer en
équipe avant de le fusionner définitivement dans `01_schema.sql`.

### 2. RLS temporairement forcée à `finance_staff`
Dans `app/database.py`, chaque connexion exécute
`SET app.current_roles = 'finance_staff'` — donc **toutes** les requêtes
sont actuellement traitées comme si elles venaient du staff finance,
peu importe qui appelle l'API. Il n'y a pas encore de vraie
authentification sur ce service.

**À faire** : décoder le JWT émis par `identity-service` (même secret
`JWT_SECRET`) et dériver le contexte RLS (`SET LOCAL app.current_roles`,
`app.current_student_id`) à partir du rôle/utilisateur réel du token.

### 3. Mapping rôles/utilisateurs pas encore décidé en équipe
- `identity-service` connaît les rôles `Admin` / `Student`.
- `finance-service` (RLS) attend `admin` / `super_admin` / `finance_staff`
  (minuscules, taxonomie différente).
- Un `User.id` (identity) n'est pas directement un `id_student`
  (academic/finance) — il faut décider comment les relier.

Ces trois questions sont liées et à trancher **ensemble**, idéalement
avant la Semaine 4 (consumer d'événements RabbitMQ pour `student_ref`).

### 4. Cache `student_ref` alimenté manuellement
`POST /student-ref` permet de peupler le cache local à la main — c'est un
stub. En Semaine 4, ce cache doit être synchronisé automatiquement par un
consumer d'événements écoutant `academic-service` (voir commentaire dans
`main.py`), pas via cet endpoint manuel.

## Endpoints testés et fonctionnels

| Endpoint | Statut | Notes |
|---|---|---|
| `POST /student-ref` | ✅ | Stub manuel, à remplacer par un consumer d'événements |
| `POST /invoices` | ✅ | `numero_facture` inclut un suffixe aléatoire pour éviter les doublons |
| `GET /invoices/{id}` | ✅ | |
| `GET /students/{id}/invoices` | ✅ | Utilise l'index sur `invoice.id_student` |
| `POST /payments/momo/initiate` | ✅ | Simulation — voir `app/momo.py`. Nécessite la migration #1 ci-dessus |
| `POST /payments/momo/confirm/{reference}` | ✅ | Met à jour `payment` ET `invoice` dans la même transaction |
| `GET /payments/{reference}` | ✅ | |
| `POST /campaigns`, `GET /campaigns` | ✅ | |
| `POST /leads`, `GET /campaigns/{id}/leads` | ✅ | |

## Exemple de flux complet (pour tester ou faire une démo)

```
1. POST /student-ref        {"id_student": 1, "id_person": 1, "matricule": "ICTU001", "nom_complet_cache": "Test Etudiant"}
2. POST /invoices            {"id_student": 1, "date_echeance": "2026-09-01", "lignes": [{"description": "Frais scolarite", "quantite": 1, "prix_unitaire": 450000}]}
3. POST /payments/momo/initiate   {"id_invoice": 1, "montant": 450000, "methode": "MTN_MOMO", "numero_telephone": "677000000"}
4. Attendre 5s (confirmation auto) OU POST /payments/momo/confirm/{reference}
5. GET /invoices/1           -> statut doit être "PAYEE"
```

## Intégration MoMo réelle — pour plus tard
`app/momo.py` documente précisément où brancher une vraie API (MTN MoMo
Collections API ou Orange Money API) : remplacer le corps de
`initiate_payment()` par un appel HTTP réel, et remplacer l'endpoint
`/payments/momo/confirm/{reference}` par le vrai webhook du fournisseur.
La logique métier (transaction `payment` + `invoice`) n'a pas besoin de
changer.

## Problèmes rencontrés pendant le développement (pour référence)
- Chemin `build:` dans `docker-compose.yml` : bien utiliser `../finance-service`
  (relatif à `database/`, où vit le compose), pas `./finance-service`.
- `montant` sur `invoice_line` est une colonne PostgreSQL `GENERATED ALWAYS AS`
  → doit être déclarée avec `Computed(...)` côté SQLModel, jamais écrite manuellement.
- RLS (`03_rls.sql`) bloque les écritures sans `app.current_roles` défini en session.