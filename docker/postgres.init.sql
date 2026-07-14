-- ============================================================================
-- Pikud360 Enterprise Database Schema Initialization (v2.5)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- 2. SCHEMAS
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS workforce;
CREATE SCHEMA IF NOT EXISTS shifts;
CREATE SCHEMA IF NOT EXISTS comms;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS support;
CREATE SCHEMA IF NOT EXISTS workforce_planning;


-- ----------------------------------------------------------------------------
-- 3. TABLES DEFINITIONS
-- ----------------------------------------------------------------------------

-- tenants
CREATE TABLE core.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- unit types
CREATE TABLE core.organization_unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    rank INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- organization units
CREATE TABLE core.organization_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    type_id UUID NOT NULL REFERENCES core.organization_unit_types(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID,
    updated_by UUID
);

-- closure tree
CREATE TABLE core.organization_unit_closure (
    ancestor_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    descendant_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ancestor_id, descendant_id)
);

-- system settings
CREATE TABLE core.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- organization settings
CREATE TABLE core.organization_settings (
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (org_unit_id, key)
);

CREATE TABLE core.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    organization_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- users
CREATE TABLE security.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

-- Link back core references
ALTER TABLE core.organization_units ADD CONSTRAINT fk_org_units_created_by FOREIGN KEY (created_by) REFERENCES security.users(id) ON DELETE SET NULL;
ALTER TABLE core.organization_units ADD CONSTRAINT fk_org_units_updated_by FOREIGN KEY (updated_by) REFERENCES security.users(id) ON DELETE SET NULL;

-- WebAuthn Credentials
CREATE TABLE security.user_security_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    credential_type VARCHAR(50) NOT NULL,
    counter BIGINT DEFAULT 0,
    device_name VARCHAR(150) NOT NULL,
    backup_state BOOLEAN DEFAULT FALSE,
    transports JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- sessions
CREATE TABLE security.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(150),
    ip_address VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- service accounts
CREATE TABLE security.service_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- permissions groups & parameters
CREATE TABLE security.permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES security.permission_groups(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES core.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_role_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE security.role_permissions (
    role_id UUID NOT NULL REFERENCES security.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES security.permissions(id) ON DELETE CASCADE,
    permission_scope_type VARCHAR(50) NOT NULL DEFAULT 'ORGANIZATION_UNIT',
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE security.user_roles (
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES security.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- user organization access
CREATE TABLE security.user_organization_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    organization_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    access_type VARCHAR(50) DEFAULT 'READ',
    is_inheritable BOOLEAN DEFAULT TRUE,
    is_temporary BOOLEAN DEFAULT FALSE,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- logins log
CREATE TABLE security.user_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES core.tenants(id) ON DELETE CASCADE,
    session_id UUID,
    login_method VARCHAR(50) DEFAULT 'PASSWORD',
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50) NOT NULL,
    device_information TEXT,
    user_agent TEXT NOT NULL,
    is_successful BOOLEAN NOT NULL,
    failure_reason TEXT DEFAULT NULL
);

-- user settings
CREATE TABLE security.user_settings (
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
);

-- employees
CREATE TABLE workforce.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES security.users(id) ON DELETE SET NULL,
    commander_id UUID REFERENCES workforce.employees(id) ON DELETE SET NULL,
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    phone_ciphertext BYTEA,
    phone_nonce BYTEA,
    phone_tag BYTEA,
    phone_blind_index VARCHAR(64),
    
    email_ciphertext BYTEA,
    email_nonce BYTEA,
    email_tag BYTEA,
    email_blind_index VARCHAR(64),
    
    birthdate_ciphertext BYTEA NOT NULL,
    birthdate_nonce BYTEA NOT NULL,
    birthdate_tag BYTEA NOT NULL,
    
    rank VARCHAR(100) NOT NULL,
    position VARCHAR(150) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

CREATE TABLE core.organization_unit_commanders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    commander_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_org_unit_active_commander UNIQUE (org_unit_id, is_active)
);


-- history lifecycle
CREATE TABLE workforce.employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    change_type VARCHAR(100) NOT NULL,
    org_unit_id UUID REFERENCES core.organization_units(id) ON DELETE SET NULL,
    commander_id UUID REFERENCES workforce.employees(id) ON DELETE SET NULL,
    rank VARCHAR(100),
    position VARCHAR(150),
    service_type VARCHAR(100),
    status VARCHAR(50),
    snapshot_json JSONB NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    change_reason TEXT,
    recorded_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- commander log history
CREATE TABLE workforce.employee_command_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    commander_id UUID REFERENCES workforce.employees(id) ON DELETE SET NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- employee assignments
CREATE TABLE workforce.employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    position VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    assignment_type VARCHAR(50) DEFAULT 'PERMANENT',
    assignment_reason TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES security.users(id) ON DELETE RESTRICT,
    end_reason TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

-- statuses logs catalog
CREATE TABLE workforce.main_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce.office_sub_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    main_status_id UUID NOT NULL REFERENCES workforce.main_statuses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, main_status_id)
);

CREATE TABLE workforce.schedule_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    organization_unit_id UUID NOT NULL UNIQUE REFERENCES core.organization_units(id) ON DELETE CASCADE,
    scheduling_mode VARCHAR(50) DEFAULT 'DIRECT_STATUS',
    unassigned_threshold NUMERIC DEFAULT 10.0,
    sick_threshold NUMERIC DEFAULT 5.0,
    shortage_threshold NUMERIC DEFAULT 70.0,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce.shift_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    organization_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce.schedule_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_status_code UNIQUE (tenant_id, code)
);

CREATE TABLE workforce.employee_daily_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    organization_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    status_id UUID NOT NULL REFERENCES workforce.schedule_statuses(id) ON DELETE RESTRICT,
    shift_type_id UUID REFERENCES workforce.shift_types(id) ON DELETE SET NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    notes TEXT,
    created_by_commander_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by_commander_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_schedule_date UNIQUE (employee_id, schedule_date)
);



-- shift templates
CREATE TABLE shifts.shift_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    required_staff_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

-- shift recurrence rules
CREATE TABLE shifts.shift_recurrence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_template_id UUID NOT NULL REFERENCES shifts.shift_templates(id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL,
    days_of_week INTEGER[],
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- shift schedules
CREATE TABLE shifts.shift_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_template_id UUID NOT NULL REFERENCES shifts.shift_templates(id) ON DELETE RESTRICT,
    schedule_date DATE NOT NULL,
    start_time_override TIME,
    end_time_override TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    UNIQUE (shift_template_id, schedule_date)
);

-- planned shift assignments
CREATE TABLE shifts.shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_schedule_id UUID NOT NULL REFERENCES shifts.shift_schedules(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shift_schedule_id, employee_id)
);

-- actual attendance shifts
CREATE TABLE shifts.employee_shift_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_assignment_id UUID REFERENCES shifts.shift_assignments(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    attendance_status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- shift swaps
CREATE TABLE shifts.shift_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    target_employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    source_schedule_id UUID NOT NULL REFERENCES shifts.shift_schedules(id) ON DELETE CASCADE,
    target_schedule_id UUID NOT NULL REFERENCES shifts.shift_schedules(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    reviewed_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- birthday templates
CREATE TABLE comms.birthday_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    message_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- birthday logs
CREATE TABLE comms.birthday_delivery_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    celebration_year INTEGER NOT NULL,
    channel VARCHAR(50) NOT NULL,
    sent_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    delivery_status VARCHAR(50) NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    CONSTRAINT uq_employee_birthday_year_channel UNIQUE(employee_id, celebration_year, channel)
);

-- whatsapp template
CREATE TABLE comms.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    language_code VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- whatsapp queue
CREATE TABLE comms.whatsapp_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES comms.whatsapp_templates(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    provider_message_id VARCHAR(255),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- whatsapp history
CREATE TABLE comms.whatsapp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID,
    recipient_phone VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

-- notifications
CREATE TABLE comms.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL',
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    action_url VARCHAR(255),
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

-- notification target mapping
CREATE TABLE comms.notification_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES comms.notifications(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- notification read receipts
CREATE TABLE comms.notification_read_receipts (
    notification_id UUID NOT NULL REFERENCES comms.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, user_id)
);

-- notification channels deliveries
CREATE TABLE comms.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES comms.notifications(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI sessions
CREATE TABLE ai.ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Chat session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI messages
CREATE TABLE ai.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai.ai_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI prompts history
CREATE TABLE ai.ai_prompts_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI knowledge base
CREATE TABLE ai.ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI knowledge tags
CREATE TABLE ai.ai_knowledge_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ai.ai_knowledge_tag_mappings (
    article_id UUID NOT NULL REFERENCES ai.ai_knowledge_base(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES ai.ai_knowledge_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- feedbacks
CREATE TABLE support.feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES security.users(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL',
    status VARCHAR(50) DEFAULT 'PENDING',
    resolution_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

-- attachments
CREATE TABLE support.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    virus_scan_status VARCHAR(50) DEFAULT 'PENDING',
    is_quarantined BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

-- outbox out of events
CREATE TABLE audit.system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES core.tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- file logs download auditing
CREATE TABLE audit.attachment_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attachment_id UUID NOT NULL REFERENCES support.attachments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- audit.dashboard_snapshots was removed and migrated to workforce.dashboard_snapshots in Phase 7.1


-- PARTITIONED Audit Logs table (Partitioned by Range of created_at)
CREATE TABLE audit.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    request_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'INFO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ----------------------------------------------------------------------------
-- 4. OPERATIONAL AND SYSTEM CONFIGURATION TABLES (Phase 6, 7 & 7.1)
-- ----------------------------------------------------------------------------

CREATE TABLE workforce.employee_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    from_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    to_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES security.users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE core.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    organization_unit_id UUID REFERENCES core.organization_units(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'UNREAD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE core.business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    organization_unit_id UUID REFERENCES core.organization_units(id) ON DELETE CASCADE,
    rule_type VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    condition_json JSONB NOT NULL DEFAULT '{}',
    action_json JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    trigger_event VARCHAR(100) NOT NULL,
    condition_json JSONB NOT NULL DEFAULT '{}',
    action_type VARCHAR(100) NOT NULL,
    action_config JSONB NOT NULL DEFAULT '{}',
    schedule_cron VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP',
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    variables_json JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_template_type_channel UNIQUE (tenant_id, notification_type, channel)
);

CREATE TABLE workforce.dashboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    snapshot_hour INTEGER NOT NULL,
    total_employees INTEGER DEFAULT 0,
    assigned_employees INTEGER DEFAULT 0,
    unassigned_employees INTEGER DEFAULT 0,
    available_count INTEGER DEFAULT 0,
    sick_count INTEGER DEFAULT 0,
    vacation_count INTEGER DEFAULT 0,
    training_count INTEGER DEFAULT 0,
    mission_count INTEGER DEFAULT 0,
    reinforcement_count INTEGER DEFAULT 0,
    other_count INTEGER DEFAULT 0,
    readiness_percentage NUMERIC(5,2) DEFAULT 100.00,
    status_distribution JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_workforce_snapshot_unit_date_hour UNIQUE (tenant_id, org_unit_id, snapshot_date, snapshot_hour)
);

CREATE TABLE workforce.alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    org_unit_id UUID REFERENCES core.organization_units(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    operator VARCHAR(10) NOT NULL CHECK (operator IN ('>', '>=', '<', '<=', '=', '!=')),
    threshold_value NUMERIC(10,2) NOT NULL,
    evaluation_period VARCHAR(50) NOT NULL CHECK (evaluation_period IN ('TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS')),
    severity VARCHAR(50) NOT NULL DEFAULT 'WARNING',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce.generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    org_unit_id UUID REFERENCES core.organization_units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    parameters_json JSONB DEFAULT '{}',
    format VARCHAR(20) NOT NULL,
    file_path VARCHAR(512),
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    error_message TEXT,
    generated_by UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Extended results fields
    file_name VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    mime_type VARCHAR(100),
    checksum VARCHAR(64)
);


CREATE TABLE audit.job_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES core.tenants(id) ON DELETE CASCADE,
    job_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    records_processed INTEGER DEFAULT 0
);


CREATE TABLE workforce.report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    supported_formats VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ----------------------------------------------------------------------------
-- 5. INDEXES STRATEGY
-- ----------------------------------------------------------------------------

CREATE INDEX idx_users_tenant ON security.users(tenant_id);
CREATE INDEX idx_roles_tenant ON security.roles(tenant_id);
CREATE INDEX idx_service_accounts_tenant ON security.service_accounts(tenant_id);
CREATE INDEX idx_org_units_tenant ON core.organization_units(tenant_id);
CREATE INDEX idx_employees_user ON workforce.employees(user_id);
CREATE INDEX idx_employees_org ON workforce.employees(org_unit_id);
CREATE INDEX idx_employees_commander ON workforce.employees(commander_id);

CREATE INDEX idx_org_unit_closure_search 
    ON core.organization_unit_closure(ancestor_id, descendant_id, depth);

CREATE INDEX idx_employees_name_trgm 
    ON workforce.employees USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX idx_employees_email_trgm 
    ON workforce.employees USING gin (personal_email gin_trgm_ops);

CREATE INDEX idx_employees_email_blind ON workforce.employees(email_blind_index) WHERE email_blind_index IS NOT NULL;
CREATE INDEX idx_employees_phone_blind ON workforce.employees(phone_blind_index) WHERE phone_blind_index IS NOT NULL;

CREATE UNIQUE INDEX idx_active_employee_assignment 
    ON workforce.employee_assignments(employee_id) 
    WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_daily_status_composite 
    ON workforce.employee_daily_statuses(report_date, status_id);

CREATE INDEX idx_shift_schedules_date ON shifts.shift_schedules(schedule_date);
CREATE INDEX idx_shift_assignments_composite ON shifts.shift_assignments(shift_schedule_id, employee_id);

CREATE INDEX idx_notifications_recipient_unread 
    ON comms.notifications(created_by) WHERE deleted_at IS NULL;

CREATE INDEX idx_notif_receipts_user ON comms.notification_read_receipts(user_id);

CREATE INDEX idx_snapshots_composite 
    ON workforce.dashboard_snapshots(tenant_id, org_unit_id, snapshot_date);

CREATE INDEX idx_audit_logs_lookup ON audit.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_request ON audit.audit_logs(request_id);
CREATE INDEX idx_audit_logs_tenant_timestamp ON audit.audit_logs(tenant_id, created_at);

-- Phase 6, 7 and 7.1 Indexes
CREATE INDEX idx_transfers_tenant ON workforce.employee_transfers(tenant_id);
CREATE INDEX idx_transfers_employee ON workforce.employee_transfers(employee_id);
CREATE INDEX idx_transfers_status ON workforce.employee_transfers(status);
CREATE INDEX idx_transfers_from_unit ON workforce.employee_transfers(from_unit_id);
CREATE INDEX idx_transfers_to_unit ON workforce.employee_transfers(to_unit_id);

CREATE INDEX idx_notifications_tenant ON core.notifications(tenant_id);
CREATE INDEX idx_notifications_user ON core.notifications(user_id);
CREATE INDEX idx_notifications_unit ON core.notifications(organization_unit_id);
CREATE INDEX idx_notifications_status ON core.notifications(status);

CREATE INDEX idx_workforce_alert_rules_tenant_metric ON workforce.alert_rules(tenant_id, metric_name, is_active);
CREATE INDEX idx_workforce_generated_reports_tenant_user ON workforce.generated_reports(tenant_id, generated_by, created_at DESC);



-- ----------------------------------------------------------------------------
-- 6. STORED PROCEDURES & TRIGGERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tenants_timestamp BEFORE UPDATE ON core.tenants
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_org_unit_types_timestamp BEFORE UPDATE ON core.organization_unit_types
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_org_units_timestamp BEFORE UPDATE ON core.organization_units
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_users_timestamp BEFORE UPDATE ON security.users
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_roles_timestamp BEFORE UPDATE ON security.roles
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_employees_timestamp BEFORE UPDATE ON workforce.employees
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_employee_daily_status_timestamp BEFORE UPDATE ON workforce.employee_daily_statuses
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_shift_templates_timestamp BEFORE UPDATE ON shifts.shift_templates
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_shift_schedules_timestamp BEFORE UPDATE ON shifts.shift_schedules
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_feedback_reports_timestamp BEFORE UPDATE ON support.feedback_reports
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

-- Circle check loops
CREATE OR REPLACE FUNCTION core.fn_check_circular_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        IF NEW.id = NEW.parent_id THEN
            RAISE EXCEPTION 'Circular hierarchy detected: parent_id cannot be self (% = %)', NEW.id, NEW.parent_id;
        END IF;

        IF EXISTS (
            SELECT 1 FROM core.organization_unit_closure
            WHERE ancestor_id = NEW.id AND descendant_id = NEW.parent_id
        ) THEN
            RAISE EXCEPTION 'Circular hierarchy detected: parent unit % is a descendant of unit %', NEW.parent_id, NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_org_units_cycle_check
    BEFORE INSERT OR UPDATE ON core.organization_units
    FOR EACH ROW EXECUTE FUNCTION core.fn_check_circular_hierarchy();

-- Closure tree maintainer
CREATE OR REPLACE FUNCTION core.fn_maintain_hierarchy_closure()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO core.organization_unit_closure (ancestor_id, descendant_id, depth)
        VALUES (NEW.id, NEW.id, 0);

        IF NEW.parent_id IS NOT NULL THEN
            INSERT INTO core.organization_unit_closure (ancestor_id, descendant_id, depth)
            SELECT ancestor_id, NEW.id, depth + 1
            FROM core.organization_unit_closure
            WHERE descendant_id = NEW.parent_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF COALESCE(NEW.parent_id, '00000000-0000-0000-0000-000000000000'::UUID) != 
           COALESCE(OLD.parent_id, '00000000-0000-0000-0000-000000000000'::UUID) THEN
            
            DELETE FROM core.organization_unit_closure
            WHERE descendant_id IN (
                SELECT descendant_id 
                FROM core.organization_unit_closure 
                WHERE ancestor_id = OLD.id
            )
            AND ancestor_id IN (
                SELECT ancestor_id 
                FROM core.organization_unit_closure 
                WHERE descendant_id = OLD.id AND ancestor_id != OLD.id
            );

            IF NEW.parent_id IS NOT NULL THEN
                INSERT INTO core.organization_unit_closure (ancestor_id, descendant_id, depth)
                SELECT tbl_ancestor.ancestor_id, tbl_descendant.descendant_id, tbl_ancestor.depth + tbl_descendant.depth + 1
                FROM core.organization_unit_closure tbl_ancestor
                CROSS JOIN core.organization_unit_closure tbl_descendant
                WHERE tbl_ancestor.descendant_id = NEW.parent_id
                AND tbl_descendant.ancestor_id = NEW.id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_org_units_closure_maintain
    AFTER INSERT OR UPDATE ON core.organization_units
    FOR EACH ROW EXECUTE FUNCTION core.fn_maintain_hierarchy_closure();

CREATE TRIGGER tr_business_rules_timestamp BEFORE UPDATE ON core.business_rules
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_automation_rules_timestamp BEFORE UPDATE ON core.automation_rules
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_notification_templates_timestamp BEFORE UPDATE ON core.notification_templates
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_dashboard_snapshots_timestamp BEFORE UPDATE ON workforce.dashboard_snapshots
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();

CREATE TRIGGER tr_alert_rules_timestamp BEFORE UPDATE ON workforce.alert_rules
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_timestamp();



-- ----------------------------------------------------------------------------
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE core.organization_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_unit_commanders ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.service_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.employee_daily_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts.shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.system_events ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY unit_commanders_tenant_policy ON core.organization_unit_commanders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM core.organization_units ou
            WHERE ou.id = organization_unit_commanders.org_unit_id
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


-- ----------------------------------------------------------------------------
-- 8. DEFAULT SEED METADATA
-- ----------------------------------------------------------------------------

INSERT INTO core.organization_unit_types (name, rank) VALUES
    ('Branch', 1),
    ('Department', 2),
    ('Section', 3),
    ('Team', 4)
ON CONFLICT (name) DO NOTHING;

INSERT INTO workforce.main_statuses (name) VALUES
    ('Office'),
    ('Sick'),
    ('Reinforcement'),
    ('Course'),
    ('Vacation'),
    ('Vacation Abroad')
ON CONFLICT (name) DO NOTHING;

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


-- RLS for core.alerts
ALTER TABLE core.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY alerts_tenant_policy ON core.alerts
    FOR ALL USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID
    );


-- ============================================================================
-- Phase 6 Tables, Indexes, and RLS Policies
-- ============================================================================

CREATE TABLE workforce.employee_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    from_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    to_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES security.users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE core.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    organization_unit_id UUID REFERENCES core.organization_units(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'UNREAD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX idx_transfers_tenant ON workforce.employee_transfers(tenant_id);
CREATE INDEX idx_transfers_employee ON workforce.employee_transfers(employee_id);
CREATE INDEX idx_transfers_status ON workforce.employee_transfers(status);
CREATE INDEX idx_transfers_from_unit ON workforce.employee_transfers(from_unit_id);
CREATE INDEX idx_transfers_to_unit ON workforce.employee_transfers(to_unit_id);

CREATE INDEX idx_notifications_tenant ON core.notifications(tenant_id);
CREATE INDEX idx_notifications_user ON core.notifications(user_id);
CREATE INDEX idx_notifications_unit ON core.notifications(organization_unit_id);
CREATE INDEX idx_notifications_status ON core.notifications(status);

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

ALTER TABLE core.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.dashboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.job_history ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY job_history_tenant_policy ON audit.job_history
    FOR ALL USING (tenant_id IS NULL OR tenant_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID);

ALTER TABLE workforce.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_global_policy ON workforce.report_templates
    FOR SELECT USING (TRUE);

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
    ('notification_sms_enabled',    'false',           'Enable SMS notification dispatch'),
    ('scheduler_snapshot_interval', '60',              'Minutes between snapshot generation background runs'),
    ('scheduler_alert_interval',    '5',               'Minutes between alert evaluation background checks'),
    ('scheduler_cleanup_interval',  '1440',            'Minutes between expired logs and files pruning runs'),
    ('scheduler_retention_days',    '90',              'Data retention threshold in days for logs and snapshots')
ON CONFLICT (key) DO NOTHING;


-- ============================================================================
-- Phase 7.1 Seed: Analytics Permissions and Default Rules
-- ============================================================================
DO $$
DECLARE
    analytics_group_id UUID;
    role_uuid UUID := 'role-uuid-123';
    tenant_uuid UUID := 'de305d54-75b4-431b-adb2-eb6b9e546013';
BEGIN
    -- Create Analytics permission group
    INSERT INTO security.permission_groups (name, description) VALUES
        ('Analytics & Reports', 'Operations for viewing and managing workforce intelligence, snapshots, and generated reports')
    ON CONFLICT (name) DO NOTHING;

    SELECT id INTO analytics_group_id FROM security.permission_groups WHERE name = 'Analytics & Reports';

    IF analytics_group_id IS NOT NULL THEN
        INSERT INTO security.permissions (group_id, code, description) VALUES
            (analytics_group_id, 'analytics.view',     'Allows viewing dashboard snapshots, metrics, and generated reports'),
            (analytics_group_id, 'analytics.manage',   'Allows managing alert rules and triggering report generation tasks'),
            (analytics_group_id, 'analytics.export',   'Allows exporting analytics metrics and generated reports data')
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Grant permissions to admin role globally
    INSERT INTO security.role_permissions (role_id, permission_id, permission_scope_type)
    SELECT role_uuid, id, 'GLOBAL'
    FROM security.permissions
    WHERE code IN ('analytics.view', 'analytics.manage', 'analytics.export')
    ON CONFLICT DO NOTHING;

    -- Seed default alert rule for sick rate threshold (> 10% sick rate over LAST_7_DAYS)
    INSERT INTO workforce.alert_rules (tenant_id, name, metric_name, operator, threshold_value, evaluation_period, severity, is_active) VALUES
    (tenant_uuid, 'Sick Rate High Alert', 'SICK_PERCENTAGE', '>', 10.00, 'LAST_7_DAYS', 'WARNING', true)
    ON CONFLICT DO NOTHING;

    -- Seed default report templates
    INSERT INTO workforce.report_templates (code, name, description, supported_formats, enabled) VALUES
    ('manpower_summary',       'Manpower Summary',       'Manpower availability and readiness dashboard report',       'PDF,EXCEL,CSV', true),
    ('alert_log',              'Alert Log',              'Active and resolved system alerts history log',              'PDF,EXCEL,CSV', true),
    ('schedule_details',       'Schedule Details',       'Detailed employee workforce shifts schedules roster',        'PDF,EXCEL,CSV', true),
    ('organization_summary',   'Organization Summary',   'Organization unit metadata and summary statistics',          'PDF,EXCEL,CSV', true),
    ('attendance_statistics',  'Attendance Statistics',  'Employee daily attendance and absence tracking report',      'PDF,EXCEL,CSV', true),
    ('personnel_distribution', 'Personnel Distribution', 'Workforce distribution across categories and roles',         'PDF,EXCEL,CSV', true)
    ON CONFLICT (code) DO NOTHING;

END $$;





