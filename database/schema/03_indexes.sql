-- ============================================================================
-- Pikud360 Database Schema - Indexing Strategy
-- ============================================================================

-- 1. Foreign Key Indexes (Optimize joins and cascade checks)
CREATE INDEX idx_users_tenant ON security.users(tenant_id);
CREATE INDEX idx_roles_tenant ON security.roles(tenant_id);
CREATE INDEX idx_service_accounts_tenant ON security.service_accounts(tenant_id);
CREATE INDEX idx_org_units_tenant ON core.organization_units(tenant_id);
CREATE INDEX idx_employees_user ON workforce.employees(user_id);
CREATE INDEX idx_employees_org ON workforce.employees(org_unit_id);
CREATE INDEX idx_employees_commander ON workforce.employees(commander_id);

-- 2. Organization Unit Tree Closure Index
CREATE INDEX idx_org_unit_closure_search 
    ON core.organization_unit_closure(ancestor_id, descendant_id, depth);

-- 3. Trigram Fuzzy Search Indexes (Requires pg_trgm extension)
CREATE INDEX idx_employees_name_trgm 
    ON workforce.employees USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
    
CREATE INDEX idx_employees_email_trgm 
    ON workforce.employees USING gin (personal_email gin_trgm_ops);

-- 4. PII Blind Index Lookups (Exact matching indexes)
CREATE INDEX idx_employees_email_blind ON workforce.employees(email_blind_index) WHERE email_blind_index IS NOT NULL;
CREATE INDEX idx_employees_phone_blind ON workforce.employees(phone_blind_index) WHERE phone_blind_index IS NOT NULL;

-- 5. Active Assignment Filter Index (Guarantees only one active assignment per employee)
CREATE UNIQUE INDEX idx_active_employee_assignment 
    ON workforce.employee_assignments(employee_id) 
    WHERE is_active = TRUE AND deleted_at IS NULL;

-- 6. Daily Status Log Lookups
CREATE INDEX idx_daily_status_composite 
    ON workforce.employee_daily_statuses(report_date, status_id);

-- 7. Shift Roster Lookups
CREATE INDEX idx_shift_schedules_date ON shifts.shift_schedules(schedule_date);
CREATE INDEX idx_shift_assignments_composite ON shifts.shift_assignments(shift_schedule_id, employee_id);

-- 8. Notifications Recipient Index
CREATE INDEX idx_notifications_recipient_unread 
    ON comms.notifications(created_by) WHERE deleted_at IS NULL;

CREATE INDEX idx_notif_receipts_user ON comms.notification_read_receipts(user_id);

-- 9. High-Performance Dashboard Snapshot Index
CREATE INDEX idx_snapshots_composite 
    ON workforce.dashboard_snapshots(tenant_id, org_unit_id, snapshot_date);


-- 10. Audit Log Performance
CREATE INDEX idx_audit_logs_lookup ON audit.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_request ON audit.audit_logs(request_id);
CREATE INDEX idx_audit_logs_tenant_timestamp ON audit.audit_logs(tenant_id, created_at);


-- Phase 6 Indexes
CREATE INDEX idx_transfers_tenant ON workforce.employee_transfers(tenant_id);
CREATE INDEX idx_transfers_employee ON workforce.employee_transfers(employee_id);
CREATE INDEX idx_transfers_status ON workforce.employee_transfers(status);
CREATE INDEX idx_transfers_from_unit ON workforce.employee_transfers(from_unit_id);
CREATE INDEX idx_transfers_to_unit ON workforce.employee_transfers(to_unit_id);

CREATE INDEX idx_notifications_tenant ON core.notifications(tenant_id);
CREATE INDEX idx_notifications_user ON core.notifications(user_id);
CREATE INDEX idx_notifications_unit ON core.notifications(organization_unit_id);
CREATE INDEX idx_notifications_status ON core.notifications(status);


-- Phase 7.1 Indexes: Analytics Database Foundation
CREATE INDEX idx_workforce_alert_rules_tenant_metric ON workforce.alert_rules(tenant_id, metric_name, is_active);
CREATE INDEX idx_workforce_generated_reports_tenant_user ON workforce.generated_reports(tenant_id, generated_by, created_at DESC);

