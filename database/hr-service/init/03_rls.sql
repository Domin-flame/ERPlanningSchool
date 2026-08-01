-- =====================================================================
-- Row-Level Security — hr_db
-- Variables de session : app.current_person_id, app.current_roles,
-- app.current_employee_id, app.current_unit_id (unité organisationnelle
-- de rattachement de l'utilisateur staff RH, portée par le JWT)
-- =====================================================================

CREATE OR REPLACE FUNCTION app_current_employee_id() RETURNS BIGINT AS $$
    SELECT NULLIF(current_setting('app.current_employee_id', true), '')::BIGINT
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_unit_id() RETURNS INT AS $$
    SELECT NULLIF(current_setting('app.current_unit_id', true), '')::INT
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_has_role(p_role TEXT) RETURNS BOOLEAN AS $$
    SELECT p_role = ANY(string_to_array(current_setting('app.current_roles', true), ','))
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_hr_admin() RETURNS BOOLEAN AS $$
    SELECT app_has_role('admin') OR app_has_role('super_admin')
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------
-- EMPLOYEE : un employé voit son propre dossier ; un hr_staff ne voit
-- que les employés dont le poste actuel appartient à son unité (ABAC) ;
-- admin/super_admin voient tout.
-- ---------------------------------------------------------------------
ALTER TABLE employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee FORCE ROW LEVEL SECURITY;

CREATE POLICY employee_self_or_scoped_hr ON employee
    USING (
        id_employee = app_current_employee_id()
        OR app_is_hr_admin()
        OR (
            app_has_role('hr_staff') AND EXISTS (
                SELECT 1 FROM contract c JOIN position p ON p.id_position = c.id_position
                WHERE c.id_employee = employee.id_employee AND p.id_unit = app_current_unit_id()
            )
        )
    )
    WITH CHECK (app_is_hr_admin() OR app_has_role('hr_staff'));

-- ---------------------------------------------------------------------
-- CONTRACT / PAYROLL : mêmes règles, dérivées via employee.
-- ---------------------------------------------------------------------
ALTER TABLE contract ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract FORCE ROW LEVEL SECURITY;

CREATE POLICY contract_self_or_scoped_hr ON contract
    USING (
        id_employee = app_current_employee_id()
        OR app_is_hr_admin()
        OR (app_has_role('hr_staff') AND EXISTS (
                SELECT 1 FROM position p WHERE p.id_position = contract.id_position
                                            AND p.id_unit = app_current_unit_id()))
    )
    WITH CHECK (app_is_hr_admin() OR app_has_role('hr_staff'));

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll FORCE ROW LEVEL SECURITY;

CREATE POLICY payroll_self_or_hr_admin ON payroll
    USING (
        app_is_hr_admin()
        OR app_has_role('hr_staff')  -- la paie reste sensible : seul HR/admin gère, jamais le manager de service
        OR EXISTS (SELECT 1 FROM contract c WHERE c.id_contract = payroll.id_contract
                                               AND c.id_employee = app_current_employee_id())
    )
    WITH CHECK (app_is_hr_admin() OR app_has_role('hr_staff'));

-- ---------------------------------------------------------------------
-- LEAVE_REQUEST : l'employé gère ses propres demandes ; son n+1/hr_staff
-- peut approuver dans son unité ; admin voit tout.
-- ---------------------------------------------------------------------
ALTER TABLE leave_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_request FORCE ROW LEVEL SECURITY;

CREATE POLICY leave_owner_or_hr_scope ON leave_request
    USING (
        id_employee = app_current_employee_id()
        OR app_is_hr_admin()
        OR (app_has_role('hr_staff') AND EXISTS (
                SELECT 1 FROM contract c JOIN position p ON p.id_position = c.id_position
                WHERE c.id_employee = leave_request.id_employee AND p.id_unit = app_current_unit_id()))
    )
    WITH CHECK (
        id_employee = app_current_employee_id()  -- créer sa propre demande
        OR app_is_hr_admin() OR app_has_role('hr_staff')  -- approuver/modifier
    );

-- ---------------------------------------------------------------------
-- ASSET : filtré par unité organisationnelle (ABAC simple).
-- ---------------------------------------------------------------------
ALTER TABLE asset ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset FORCE ROW LEVEL SECURITY;

CREATE POLICY asset_scoped_by_unit ON asset
    USING (app_is_hr_admin() OR id_unit = app_current_unit_id())
    WITH CHECK (app_is_hr_admin() OR app_has_role('hr_staff'));
-- =====================================================================
