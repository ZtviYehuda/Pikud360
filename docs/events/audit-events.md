# Audit Logging Event Mapping Specifications

**Domain:** Security / Integration  
**Phase:** 16.6 — Audit Event Mapping  
**Depends on:** event-catalog.md, organization-hierarchy.md

---

## 1. Overview

This document specifies which system events are routed to the read-only audit log database (`core.audit_logs`) and details what fields, actors, and timestamps are logged. 

It also defines strict masking and encryption policies to protect personally identifiable information (PII) at the serialization layer.

---

## 2. Common Audit Schema

Every audit log entry contains these root metadata fields:

```json
{
  "auditLogId": "string (UUID)",
  "eventId": "string (UUID)",
  "eventName": "string (Event Catalog ID)",
  "timestamp": "string (ISO 8601 UTC Server timestamp)",
  "actor": {
    "userId": "string (UUID)",
    "userRole": "string (User System Role)",
    "ipAddress": "string (IPv4/IPv6 client IP)",
    "userAgent": "string (Browser user-agent string)"
  },
  "changes": {
    "before": "object (JSON snapshot of modified fields before action)",
    "after": "object (JSON snapshot of modified fields after action)"
  }
}
```

---

## 3. Events Audit Registry

This section registers the mapping rules for events defined in the global event catalog.

---

### 3.1 Workforce & Employee Domain

#### 3.1.1 `workforce.employee.created`
- **Audit Required:** **Yes** (Audits addition of new roster elements).
- **Logged Fields:**
  - `employeeId`
  - `rank`
  - `primaryUnitId` (associated Section/Cell node ID)
- **Actor:** Submitting operator.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** **STRICT PII MASKING.** Personal contact fields (such as phone numbers, emails, date of birth, national ID numbers) must be omitted from the audit log `changes` payload entirely. Only structural parameters are stored.

#### 3.1.2 `workforce.employee.status_changed`
- **Audit Required:** **Yes** (Tracks roster availability changes).
- **Logged Fields:**
  - `employeeId`
  - `oldStatus`
  - `newStatus`
  - `reason`
  - `effectiveUntil`
- **Actor:** Operator executing status change.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** The `reason` field is scrubbed of any medical detail keywords (e.g. specific diagnosis names are replaced with a generic "MEDICAL_LEAVE" label) to comply with privacy laws.

---

### 3.2 Organization Domain

#### 3.2.1 `core.organization.node_created`
- **Audit Required:** **Yes** (Tracks structural tree changes).
- **Logged Fields:**
  - `nodeId`
  - `name`
  - `code`
  - `level` (index 1 to 5)
  - `typeName` (e.g. `BRIGADE`, `DEPARTMENT`, `SECTION`, `CELL`)
  - `parentId`
- **Actor:** Tenant Admin.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** None. Node metadata is not sensitive.

#### 3.2.2 `core.organization.commander_assigned`
- **Audit Required:** **Yes** (Audits changes in leadership roles).
- **Logged Fields:**
  - `nodeId`
  - `nodeName`
  - `oldCommanderId`
  - `newCommanderId`
  - `newCommanderName`
- **Actor:** Tenant Admin.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** Commander names are logged; PII numbers are omitted.

#### 3.2.3 `core.organization.transfer_completed`
- **Audit Required:** **Yes** (Audits staff reassignment logs).
- **Logged Fields:**
  - `transferId`
  - `employeeId`
  - `fromUnitId` (source node ID)
  - `toUnitId` (target node ID)
  - `approvedBy` (authorizing commander ID)
- **Actor:** Approving Section/Department commander.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** Transfer justification reasons are stripped of personal text fields and stored as simple category tags in the audit block.

---

### 3.3 Attendance Domain

#### 3.3.1 `attendance.roll_call.signed_off`
- **Audit Required:** **Yes** (Critical operational sign-offs).
- **Logged Fields:**
  - `rollCallId`
  - `unitId` (submitting Section ID)
  - `date` (target roll call date)
  - `signedBy` (Section Head commander ID)
  - `presentCount`
  - `absentCount`
- **Actor:** Section Head.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** Individual employee absence reasons are omitted. Only total counts are logged in the audit record.

---

### 3.4 Shifts & Scheduling Domain

#### 3.4.1 `scheduling.shift.published`
- **Audit Required:** **Yes** (Roster publication history).
- **Logged Fields:**
  - `unitId` (publishing Section ID)
  - `startDate`
  - `endDate`
  - `publishedBy` (Section Head commander ID)
- **Actor:** Section Head.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** None. Shows schedule block dates.

#### 3.4.2 `scheduling.rule.overridden`
- **Audit Required:** **Yes** (Bypassed constraints are audited for safety compliance).
- **Logged Fields:**
  - `employeeId`
  - `shiftId`
  - `violatedRule` (e.g. `MINIMUM_REST_BUFFER`)
  - `overrideReason` (mandatory text note)
- **Actor:** Overriding commander.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** Override reason notes are checked against maximum size boundaries (1000 characters) and stored in plain text to allow safety review.

---

### 3.5 Authentication & Security Domains

#### 3.5.1 `auth.user.login_failed`
- **Audit Required:** **Yes** (Essential for threat monitoring).
- **Logged Fields:**
  - `username` (input username string)
  - `ipAddress`
  - `failureReason`
  - `attemptNumber`
- **Actor:** System Guest (caller IP).
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** If a user accidentally types their password in the `username` field, the system parses the string. If the string matches a password complexity pattern, it is masked as `[CLASSIFIED_PASS_STRING]` in the log to prevent logging active user credentials.

#### 3.5.2 `security.permission.granted`
- **Audit Required:** **Yes** (Critical role-based access changes).
- **Logged Fields:**
  - `targetUserId`
  - `grantedPermission`
  - `scopeNodeId` (associated Section/Brigade ID)
  - `grantedBy` (admin ID)
- **Actor:** System Administrator.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** None.

---

### 3.6 System Administration Domain

#### 3.6.1 `admin.settings.updated`
- **Audit Required:** **Yes** (Tracks tenant parameter modifications).
- **Logged Fields:**
  - `modifiedSettings` (array of setting keys, old values, new values)
- **Actor:** System Admin.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** None.

#### 3.6.2 `admin.audit_log.exported`
- **Audit Required:** **Yes** (Logs access to audit logs).
- **Logged Fields:**
  - `exportedBy`
  - `dateRangeStart`
  - `dateRangeEnd`
  - `exportFormat`
- **Actor:** Auditor user.
- **Timestamp:** Server event commit timestamp.
- **Sensitive Data Handling:** None.
