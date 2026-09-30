CREATE SCHEMA IF NOT EXISTS hr;

-- Métiers & Postes
CREATE TABLE hr.Position_ (
    position_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    salary_grade VARCHAR(50),
    department_id INT NOT NULL -- Référence au département (ex: academic.Department)
);

-- Employés
CREATE TABLE hr.Employee (
    employee_id SERIAL PRIMARY KEY,
    department_id INT NOT NULL,
    user_id INT UNIQUE, -- Référence au User_ du système
    hired_date DATE NOT NULL,
    employment_status VARCHAR(50) NOT NULL,
    position_id INT REFERENCES hr.Position_(position_id) ON DELETE SET NULL
);

-- Contrats
CREATE TABLE hr.Contract (
    contract_id SERIAL PRIMARY KEY,
    salary NUMERIC(12, 2) NOT NULL CHECK (salary >= 0),
    contract_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    employee_id INT NOT NULL REFERENCES hr.Employee(employee_id) ON DELETE CASCADE,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Congés
CREATE TABLE hr.leave_type (
    leave_type_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    default_days INT NOT NULL CHECK (default_days >= 0)
);

CREATE TABLE hr.Leave_balance (
    leave_balance_id SERIAL PRIMARY KEY,
    year_ INT NOT NULL,
    days_remaining INT NOT NULL CHECK (days_remaining >= 0),
    employee_id INT NOT NULL REFERENCES hr.Employee(employee_id) ON DELETE CASCADE,
    leave_type_id INT NOT NULL REFERENCES hr.leave_type(leave_type_id) ON DELETE CASCADE,
    CONSTRAINT unique_emp_leave_year UNIQUE (employee_id, leave_type_id, year_)
);

CREATE TABLE hr.Leave_request (
    leave_request_id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    approved_by INT REFERENCES hr.Employee(employee_id) ON DELETE SET NULL,
    leave_type_id INT NOT NULL REFERENCES hr.leave_type(leave_type_id) ON DELETE RESTRICT,
    employee_id INT NOT NULL REFERENCES hr.Employee(employee_id) ON DELETE CASCADE,
    CHECK (end_date >= start_date)
);

-- Évaluations de performance
CREATE TABLE hr.Performance_review (
    perf_review_id SERIAL PRIMARY KEY,
    review_period VARCHAR(50) NOT NULL,
    score NUMERIC(5, 2) CHECK (score >= 0 AND score <= 100),
    comments TEXT,
    reviewer_id INT REFERENCES hr.Employee(employee_id) ON DELETE SET NULL,
    employee_id INT NOT NULL REFERENCES hr.Employee(employee_id) ON DELETE CASCADE
);

-- Paie (Payroll)
CREATE TABLE hr.Payroll_run (
    payroll_id SERIAL PRIMARY KEY,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INT NOT NULL,
    process_by INT REFERENCES hr.Employee(employee_id) ON DELETE SET NULL
);

CREATE TABLE hr.Payslip (
    payslip_id SERIAL PRIMARY KEY,
    gross_salary NUMERIC(12, 2) NOT NULL,
    deductions NUMERIC(12, 2) DEFAULT 0.00,
    net_salary NUMERIC(12, 2) GENERATED ALWAYS AS (gross_salary - deductions) STORED,
    payroll_id INT NOT NULL REFERENCES hr.Payroll_run(payroll_id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES hr.Employee(employee_id) ON DELETE CASCADE
);

-- Gestion du Matériel / Actifs
CREATE TABLE hr.Asset (
    asset_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    location VARCHAR(150)
);

CREATE TABLE hr.Asset_assignment (
    assignment_id SERIAL PRIMARY KEY,
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    returned_date DATE,
    asset_id INT NOT NULL REFERENCES hr.Asset(asset_id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES hr.Employee(employee_id) ON DELETE CASCADE,
    CHECK (returned_date IS NULL OR returned_date >= assignment_date)
);

CREATE TABLE hr.Maintenance_request (
    maintenance_id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reported_by INT REFERENCES hr.Employee(employee_id) ON DELETE SET NULL,
    asset_id INT NOT NULL REFERENCES hr.Asset(asset_id) ON DELETE CASCADE
);