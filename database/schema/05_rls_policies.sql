-- ============================================================================
-- Pikud360 Database Schema - Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on core tenant-direct tables
ALTER TABLE core.organization_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_unit_commanders ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.service_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on workforce tables
ALTER TABLE workforce.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.employee_daily_statuses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shifts schedules
ALTER TABLE shifts.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts.shift_schedules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on supporting logs and systems
ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.system_events ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 1. Direct Tenant Isolation Policies
-- ============================================================================

CREATE POLICY tenant_isolation_org_units ON core.organization_units
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY tenant_isolation_users ON security.users
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY tenant_isolation_service_accounts ON security.service_accounts
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY tenant_isolation_roles ON security.roles
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY tenant_isolation_system_events ON audit.system_events
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY tenant_isolation_audit_logs ON audit.audit_logs
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);


-- ============================================================================
-- 2. Explicit Child Tenant Resolution Policies (Mapped via organization units)
-- ============================================================================

CREATE POLICY employee_tenant_policy ON workforce.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM core.organization_units ou
            WHERE ou.id = employees.org_unit_id
            AND ou.tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
        )
    );

CREATE POLICY employee_assignments_tenant_policy ON workforce.employee_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM core.organization_units ou
            WHERE ou.id = employee_assignments.org_unit_id
            AND ou.tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
        )
    );

CREATE POLICY daily_statuses_tenant_policy ON workforce.employee_daily_statuses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workforce.employees emp
            JOIN core.organization_units ou ON ou.id = emp.org_unit_id
            WHERE emp.id = employee_daily_statuses.employee_id
            AND ou.tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
        )
    );

CREATE POLICY shift_templates_tenant_policy ON shifts.shift_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM core.organization_units ou
            WHERE ou.id = shift_templates.org_unit_id
            AND ou.tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
        )
    );

CREATE POLICY shift_schedules_tenant_policy ON shifts.shift_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shifts.shift_templates st
            JOIN core.organization_units ou ON ou.id = st.org_unit_id
            WHERE st.id = shift_schedules.shift_template_id
            AND ou.tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
        )
    );

CREATE POLICY unit_commanders_tenant_policy ON core.organization_unit_commanders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM core.organization_units ou
            WHERE ou.id = organization_unit_commanders.org_unit_id
            AND ou.tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
        )
    );

ALTER TABLE workforce.schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.employee_daily_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_tenant_policy ON workforce.schedule_settings
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );

CREATE POLICY shift_types_tenant_policy ON workforce.shift_types
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );

CREATE POLICY schedule_tenant_policy ON workforce.employee_daily_schedule
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );

ALTER TABLE workforce.schedule_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY statuses_tenant_policy ON workforce.schedule_statuses
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );


ALTER TABLE core.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY alerts_tenant_policy ON core.alerts
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );


ALTER TABLE workforce.employee_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY transfers_tenant_policy ON workforce.employee_transfers
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );


ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_tenant_policy ON core.notifications
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );


-- Phase 7 & 7.1 RLS Policies
ALTER TABLE core.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.dashboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_rules_tenant_policy ON core.business_rules
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY automation_rules_tenant_policy ON core.automation_rules
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY notification_templates_tenant_policy ON core.notification_templates
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY snapshots_tenant_policy ON workforce.dashboard_snapshots
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY alert_rules_tenant_policy ON workforce.alert_rules
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

CREATE POLICY generated_reports_tenant_policy ON workforce.generated_reports
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);






