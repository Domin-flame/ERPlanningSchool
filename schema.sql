-- ============================================================
-- Module HR — schéma en 3NF
-- (SQLAlchemy crée déjà ces tables automatiquement au démarrage,
--  ce fichier sert de référence pour ton ERD / documentation Week 2)
-- ============================================================

CREATE TABLE employees (
    id              UUID PRIMARY KEY,
    auth_user_id    VARCHAR(64) UNIQUE NOT NULL,
    matricule       VARCHAR(20) UNIQUE NOT NULL,
    first_name      VARCHAR(80) NOT NULL,
    last_name       VARCHAR(80) NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    department      VARCHAR(80) NOT NULL,
    position        VARCHAR(80) NOT NULL,
    hire_date       DATE NOT NULL,
    base_salary     FLOAT NOT NULL,
    cnps_number     VARCHAR(30) UNIQUE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leave_balances (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    leave_type      VARCHAR(20) NOT NULL,
    year            INT NOT NULL,
    days_allocated  FLOAT NOT NULL DEFAULT 0,
    days_used       FLOAT NOT NULL DEFAULT 0,
    UNIQUE (employee_id, leave_type, year)
);

CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    leave_type      VARCHAR(20) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    reason          TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by     VARCHAR(64),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    date            DATE NOT NULL,
    check_in_time   TIMESTAMP,
    check_out_time  TIMESTAMP,
    method          VARCHAR(20) DEFAULT 'qr',
    UNIQUE (employee_id, date)
);

CREATE TABLE payslips (
    id                          UUID PRIMARY KEY,
    employee_id                 UUID NOT NULL REFERENCES employees(id),
    period_month                INT NOT NULL,
    period_year                 INT NOT NULL,
    base_salary                 FLOAT NOT NULL,
    cnps_employee                FLOAT NOT NULL,
    cnps_employer_total          FLOAT NOT NULL,
    cfc_employee                 FLOAT NOT NULL,
    cfc_employer                 FLOAT NOT NULL,
    fne_employer                 FLOAT NOT NULL,
    taxable_base                 FLOAT NOT NULL,
    irpp                         FLOAT NOT NULL,
    cac                          FLOAT NOT NULL,
    total_employee_deductions    FLOAT NOT NULL,
    net_salary                   FLOAT NOT NULL,
    total_employer_cost          FLOAT NOT NULL,
    generated_at                 TIMESTAMP DEFAULT NOW(),
    UNIQUE (employee_id, period_month, period_year)
);

-- ============================================================
-- Index (exigence Week 2 : au moins 2 index sur des tables
-- fréquemment recherchées)
-- ============================================================
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
