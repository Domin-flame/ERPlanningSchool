# Academic Module Service

Microservice FastAPI + PostgreSQL gérant le **module académique** : structure
pédagogique, calendrier, personnes, infrastructure, offres de cours et
dossiers pédagogiques (inscriptions, notes, séances, présences), conforme
au MCD/MLD fourni.

## Sommaire
- [Démarrage rapide](#démarrage-rapide)
- [Architecture du projet](#architecture-du-projet)
- [Modèle de données couvert](#modèle-de-données-couvert)
- [Liste des endpoints](#liste-des-endpoints)
- [Exemple d'utilisation complet](#exemple-dutilisation-complet-curl)
- [Lancer les tests automatisés](#lancer-les-tests-automatisés)
- [Dépannage](#dépannage)

---

## Démarrage rapide

Prérequis : Docker + Docker Compose installés.

```bash
docker-compose up --build
```

- API : http://localhost:8000
- Documentation interactive (Swagger) : http://localhost:8000/docs
- Documentation alternative (ReDoc) : http://localhost:8000/redoc
- Base de données PostgreSQL exposée sur le port `5432` (utilisateur
  `academic_user`, mot de passe `academic_pass`, base `academic_db`)

Les tables sont créées **automatiquement** au démarrage de l'API (aucune
migration manuelle à lancer).

---

## Architecture du projet

```
academic-service/
├── docker-compose.yml       # Orchestration API + PostgreSQL
├── Dockerfile                # Image de l'API FastAPI
├── requirements.txt
├── .env.example
├── pytest.ini
├── app/
│   ├── main.py                # Point d'entrée FastAPI, CORS, lifespan
│   ├── config.py              # Lecture de DATABASE_URL (variables d'env)
│   ├── database.py            # Moteur SQLAlchemy + session
│   ├── models.py              # 20 modèles SQLAlchemy (tout le MLD)
│   ├── schemas.py             # Schémas Pydantic (Create/Update/Read)
│   ├── crud.py                # Classe CRUD générique réutilisable
│   └── routers/
│       ├── academic_structure.py   # Faculty, Department, Programs,
│       │                            # Module_UE, groups, Course, prerequisites
│       ├── calendar.py             # Academic_year, Semester
│       ├── people.py               # User, Teacher, Student
│       ├── infrastructure.py       # Campus, Building, Room
│       ├── offerings.py            # Course_offering, Class_schedule, Exam
│       └── records.py              # Enrollment, Grade, Session, Attendance
└── tests/
    ├── conftest.py             # Fixtures pytest (base SQLite isolée)
    ├── test_academic_structure.py
    ├── test_calendar.py
    ├── test_people.py
    ├── test_infrastructure.py
    └── test_offerings_and_records.py   # flux complet bout en bout
```

---

## Modèle de données couvert

Toutes les entités et associations du MLD fourni sont implémentées avec
leurs clés étrangères et contraintes :

| Domaine | Tables |
|---|---|
| Structure académique | `faculties`, `departments`, `programs`, `modules_ue`, `groups` (liaison programme↔module), `courses`, `prerequisite_courses` |
| Calendrier | `academic_years`, `semesters` |
| Personnes | `users`, `teachers`, `students` |
| Infrastructure | `campuses`, `buildings`, `rooms` |
| Offres de cours | `course_offerings`, `class_schedules`, `exams` |
| Dossiers pédagogiques | `enrollments`, `grades`, `sessions`, `attendances` |

Chaque route applique les règles d'intégrité issues du diagramme : par
exemple un `Department` ne peut être créé que si sa `Faculty` existe, un
étudiant ne peut être inscrit deux fois à la même offre de cours, un cours
ne peut être son propre prérequis, `start_time < end_time` sur un créneau,
etc.

---

## Liste des endpoints

Chaque ressource expose le CRUD standard :
`POST /ressource/`, `GET /ressource/`, `GET /ressource/{id}`,
`PUT /ressource/{id}`, `DELETE /ressource/{id}`.

| Préfixe | Ressource |
|---|---|
| `/faculties` | Facultés |
| `/departments` | Départements |
| `/programs` | Programmes/filières |
| `/modules` | Modules (UE) |
| `/groups` | Liaison programme ↔ module (clé composite) |
| `/courses` | Cours |
| `/prerequisites` | Prérequis entre cours (clé composite) |
| `/academic-years` | Années académiques |
| `/semesters` | Semestres |
| `/users` | Utilisateurs (rôle Admin/Teacher/Student) |
| `/teachers` | Enseignants |
| `/students` | Étudiants |
| `/campuses` | Campus |
| `/buildings` | Bâtiments |
| `/rooms` | Salles |
| `/course-offerings` | Offres de cours (instance d'un cours sur un semestre) |
| `/class-schedules` | Créneaux d'emploi du temps |
| `/exams` | Examens |
| `/enrollments` | Inscriptions des étudiants aux offres de cours |
| `/grades` | Notes |
| `/sessions` | Séances de cours effectives |
| `/attendances` | Présences |

La liste exhaustive avec les schémas de requête/réponse est disponible sur
`/docs` une fois l'API démarrée.

---

## Exemple d'utilisation complet (curl)

Enchaînement typique : créer la structure, puis inscrire un étudiant et lui
attribuer une note.

```bash
BASE=http://localhost:8000

# 1. Faculté -> Département -> Programme
FACULTY_ID=$(curl -s -X POST $BASE/faculties/ -H "Content-Type: application/json" \
  -d '{"name":"Sciences","code":"FAC-SCI"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['faculty_id'])")

DEPT_ID=$(curl -s -X POST $BASE/departments/ -H "Content-Type: application/json" \
  -d "{\"name\":\"Informatique\",\"faculty_id\":$FACULTY_ID}" | python3 -c "import sys,json;print(json.load(sys.stdin)['department_id'])")

PROGRAM_ID=$(curl -s -X POST $BASE/programs/ -H "Content-Type: application/json" \
  -d "{\"name\":\"Licence Info\",\"level\":\"L2\",\"department_id\":$DEPT_ID}" | python3 -c "import sys,json;print(json.load(sys.stdin)['program_id'])")

# 2. Module -> Cours
MODULE_ID=$(curl -s -X POST $BASE/modules/ -H "Content-Type: application/json" \
  -d '{"code":"MOD-DB","title":"Bases de données","credits_ects":6}' | python3 -c "import sys,json;print(json.load(sys.stdin)['module_id'])")

COURSE_ID=$(curl -s -X POST $BASE/courses/ -H "Content-Type: application/json" \
  -d "{\"code\":\"CRS-DB1\",\"title\":\"SQL avancé\",\"credits\":3,\"module_id\":$MODULE_ID}" | python3 -c "import sys,json;print(json.load(sys.stdin)['course_id'])")

# 3. Campus -> Bâtiment -> Salle
CAMPUS_ID=$(curl -s -X POST $BASE/campuses/ -H "Content-Type: application/json" \
  -d '{"name":"Campus Principal","city":"Yaoundé"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['campus_id'])")

# 4. Année académique -> Semestre
YEAR_ID=$(curl -s -X POST $BASE/academic-years/ -H "Content-Type: application/json" \
  -d '{"start_date":"2025-09-01","end_date":"2026-07-31","year_label":"2025-2026"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['academic_year_id'])")

SEMESTER_ID=$(curl -s -X POST $BASE/semesters/ -H "Content-Type: application/json" \
  -d "{\"term_name\":\"Semestre 1\",\"start_date\":\"2025-09-01\",\"end_date\":\"2026-01-31\",\"is_locked\":false,\"academic_year_id\":$YEAR_ID}" | python3 -c "import sys,json;print(json.load(sys.stdin)['semester_id'])")

# 5. Utilisateur enseignant -> Enseignant
TEACHER_USER_ID=$(curl -s -X POST $BASE/users/ -H "Content-Type: application/json" \
  -d '{"name":"Prof Martin","email":"prof.martin@example.com","role":"Teacher"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['user_id'])")

TEACHER_ID=$(curl -s -X POST $BASE/teachers/ -H "Content-Type: application/json" \
  -d "{\"employee_code\":\"EMP-100\",\"speciality\":\"BDD\",\"user_id\":$TEACHER_USER_ID}" | python3 -c "import sys,json;print(json.load(sys.stdin)['teacher_id'])")

# 6. Offre de cours
OFFERING_ID=$(curl -s -X POST $BASE/course-offerings/ -H "Content-Type: application/json" \
  -d "{\"name\":\"SQL avancé - Groupe A\",\"campus_id\":$CAMPUS_ID,\"teacher_id\":$TEACHER_ID,\"course_id\":$COURSE_ID,\"semester_id\":$SEMESTER_ID}" | python3 -c "import sys,json;print(json.load(sys.stdin)['course_offering_id'])")

# 7. Utilisateur étudiant -> Étudiant -> Inscription
STUDENT_USER_ID=$(curl -s -X POST $BASE/users/ -H "Content-Type: application/json" \
  -d '{"name":"Alice Etudiante","email":"alice@example.com","role":"Student"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['user_id'])")

STUDENT_ID=$(curl -s -X POST $BASE/students/ -H "Content-Type: application/json" \
  -d "{\"matricule\":\"MAT-2025-010\",\"enrollment_date\":\"2025-09-01\",\"status\":\"Active\",\"program_id\":$PROGRAM_ID,\"user_id\":$STUDENT_USER_ID}" | python3 -c "import sys,json;print(json.load(sys.stdin)['student_id'])")

curl -s -X POST $BASE/enrollments/ -H "Content-Type: application/json" \
  -d "{\"status\":\"Active\",\"enrollment_date\":\"2025-09-05\",\"student_id\":$STUDENT_ID,\"course_offering_id\":$OFFERING_ID}"
```

---

## Lancer les tests automatisés

Les tests utilisent une base **SQLite isolée** (aucune dépendance à
PostgreSQL n'est nécessaire pour les exécuter) et couvrent : le CRUD de
chaque ressource, les contraintes d'intégrité (clé étrangère manquante,
doublons interdits), et un **flux complet bout en bout** (structure
académique → offre de cours → inscription → note → séance → présence).

### En local
```bash
pip install -r requirements.txt
pytest -v
```

### Dans le conteneur Docker
```bash
docker-compose exec api pytest -v
```

19 tests, tous verts :
```
tests/test_academic_structure.py ......      [ 31%]
tests/test_calendar.py ...                   [ 47%]
tests/test_infrastructure.py ...             [ 63%]
tests/test_offerings_and_records.py ..       [ 73%]
tests/test_people.py .....                   [100%]
```

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `api` redémarre en boucle | PostgreSQL pas encore prêt | Le `healthcheck` du service `db` bloque déjà le démarrage de `api` ; attendre quelques secondes ou vérifier `docker-compose logs db` |
| `password authentication failed` | Volume PostgreSQL réutilisé avec d'anciens identifiants | `docker-compose down -v` puis `docker-compose up --build` pour repartir d'un volume propre |
| Port `8000` ou `5432` déjà utilisé | Un autre service tourne localement | Modifier le mapping de ports dans `docker-compose.yml` |
| `ModuleNotFoundError: app` en lançant pytest hors Docker | Mauvais répertoire courant | Lancer `pytest` depuis la racine `academic-service/` (le fichier `pytest.ini` fixe `pythonpath = .`) |
| Modifications de code non prises en compte | Cache Docker | `docker-compose up --build --force-recreate` |

## Notes techniques

- **ORM** : SQLAlchemy 2.0 avec `declarative_base`, relations bidirectionnelles
  (`relationship`/`back_populates`) et cascades de suppression cohérentes
  avec le MLD (ex. supprimer un `Campus` supprime ses `Building`).
- **Validation** : chaque route de création vérifie l'existence des clés
  étrangères référencées avant insertion, avec un code `404` explicite.
- **Tables de jonction** (`groups`, `prerequisite_courses`) : gérées avec
  des routes dédiées puisqu'elles n'ont pas de clé primaire simple.
- **Compatibilité base de données** : `app/database.py` détecte
  automatiquement si `DATABASE_URL` pointe vers SQLite (tests) ou
  PostgreSQL (Docker/production) et adapte les `connect_args` en conséquence.
