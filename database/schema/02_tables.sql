-- ============================================================================
-- Pikud360 Database Schema - Table Definitions
-- ============================================================================

-- ============================================================================
-- SCHEMA: core
-- ============================================================================

CREATE TABLE core.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE core.organization_unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    rank INTEGER NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_by UUID, -- References security.users(id) - added post-creation FK
    updated_by UUID  -- References security.users(id)
);

CREATE TABLE core.organization_unit_closure (
    ancestor_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    descendant_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    depth INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE TABLE core.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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


-- ============================================================================
-- SCHEMA: security
-- ============================================================================

CREATE TABLE security.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL, -- Nullable for WebAuthn authentication profiles
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

-- Backlink organization_units references to security.users
ALTER TABLE core.organization_units ADD CONSTRAINT fk_org_units_created_by FOREIGN KEY (created_by) REFERENCES security.users(id) ON DELETE SET NULL;
ALTER TABLE core.organization_units ADD CONSTRAINT fk_org_units_updated_by FOREIGN KEY (updated_by) REFERENCES security.users(id) ON DELETE SET NULL;

CREATE TABLE security.user_security_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    credential_type VARCHAR(50) NOT NULL, -- YUBIKEY, BIOMETRIC, PASSKEY, etc.
    counter BIGINT DEFAULT 0,
    device_name VARCHAR(150) NOT NULL,
    backup_state BOOLEAN DEFAULT FALSE,
    transports JSONB, -- list of supported channels: ['usb', 'nfc', 'ble', 'internal']
    is_active BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE security.service_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB, -- Fine-grained API scoping
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

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
    code VARCHAR(100) NOT NULL UNIQUE, -- E.g. view_employees
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES core.tenants(id) ON DELETE CASCADE, -- NULL = System-wide Role
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
    permission_scope_type VARCHAR(50) NOT NULL DEFAULT 'ORGANIZATION_UNIT', -- GLOBAL, ORGANIZATION_UNIT, SELF
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE security.user_roles (
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES security.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE security.user_organization_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    organization_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    access_type VARCHAR(50) DEFAULT 'READ', -- READ, WRITE, ADMIN
    is_inheritable BOOLEAN DEFAULT TRUE, -- Rename from include_children
    is_temporary BOOLEAN DEFAULT FALSE,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE security.user_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES core.tenants(id) ON DELETE CASCADE,
    session_id UUID, -- Links to security.user_sessions(id) if successful
    login_method VARCHAR(50) DEFAULT 'PASSWORD', -- PASSWORD, WEBAUTHN
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50) NOT NULL,
    device_information TEXT,
    user_agent TEXT NOT NULL,
    is_successful BOOLEAN NOT NULL,
    failure_reason TEXT DEFAULT NULL
);

CREATE TABLE security.user_settings (
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
);


-- ============================================================================
-- SCHEMA: workforce
-- ============================================================================

CREATE TABLE workforce.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES security.users(id) ON DELETE SET NULL,
    commander_id UUID REFERENCES workforce.employees(id) ON DELETE SET NULL,
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Encrypted PII Fields (BYTEA binary storage)
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
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, LEAVE
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


CREATE TABLE workforce.employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    change_type VARCHAR(100) NOT NULL, -- TRANSFER, PROMOTION, COMMANDER_CHANGE, etc.
    org_unit_id UUID REFERENCES core.organization_units(id) ON DELETE SET NULL,
    commander_id UUID REFERENCES workforce.employees(id) ON DELETE SET NULL,
    rank VARCHAR(100),
    position VARCHAR(150),
    service_type VARCHAR(100),
    status VARCHAR(50),
    snapshot_json JSONB NOT NULL, -- JSON state before change
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    change_reason TEXT,
    recorded_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce.employee_command_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    commander_id UUID REFERENCES workforce.employees(id) ON DELETE SET NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workforce.employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE RESTRICT,
    position VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    assignment_type VARCHAR(50) DEFAULT 'PERMANENT', -- PERMANENT, TEMPORARY, DEPLOYMENT
    assignment_reason TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES security.users(id) ON DELETE RESTRICT,
    end_reason TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL
);

CREATE TABLE workforce.main_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- Office, Sick, Vacation, Course
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




-- ============================================================================
-- SCHEMA: shifts
-- ============================================================================

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

CREATE TABLE shifts.shift_recurrence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_template_id UUID NOT NULL REFERENCES shifts.shift_templates(id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY
    days_of_week INTEGER[], -- Days array [1,2,3,4,5] (1=Monday)
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

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

CREATE TABLE shifts.shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_schedule_id UUID NOT NULL REFERENCES shifts.shift_schedules(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, PRESENT, ABSENT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shift_schedule_id, employee_id)
);

CREATE TABLE shifts.employee_shift_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_assignment_id UUID REFERENCES shifts.shift_assignments(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    attendance_status VARCHAR(50) NOT NULL, -- PRESENT, LATE, ABSENT, PARTIAL
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shifts.shift_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    target_employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    source_schedule_id UUID NOT NULL REFERENCES shifts.shift_schedules(id) ON DELETE CASCADE,
    target_schedule_id UUID NOT NULL REFERENCES shifts.shift_schedules(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    notes TEXT,
    reviewed_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- SCHEMA: comms
-- ============================================================================

CREATE TABLE comms.birthday_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    message_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comms.birthday_delivery_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES workforce.employees(id) ON DELETE CASCADE,
    celebration_year INTEGER NOT NULL,
    channel VARCHAR(50) NOT NULL, -- WHATSAPP, EMAIL, SYSTEM
    sent_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    delivery_status VARCHAR(50) NOT NULL, -- SENT, FAILED
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    CONSTRAINT uq_employee_birthday_year_channel UNIQUE(employee_id, celebration_year, channel)
);

CREATE TABLE comms.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    language_code VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comms.whatsapp_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES comms.whatsapp_templates(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, SENT, FAILED
    provider_message_id VARCHAR(255),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comms.whatsapp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID,
    recipient_phone VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- DELIVERED, FAILED
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

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

CREATE TABLE comms.notification_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES comms.notifications(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- USER, ORGANIZATION_UNIT, ROLE
    target_id UUID NOT NULL, -- Matches target type id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comms.notification_read_receipts (
    notification_id UUID NOT NULL REFERENCES comms.notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE comms.notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES comms.notifications(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- PUSH, EMAIL, WHATSAPP, IN_APP
    status VARCHAR(50) DEFAULT 'PENDING',
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- SCHEMA: ai
-- ============================================================================

CREATE TABLE ai.ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Chat session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai.ai_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- USER, ASSISTANT
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai.ai_prompts_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai.ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai.ai_knowledge_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ai.ai_knowledge_tag_mappings (
    article_id UUID NOT NULL REFERENCES ai.ai_knowledge_base(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES ai.ai_knowledge_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);


-- ============================================================================
-- SCHEMA: support
-- ============================================================================

CREATE TABLE support.feedback_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES security.users(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL, -- BUG_REPORT, FEATURE_REQUEST, etc.
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

CREATE TABLE support.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL, -- E.g. transfer_requests
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


-- ============================================================================
-- SCHEMA: audit
-- ============================================================================

-- Outbox Events
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

CREATE TABLE audit.attachment_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attachment_id UUID NOT NULL REFERENCES support.attachments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- VIEW, DOWNLOAD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pre-aggregated Dashboard Snapshots
CREATE TABLE audit.dashboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_unit_id UUID NOT NULL REFERENCES core.organization_units(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    snapshot_hour INTEGER NOT NULL,
    total_employees INTEGER DEFAULT 0,
    office_count INTEGER DEFAULT 0,
    field_count INTEGER DEFAULT 0,
    home_count INTEGER DEFAULT 0,
    sick_count INTEGER DEFAULT 0,
    vacation_count INTEGER DEFAULT 0,
    course_count INTEGER DEFAULT 0,
    reinforcement_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_snapshot_unit_date_hour UNIQUE (org_unit_id, snapshot_date, snapshot_hour)
);

-- PARTITIONED Audit Logs table (Partitioned by Range of created_at)
CREATE TABLE audit.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES security.users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    request_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- Security event categorization
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'INFO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at) -- Partition key must be part of primary key in PG
) PARTITION BY RANGE (created_at);


-- ============================================================================
-- Phase 6 Tables
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


-- ============================================================================
-- Phase 7 Tables: Administration, Business Rules, Automation, Templates
-- ============================================================================

CREATE TABLE core.business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
    organization_unit_id UUID REFERENCES core.organization_units(id) ON DELETE CASCADE,
    rule_type VARCHAR(100) NOT NULL,         -- SICK_THRESHOLD, MANPOWER_MIN, TRANSFER_APPROVAL, etc.
    name VARCHAR(150) NOT NULL,
    description TEXT,
    condition_json JSONB NOT NULL DEFAULT '{}',  -- Rule condition parameters
    action_json JSONB NOT NULL DEFAULT '{}',     -- Action parameters when triggered
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,               -- Lower = evaluated first
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
    trigger_event VARCHAR(100) NOT NULL,          -- SICK_EXCEEDED, MANPOWER_SHORTAGE, PENDING_TRANSFER, etc.
    condition_json JSONB NOT NULL DEFAULT '{}',   -- Evaluation conditions
    action_type VARCHAR(100) NOT NULL,            -- NOTIFY_COMMANDER, CREATE_ALERT, ESCALATE, etc.
    action_config JSONB NOT NULL DEFAULT '{}',    -- Action parameters (recipient, message template, etc.)
    schedule_cron VARCHAR(100),                   -- Cron expression for scheduled triggers (optional)
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
    notification_type VARCHAR(100) NOT NULL,    -- TRANSFER_APPROVED, MANPOWER_SHORTAGE, etc.
    channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP',  -- IN_APP, EMAIL, SMS, WEBHOOK
    subject VARCHAR(255),                       -- Email subject (null for in-app)
    body_template TEXT NOT NULL,                -- Mustache/Jinja2-style template text
    variables_json JSONB NOT NULL DEFAULT '[]', -- Available variable names for preview
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES security.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_template_type_channel UNIQUE (tenant_id, notification_type, channel)
);
