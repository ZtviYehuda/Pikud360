-- ============================================================================
-- Pikud360 Database Schema - Stored Procedures & Triggers
-- ============================================================================

-- ============================================================================
-- 1. Auto-update Timestamp Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION core.fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach update timestamp triggers
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


-- ============================================================================
-- 2. Organization Unit Hierarchy Closure Triggers
-- ============================================================================

-- Loop Cycle Prevention check on Insert / Update
CREATE OR REPLACE FUNCTION core.fn_check_circular_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        -- If parent is self, fail immediately
        IF NEW.id = NEW.parent_id THEN
            RAISE EXCEPTION 'Circular hierarchy detected: parent_id cannot be self (% = %)', NEW.id, NEW.parent_id;
        END IF;

        -- If new parent is currently a descendant of self, circular loop exists
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


-- Maintain closure tree tables automatically
CREATE OR REPLACE FUNCTION core.fn_maintain_hierarchy_closure()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 1. Insert self-mapping entry (depth 0)
        INSERT INTO core.organization_unit_closure (ancestor_id, descendant_id, depth)
        VALUES (NEW.id, NEW.id, 0);

        -- 2. Pull mappings of parent ancestors
        IF NEW.parent_id IS NOT NULL THEN
            INSERT INTO core.organization_unit_closure (ancestor_id, descendant_id, depth)
            SELECT ancestor_id, NEW.id, depth + 1
            FROM core.organization_unit_closure
            WHERE descendant_id = NEW.parent_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- If parent has changed, rebuild closure branches
        IF COALESCE(NEW.parent_id, '00000000-0000-0000-0000-000000000000'::UUID) != 
           COALESCE(OLD.parent_id, '00000000-0000-0000-0000-000000000000'::UUID) THEN
            
            -- Delete old mappings representing ancestors of OLD parent
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

            -- Insert new ancestor mappings for NEW parent
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
