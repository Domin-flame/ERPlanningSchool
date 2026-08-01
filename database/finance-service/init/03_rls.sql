-- =====================================================================
-- Row-Level Security — finance_db
-- Variables de session : app.current_person_id, app.current_roles,
-- app.current_student_id (voir academic_db/03_rls.sql pour la convention)
-- =====================================================================

CREATE OR REPLACE FUNCTION app_current_student_id() RETURNS BIGINT AS $$
    SELECT NULLIF(current_setting('app.current_student_id', true), '')::BIGINT
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_has_role(p_role TEXT) RETURNS BOOLEAN AS $$
    SELECT p_role = ANY(string_to_array(current_setting('app.current_roles', true), ','))
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_finance_staff_or_admin() RETURNS BOOLEAN AS $$
    SELECT app_has_role('admin') OR app_has_role('super_admin') OR app_has_role('finance_staff')
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------
-- INVOICE : un étudiant ne voit que ses propres factures.
-- ---------------------------------------------------------------------
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice FORCE ROW LEVEL SECURITY;

CREATE POLICY invoice_owner_or_finance_staff ON invoice
    USING (id_student = app_current_student_id() OR app_is_finance_staff_or_admin())
    WITH CHECK (app_is_finance_staff_or_admin());  -- seul finance_staff/admin émet une facture

-- ---------------------------------------------------------------------
-- INVOICE_LINE / PAYMENT / RECEIPT : héritent de la portée via l'invoice liée.
-- ---------------------------------------------------------------------
ALTER TABLE invoice_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line FORCE ROW LEVEL SECURITY;

CREATE POLICY invoice_line_scope ON invoice_line
    USING (
        app_is_finance_staff_or_admin()
        OR EXISTS (SELECT 1 FROM invoice i WHERE i.id_invoice = invoice_line.id_invoice
                                              AND i.id_student = app_current_student_id())
    )
    WITH CHECK (app_is_finance_staff_or_admin());

ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment FORCE ROW LEVEL SECURITY;

CREATE POLICY payment_scope ON payment
    USING (
        app_is_finance_staff_or_admin()
        OR EXISTS (SELECT 1 FROM invoice i WHERE i.id_invoice = payment.id_invoice
                                              AND i.id_student = app_current_student_id())
    )
    WITH CHECK (
        app_is_finance_staff_or_admin()
        OR EXISTS (SELECT 1 FROM invoice i WHERE i.id_invoice = payment.id_invoice
                                              AND i.id_student = app_current_student_id())
    );  -- un étudiant peut payer sa propre facture (portail de paiement)

ALTER TABLE receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt FORCE ROW LEVEL SECURITY;

CREATE POLICY receipt_scope ON receipt
    USING (
        app_is_finance_staff_or_admin()
        OR EXISTS (
            SELECT 1 FROM payment p JOIN invoice i ON i.id_invoice = p.id_invoice
            WHERE p.id_payment = receipt.id_payment AND i.id_student = app_current_student_id()
        )
    );

-- CAMPAIGN / LEAD : purement RBAC (marketing_staff/admin), pas de notion
-- d'ownership individuel → pas de RLS nécessaire.
-- =====================================================================
