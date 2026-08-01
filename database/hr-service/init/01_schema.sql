-- =====================================================================
-- hr_db — Administration & Human Resources domain
-- Service propriétaire : hr-service (FastAPI)
-- MASTER de : employee
-- CACHE (lecture seule, synchronisée par événements) : organization_unit_ref
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cache en lecture seule des unités organisationnelles
-- (source de vérité = academic_db.organization_unit)
CREATE TABLE organization_unit_ref (
    id_unit         INT PRIMARY KEY,             -- réf. externe academic_db.organization_unit.id_unit
    nom             VARCHAR(150) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    id_parent_unit  INT,
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE organization_unit_ref IS 'Read-model alimenté par le consumer hr-service sur le topic org.unit.events. Ne jamais écrire manuellement.';

-- ---------------------------------------------------------------------
-- EMPLOYEE (MASTER — id_person réf. externe identity_db.person)
-- ---------------------------------------------------------------------
CREATE TABLE employee (
    id_employee        BIGSERIAL PRIMARY KEY,
    id_person          BIGINT NOT NULL UNIQUE,   -- réf. externe identity_db.person.id_person
    matricule_employe  VARCHAR(30) NOT NULL UNIQUE,
    nom_complet_cache  VARCHAR(210) NOT NULL,
    date_embauche      DATE NOT NULL,
    statut             VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                            CHECK (statut IN ('ACTIF','CONGE','SUSPENDU','DEPART'))
);
CREATE INDEX idx_employee_person ON employee (id_person);

CREATE TABLE position (
    id_position       SERIAL PRIMARY KEY,
    titre             VARCHAR(150) NOT NULL,
    grade_salarial    VARCHAR(20) NOT NULL,
    id_unit           INT NOT NULL REFERENCES organization_unit_ref(id_unit)
);
CREATE INDEX idx_position_unit ON position (id_unit);

CREATE TABLE contract (
    id_contract    BIGSERIAL PRIMARY KEY,
    type           VARCHAR(20) NOT NULL CHECK (type IN ('CDI','CDD','VACATAIRE','STAGE')),
    date_debut     DATE NOT NULL,
    date_fin       DATE,
    salaire        NUMERIC(12,2) NOT NULL CHECK (salaire >= 0),
    id_employee    BIGINT NOT NULL REFERENCES employee(id_employee),
    id_position    INT NOT NULL REFERENCES position(id_position),
    CHECK (date_fin IS NULL OR date_fin > date_debut)
);
CREATE INDEX idx_contract_employee ON contract (id_employee);
CREATE INDEX idx_contract_position ON contract (id_position);

-- ---------------------------------------------------------------------
-- PAIE — champs statutaires camerounais (CNPS, PAYE) selon taux publiés,
-- calcul effectué côté application ; la base stocke le résultat + les
-- composantes pour audit.
-- ---------------------------------------------------------------------
CREATE TABLE payroll (
    id_payroll         BIGSERIAL PRIMARY KEY,
    periode            VARCHAR(7) NOT NULL,        -- 'YYYY-MM'
    salaire_brut       NUMERIC(12,2) NOT NULL CHECK (salaire_brut >= 0),
    cotisation_cnps    NUMERIC(12,2) NOT NULL CHECK (cotisation_cnps >= 0),
    impot_paye         NUMERIC(12,2) NOT NULL CHECK (impot_paye >= 0),
    salaire_net        NUMERIC(12,2) GENERATED ALWAYS AS
                            (salaire_brut - cotisation_cnps - impot_paye) STORED,
    date_generation    TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_contract        BIGINT NOT NULL REFERENCES contract(id_contract),
    UNIQUE (id_contract, periode)
);
CREATE INDEX idx_payroll_contract ON payroll (id_contract);

CREATE TABLE leave_request (
    id_leave       BIGSERIAL PRIMARY KEY,
    type           VARCHAR(30) NOT NULL
                        CHECK (type IN ('ANNUEL','MALADIE','MATERNITE','SANS_SOLDE','AUTRE')),
    date_debut     DATE NOT NULL,
    date_fin       DATE NOT NULL,
    statut         VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                        CHECK (statut IN ('EN_ATTENTE','APPROUVE','REJETE','ANNULE')),
    approuve_par   BIGINT REFERENCES employee(id_employee),
    id_employee    BIGINT NOT NULL REFERENCES employee(id_employee),
    CHECK (date_fin >= date_debut)
);
CREATE INDEX idx_leave_employee ON leave_request (id_employee);
CREATE INDEX idx_leave_statut ON leave_request (statut);

CREATE TABLE asset (
    id_asset            BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(150) NOT NULL,
    categorie           VARCHAR(50) NOT NULL,
    numero_serie        VARCHAR(100) UNIQUE,
    date_acquisition    DATE NOT NULL,
    statut              VARCHAR(20) NOT NULL DEFAULT 'EN_SERVICE'
                            CHECK (statut IN ('EN_SERVICE','EN_MAINTENANCE','REFORME')),
    id_unit             INT NOT NULL REFERENCES organization_unit_ref(id_unit)
);
CREATE INDEX idx_asset_unit ON asset (id_unit);

COMMENT ON TABLE payroll IS 'Champs cotisation_cnps/impot_paye calculés côté application selon les barèmes publiés en vigueur — à documenter précisément dans le rapport.';
