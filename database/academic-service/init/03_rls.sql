-- =====================================================================
-- Row-Level Security — academic_db
-- Variables de session injectées par le middleware FastAPI depuis le JWT :
--   app.current_person_id   (BIGINT, id_person)
--   app.current_roles       (CSV: 'staff,teacher')
--   app.current_student_id  (BIGINT, id_student — NULL si non étudiant)
--   app.current_employee_id (BIGINT, id_employee — NULL si non employé)
-- =====================================================================

CREATE OR REPLACE FUNCTION app_current_student_id() RETURNS BIGINT AS $$
    SELECT NULLIF(current_setting('app.current_student_id', true), '')::BIGINT
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_employee_id() RETURNS BIGINT AS $$
    SELECT NULLIF(current_setting('app.current_employee_id', true), '')::BIGINT
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_has_role(p_role TEXT) RETURNS BOOLEAN AS $$
    SELECT p_role = ANY(string_to_array(current_setting('app.current_roles', true), ','))
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_staff_or_admin() RETURNS BOOLEAN AS $$
    SELECT app_has_role('admin') OR app_has_role('super_admin') OR app_has_role('staff')
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------
-- ENROLLMENT : étudiant = ses propres inscriptions ; teacher/staff/admin = tout
-- ---------------------------------------------------------------------
ALTER TABLE enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment FORCE ROW LEVEL SECURITY;

CREATE POLICY enrollment_owner_or_staff ON enrollment
    USING (id_student = app_current_student_id() OR app_is_staff_or_admin() OR app_has_role('teacher'))
    WITH CHECK (app_is_staff_or_admin());  -- un étudiant ne peut pas s'auto-inscrire en écriture directe

-- ---------------------------------------------------------------------
-- GRADE : étudiant voit ses notes ; teacher ne voit/modifie que les notes
-- des CourseOffering qu'il enseigne ; staff/admin = tout.
-- ---------------------------------------------------------------------
ALTER TABLE grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade FORCE ROW LEVEL SECURITY;

CREATE POLICY grade_owner_read ON grade
    FOR SELECT
    USING (
        id_student = app_current_student_id()
        OR app_is_staff_or_admin()
        OR EXISTS (
            SELECT 1 FROM assessment a
            JOIN course_offering co ON co.id_offering = a.id_offering
            WHERE a.id_assessment = grade.id_assessment
              AND co.id_employee_teacher = app_current_employee_id()
        )
    );

CREATE POLICY grade_teacher_write ON grade
    FOR INSERT
    WITH CHECK (
        app_is_staff_or_admin()
        OR EXISTS (
            SELECT 1 FROM assessment a
            JOIN course_offering co ON co.id_offering = a.id_offering
            WHERE a.id_assessment = grade.id_assessment
              AND co.id_employee_teacher = app_current_employee_id()
        )
    );

CREATE POLICY grade_teacher_update ON grade
    FOR UPDATE
    USING (
        app_is_staff_or_admin()
        OR EXISTS (
            SELECT 1 FROM assessment a
            JOIN course_offering co ON co.id_offering = a.id_offering
            WHERE a.id_assessment = grade.id_assessment
              AND co.id_employee_teacher = app_current_employee_id()
        )
    );

-- ---------------------------------------------------------------------
-- ASSESSMENT : un teacher ne gère que les évaluations de ses propres offres
-- ---------------------------------------------------------------------
ALTER TABLE assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment FORCE ROW LEVEL SECURITY;

CREATE POLICY assessment_teacher_scope ON assessment
    USING (
        app_is_staff_or_admin()
        OR EXISTS (
            SELECT 1 FROM course_offering co
            WHERE co.id_offering = assessment.id_offering
              AND co.id_employee_teacher = app_current_employee_id()
        )
        OR app_has_role('student')   -- lecture seule pour affichage des évaluations à venir
    )
    WITH CHECK (
        app_is_staff_or_admin()
        OR EXISTS (
            SELECT 1 FROM course_offering co
            WHERE co.id_offering = assessment.id_offering
              AND co.id_employee_teacher = app_current_employee_id()
        )
    );

-- Les tables de référence (course, program, room, campus, organization_unit...)
-- restent en RBAC pur (lecture publique aux authentifiés, écriture staff/admin
-- gérée au niveau applicatif) : pas de RLS nécessaire, ABAC n'y apporte rien.
-- =====================================================================
