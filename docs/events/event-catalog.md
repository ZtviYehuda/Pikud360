# Global Business Event Catalog

**Domain:** Cross-Domain Events / System Integration  
**Phase:** 16.1 — Event Catalog  
**Status:** Single Source of Truth for Integrations

---

## 1. Overview

This document specifies the global business event catalog for Pikud360. Every state mutation, security action, and administrative bypass emits an event following the standard naming convention:

`domain.entity.action` (e.g. `workforce.employee.status_changed`)

These events drive audit logging, dashboard real-time indicators, and external email/SMS notifications.

---

## 2. Event Severity Reference
- **INFO**: Low priority lifecycle events. Not audited.
- **WARNING**: Operations that bypassed soft validations or triggers alerts. Notification eligible.
- **AUDIT**: Critical business changes (state modifications, commander assignments). Audited.
- **CRITICAL**: System errors, access failures, or hard block rejections. Audited and alerts administrators immediately.

---

## 3. Events Catalog

---

### 3.1 Workforce & Employee Domain (עובדים וסגל)

#### 3.1.1 `workforce.employee.created`
- **Description:** Emitted when a new employee record is created in the draft state.
- **Trigger:** System operator submits the new employee profile form.
- **Source:** `EmployeeService`
- **Severity:** INFO
- **Audit Required:** No
- **Notification Eligible:** No
- **Payload Schema:**
  ```json
  {
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "name": "יוסי לוי",
    "rank": "טוראי",
    "primaryUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "operatorId": "op-99"
  }
  ```

#### 3.1.2 `workforce.employee.status_changed`
- **Description:** Emitted when an employee's employment status changes (e.g. Active ➔ On Leave ➔ Inactive).
- **Trigger:** Operator modifies the status field or a scheduled date boundary is reached.
- **Source:** `EmployeeService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** Yes (alerts unit commander)
- **Payload Schema:**
  ```json
  {
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "oldStatus": "ACTIVE",
    "newStatus": "ON_LEAVE",
    "effectiveUntil": "2026-07-25T00:00:00Z",
    "reason": "חופשת מחלה",
    "operatorId": "op-99"
  }
  ```

---

### 3.2 Organization Domain (מבנה ארגוני)

#### 3.2.1 `core.organization.node_created`
- **Description:** Emitted when a new organization unit node (e.g., Section or Cell) is added to the hierarchy tree.
- **Trigger:** Tenant administrator creates a unit node.
- **Source:** `OrganizationService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** No
- **Payload Schema:**
  ```json
  {
    "nodeId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "name": "מדור א'",
    "code": "MDR-A-7",
    "level": 4,
    "typeName": "SECTION",
    "parentId": "o1o2o3o4-p5p6-7890-abcd-ef1234567890",
    "operatorId": "admin-1"
  }
  ```

#### 3.2.2 `core.organization.commander_assigned`
- **Description:** Emitted when a new primary commander/manager is assigned to an organization node.
- **Trigger:** Operator submits commander reassignment dialog form.
- **Source:** `OrganizationService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** Yes (notifies new commander)
- **Payload Schema:**
  ```json
  {
    "nodeId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "nodeName": "מדור א'",
    "oldCommanderId": "c1c2c3c4-d5d6-7890-efgh-ij1234567890",
    "newCommanderId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "newCommanderName": "רס\"ן דוד לוי",
    "operatorId": "admin-1"
  }
  ```

#### 3.2.3 `core.organization.transfer_requested`
- **Description:** Emitted when an employee transfer is requested across scopes, requiring target scope approval.
- **Trigger:** Operator initiates transfer form where target is outside scope.
- **Source:** `TransferService`
- **Severity:** INFO
- **Audit Required:** No
- **Notification Eligible:** Yes (notifies destination commander)
- **Payload Schema:**
  ```json
  {
    "transferId": "f5f6f7f8-g9g0-1234-abcd-ef1234567890",
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "fromUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "toUnitId": "z9z8z7z6-y5y4-3210-wxvu-ts9876543210",
    "reason": "שינוי שיבוץ מקצועי",
    "operatorId": "op-44"
  }
  ```

#### 3.2.4 `core.organization.transfer_completed`
- **Description:** Emitted when an employee transfer request is authorized and completed.
- **Trigger:** Destination commander approves transfer or transfer is direct.
- **Source:** `TransferService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** Yes (notifies employee and source commander)
- **Payload Schema:**
  ```json
  {
    "transferId": "f5f6f7f8-g9g0-1234-abcd-ef1234567890",
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "fromUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "toUnitId": "z9z8z7z6-y5y4-3210-wxvu-ts9876543210",
    "approvedBy": "cmd-88"
  }
  ```

---

### 3.3 Attendance Domain (נוכחות)

#### 3.3.1 `attendance.record.checked_in`
- **Description:** Emitted when an employee registers a check-in status log.
- **Trigger:** Employee logs check-in via mobile or kiosk.
- **Source:** `AttendanceService`
- **Severity:** INFO
- **Audit Required:** No
- **Notification Eligible:** No
- **Payload Schema:**
  ```json
  {
    "attendanceId": "a1a2a3a4-b5b6-7890-cdef-gh1234567890",
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "checkInTime": "2026-07-19T08:02:15Z",
    "status": "LATE",
    "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "geofenceCoordinates": { "lat": 32.0853, "lng": 34.7818 }
  }
  ```

#### 3.3.2 `attendance.roll_call.signed_off`
- **Description:** Emitted when a Section Head signs and submits the daily unit attendance report.
- **Trigger:** Commander clicks "חתימת יום" (Submit Daily Roll Call).
- **Source:** `AttendanceService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** Yes (alerts higher command levels)
- **Payload Schema:**
  ```json
  {
    "rollCallId": "r1r2r3r4-s5s6-7890-tuvw-xy1234567890",
    "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "date": "2026-07-19",
    "signedBy": "cmd-88",
    "presentCount": 42,
    "absentCount": 3,
    "leaveCount": 5
  }
  ```

---

### 3.4 Shifts & Scheduling Domain (משמרות וסידורי עבודה)

#### 3.4.1 `scheduling.shift.assigned`
- **Description:** Emitted when an employee is assigned to a shift roster slot.
- **Trigger:** Commander assigns employee via planner.
- **Source:** `SchedulingService`
- **Severity:** INFO
- **Audit Required:** No
- **Notification Eligible:** No
- **Payload Schema:**
  ```json
  {
    "shiftId": "s1s2s3s4-t5t6-7890-abcd-ef1234567890",
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "assignmentDate": "2026-07-20",
    "role": "נהג חילוץ",
    "operatorId": "op-99"
  }
  ```

#### 3.4.2 `scheduling.shift.published`
- **Description:** Emitted when a schedule roster is published for a unit date range.
- **Trigger:** Commander clicks "פרסם סידור שבועי" (Publish Weekly Schedule).
- **Source:** `SchedulingService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** Yes (notifies all assigned employees)
- **Payload Schema:**
  ```json
  {
    "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "startDate": "2026-07-20",
    "endDate": "2026-07-26",
    "publishedBy": "cmd-88"
  }
  ```

#### 3.4.3 `scheduling.rule.overridden`
- **Description:** Emitted when a commander overrides a soft safety block scheduling constraint.
- **Trigger:** Commander enters justification reason and overrides warning in assignment dialog.
- **Source:** `ConstraintEngine`
- **Severity:** WARNING
- **Audit Required:** Yes
- **Notification Eligible:** Yes (alerts department safety officer)
- **Payload Schema:**
  ```json
  {
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "shiftId": "s1s2s3s4-t5t6-7890-abcd-ef1234567890",
    "violatedRule": "MINIMUM_REST_BUFFER",
    "overrideReason": "כוח כוננות מוקפץ עקב כוננות מוגברת",
    "operatorId": "cmd-88"
  }
  ```

---

### 3.5 Authentication Domain (אימות משתמשים)

#### 3.5.1 `auth.user.login_succeeded`
- **Description:** Emitted when a user successfully authenticates.
- **Trigger:** Correct credentials submitted on login page.
- **Source:** `AuthService`
- **Severity:** INFO
- **Audit Required:** No
- **Notification Eligible:** No
- **Payload Schema:**
  ```json
  {
    "userId": "usr123-ab",
    "ipAddress": "192.168.1.55",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2026-07-19T15:09:00Z"
  }
  ```

#### 3.5.2 `auth.user.login_failed`
- **Description:** Emitted when a login attempt fails (e.g. incorrect password).
- **Trigger:** Incorrect login payload submitted.
- **Source:** `AuthService`
- **Severity:** WARNING
- **Audit Required:** Yes
- **Notification Eligible:** No (monitored for rate-limit locks)
- **Payload Schema:**
  ```json
  {
    "username": "yossi_levi",
    "ipAddress": "192.168.1.55",
    "failureReason": "INVALID_PASSWORD",
    "attemptNumber": 3
  }
  ```

---

### 3.6 Roles & Permissions Domain (הרשאות ואבטחה)

#### 3.6.1 `security.permission.granted`
- **Description:** Emitted when a security role or specific permission is granted to a user.
- **Trigger:** System administrator modifies role access parameters.
- **Source:** `RBACService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** Yes (notifies target user)
- **Payload Schema:**
  ```json
  {
    "targetUserId": "usr456-cd",
    "grantedPermission": "scheduling.manage",
    "scopeNodeId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "grantedBy": "admin-1"
  }
  ```

---

### 3.7 System Administration Domain (ניהול מערכת)

#### 3.7.1 `admin.settings.updated`
- **Description:** Emitted when global tenant configuration values are modified.
- **Trigger:** Tenant administrator saves settings changes.
- **Source:** `AdminSettingsService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** No
- **Payload Schema:**
  ```json
  {
    "modifiedSettings": [
      { "key": "GEOCONST_TOLERANCE_METERS", "oldValue": "100", "newValue": "250" }
    ],
    "operatorId": "admin-1"
  }
  ```

#### 3.7.2 `admin.audit_log.exported`
- **Description:** Emitted when system audit log files are exported.
- **Trigger:** Systems auditor triggers CSV/PDF log download.
- **Source:** `AuditService`
- **Severity:** AUDIT
- **Audit Required:** Yes
- **Notification Eligible:** Yes (alerts system owner)
- **Payload Schema:**
  ```json
  {
    "exportedBy": "auditor-0",
    "dateRangeStart": "2026-07-01T00:00:00Z",
    "dateRangeEnd": "2026-07-19T23:59:59Z",
    "exportFormat": "CSV"
  }
  ```
