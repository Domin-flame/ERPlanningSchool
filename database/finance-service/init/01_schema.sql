-- =====================================================================
-- finance_db — Marketing & Finance domain
-- Service propriétaire : finance-service (FastAPI)
-- CACHE (lecture seule, synchronisée par événements) : student_ref
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cache en lecture seule des étudiants (source de vérité = academic_db.student)
CREATE TABLE student_ref (
    id_student         BIGINT PRIMARY KEY,          -- réf. externe academic_db.student.id_student
    id_person          BIGINT NOT NULL,
    matricule          VARCHAR(30) NOT NULL,
    nom_complet_cache  VARCHAR(210) NOT NULL,
    synced_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE student_ref IS 'Read-model alimenté par le consumer finance-service sur le topic academic.student.events. Ne jamais écrire manuellement.';

-- ---------------------------------------------------------------------
-- FACTURATION
-- ---------------------------------------------------------------------
CREATE TABLE invoice (
    id_invoice       BIGSERIAL PRIMARY KEY,
    numero_facture   VARCHAR(30) NOT NULL UNIQUE,
    date_emission    DATE NOT NULL DEFAULT CURRENT_DATE,
    date_echeance    DATE NOT NULL,
    montant_total    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (montant_total >= 0),
    statut           VARCHAR(20) NOT NULL DEFAULT 'EMISE'
                        CHECK (statut IN ('EMISE','PARTIELLEMENT_PAYEE','PAYEE','EN_RETARD','ANNULEE')),
    id_student       BIGINT NOT NULL REFERENCES student_ref(id_student),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (date_echeance >= date_emission)
);
CREATE INDEX idx_invoice_student ON invoice (id_student);
CREATE INDEX idx_invoice_statut_echeance ON invoice (statut, date_echeance);

CREATE TABLE invoice_line (
    id_line         BIGSERIAL PRIMARY KEY,
    description     VARCHAR(200) NOT NULL,     -- inscription, bibliothèque, laboratoire, sport, rattrapage...
    quantite        SMALLINT NOT NULL DEFAULT 1 CHECK (quantite > 0),
    prix_unitaire   NUMERIC(12,2) NOT NULL CHECK (prix_unitaire >= 0),
    montant         NUMERIC(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    id_invoice      BIGINT NOT NULL REFERENCES invoice(id_invoice) ON DELETE CASCADE
);
CREATE INDEX idx_invoice_line_invoice ON invoice_line (id_invoice);

CREATE TABLE payment (
    id_payment      BIGSERIAL PRIMARY KEY,
    montant         NUMERIC(12,2) NOT NULL CHECK (montant > 0),
    date_paiement   TIMESTAMPTZ NOT NULL DEFAULT now(),
    methode         VARCHAR(30) NOT NULL
                        CHECK (methode IN ('MTN_MOMO','ORANGE_MONEY','CARTE','VIREMENT','ESPECES')),
    reference       VARCHAR(100) NOT NULL UNIQUE,   -- référence transaction gateway mobile money
    id_invoice      BIGINT NOT NULL REFERENCES invoice(id_invoice)
);
CREATE INDEX idx_payment_invoice ON payment (id_invoice);

CREATE TABLE receipt (
    id_receipt      BIGSERIAL PRIMARY KEY,
    numero_recu     VARCHAR(30) NOT NULL UNIQUE,
    date_emission   TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_payment      BIGINT NOT NULL UNIQUE REFERENCES payment(id_payment)
);

-- ---------------------------------------------------------------------
-- MARKETING
-- ---------------------------------------------------------------------
CREATE TABLE campaign (
    id_campaign  SERIAL PRIMARY KEY,
    nom          VARCHAR(150) NOT NULL,
    canal        VARCHAR(30) NOT NULL,       -- SOCIAL, EMAIL, RADIO, EVENT...
    date_debut   DATE NOT NULL,
    date_fin     DATE,
    budget       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (budget >= 0)
);

CREATE TABLE lead (
    id_lead           BIGSERIAL PRIMARY KEY,
    nom               VARCHAR(150) NOT NULL,
    contact           VARCHAR(150) NOT NULL,
    source            VARCHAR(50),
    statut            VARCHAR(20) NOT NULL DEFAULT 'NOUVEAU'
                        CHECK (statut IN ('NOUVEAU','CONTACTE','QUALIFIE','CONVERTI','PERDU')),
    date_conversion   DATE,
    id_campaign       INT REFERENCES campaign(id_campaign)
);
CREATE INDEX idx_lead_campaign ON lead (id_campaign);

COMMENT ON TABLE invoice IS 'Le trigger applicatif Payment→Invoice.montant_total/statut doit être exécuté dans la MÊME transaction (démonstration ACID exigée par le barème).';
