-- ============================================================================
-- Pikud360 Database Schema - Default Seed Metadata
-- ============================================================================

-- 1. Seed Organization Unit Tiers
INSERT INTO core.organization_unit_types (name, rank) VALUES
    ('Branch', 1),
    ('Department', 2),
    ('Section', 3),
    ('Team', 4)
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Main Daily Statuses
INSERT INTO workforce.main_statuses (name) VALUES
    ('Office'),
    ('Sick'),
    ('Reinforcement'),
    ('Course'),
    ('Vacation'),
    ('Vacation Abroad')
ON CONFLICT (name) DO NOTHING;

-- 3. Seed Office Sub Statuses (Must map to parent main_status 'Office')
-- Note: Requires resolving the main_status_id for 'Office'
DO $$
DECLARE
    office_id UUID;
    emp_group_id UUID;
    shift_group_id UUID;
    transfer_group_id UUID;
    report_group_id UUID;
    org_group_id UUID;
BEGIN
    SELECT id INTO office_id FROM workforce.main_statuses WHERE name = 'Office';
    
    IF office_id IS NOT NULL THEN
        INSERT INTO workforce.office_sub_statuses (main_status_id, name) VALUES
            (office_id, 'Office'),
            (office_id, 'Field'),
            (office_id, 'Work From Home')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Seed Permission Groups
    INSERT INTO security.permission_groups (id, name, description) VALUES
        ('11111111-1111-1111-1111-111111111111', 'Employee Management', 'Operations managing employees and postings'),
        ('22222222-2222-2222-2222-222222222222', 'Shift Management', 'Roster scheduling templates and assignments'),
        ('33333333-3333-3333-3333-333333333333', 'Transfer Management', 'Employee transfer request routing workflows'),
        ('44444444-4444-4444-4444-444444444444', 'Reports Management', 'Audits and WFM CSV reports export'),
        ('55555555-5555-5555-5555-555555555555', 'Organization Management', 'Operations managing units and hierarchies')
    ON CONFLICT (name) DO NOTHING;

    SELECT id INTO emp_group_id FROM security.permission_groups WHERE name = 'Employee Management';
    SELECT id INTO shift_group_id FROM security.permission_groups WHERE name = 'Shift Management';
    SELECT id INTO transfer_group_id FROM security.permission_groups WHERE name = 'Transfer Management';
    SELECT id INTO report_group_id FROM security.permission_groups WHERE name = 'Reports Management';
    SELECT id INTO org_group_id FROM security.permission_groups WHERE name = 'Organization Management';

    -- Seed Permissions
    IF emp_group_id IS NOT NULL THEN
        INSERT INTO security.permissions (group_id, code, description) VALUES
            (emp_group_id, 'employees.view', 'Allows viewing employee profile details'),
            (emp_group_id, 'employees.create', 'Allows onboarding new employees'),
            (emp_group_id, 'employees.update', 'Allows updating employee records'),
            (emp_group_id, 'employees.delete', 'Allows soft-deleting employees'),
            (emp_group_id, 'employees.history.view', 'Allows viewing employee chronological timeline'),
            (emp_group_id, 'notifications.view', 'Allows viewing received notifications'),
            (emp_group_id, 'notifications.manage', 'Allows managing and marking notifications as read')
        ON CONFLICT (code) DO NOTHING;
    END IF;

    IF shift_group_id IS NOT NULL THEN
        INSERT INTO security.permissions (group_id, code, description) VALUES
            (shift_group_id, 'shifts.view', 'Allows viewing schedules and shift rosters'),
            (shift_group_id, 'shifts.manage', 'Allows modifying shift templates and schedules'),
            (shift_group_id, 'schedule.view', 'Allows viewing daily schedules'),
            (shift_group_id, 'schedule.create', 'Allows creating schedule entries'),
            (shift_group_id, 'schedule.update', 'Allows updating schedule entries'),
            (shift_group_id, 'schedule.delete', 'Allows deleting schedule entries'),
            (shift_group_id, 'schedule.manage_settings', 'Allows managing unit scheduling settings'),
            (shift_group_id, 'schedule.statuses.view', 'Allows viewing scheduling statuses'),
            (shift_group_id, 'schedule.statuses.manage', 'Allows managing custom scheduling statuses'),
            (shift_group_id, 'schedule.bulk_update', 'Allows bulk status assignments'),
            (shift_group_id, 'schedule.dashboard.view', 'Allows viewing scheduling dashboard summary'),
            (shift_group_id, 'dashboard.view', 'Allows viewing daily operational intelligence dashboard'),
            (shift_group_id, 'dashboard.export', 'Allows exporting dashboard manpower planning summaries'),
            (shift_group_id, 'dashboard.manage_alerts', 'Allows managing persistent operational alerts')
        ON CONFLICT (code) DO NOTHING;
    END IF;


    IF transfer_group_id IS NOT NULL THEN
        INSERT INTO security.permissions (group_id, code, description) VALUES
            (transfer_group_id, 'transfers.view', 'Allows viewing employee unit transfers requests'),
            (transfer_group_id, 'transfers.request', 'Allows requesting employee transfers'),
            (transfer_group_id, 'transfers.approve', 'Allows signing off and approving transfers')
        ON CONFLICT (code) DO NOTHING;
    END IF;

    IF report_group_id IS NOT NULL THEN
        INSERT INTO security.permissions (group_id, code, description) VALUES
            (report_group_id, 'reports.export', 'Allows exporting dashboard analytics reports')
        ON CONFLICT (code) DO NOTHING;
    END IF;

    IF org_group_id IS NOT NULL THEN
        INSERT INTO security.permissions (group_id, code, description) VALUES
            (org_group_id, 'organization.view', 'Allows viewing organization structure and units'),
            (org_group_id, 'organization.create', 'Allows creating new organization units'),
            (org_group_id, 'organization.update', 'Allows updating organization units'),
            (org_group_id, 'organization.delete', 'Allows soft-deleting organization units'),
            (org_group_id, 'organization.manage_hierarchy', 'Allows structural changes and movements of units')
        ON CONFLICT (code) DO NOTHING;
    END IF;

END $$;


-- ============================================================================
-- 9. Seed Default Tenant, Users, Roles and Organization Units Hierarchy
-- ============================================================================
DO $$
DECLARE
    tenant_uuid UUID := 'de305d54-75b4-431b-adb2-eb6b9e546013';
    user_uuid UUID := 'user-uuid-123';
    role_uuid UUID := 'role-uuid-123';
    dept_type_id UUID;
    sect_type_id UUID;
    team_type_id UUID;
BEGIN
    -- Resolve Type IDs
    SELECT id INTO dept_type_id FROM core.organization_unit_types WHERE name = 'Department';
    SELECT id INTO sect_type_id FROM core.organization_unit_types WHERE name = 'Section';
    SELECT id INTO team_type_id FROM core.organization_unit_types WHERE name = 'Team';

    -- Ensure Default Tenant exists
    INSERT INTO core.tenants (id, name, code, is_active)
    VALUES (tenant_uuid, 'מפקדת החבל', 'tenant_code_123', true)
    ON CONFLICT (code) DO NOTHING;

    -- Ensure Default Admin User exists
    INSERT INTO security.users (id, tenant_id, username, email, password_hash, is_active)
    VALUES (user_uuid, tenant_uuid, 'admin', 'admin@pikud360.com', '$2b$12$M9VGTCI1LkjwJRRFOXYlEuSw8FmrIaS/Z2OkRhPEiPiuf8MewLNpS', true)
    ON CONFLICT (username) DO NOTHING;

    -- Ensure Admin Role exists
    INSERT INTO security.roles (id, tenant_id, name, description)
    VALUES (role_uuid, tenant_uuid, 'admin', 'System Administrator')
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Link User to Role
    INSERT INTO security.user_roles (user_id, role_id)
    VALUES (user_uuid, role_uuid)
    ON CONFLICT DO NOTHING;

    -- Assign all permissions to the admin role
    INSERT INTO security.role_permissions (role_id, permission_id, permission_scope_type)
    SELECT role_uuid, id, 'GLOBAL'
    FROM security.permissions
    ON CONFLICT DO NOTHING;

    -- --- SEED DEPARTMENTS (מחלקות) ---
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('d0000000-0000-0000-0000-000000000001', tenant_uuid, NULL, dept_type_id, 'מחלקת טכנולוגיות', 'TECH_DEPT', 'מחלקת טכנולוגיות'),
    ('d0000000-0000-0000-0000-000000000002', tenant_uuid, NULL, dept_type_id, 'מחלקת התעצמות', 'EMPOWERMENT_DEPT', 'מחלקת התעצמות'),
    ('d0000000-0000-0000-0000-000000000003', tenant_uuid, NULL, dept_type_id, 'מחלקת מענה מבצעי', 'OPERATIONAL_RESPONSE_DEPT', 'מחלקת מענה מבצעי')
    ON CONFLICT (code) DO NOTHING;

    -- --- SEED SECTIONS (מדורים) ---
    -- Under Tech Department
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('s0000000-0000-0000-0000-000000000001', tenant_uuid, 'd0000000-0000-0000-0000-000000000001', sect_type_id, 'מדור הסייבר המבצעי', 'TECH_OPS_CYBER_SECT', 'מדור הסייבר המבצעי'),
    ('s0000000-0000-0000-0000-000000000002', tenant_uuid, 'd0000000-0000-0000-0000-000000000001', sect_type_id, 'מדור מערכות הסייבר', 'TECH_CYBER_SYS_SECT', 'מדור מערכות הסייבר'),
    ('s0000000-0000-0000-0000-000000000003', tenant_uuid, 'd0000000-0000-0000-0000-000000000001', sect_type_id, 'מדור סיגמ"ה', 'TECH_SIGMA_SECT', 'מדור סיגמ"ה')
    ON CONFLICT (code) DO NOTHING;

    -- Under Empowerment Department
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('s0000000-0000-0000-0000-000000000005', tenant_uuid, 'd0000000-0000-0000-0000-000000000002', sect_type_id, 'מדור הכוונה מבצעית', 'EMP_OPS_DIR_SECT', 'מדור הכוונה מבצעית'),
    ('s0000000-0000-0000-0000-000000000004', tenant_uuid, 'd0000000-0000-0000-0000-000000000002', sect_type_id, 'מדור תכנון ייעודי ואסטרטגיה', 'EMP_STRAT_PLAN_SECT', 'מדור תכנון ייעודי ואסטרטגיה')
    ON CONFLICT (code) DO NOTHING;

    -- Under Operational Response Department
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('s0000000-0000-0000-0000-000000000006', tenant_uuid, 'd0000000-0000-0000-0000-000000000003', sect_type_id, 'מדור שטח', 'OPS_FIELD_SECT', 'מדור שטח'),
    ('s0000000-0000-0000-0000-000000000007', tenant_uuid, 'd0000000-0000-0000-0000-000000000003', sect_type_id, 'מדור יחידות ארציות', 'OPS_NAT_UNITS_SECT', 'מדור יחידות ארציות'),
    ('s0000000-0000-0000-0000-000000000008', tenant_uuid, 'd0000000-0000-0000-0000-000000000003', sect_type_id, 'מדור שליטה מבצעית', 'OPS_CONTROL_SECT', 'מדור שליטה מבצעית'),
    ('s0000000-0000-0000-0000-000000000009', tenant_uuid, 'd0000000-0000-0000-0000-000000000003', sect_type_id, 'מדור סייבר ארצי', 'OPS_NAT_CYBER_SECT', 'מדור סייבר ארצי')
    ON CONFLICT (code) DO NOTHING;

    -- --- SEED TEAMS (חוליות) ---
    -- Under Section 1 (מדור הסייבר המבצעי)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000001', tenant_uuid, 's0000000-0000-0000-0000-000000000001', team_type_id, 'חוליית מו"פ', 'CYBER_RD_TEAM', 'חוליית מו"פ'),
    ('t0000000-0000-0000-0000-000000000002', tenant_uuid, 's0000000-0000-0000-0000-000000000001', team_type_id, 'חוליית סייבר מבצעי', 'CYBER_OPS_TEAM', 'חוליית סייבר מבצעי'),
    ('t0000000-0000-0000-0000-000000000003', tenant_uuid, 's0000000-0000-0000-0000-000000000001', team_type_id, 'חוליית נגישות בסייבר', 'CYBER_ACCESS_TEAM', 'חוליית נגישות בסייבר')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 2 (מדור מערכות הסייבר)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000004', tenant_uuid, 's0000000-0000-0000-0000-000000000002', team_type_id, 'חוליית חברות תקשורת', 'SYS_TELECOM_TEAM', 'חוליית חברות תקשורת'),
    ('t0000000-0000-0000-0000-000000000005', tenant_uuid, 's0000000-0000-0000-0000-000000000002', team_type_id, 'חולייה פרויקטים ואמצעים', 'SYS_PROJ_MEANS_TEAM', 'חולייה פרויקטים ואמצעים')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 3 (מדור סיגמ"ה)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000006', tenant_uuid, 's0000000-0000-0000-0000-000000000003', team_type_id, 'חוליית אמצעי קצה', 'SIGMA_ENDPOINTS_TEAM', 'חוליית אמצעי קצה'),
    ('t0000000-0000-0000-0000-000000000007', tenant_uuid, 's0000000-0000-0000-0000-000000000003', team_type_id, 'חוליית סיוע מבצעי', 'SIGMA_OPS_ASSIST_TEAM', 'חוליית סיוע מבצעי'),
    ('t0000000-0000-0000-0000-000000000008', tenant_uuid, 's0000000-0000-0000-0000-000000000003', team_type_id, 'חוליית מענים מהירים', 'SIGMA_FAST_RESP_TEAM', 'חוליית מענים מהירים')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 4 (מדור תכנון ייעודי ואסטרטגיה)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000009', tenant_uuid, 's0000000-0000-0000-0000-000000000004', team_type_id, 'חוליית תקציב', 'STRAT_BUDGET_TEAM', 'חוליית תקציב'),
    ('t0000000-0000-0000-0000-000000000011', tenant_uuid, 's0000000-0000-0000-0000-000000000004', team_type_id, 'חוליית מערכה (אורית)', 'STRAT_CAMP_ORIT_TEAM', 'חוליית מערכה (אורית)'),
    ('t0000000-0000-0000-0000-000000000012', tenant_uuid, 's0000000-0000-0000-0000-000000000004', team_type_id, 'חוליית מערכה (רפאל)', 'STRAT_CAMP_RAFAEL_TEAM', 'חוליית מערכה (רפאל)'),
    ('t0000000-0000-0000-0000-000000000013', tenant_uuid, 's0000000-0000-0000-0000-000000000004', team_type_id, 'חוליית נ"מ', 'STRAT_NM_TEAM', 'חוליית נ"מ'),
    ('t0000000-0000-0000-0000-000000000414', tenant_uuid, 's0000000-0000-0000-0000-000000000004', team_type_id, 'חוליית קש"ח ושותפויות', 'STRAT_COOP_TEAM', 'חוליית קש"ח ושותפויות')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 5 (מדור הכוונה מבצעית)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000014', tenant_uuid, 's0000000-0000-0000-0000-000000000005', team_type_id, 'חוליית הפקה ארצית', 'DIR_NAT_PROD_TEAM', 'חוליית הפקה ארצית'),
    ('t0000000-0000-0000-0000-000000000015', tenant_uuid, 's0000000-0000-0000-0000-000000000005', team_type_id, 'חוליית ב"ר', 'DIR_BR_TEAM', 'חוליית ב"ר'),
    ('t0000000-0000-0000-0000-000000000016', tenant_uuid, 's0000000-0000-0000-0000-000000000005', team_type_id, 'חוליית סייבר', 'DIR_CYBER_TEAM', 'חוליית סייבר'),
    ('t0000000-0000-0000-0000-000000000017', tenant_uuid, 's0000000-0000-0000-0000-000000000005', team_type_id, 'חוליית מחת"ק', 'DIR_MACHTAK_TEAM', 'חוליית מחת"ק'),
    ('t0000000-0000-0000-0000-000000000018', tenant_uuid, 's0000000-0000-0000-0000-000000000005', team_type_id, 'חוליית בקרות', 'DIR_CONTROLS_TEAM', 'חוליית בקרות')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 6 (מדור שטח)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000019', tenant_uuid, 's0000000-0000-0000-0000-000000000006', team_type_id, 'חוליית מ"מ', 'FIELD_MM_TEAM', 'חוליית מ"מ'),
    ('t0000000-0000-0000-0000-000000000020', tenant_uuid, 's0000000-0000-0000-0000-000000000006', team_type_id, 'חוליית ביטחון מידע וחסיונות', 'FIELD_INFO_SEC_TEAM', 'חוליית ביטחון מידע וחסיונות'),
    ('t0000000-0000-0000-0000-000000000021', tenant_uuid, 's0000000-0000-0000-0000-000000000006', team_type_id, 'חוליית חות"ם', 'FIELD_CHOTAM_TEAM', 'חוליית חות"ם'),
    ('t0000000-0000-0000-0000-000000000022', tenant_uuid, 's0000000-0000-0000-0000-000000000006', team_type_id, 'חוליית חוס"ם', 'FIELD_CHOSAM_TEAM', 'חוליית חוס"ם')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 7 (מדור יחידות ארציות)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000023', tenant_uuid, 's0000000-0000-0000-0000-000000000007', team_type_id, 'חוליית סלע', 'NAT_SELA_TEAM', 'חוליית סלע'),
    ('t0000000-0000-0000-0000-000000000024', tenant_uuid, 's0000000-0000-0000-0000-000000000007', team_type_id, 'חוליית שהם', 'NAT_SHOHAM_TEAM', 'חוליית שהם'),
    ('t0000000-0000-0000-0000-000000000025', tenant_uuid, 's0000000-0000-0000-0000-000000000007', team_type_id, 'חוליית רשויות', 'NAT_AUTH_TEAM', 'חוליית רשויות'),
    ('t0000000-0000-0000-0000-000000000026', tenant_uuid, 's0000000-0000-0000-0000-000000000007', team_type_id, 'חוליית קיסר', 'NAT_KEISAR_TEAM', 'חוליית קיסר')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 8 (מדור שליטה מבצעית)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000027', tenant_uuid, 's0000000-0000-0000-0000-000000000008', team_type_id, 'חוליית 7100', 'CTRL_TEAM_7100', 'חוליית 7100'),
    ('t0000000-0000-0000-0000-000000000028', tenant_uuid, 's0000000-0000-0000-0000-000000000008', team_type_id, 'חוליית 7103', 'CTRL_TEAM_7103', 'חוליית 7103'),
    ('t0000000-0000-0000-0000-000000000029', tenant_uuid, 's0000000-0000-0000-0000-000000000008', team_type_id, 'חוליית משל"ט טכנו סיגינטי', 'CTRL_SIGINT_TEAM', 'חוליית משל"ט טכנו סיגינטי')
    ON CONFLICT (code) DO NOTHING;

    -- Under Section 9 (מדור סייבר ארצי)
    INSERT INTO core.organization_units (id, tenant_id, parent_id, type_id, name, code, description) VALUES
    ('t0000000-0000-0000-0000-000000000030', tenant_uuid, 's0000000-0000-0000-0000-000000000009', team_type_id, 'חוליית מס"א', 'NAT_CYBER_MASA_TEAM', 'חוליית מס"א'),
    ('t0000000-0000-0000-0000-000000000031', tenant_uuid, 's0000000-0000-0000-0000-000000000009', team_type_id, 'חוליית קריפטו', 'NAT_CYBER_CRYPTO_TEAM', 'חוליית קריפטו')
    ON CONFLICT (code) DO NOTHING;

    -- Give user explicit organization access permission mappings (inheritable)
    IF NOT EXISTS (SELECT 1 FROM security.user_organization_access WHERE user_id = user_uuid AND organization_unit_id = 'd0000000-0000-0000-0000-000000000001') THEN
        INSERT INTO security.user_organization_access (user_id, organization_unit_id, access_type, is_inheritable) VALUES
        (user_uuid, 'd0000000-0000-0000-0000-000000000001', 'ADMIN', true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM security.user_organization_access WHERE user_id = user_uuid AND organization_unit_id = 'd0000000-0000-0000-0000-000000000002') THEN
        INSERT INTO security.user_organization_access (user_id, organization_unit_id, access_type, is_inheritable) VALUES
        (user_uuid, 'd0000000-0000-0000-0000-000000000002', 'ADMIN', true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM security.user_organization_access WHERE user_id = user_uuid AND organization_unit_id = 'd0000000-0000-0000-0000-000000000003') THEN
        INSERT INTO security.user_organization_access (user_id, organization_unit_id, access_type, is_inheritable) VALUES
        (user_uuid, 'd0000000-0000-0000-0000-000000000003', 'ADMIN', true);
    END IF;

    -- Ensure schedule settings exist for each seeded unit
    INSERT INTO workforce.schedule_settings (id, tenant_id, organization_unit_id, scheduling_mode)
    SELECT gen_random_uuid(), tenant_id, id, 'DIRECT_STATUS'
    FROM core.organization_units
    ON CONFLICT (organization_unit_id) DO NOTHING;

END $$;


-- ============================================================================
-- Phase 7 Seed: System Administration Permissions & Default Settings
-- ============================================================================
DO $$
DECLARE
    admin_group_id UUID;
    role_uuid UUID := 'role-uuid-123';
BEGIN
    -- Create System Administration permission group
    INSERT INTO security.permission_groups (name, description) VALUES
        ('System Administration', 'Platform-wide configuration, audit, and automation management')
    ON CONFLICT (name) DO NOTHING;

    SELECT id INTO admin_group_id FROM security.permission_groups WHERE name = 'System Administration';

    IF admin_group_id IS NOT NULL THEN
        INSERT INTO security.permissions (group_id, code, description) VALUES
            (admin_group_id, 'system.settings.view',              'Allows viewing global system settings'),
            (admin_group_id, 'system.settings.manage',            'Allows modifying global system settings'),
            (admin_group_id, 'audit.view',                        'Allows viewing platform audit log events'),
            (admin_group_id, 'audit.export',                      'Allows exporting audit log as CSV'),
            (admin_group_id, 'automation.view',                   'Allows viewing automation rule definitions'),
            (admin_group_id, 'automation.manage',                  'Allows creating and managing automation rules'),
            (admin_group_id, 'business_rules.view',               'Allows viewing configured business rules'),
            (admin_group_id, 'business_rules.manage',             'Allows creating and managing business rules'),
            (admin_group_id, 'notification_templates.view',       'Allows viewing notification message templates'),
            (admin_group_id, 'notification_templates.manage',     'Allows editing notification message templates'),
            (admin_group_id, 'system_health.view',                'Allows viewing system health and status dashboard')
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Grant all new permissions to admin role with GLOBAL scope
    INSERT INTO security.role_permissions (role_id, permission_id, permission_scope_type)
    SELECT role_uuid, id, 'GLOBAL'
    FROM security.permissions
    WHERE code IN (
        'system.settings.view', 'system.settings.manage',
        'audit.view', 'audit.export',
        'automation.view', 'automation.manage',
        'business_rules.view', 'business_rules.manage',
        'notification_templates.view', 'notification_templates.manage',
        'system_health.view'
    )
    ON CONFLICT DO NOTHING;

END $$;


-- ============================================================================
-- Phase 7 Seed: Default System Settings
-- ============================================================================
INSERT INTO core.system_settings (key, value, description) VALUES
    ('scheduling_mode_default',     'DIRECT_STATUS',  'Default scheduling mode for new organization units'),
    ('session_timeout_minutes',     '480',             'Idle session timeout in minutes'),
    ('dashboard_refresh_seconds',   '60',              'Commander dashboard auto-refresh interval in seconds'),
    ('default_timezone',            'Asia/Jerusalem',  'Platform default timezone for date/time display'),
    ('default_language',            'he',              'Platform default language code (he/en)'),
    ('date_format',                 'DD/MM/YYYY',      'Display date format used across the platform'),
    ('working_days',                '0,1,2,3,4',       'Comma-separated day indices (0=Sun … 6=Sat)'),
    ('weekend_days',                '5,6',             'Comma-separated weekend day indices'),
    ('sick_alert_threshold_pct',    '10',              'Alert when sick percentage exceeds this value'),
    ('unavailable_alert_threshold', '20',              'Alert when unavailable percentage exceeds this value'),
    ('min_manpower_threshold_pct',  '70',              'Minimum acceptable manpower coverage percentage'),
    ('transfer_require_approval',   'true',            'Whether transfers require commander approval'),
    ('password_min_length',         '8',               'Minimum password length for user accounts'),
    ('max_failed_login_attempts',   '5',               'Lock account after this many consecutive failures'),
    ('notification_email_enabled',  'false',           'Enable email notification dispatch'),
    ('notification_sms_enabled',    'false',           'Enable SMS notification dispatch')
ON CONFLICT (key) DO NOTHING;
