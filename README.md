# HR & Admin Service — Module RH de l'ERP scolaire

Microservice FastAPI + PostgreSQL gérant : employés, paie (CNPS/PAYE), congés,
et pointage par QR code.

## 1. Démarrage rapide

```bash
cp .env.example .env
# édite .env : mets le MÊME JWT_SECRET que le service Auth de ton groupe

docker build -t hr-service .
docker run --env-file .env -p 8003:8003 hr-service
```

Documentation Swagger auto-générée : `http://localhost:8003/docs`
(exigence Week 3 — "documente tes APIs avec OpenAPI/Swagger", FastAPI le fait
automatiquement à partir du code, aucun fichier YAML à écrire à la main).

## 2. Endpoints principaux (préfixe `/api/v1/hr`)

| Méthode | Route                              | Rôle requis   | Description |
|---------|-------------------------------------|---------------|-------------|
| POST    | `/employees/`                       | admin, hr     | Créer un employé |
| GET     | `/employees/`                       | admin, hr     | Lister les employés |
| GET     | `/employees/{id}`                   | tous (soi-même ou admin/hr) | Fiche employé |
| POST    | `/leave/requests`                   | tous          | Demander un congé |
| PATCH   | `/leave/requests/{id}`              | admin, hr     | Approuver/rejeter |
| GET     | `/attendance/qr/{employee_id}`      | tous          | Générer le QR de pointage |
| POST    | `/attendance/scan`                  | tous          | Scanner le QR (check-in/out) |
| POST    | `/payroll/generate/{employee_id}`   | admin, hr     | Générer le bulletin de paie |

## 3. Lien avec les autres semaines (à savoir expliquer à l'oral)

**Week 1 (Auth) :** ce service ne fait PAS de login. Il reçoit le JWT émis
par le service Auth dans le header `Authorization: Bearer <token>`, et
`app/auth.py` le vérifie avec le même secret. Le rôle (`admin`/`hr`/`student`)
contenu dans le token pilote le RBAC via `require_roles([...])`.

**Week 2 (Base de données) :** voir `sql/schema.sql`. Les congés sont dans
une table séparée (`leave_balances`) plutôt que des colonnes dans
`employees`, pour respecter la 3NF. Index sur `email`, `department`,
`(employee_id, date)` pour les recherches fréquentes.

**Week 3 (API Gateway) :** ce service tourne sur le port 8003 et n'est PAS
appelé directement par le frontend — il doit être enregistré dans la
config du Gateway pour que `/api/v1/hr/*` soit redirigé vers ce conteneur.
Donne l'URL interne (`http://hr-service:8003`) à la personne qui code le
Gateway pour qu'elle ajoute la route.

## 4. Ce qu'il faut savoir expliquer en évaluation (n'importe quel membre)

1. **Comment le JWT est vérifié** ici sans redemander au service Auth
   (vérification locale par signature — c'est tout l'intérêt du JWT).
2. **CNPS/PAYE** : quelle est la différence entre part salariale (retenue
   sur le salaire) et part patronale (coût pour l'employeur, n'apparaît pas
   dans le "net à payer"). Voir `payroll_calculator.py`.
3. **QR code de pointage** : pourquoi il expire après 5 minutes (empêche
   la triche/réutilisation d'une photo du QR) et pourquoi il est signé
   (empêche la fabrication d'un faux QR).
4. **RBAC** : montrer qu'un `student`/employé lambda ne peut pas créer
   d'employé ni approuver un congé (essaie avec un token du mauvais rôle,
   ça doit renvoyer 403).

## 5. Note sur les taux CNPS/PAYE

Les taux dans `app/config.py` sont des constantes **configurables**,
à ajuster si besoin auprès des barèmes officiels CNPS/DGI actuels — ce
n'est pas un conseil fiscal, juste une base de calcul pédagogique réaliste
pour le projet.
