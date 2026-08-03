CREATE SCHEMA IF NOT EXISTS finance;

-- Tarification et Facturation
CREATE TABLE finance.Fee_structure (
    fee_structure_id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    tuition_amount NUMERIC(12, 2) NOT NULL CHECK (tuition_amount >= 0)
);

CREATE TABLE finance.Invoice (
    invoice_id SERIAL PRIMARY KEY,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
    student_id INT NOT NULL, -- Référence à academic.Student(student_id)
    fee_structure_id INT REFERENCES finance.Fee_structure(fee_structure_id) ON DELETE SET NULL,
    CHECK (due_date >= issue_date)
);

CREATE TABLE finance.Invoice_item (
    invoice_item_id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    invoice_id INT NOT NULL REFERENCES finance.Invoice(invoice_id) ON DELETE CASCADE
);

CREATE TABLE finance.Payment (
    payment_id SERIAL PRIMARY KEY,
    amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    statut VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'confirmed', 'failed')),
    invoice_id INT NOT NULL REFERENCES finance.Invoice(invoice_id) ON DELETE RESTRICT
);

-- Bourses d'études
CREATE TABLE finance.scholarship (
    scholarship_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage BETWEEN 0 AND 100),
    type VARCHAR(50) NOT NULL
);

CREATE TABLE finance.Student_scholarship (
    student_scholarship_id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    Approved_by INT, -- Référence à hr.Employee ou academic.User_
    student_id INT NOT NULL, -- Référence à academic.Student
    scholarship_id INT NOT NULL REFERENCES finance.scholarship(scholarship_id) ON DELETE CASCADE,
    CONSTRAINT unique_student_scholarship_year UNIQUE (student_id, scholarship_id, academic_year)
);

-- Marketing & Leads (Inscriptions / Prospects)
CREATE TABLE finance.Campaign (
    campaign_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    channel VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    budget NUMERIC(12, 2) CHECK (budget >= 0),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE finance.Lead_ (
    lead_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'New',
    approved_to INT, -- Référence à un employé/agent
    campaign_id INT REFERENCES finance.Campaign(campaign_id) ON DELETE SET NULL
);

-- Budgets & Dépenses
CREATE TABLE finance.Budget (
    budget_id SERIAL PRIMARY KEY,
    fiscal_year INT NOT NULL,
    allocated_amount NUMERIC(15, 2) NOT NULL CHECK (allocated_amount >= 0)
);

CREATE TABLE finance.Expense_request (
    expense_request_id SERIAL PRIMARY KEY,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) DEFAULT 'Pending',
    approved_by INT, -- Référence à l'approbateur (ex: hr.Employee)
    budget_id INT NOT NULL REFERENCES finance.Budget(budget_id) ON DELETE RESTRICT
);