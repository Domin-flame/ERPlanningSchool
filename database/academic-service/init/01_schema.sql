-- =====================================================================
-- academic_db — Academic domain
-- Service propriétaire : academic-service (FastAPI)
-- MASTER de : organization_unit, student (statut académique)
-- CACHE (lecture seule, synchronisée par événements) : teacher_ref
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- ORGANIZATION_UNIT (MASTER — hiérarchie Faculté/Département/...)
-- ---------------------------------------------------------------------
CREATE TABLE organization_unit (
    id_unit         SERIAL PRIMARY KEY,
    nom             VARCHAR(150) NOT NULL,
    type            VARCHAR(30) NOT NULL
                        CHECK (type IN ('FACULTY','DEPARTMENT','FINANCE','IT','HR','MARKETING',
                                         'SECURITY','TRANSPORT','STUDENT_AFFAIRS')),
    id_parent_unit  INT REFERENCES organization_unit(id_unit) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_unit_parent ON organization_unit (id_parent_unit);

-- ---------------------------------------------------------------------
-- STUDENT (MASTER du statut académique — id_person est une référence
-- externe vers identity_db.person, PAS de FK physique inter-bases)
-- ---------------------------------------------------------------------
CREATE TABLE student (
    id_student        BIGSERIAL PRIMARY KEY,
    id_person         BIGINT NOT NULL UNIQUE,     -- réf. externe identity_db.person.id_person
    matricule         VARCHAR(30) NOT NULL UNIQUE,
    nom_complet_cache VARCHAR(210) NOT NULL,       -- copie légère pour affichage (event PersonUpdated)
    date_inscription  DATE NOT NULL DEFAULT CURRENT_DATE,
    statut            VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                        CHECK (statut IN ('ACTIF','SUSPENDU','DIPLOME','ABANDON'))
);
CREATE INDEX idx_student_person ON student (id_person);

-- Cache en lecture seule des enseignants (source de vérité = hr_db.employee)
CREATE TABLE teacher_ref (
    id_employee        BIGINT PRIMARY KEY,          -- réf. externe hr_db.employee.id_employee
    id_person          BIGINT NOT NULL,
    nom_complet_cache  VARCHAR(210) NOT NULL,
    synced_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE teacher_ref IS 'Read-model alimenté par le consumer academic-service sur le topic hr.employee.events. Ne jamais écrire manuellement.';

-- ---------------------------------------------------------------------
-- PROGRAM / COURSE
-- ---------------------------------------------------------------------
CREATE TABLE program (
    id_program     SERIAL PRIMARY KEY,
    nom            VARCHAR(150) NOT NULL,
    niveau         VARCHAR(30) NOT NULL,        -- Licence, Master, ...
    duree_annees   SMALLINT NOT NULL CHECK (duree_annees BETWEEN 1 AND 8),
    id_unit        INT NOT NULL REFERENCES organization_unit(id_unit)
);
CREATE INDEX idx_program_unit ON program (id_unit);

CREATE TABLE course (
    id_course     SERIAL PRIMARY KEY,
    code          VARCHAR(20) NOT NULL UNIQUE,
    titre         VARCHAR(200) NOT NULL,
    credits       SMALLINT NOT NULL CHECK (credits > 0),
    description   TEXT
);

CREATE TABLE course_prerequisite (
    id_course             INT NOT NULL REFERENCES course(id_course) ON DELETE CASCADE,
    id_course_prerequis   INT NOT NULL REFERENCES course(id_course) ON DELETE CASCADE,
    PRIMARY KEY (id_course, id_course_prerequis),
    CHECK (id_course <> id_course_prerequis)
);

-- ---------------------------------------------------------------------
-- CALENDRIER
-- ---------------------------------------------------------------------
CREATE TABLE academic_year (
    id_year      SERIAL PRIMARY KEY,
    libelle      VARCHAR(20) NOT NULL UNIQUE,   -- '2025-2026'
    date_debut   DATE NOT NULL,
    date_fin     DATE NOT NULL,
    CHECK (date_fin > date_debut)
);

CREATE TABLE semester (
    id_semester  SERIAL PRIMARY KEY,
    nom          VARCHAR(30) NOT NULL,          -- 'Semestre 1'
    date_debut   DATE NOT NULL,
    date_fin     DATE NOT NULL,
    id_year      INT NOT NULL REFERENCES academic_year(id_year),
    CHECK (date_fin > date_debut)
);
CREATE INDEX idx_semester_year ON semester (id_year);

-- ---------------------------------------------------------------------
-- OFFRES DE COURS / INSCRIPTIONS
-- ---------------------------------------------------------------------
CREATE TABLE course_offering (
    id_offering          BIGSERIAL PRIMARY KEY,
    capacite             SMALLINT NOT NULL CHECK (capacite > 0),
    statut               VARCHAR(20) NOT NULL DEFAULT 'PLANIFIE'
                            CHECK (statut IN ('PLANIFIE','OUVERT','FERME','ANNULE')),
    id_course            INT NOT NULL REFERENCES course(id_course),
    id_semester           INT NOT NULL REFERENCES semester(id_semester),
    id_employee_teacher   BIGINT REFERENCES teacher_ref(id_employee),
    UNIQUE (id_course, id_semester, id_employee_teacher)
);
CREATE INDEX idx_offering_course ON course_offering (id_course);
CREATE INDEX idx_offering_semester ON course_offering (id_semester);
CREATE INDEX idx_offering_teacher ON course_offering (id_employee_teacher);

CREATE TABLE enrollment (
    id_enrollment      BIGSERIAL PRIMARY KEY,
    date_inscription   DATE NOT NULL DEFAULT CURRENT_DATE,
    statut             VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                            CHECK (statut IN ('ACTIF','ABANDONNE','TERMINE')),
    id_student         BIGINT NOT NULL REFERENCES student(id_student),
    id_program         INT NOT NULL REFERENCES program(id_program),
    id_semester        INT NOT NULL REFERENCES semester(id_semester),
    UNIQUE (id_student, id_program, id_semester)
);
CREATE INDEX idx_enrollment_student_semester ON enrollment (id_student, id_semester);
CREATE INDEX idx_enrollment_program ON enrollment (id_program);

-- ---------------------------------------------------------------------
-- CAMPUS / SALLES
-- ---------------------------------------------------------------------
CREATE TABLE campus (
    id_campus  SERIAL PRIMARY KEY,
    nom        VARCHAR(100) NOT NULL,
    adresse    VARCHAR(255)
);

CREATE TABLE building (
    id_building  SERIAL PRIMARY KEY,
    nom          VARCHAR(100) NOT NULL,
    id_campus    INT NOT NULL REFERENCES campus(id_campus)
);
CREATE INDEX idx_building_campus ON building (id_campus);

CREATE TABLE room (
    id_room      SERIAL PRIMARY KEY,
    code         VARCHAR(20) NOT NULL,
    capacite     SMALLINT NOT NULL CHECK (capacite > 0),
    type         VARCHAR(30) NOT NULL DEFAULT 'CLASSROOM'
                    CHECK (type IN ('CLASSROOM','LAB','AMPHITHEATER','EXAM_ROOM')),
    id_building  INT NOT NULL REFERENCES building(id_building),
    UNIQUE (id_building, code)
);
CREATE INDEX idx_room_building ON room (id_building);

CREATE TABLE schedule (
    id_schedule    BIGSERIAL PRIMARY KEY,
    jour_semaine   SMALLINT NOT NULL CHECK (jour_semaine BETWEEN 1 AND 7),
    heure_debut    TIME NOT NULL,
    heure_fin      TIME NOT NULL,
    id_offering    BIGINT NOT NULL REFERENCES course_offering(id_offering) ON DELETE CASCADE,
    id_room        INT NOT NULL REFERENCES room(id_room),
    CHECK (heure_fin > heure_debut)
);
CREATE INDEX idx_schedule_offering ON schedule (id_offering);
-- Empêche deux cours dans la même salle, même créneau (détection de conflit)
CREATE UNIQUE INDEX uq_schedule_room_slot ON schedule (id_room, jour_semaine, heure_debut, heure_fin);

-- ---------------------------------------------------------------------
-- ÉVALUATIONS
-- ---------------------------------------------------------------------
CREATE TABLE assessment (
    id_assessment  BIGSERIAL PRIMARY KEY,
    type           VARCHAR(20) NOT NULL
                     CHECK (type IN ('DEVOIR','TP','PROJET','EXAMEN_FINAL','RATTRAPAGE')),
    titre          VARCHAR(150) NOT NULL,
    poids          NUMERIC(4,2) NOT NULL CHECK (poids > 0 AND poids <= 1),
    date_eval      DATE,
    id_offering    BIGINT NOT NULL REFERENCES course_offering(id_offering) ON DELETE CASCADE
);
CREATE INDEX idx_assessment_offering ON assessment (id_offering);

CREATE TABLE exam (
    id_exam        BIGINT PRIMARY KEY REFERENCES assessment(id_assessment) ON DELETE CASCADE,
    duree_minutes  SMALLINT NOT NULL CHECK (duree_minutes > 0),
    salle_examen   VARCHAR(50)
);

CREATE TABLE grade (
    id_grade       BIGSERIAL PRIMARY KEY,
    note           NUMERIC(5,2) NOT NULL CHECK (note >= 0),
    commentaire    TEXT,
    id_assessment  BIGINT NOT NULL REFERENCES assessment(id_assessment) ON DELETE CASCADE,
    id_student     BIGINT NOT NULL REFERENCES student(id_student) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id_assessment, id_student)
);
CREATE INDEX idx_grade_student ON grade (id_student);
CREATE INDEX idx_grade_assessment ON grade (id_assessment);

COMMENT ON TABLE organization_unit IS 'MASTER — synchronisée vers hr_db.organization_unit_ref via événements org.unit.events.';
