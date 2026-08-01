# Documentation de l'API — Academic Module Service

Cette documentation liste **chaque endpoint** exposé par le service de module académique, générée directement à partir du schéma **OpenAPI 3.1** produit par FastAPI (donc garantie synchronisée avec le code réel). Le service expose aussi cette même définition sous forme interactive :

- **Swagger UI** (essai des requêtes directement dans le navigateur) : `http://localhost:8000/docs`
- **ReDoc** (documentation de référence, lecture seule) : `http://localhost:8000/redoc`
- **Schéma brut JSON** : `http://localhost:8000/openapi.json`

Deux fichiers du schéma sont fournis à côté de ce document : `openapi.json` et 
`openapi.yaml`, importables tels quels dans Postman, Insomnia, Bruno ou tout autre 
client compatible OpenAPI.

## Informations générales

| | |
|---|---|
| **Titre** | Academic Module Service |
| **Version** | 1.0.0 |
| **Spécification** | OpenAPI 3.1.0 |
| **URL de base (Docker/local)** | `http://localhost:8000` |
| **Format** | `application/json` en entrée et en sortie |
| **Authentification** | Aucune sur ce service (backend interne — à protéger via une gateway/API Gateway ou un service d'auth dédié en production) |
| **Total** | 108 opérations sur 46 chemins uniques, réparties en 7 domaines |

## Sommaire

- [🏛️ Structure académique](#structure-academique) — 31 endpoints
- [📅 Calendrier académique](#calendrier-academique) — 10 endpoints
- [👥 Personnes](#personnes) — 15 endpoints
- [🏢 Infrastructure](#infrastructure) — 15 endpoints
- [📚 Offres de cours](#offres-de-cours) — 15 endpoints
- [📝 Dossiers pédagogiques](#dossiers-pedagogiques) — 20 endpoints
- [🩺 Health](#health) — 2 endpoints

## 🏛️ Structure académique

Facultés, départements, programmes, modules (UE), liaison programme ↔ module (`groups`), cours et prérequis entre cours (`prerequisites`).

| Méthode | Endpoint | Description | Corps de requête | Réponse succès | Erreurs |
|---|---|---|---|---|---|
| `POST` | `/faculties/` | Create Faculty | [`FacultyCreate`](#schémas-de-données) | `201` → [`FacultyRead`](#schémas-de-données) | `422` |
| `GET` | `/faculties/` | List Faculties | — | `200` → liste de [`FacultyRead`](#schémas-de-données) | `422` |
| `GET` | `/faculties/{faculty_id}` | Get Faculty | — | `200` → [`FacultyRead`](#schémas-de-données) | `422` |
| `PUT` | `/faculties/{faculty_id}` | Update Faculty | [`FacultyUpdate`](#schémas-de-données) | `200` → [`FacultyRead`](#schémas-de-données) | `422` |
| `DELETE` | `/faculties/{faculty_id}` | Delete Faculty | — | `204 No Content` | `422` |
| `POST` | `/departments/` | Create Department | [`DepartmentCreate`](#schémas-de-données) | `201` → [`DepartmentRead`](#schémas-de-données) | `422` |
| `GET` | `/departments/` | List Departments | — | `200` → liste de [`DepartmentRead`](#schémas-de-données) | `422` |
| `GET` | `/departments/{department_id}` | Get Department | — | `200` → [`DepartmentRead`](#schémas-de-données) | `422` |
| `PUT` | `/departments/{department_id}` | Update Department | [`DepartmentUpdate`](#schémas-de-données) | `200` → [`DepartmentRead`](#schémas-de-données) | `422` |
| `DELETE` | `/departments/{department_id}` | Delete Department | — | `204 No Content` | `422` |
| `POST` | `/programs/` | Create Program | [`ProgramCreate`](#schémas-de-données) | `201` → [`ProgramRead`](#schémas-de-données) | `422` |
| `GET` | `/programs/` | List Programs | — | `200` → liste de [`ProgramRead`](#schémas-de-données) | `422` |
| `GET` | `/programs/{program_id}` | Get Program | — | `200` → [`ProgramRead`](#schémas-de-données) | `422` |
| `PUT` | `/programs/{program_id}` | Update Program | [`ProgramUpdate`](#schémas-de-données) | `200` → [`ProgramRead`](#schémas-de-données) | `422` |
| `DELETE` | `/programs/{program_id}` | Delete Program | — | `204 No Content` | `422` |
| `POST` | `/modules/` | Create Module | [`ModuleCreate`](#schémas-de-données) | `201` → [`ModuleRead`](#schémas-de-données) | `422` |
| `GET` | `/modules/` | List Modules | — | `200` → liste de [`ModuleRead`](#schémas-de-données) | `422` |
| `GET` | `/modules/{module_id}` | Get Module | — | `200` → [`ModuleRead`](#schémas-de-données) | `422` |
| `PUT` | `/modules/{module_id}` | Update Module | [`ModuleUpdate`](#schémas-de-données) | `200` → [`ModuleRead`](#schémas-de-données) | `422` |
| `DELETE` | `/modules/{module_id}` | Delete Module | — | `204 No Content` | `422` |
| `POST` | `/groups/` | Create Group Link | [`GroupCreate`](#schémas-de-données) | `201` → [`GroupRead`](#schémas-de-données) | `422` |
| `GET` | `/groups/` | List Group Links | — | `200` → liste de [`GroupRead`](#schémas-de-données) | — |
| `DELETE` | `/groups/{program_id}/{module_id}` | Delete Group Link | — | `204 No Content` | `422` |
| `POST` | `/courses/` | Create Course | [`CourseCreate`](#schémas-de-données) | `201` → [`CourseRead`](#schémas-de-données) | `422` |
| `GET` | `/courses/` | List Courses | — | `200` → liste de [`CourseRead`](#schémas-de-données) | `422` |
| `GET` | `/courses/{course_id}` | Get Course | — | `200` → [`CourseRead`](#schémas-de-données) | `422` |
| `PUT` | `/courses/{course_id}` | Update Course | [`CourseUpdate`](#schémas-de-données) | `200` → [`CourseRead`](#schémas-de-données) | `422` |
| `DELETE` | `/courses/{course_id}` | Delete Course | — | `204 No Content` | `422` |
| `POST` | `/prerequisites/` | Create Prerequisite | [`PrerequisiteCreate`](#schémas-de-données) | `201` → [`PrerequisiteRead`](#schémas-de-données) | `422` |
| `GET` | `/prerequisites/` | List Prerequisites | — | `200` → liste de [`PrerequisiteRead`](#schémas-de-données) | — |
| `DELETE` | `/prerequisites/{course_id}/{course_id_1}` | Delete Prerequisite | — | `204 No Content` | `422` |

## 📅 Calendrier académique

Années académiques et semestres.

| Méthode | Endpoint | Description | Corps de requête | Réponse succès | Erreurs |
|---|---|---|---|---|---|
| `POST` | `/academic-years/` | Create Academic Year | [`AcademicYearCreate`](#schémas-de-données) | `201` → [`AcademicYearRead`](#schémas-de-données) | `422` |
| `GET` | `/academic-years/` | List Academic Years | — | `200` → liste de [`AcademicYearRead`](#schémas-de-données) | `422` |
| `GET` | `/academic-years/{academic_year_id}` | Get Academic Year | — | `200` → [`AcademicYearRead`](#schémas-de-données) | `422` |
| `PUT` | `/academic-years/{academic_year_id}` | Update Academic Year | [`AcademicYearUpdate`](#schémas-de-données) | `200` → [`AcademicYearRead`](#schémas-de-données) | `422` |
| `DELETE` | `/academic-years/{academic_year_id}` | Delete Academic Year | — | `204 No Content` | `422` |
| `POST` | `/semesters/` | Create Semester | [`SemesterCreate`](#schémas-de-données) | `201` → [`SemesterRead`](#schémas-de-données) | `422` |
| `GET` | `/semesters/` | List Semesters | — | `200` → liste de [`SemesterRead`](#schémas-de-données) | `422` |
| `GET` | `/semesters/{semester_id}` | Get Semester | — | `200` → [`SemesterRead`](#schémas-de-données) | `422` |
| `PUT` | `/semesters/{semester_id}` | Update Semester | [`SemesterUpdate`](#schémas-de-données) | `200` → [`SemesterRead`](#schémas-de-données) | `422` |
| `DELETE` | `/semesters/{semester_id}` | Delete Semester | — | `204 No Content` | `422` |

## 👥 Personnes

Utilisateurs, enseignants et étudiants.

| Méthode | Endpoint | Description | Corps de requête | Réponse succès | Erreurs |
|---|---|---|---|---|---|
| `POST` | `/users/` | Create User | [`UserCreate`](#schémas-de-données) | `201` → [`UserRead`](#schémas-de-données) | `422` |
| `GET` | `/users/` | List Users | — | `200` → liste de [`UserRead`](#schémas-de-données) | `422` |
| `GET` | `/users/{user_id}` | Get User | — | `200` → [`UserRead`](#schémas-de-données) | `422` |
| `PUT` | `/users/{user_id}` | Update User | [`UserUpdate`](#schémas-de-données) | `200` → [`UserRead`](#schémas-de-données) | `422` |
| `DELETE` | `/users/{user_id}` | Delete User | — | `204 No Content` | `422` |
| `POST` | `/teachers/` | Create Teacher | [`TeacherCreate`](#schémas-de-données) | `201` → [`TeacherRead`](#schémas-de-données) | `422` |
| `GET` | `/teachers/` | List Teachers | — | `200` → liste de [`TeacherRead`](#schémas-de-données) | `422` |
| `GET` | `/teachers/{teacher_id}` | Get Teacher | — | `200` → [`TeacherRead`](#schémas-de-données) | `422` |
| `PUT` | `/teachers/{teacher_id}` | Update Teacher | [`TeacherUpdate`](#schémas-de-données) | `200` → [`TeacherRead`](#schémas-de-données) | `422` |
| `DELETE` | `/teachers/{teacher_id}` | Delete Teacher | — | `204 No Content` | `422` |
| `POST` | `/students/` | Create Student | [`StudentCreate`](#schémas-de-données) | `201` → [`StudentRead`](#schémas-de-données) | `422` |
| `GET` | `/students/` | List Students | — | `200` → liste de [`StudentRead`](#schémas-de-données) | `422` |
| `GET` | `/students/{student_id}` | Get Student | — | `200` → [`StudentRead`](#schémas-de-données) | `422` |
| `PUT` | `/students/{student_id}` | Update Student | [`StudentUpdate`](#schémas-de-données) | `200` → [`StudentRead`](#schémas-de-données) | `422` |
| `DELETE` | `/students/{student_id}` | Delete Student | — | `204 No Content` | `422` |

## 🏢 Infrastructure

Campus, bâtiments et salles.

| Méthode | Endpoint | Description | Corps de requête | Réponse succès | Erreurs |
|---|---|---|---|---|---|
| `POST` | `/campuses/` | Create Campus | [`CampusCreate`](#schémas-de-données) | `201` → [`CampusRead`](#schémas-de-données) | `422` |
| `GET` | `/campuses/` | List Campuses | — | `200` → liste de [`CampusRead`](#schémas-de-données) | `422` |
| `GET` | `/campuses/{campus_id}` | Get Campus | — | `200` → [`CampusRead`](#schémas-de-données) | `422` |
| `PUT` | `/campuses/{campus_id}` | Update Campus | [`CampusUpdate`](#schémas-de-données) | `200` → [`CampusRead`](#schémas-de-données) | `422` |
| `DELETE` | `/campuses/{campus_id}` | Delete Campus | — | `204 No Content` | `422` |
| `POST` | `/buildings/` | Create Building | [`BuildingCreate`](#schémas-de-données) | `201` → [`BuildingRead`](#schémas-de-données) | `422` |
| `GET` | `/buildings/` | List Buildings | — | `200` → liste de [`BuildingRead`](#schémas-de-données) | `422` |
| `GET` | `/buildings/{building_id}` | Get Building | — | `200` → [`BuildingRead`](#schémas-de-données) | `422` |
| `PUT` | `/buildings/{building_id}` | Update Building | [`BuildingUpdate`](#schémas-de-données) | `200` → [`BuildingRead`](#schémas-de-données) | `422` |
| `DELETE` | `/buildings/{building_id}` | Delete Building | — | `204 No Content` | `422` |
| `POST` | `/rooms/` | Create Room | [`RoomCreate`](#schémas-de-données) | `201` → [`RoomRead`](#schémas-de-données) | `422` |
| `GET` | `/rooms/` | List Rooms | — | `200` → liste de [`RoomRead`](#schémas-de-données) | `422` |
| `GET` | `/rooms/{room_id}` | Get Room | — | `200` → [`RoomRead`](#schémas-de-données) | `422` |
| `PUT` | `/rooms/{room_id}` | Update Room | [`RoomUpdate`](#schémas-de-données) | `200` → [`RoomRead`](#schémas-de-données) | `422` |
| `DELETE` | `/rooms/{room_id}` | Delete Room | — | `204 No Content` | `422` |

## 📚 Offres de cours

Instances de cours données sur un semestre (`course-offerings`), créneaux d'emploi du temps et examens.

| Méthode | Endpoint | Description | Corps de requête | Réponse succès | Erreurs |
|---|---|---|---|---|---|
| `POST` | `/course-offerings/` | Create Course Offering | [`CourseOfferingCreate`](#schémas-de-données) | `201` → [`CourseOfferingRead`](#schémas-de-données) | `422` |
| `GET` | `/course-offerings/` | List Course Offerings | — | `200` → liste de [`CourseOfferingRead`](#schémas-de-données) | `422` |
| `GET` | `/course-offerings/{course_offering_id}` | Get Course Offering | — | `200` → [`CourseOfferingRead`](#schémas-de-données) | `422` |
| `PUT` | `/course-offerings/{course_offering_id}` | Update Course Offering | [`CourseOfferingUpdate`](#schémas-de-données) | `200` → [`CourseOfferingRead`](#schémas-de-données) | `422` |
| `DELETE` | `/course-offerings/{course_offering_id}` | Delete Course Offering | — | `204 No Content` | `422` |
| `POST` | `/class-schedules/` | Create Class Schedule | [`ClassScheduleCreate`](#schémas-de-données) | `201` → [`ClassScheduleRead`](#schémas-de-données) | `422` |
| `GET` | `/class-schedules/` | List Class Schedules | — | `200` → liste de [`ClassScheduleRead`](#schémas-de-données) | `422` |
| `GET` | `/class-schedules/{schedule_id}` | Get Class Schedule | — | `200` → [`ClassScheduleRead`](#schémas-de-données) | `422` |
| `PUT` | `/class-schedules/{schedule_id}` | Update Class Schedule | [`ClassScheduleUpdate`](#schémas-de-données) | `200` → [`ClassScheduleRead`](#schémas-de-données) | `422` |
| `DELETE` | `/class-schedules/{schedule_id}` | Delete Class Schedule | — | `204 No Content` | `422` |
| `POST` | `/exams/` | Create Exam | [`ExamCreate`](#schémas-de-données) | `201` → [`ExamRead`](#schémas-de-données) | `422` |
| `GET` | `/exams/` | List Exams | — | `200` → liste de [`ExamRead`](#schémas-de-données) | `422` |
| `GET` | `/exams/{exam_id}` | Get Exam | — | `200` → [`ExamRead`](#schémas-de-données) | `422` |
| `PUT` | `/exams/{exam_id}` | Update Exam | [`ExamUpdate`](#schémas-de-données) | `200` → [`ExamRead`](#schémas-de-données) | `422` |
| `DELETE` | `/exams/{exam_id}` | Delete Exam | — | `204 No Content` | `422` |

## 📝 Dossiers pédagogiques

Inscriptions, notes, séances effectives et présences.

| Méthode | Endpoint | Description | Corps de requête | Réponse succès | Erreurs |
|---|---|---|---|---|---|
| `POST` | `/enrollments/` | Create Enrollment | [`EnrollmentCreate`](#schémas-de-données) | `201` → [`EnrollmentRead`](#schémas-de-données) | `422` |
| `GET` | `/enrollments/` | List Enrollments | — | `200` → liste de [`EnrollmentRead`](#schémas-de-données) | `422` |
| `GET` | `/enrollments/{enrollment_id}` | Get Enrollment | — | `200` → [`EnrollmentRead`](#schémas-de-données) | `422` |
| `PUT` | `/enrollments/{enrollment_id}` | Update Enrollment | [`EnrollmentUpdate`](#schémas-de-données) | `200` → [`EnrollmentRead`](#schémas-de-données) | `422` |
| `DELETE` | `/enrollments/{enrollment_id}` | Delete Enrollment | — | `204 No Content` | `422` |
| `POST` | `/grades/` | Create Grade | [`GradeCreate`](#schémas-de-données) | `201` → [`GradeRead`](#schémas-de-données) | `422` |
| `GET` | `/grades/` | List Grades | — | `200` → liste de [`GradeRead`](#schémas-de-données) | `422` |
| `GET` | `/grades/{grade_id}` | Get Grade | — | `200` → [`GradeRead`](#schémas-de-données) | `422` |
| `PUT` | `/grades/{grade_id}` | Update Grade | [`GradeUpdate`](#schémas-de-données) | `200` → [`GradeRead`](#schémas-de-données) | `422` |
| `DELETE` | `/grades/{grade_id}` | Delete Grade | — | `204 No Content` | `422` |
| `POST` | `/sessions/` | Create Session | [`SessionCreate`](#schémas-de-données) | `201` → [`SessionRead`](#schémas-de-données) | `422` |
| `GET` | `/sessions/` | List Sessions | — | `200` → liste de [`SessionRead`](#schémas-de-données) | `422` |
| `GET` | `/sessions/{session_id}` | Get Session | — | `200` → [`SessionRead`](#schémas-de-données) | `422` |
| `PUT` | `/sessions/{session_id}` | Update Session | [`SessionUpdate`](#schémas-de-données) | `200` → [`SessionRead`](#schémas-de-données) | `422` |
| `DELETE` | `/sessions/{session_id}` | Delete Session | — | `204 No Content` | `422` |
| `POST` | `/attendances/` | Create Attendance | [`AttendanceCreate`](#schémas-de-données) | `201` → [`AttendanceRead`](#schémas-de-données) | `422` |
| `GET` | `/attendances/` | List Attendances | — | `200` → liste de [`AttendanceRead`](#schémas-de-données) | `422` |
| `GET` | `/attendances/{attendance_id}` | Get Attendance | — | `200` → [`AttendanceRead`](#schémas-de-données) | `422` |
| `PUT` | `/attendances/{attendance_id}` | Update Attendance | [`AttendanceUpdate`](#schémas-de-données) | `200` → [`AttendanceRead`](#schémas-de-données) | `422` |
| `DELETE` | `/attendances/{attendance_id}` | Delete Attendance | — | `204 No Content` | `422` |

## 🩺 Health

Vérification de disponibilité du service.

| Méthode | Endpoint | Description | Corps de requête | Réponse succès | Erreurs |
|---|---|---|---|---|---|
| `GET` | `/` | Root | — | `200` | — |
| `GET` | `/health` | Health | — | `200` | — |

## Schémas de données

Référence des objets `*Create` (entrée à la création), `*Update` (entrée à la mise à jour, tous les champs optionnels) et `*Read` (sortie, incluant l'identifiant). Définitions extraites de `components.schemas` du fichier `openapi.json`.

### `AcademicYearCreate`

| Champ | Type | Requis |
|---|---|---|
| `start_date` | `string` (`date`) | ✅ |
| `end_date` | `string` (`date`) | ✅ |
| `year_label` | `string` | ✅ |

### `AcademicYearRead`

| Champ | Type | Requis |
|---|---|---|
| `start_date` | `string` (`date`) | ✅ |
| `end_date` | `string` (`date`) | ✅ |
| `year_label` | `string` | ✅ |
| `academic_year_id` | `integer` | ✅ |

### `AcademicYearUpdate`

| Champ | Type | Requis |
|---|---|---|
| `start_date` | `string` (optionnel) | — |
| `end_date` | `string` (optionnel) | — |
| `year_label` | `string` (optionnel) | — |

### `AttendanceCreate`

| Champ | Type | Requis |
|---|---|---|
| `status` | `string` | ✅ |
| `session_id` | `integer` | ✅ |
| `enrollment_id` | `integer` | ✅ |

### `AttendanceRead`

| Champ | Type | Requis |
|---|---|---|
| `status` | `string` | ✅ |
| `session_id` | `integer` | ✅ |
| `enrollment_id` | `integer` | ✅ |
| `attendance_id` | `integer` | ✅ |

### `AttendanceUpdate`

| Champ | Type | Requis |
|---|---|---|
| `status` | `string` (optionnel) | — |
| `session_id` | `integer` (optionnel) | — |
| `enrollment_id` | `integer` (optionnel) | — |

### `BuildingCreate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `code` | `string` | ✅ |
| `campus_id` | `integer` | ✅ |

### `BuildingRead`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `code` | `string` | ✅ |
| `campus_id` | `integer` | ✅ |
| `building_id` | `integer` | ✅ |

### `BuildingUpdate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` (optionnel) | — |
| `code` | `string` (optionnel) | — |
| `campus_id` | `integer` (optionnel) | — |

### `CampusCreate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `city` | `string` | ✅ |
| `adress` | `string` (optionnel) | — |

### `CampusRead`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `city` | `string` | ✅ |
| `adress` | `string` (optionnel) | — |
| `campus_id` | `integer` | ✅ |

### `CampusUpdate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` (optionnel) | — |
| `city` | `string` (optionnel) | — |
| `adress` | `string` (optionnel) | — |

### `ClassScheduleCreate`

| Champ | Type | Requis |
|---|---|---|
| `day_of_week` | `string` | ✅ |
| `start_time` | `string` (`time`) | ✅ |
| `end_time` | `string` (`time`) | ✅ |
| `room_id` | `integer` | ✅ |
| `course_offering_id` | `integer` | ✅ |

### `ClassScheduleRead`

| Champ | Type | Requis |
|---|---|---|
| `day_of_week` | `string` | ✅ |
| `start_time` | `string` (`time`) | ✅ |
| `end_time` | `string` (`time`) | ✅ |
| `room_id` | `integer` | ✅ |
| `course_offering_id` | `integer` | ✅ |
| `schedule_id` | `integer` | ✅ |

### `ClassScheduleUpdate`

| Champ | Type | Requis |
|---|---|---|
| `day_of_week` | `string` (optionnel) | — |
| `start_time` | `string` (optionnel) | — |
| `end_time` | `string` (optionnel) | — |
| `room_id` | `integer` (optionnel) | — |
| `course_offering_id` | `integer` (optionnel) | — |

### `CourseCreate`

| Champ | Type | Requis |
|---|---|---|
| `code` | `string` | ✅ |
| `title` | `string` | ✅ |
| `credits` | `integer` | ✅ |
| `module_id` | `integer` | ✅ |

### `CourseOfferingCreate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `campus_id` | `integer` | ✅ |
| `teacher_id` | `integer` | ✅ |
| `course_id` | `integer` | ✅ |
| `semester_id` | `integer` | ✅ |

### `CourseOfferingRead`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `campus_id` | `integer` | ✅ |
| `teacher_id` | `integer` | ✅ |
| `course_id` | `integer` | ✅ |
| `semester_id` | `integer` | ✅ |
| `course_offering_id` | `integer` | ✅ |

### `CourseOfferingUpdate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` (optionnel) | — |
| `campus_id` | `integer` (optionnel) | — |
| `teacher_id` | `integer` (optionnel) | — |
| `course_id` | `integer` (optionnel) | — |
| `semester_id` | `integer` (optionnel) | — |

### `CourseRead`

| Champ | Type | Requis |
|---|---|---|
| `code` | `string` | ✅ |
| `title` | `string` | ✅ |
| `credits` | `integer` | ✅ |
| `module_id` | `integer` | ✅ |
| `course_id` | `integer` | ✅ |

### `CourseUpdate`

| Champ | Type | Requis |
|---|---|---|
| `code` | `string` (optionnel) | — |
| `title` | `string` (optionnel) | — |
| `credits` | `integer` (optionnel) | — |
| `module_id` | `integer` (optionnel) | — |

### `DepartmentCreate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `faculty_id` | `integer` | ✅ |

### `DepartmentRead`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `faculty_id` | `integer` | ✅ |
| `department_id` | `integer` | ✅ |

### `DepartmentUpdate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` (optionnel) | — |
| `faculty_id` | `integer` (optionnel) | — |

### `EnrollmentCreate`

| Champ | Type | Requis |
|---|---|---|
| `status` | `string` | ✅ |
| `enrollment_date` | `string` (`date`) | ✅ |
| `student_id` | `integer` | ✅ |
| `course_offering_id` | `integer` | ✅ |

### `EnrollmentRead`

| Champ | Type | Requis |
|---|---|---|
| `status` | `string` | ✅ |
| `enrollment_date` | `string` (`date`) | ✅ |
| `student_id` | `integer` | ✅ |
| `course_offering_id` | `integer` | ✅ |
| `enrollment_id` | `integer` | ✅ |

### `EnrollmentUpdate`

| Champ | Type | Requis |
|---|---|---|
| `status` | `string` (optionnel) | — |
| `enrollment_date` | `string` (optionnel) | — |
| `student_id` | `integer` (optionnel) | — |
| `course_offering_id` | `integer` (optionnel) | — |

### `ExamCreate`

| Champ | Type | Requis |
|---|---|---|
| `exam_type` | `string` | ✅ |
| `exam_date` | `string` (`date`) | ✅ |
| `weight_percentage` | `number/string` (optionnel) | ✅ |
| `max_score` | `number/string` (optionnel) | ✅ |
| `course_offering_id` | `integer` | ✅ |

### `ExamRead`

| Champ | Type | Requis |
|---|---|---|
| `exam_type` | `string` | ✅ |
| `exam_date` | `string` (`date`) | ✅ |
| `weight_percentage` | `string` | ✅ |
| `max_score` | `string` | ✅ |
| `course_offering_id` | `integer` | ✅ |
| `exam_id` | `integer` | ✅ |

### `ExamUpdate`

| Champ | Type | Requis |
|---|---|---|
| `exam_type` | `string` (optionnel) | — |
| `exam_date` | `string` (optionnel) | — |
| `weight_percentage` | `number/string` (optionnel) | — |
| `max_score` | `number/string` (optionnel) | — |
| `course_offering_id` | `integer` (optionnel) | — |

### `FacultyCreate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `code` | `string` | ✅ |

### `FacultyRead`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `code` | `string` | ✅ |
| `faculty_id` | `integer` | ✅ |

### `FacultyUpdate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` (optionnel) | — |
| `code` | `string` (optionnel) | — |

### `GradeCreate`

| Champ | Type | Requis |
|---|---|---|
| `score` | `number/string` (optionnel) | ✅ |
| `letter_grade` | `string` (optionnel) | — |
| `submitted_by` | `integer` (optionnel) | — |
| `submitted_at` | `string` (`date-time`) | ✅ |
| `exam_id` | `integer` | ✅ |
| `enrollment_id` | `integer` | ✅ |

### `GradeRead`

| Champ | Type | Requis |
|---|---|---|
| `score` | `string` | ✅ |
| `letter_grade` | `string` (optionnel) | — |
| `submitted_by` | `integer` (optionnel) | — |
| `submitted_at` | `string` (`date-time`) | ✅ |
| `exam_id` | `integer` | ✅ |
| `enrollment_id` | `integer` | ✅ |
| `grade_id` | `integer` | ✅ |

### `GradeUpdate`

| Champ | Type | Requis |
|---|---|---|
| `score` | `number/string` (optionnel) | — |
| `letter_grade` | `string` (optionnel) | — |
| `submitted_by` | `integer` (optionnel) | — |
| `submitted_at` | `string` (optionnel) | — |
| `exam_id` | `integer` (optionnel) | — |
| `enrollment_id` | `integer` (optionnel) | — |

### `GroupCreate`

| Champ | Type | Requis |
|---|---|---|
| `program_id` | `integer` | ✅ |
| `module_id` | `integer` | ✅ |

### `GroupRead`

| Champ | Type | Requis |
|---|---|---|
| `program_id` | `integer` | ✅ |
| `module_id` | `integer` | ✅ |

### `HTTPValidationError`

| Champ | Type | Requis |
|---|---|---|
| `detail` | `array` | — |

### `ModuleCreate`

| Champ | Type | Requis |
|---|---|---|
| `code` | `string` | ✅ |
| `title` | `string` | ✅ |
| `credits_ects` | `integer` | ✅ |

### `ModuleRead`

| Champ | Type | Requis |
|---|---|---|
| `code` | `string` | ✅ |
| `title` | `string` | ✅ |
| `credits_ects` | `integer` | ✅ |
| `module_id` | `integer` | ✅ |

### `ModuleUpdate`

| Champ | Type | Requis |
|---|---|---|
| `code` | `string` (optionnel) | — |
| `title` | `string` (optionnel) | — |
| `credits_ects` | `integer` (optionnel) | — |

### `PrerequisiteCreate`

| Champ | Type | Requis |
|---|---|---|
| `course_id` | `integer` | ✅ |
| `course_id_1` | `integer` | ✅ |

### `PrerequisiteRead`

| Champ | Type | Requis |
|---|---|---|
| `course_id` | `integer` | ✅ |
| `course_id_1` | `integer` | ✅ |

### `ProgramCreate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `level` | `string` | ✅ |
| `department_id` | `integer` | ✅ |

### `ProgramRead`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `level` | `string` | ✅ |
| `department_id` | `integer` | ✅ |
| `program_id` | `integer` | ✅ |

### `ProgramUpdate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` (optionnel) | — |
| `level` | `string` (optionnel) | — |
| `department_id` | `integer` (optionnel) | — |

### `RoomCreate`

| Champ | Type | Requis |
|---|---|---|
| `room_number` | `string` | ✅ |
| `capacity` | `integer` | ✅ |
| `room_type` | `string` (optionnel) | — |
| `room_name` | `string` (optionnel) | — |
| `building_id` | `integer` | ✅ |

### `RoomRead`

| Champ | Type | Requis |
|---|---|---|
| `room_number` | `string` | ✅ |
| `capacity` | `integer` | ✅ |
| `room_type` | `string` (optionnel) | — |
| `room_name` | `string` (optionnel) | — |
| `building_id` | `integer` | ✅ |
| `room_id` | `integer` | ✅ |

### `RoomUpdate`

| Champ | Type | Requis |
|---|---|---|
| `room_number` | `string` (optionnel) | — |
| `capacity` | `integer` (optionnel) | — |
| `room_type` | `string` (optionnel) | — |
| `room_name` | `string` (optionnel) | — |
| `building_id` | `integer` (optionnel) | — |

### `SemesterCreate`

| Champ | Type | Requis |
|---|---|---|
| `term_name` | `string` | ✅ |
| `start_date` | `string` (`date`) | ✅ |
| `end_date` | `string` (`date`) | ✅ |
| `is_locked` | `boolean` | — |
| `academic_year_id` | `integer` | ✅ |

### `SemesterRead`

| Champ | Type | Requis |
|---|---|---|
| `term_name` | `string` | ✅ |
| `start_date` | `string` (`date`) | ✅ |
| `end_date` | `string` (`date`) | ✅ |
| `is_locked` | `boolean` | — |
| `academic_year_id` | `integer` | ✅ |
| `semester_id` | `integer` | ✅ |

### `SemesterUpdate`

| Champ | Type | Requis |
|---|---|---|
| `term_name` | `string` (optionnel) | — |
| `start_date` | `string` (optionnel) | — |
| `end_date` | `string` (optionnel) | — |
| `is_locked` | `boolean` (optionnel) | — |
| `academic_year_id` | `integer` (optionnel) | — |

### `SessionCreate`

| Champ | Type | Requis |
|---|---|---|
| `session_date` | `string` (`date`) | ✅ |
| `status` | `string` | ✅ |
| `topic_covered` | `string` (optionnel) | — |
| `schedule_id` | `integer` | ✅ |

### `SessionRead`

| Champ | Type | Requis |
|---|---|---|
| `session_date` | `string` (`date`) | ✅ |
| `status` | `string` | ✅ |
| `topic_covered` | `string` (optionnel) | — |
| `schedule_id` | `integer` | ✅ |
| `session_id` | `integer` | ✅ |

### `SessionUpdate`

| Champ | Type | Requis |
|---|---|---|
| `session_date` | `string` (optionnel) | — |
| `status` | `string` (optionnel) | — |
| `topic_covered` | `string` (optionnel) | — |
| `schedule_id` | `integer` (optionnel) | — |

### `StudentCreate`

| Champ | Type | Requis |
|---|---|---|
| `matricule` | `string` | ✅ |
| `enrollment_date` | `string` (`date`) | ✅ |
| `status` | `string` | ✅ |
| `program_id` | `integer` | ✅ |
| `user_id` | `integer` | ✅ |

### `StudentRead`

| Champ | Type | Requis |
|---|---|---|
| `matricule` | `string` | ✅ |
| `enrollment_date` | `string` (`date`) | ✅ |
| `status` | `string` | ✅ |
| `program_id` | `integer` | ✅ |
| `user_id` | `integer` | ✅ |
| `student_id` | `integer` | ✅ |

### `StudentUpdate`

| Champ | Type | Requis |
|---|---|---|
| `matricule` | `string` (optionnel) | — |
| `enrollment_date` | `string` (optionnel) | — |
| `status` | `string` (optionnel) | — |
| `program_id` | `integer` (optionnel) | — |
| `user_id` | `integer` (optionnel) | — |

### `TeacherCreate`

| Champ | Type | Requis |
|---|---|---|
| `employee_code` | `string` | ✅ |
| `speciality` | `string` (optionnel) | — |
| `user_id` | `integer` | ✅ |

### `TeacherRead`

| Champ | Type | Requis |
|---|---|---|
| `employee_code` | `string` | ✅ |
| `speciality` | `string` (optionnel) | — |
| `user_id` | `integer` | ✅ |
| `teacher_id` | `integer` | ✅ |

### `TeacherUpdate`

| Champ | Type | Requis |
|---|---|---|
| `employee_code` | `string` (optionnel) | — |
| `speciality` | `string` (optionnel) | — |
| `user_id` | `integer` (optionnel) | — |

### `UserCreate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `phone` | `string` (optionnel) | — |
| `email` | `string` (`email`) | ✅ |
| `role` | `string` | ✅ |

### `UserRead`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` | ✅ |
| `phone` | `string` (optionnel) | — |
| `email` | `string` (`email`) | ✅ |
| `role` | `string` | ✅ |
| `user_id` | `integer` | ✅ |

### `UserUpdate`

| Champ | Type | Requis |
|---|---|---|
| `name` | `string` (optionnel) | — |
| `phone` | `string` (optionnel) | — |
| `email` | `string` (optionnel) | — |
| `role` | `string` (optionnel) | — |

### `ValidationError`

| Champ | Type | Requis |
|---|---|---|
| `loc` | `array` | ✅ |
| `msg` | `string` | ✅ |
| `type` | `string` | ✅ |
