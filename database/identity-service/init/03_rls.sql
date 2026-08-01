-- =====================================================================
-- Row-Level Security — identity_db
-- Convention : à chaque requête, l'API exécute (via SET LOCAL, dans la
-- même transaction que la requête métier) :
--   SET LOCAL app.current_person_id = '<id_person>';
--   SET LOCAL app.current_roles     = 'staff,teacher';   -- CSV
-- Ces valeurs proviennent du JWT décodé par le middleware FastAPI.
-- Le rôle applicatif (app_identity_service) N'EST PAS BYPASSRLS,
-- donc les policies s'appliquent même en cas de bug applicatif.
-- =====================================================================

CREATE OR REPLACE FUNCTION app_current_person_id() RETURNS BIGINT AS $$
    SELECT NULLIF(current_setting('app.current_person_id', true), '')::BIGINT
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_has_role(p_role TEXT) RETURNS BOOLEAN AS $$
    SELECT p_role = ANY(string_to_array(current_setting('app.current_roles', true), ','))
$$ LANGUAGE sql STABLE;

-- ---------------------------------------------------------------------
-- USER_ACCOUNT : un utilisateur ne voit / modifie que son propre compte,
-- sauf admin / super_admin.
-- ---------------------------------------------------------------------
ALTER TABLE user_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_account FORCE ROW LEVEL SECURITY;

CREATE POLICY user_account_self_or_admin ON user_account
    USING (
        id_person = app_current_person_id()
        OR app_has_role('admin') OR app_has_role('super_admin')
    )
    WITH CHECK (
        id_person = app_current_person_id()
        OR app_has_role('admin') OR app_has_role('super_admin')
    );

-- ---------------------------------------------------------------------
-- NOTIFICATION : chacun ne voit que ses propres notifications.
-- ---------------------------------------------------------------------
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification FORCE ROW LEVEL SECURITY;

CREATE POLICY notification_owner_only ON notification
    USING (id_person = app_current_person_id() OR app_has_role('admin') OR app_has_role('super_admin'))
    WITH CHECK (id_person = app_current_person_id());

-- ---------------------------------------------------------------------
-- AUDIT_LOG : lecture réservée aux admins (écriture faite par le
-- service applicatif via un rôle dédié, jamais par l'utilisateur final).
-- ---------------------------------------------------------------------
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_log_admin_read ON audit_log
    FOR SELECT
    USING (app_has_role('admin') OR app_has_role('super_admin'));

CREATE POLICY audit_log_service_insert ON audit_log
    FOR INSERT
    WITH CHECK (true);  -- l'insertion est faite par les consumers du broker, filtrée en amont côté service

-- ---------------------------------------------------------------------
-- PERSON / ROLE / PERMISSION / USER_ROLE / ROLE_PERMISSION :
-- pas de RLS — ce sont des données de référence RBAC, gérées uniquement
-- par admin/super_admin au niveau applicatif (contrôle RBAC classique,
-- pas besoin d'ABAC ligne par ligne ici).
-- =====================================================================
