-- =====================================================================
-- identity_db — Identity & Access + Audit + Notification (source de vérité)
-- Service propriétaire : identity-service (FastAPI)
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- pour argon2/bcrypt côté app + chiffrement colonnes sensibles
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- recherche texte (noms/emails) performante

-- ---------------------------------------------------------------------
-- PERSON (racine du système, MASTER)
-- ---------------------------------------------------------------------
CREATE TABLE person (
    id_person       BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    telephone       VARCHAR(30),
    date_naissance  DATE,
    genre           VARCHAR(20) CHECK (genre IN ('M', 'F', 'AUTRE')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_person_email ON person USING gin (email gin_trgm_ops);
CREATE INDEX idx_person_nom_prenom ON person (nom, prenom);

-- ---------------------------------------------------------------------
-- ROLE / PERMISSION (RBAC)
-- ---------------------------------------------------------------------
CREATE TABLE role (
    id_role      SERIAL PRIMARY KEY,
    nom          VARCHAR(50) NOT NULL UNIQUE,   -- super_admin, admin, staff, teacher, student
    description  TEXT
);

CREATE TABLE permission (
    id_permission  SERIAL PRIMARY KEY,
    code           VARCHAR(100) NOT NULL UNIQUE, -- ex: 'grade:write', 'invoice:read'
    description    TEXT
);

CREATE TABLE role_permission (
    id_role        INT NOT NULL REFERENCES role(id_role) ON DELETE CASCADE,
    id_permission  INT NOT NULL REFERENCES permission(id_permission) ON DELETE CASCADE,
    PRIMARY KEY (id_role, id_permission)
);

-- ---------------------------------------------------------------------
-- USER_ACCOUNT (auth)
-- ---------------------------------------------------------------------
CREATE TABLE user_account (
    id_account       BIGSERIAL PRIMARY KEY,
    id_person        BIGINT NOT NULL UNIQUE REFERENCES person(id_person) ON DELETE CASCADE,
    username         VARCHAR(60) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,           -- Argon2id, jamais en clair
    statut           VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                        CHECK (statut IN ('ACTIF', 'SUSPENDU', 'VERROUILLE', 'DESACTIVE')),
    failed_attempts  SMALLINT NOT NULL DEFAULT 0,
    locked_until     TIMESTAMPTZ,
    last_login       TIMESTAMPTZ,
    mfa_enabled      BOOLEAN NOT NULL DEFAULT false,
    mfa_secret       VARCHAR(255),                     -- chiffré via pgcrypto si utilisé
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_account_person ON user_account (id_person);

CREATE TABLE user_role (
    id_account   BIGINT NOT NULL REFERENCES user_account(id_account) ON DELETE CASCADE,
    id_role      INT NOT NULL REFERENCES role(id_role) ON DELETE CASCADE,
    date_attribution DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (id_account, id_role)
);

-- Jetons de rafraîchissement (rotation) — nécessaire pour le critère JWT/refresh-token
CREATE TABLE refresh_token (
    id_token      BIGSERIAL PRIMARY KEY,
    id_account    BIGINT NOT NULL REFERENCES user_account(id_account) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL UNIQUE,
    issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked_at    TIMESTAMPTZ,
    replaced_by   BIGINT REFERENCES refresh_token(id_token)
);
CREATE INDEX idx_refresh_token_account ON refresh_token (id_account);

-- ---------------------------------------------------------------------
-- AUDIT & NOTIFICATION (transverses, alimentées par tous les services via broker)
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
    id_log            BIGSERIAL PRIMARY KEY,
    id_person         BIGINT REFERENCES person(id_person) ON DELETE SET NULL,
    action             VARCHAR(50) NOT NULL,           -- CREATE/UPDATE/DELETE/LOGIN/...
    type_ressource     VARCHAR(100) NOT NULL,          -- ex: 'Invoice', 'Grade'
    id_ressource       VARCHAR(100),
    service_origine    VARCHAR(50) NOT NULL,           -- academic-service, finance-service...
    ancienne_valeur    JSONB,
    nouvelle_valeur    JSONB,
    adresse_ip         INET,
    horodatage         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_person ON audit_log (id_person);
CREATE INDEX idx_audit_ressource ON audit_log (type_ressource, id_ressource);
CREATE INDEX idx_audit_horodatage ON audit_log (horodatage);

CREATE TABLE notification (
    id_notification  BIGSERIAL PRIMARY KEY,
    id_person        BIGINT NOT NULL REFERENCES person(id_person) ON DELETE CASCADE,
    message          TEXT NOT NULL,
    type             VARCHAR(50) NOT NULL,
    date_envoi       TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_lecture     TIMESTAMPTZ
);
CREATE INDEX idx_notification_person ON notification (id_person, date_lecture);

COMMENT ON TABLE person IS 'MASTER — source de vérité. Les autres services ne stockent que id_person + une copie légère (nom/matricule) via événements.';
COMMENT ON TABLE audit_log IS 'Alimentée en asynchrone par tous les microservices via le broker (topic audit.events).';
