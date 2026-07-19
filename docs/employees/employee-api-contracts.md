# Employee API Contracts

**Domain:** Employee
**Phase:** 12.6 — Employee Data Contracts
**Depends on:** employee-dtos.md, employee-business-rules.md

---

## Overview

This document defines every API endpoint in the Employee domain. For each endpoint it specifies:

- **Method and path**
- **Purpose**
- **Authorization**
- **Request shape**
- **Response shape**
- **Error responses**
- **Business rules enforced**

All endpoints are prefixed with `/api/v1`.

All responses use the system's standard `ApiResponse` envelope:

```
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [ ... ]   // optional field-level validation errors
  }
}
```

---

## Endpoint Index

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/employees` | List employees visible to the operator |
| `POST` | `/employees` | Create a new employee |
| `GET` | `/employees/{id}` | Get a single employee's full profile |
| `PATCH` | `/employees/{id}` | Update an employee |
| `DELETE` | `/employees/{id}` | Soft-delete an employee |
| `PATCH` | `/employees/{id}/status` | Change employment status |
| `PATCH` | `/employees/{id}/preferences` | Update self-service preferences |
| `GET` | `/employees/{id}/timeline` | Get the full history and transfer timeline |
| `GET` | `/employees/{id}/certifications` | Get certifications with derived statuses |
| `PATCH` | `/employees/{id}/certifications` | Update a certification entry |

---

## Endpoints

---

### GET /employees

**Purpose:** Returns a list of employees the operator is authorized to view, scoped to their unit access.

**Authorization:** Requires `employees.view` permission with `ORGANIZATION_UNIT` scope. Results are automatically filtered to units within the operator's view scope. Operators never receive employees outside their scope.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `unitId` | string (UUID) | No | Filter to a specific organization unit. Must be within the operator's scope. |
| `includeDescendants` | boolean | No | If true and `unitId` is set, includes employees in all child units. Default: `false` |
| `status` | string | No | Filter by Employment Status. Multiple values comma-separated. Default: `ACTIVE` |
| `search` | string | No | Free-text search against first name, last name, and employee number |
| `serviceType` | string | No | Filter by service type. Multiple values comma-separated. |
| `page` | number | No | Page number. Default: `1` |
| `pageSize` | number | No | Results per page. Default: `50`. Maximum: `200` |
| `sortBy` | string | No | Field to sort by. Default: `lastName`. Options: `lastName`, `rank`, `employeeNumber`, `startDate`, `status` |
| `sortOrder` | string | No | `asc` or `desc`. Default: `asc` |

**Response:**

```
{
  "success": true,
  "data": {
    "items": EmployeeSummaryDTO[],
    "total": number,
    "page": number,
    "pageSize": number,
    "totalPages": number
  }
}
```

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks `employees.view` permission |
| `INVALID_UNIT` | 400 | `unitId` is not within the operator's scope |
| `VALIDATION_ERROR` | 400 | Invalid query parameter values |

**Business Rules Enforced:** ER-02, ER-03, SR-05 (DRAFT excluded unless `status=DRAFT` explicitly requested by Admin)

---

### POST /employees

**Purpose:** Creates a new employee record.

**Authorization:** Requires `employees.manage` permission with `ORGANIZATION_UNIT` scope on the target `orgUnitId`.

**Request Body:** `CreateEmployeeDTO`

**Response:**

```
{
  "success": true,
  "data": EmployeeProfileDTO
}
```

HTTP status: `201 Created`

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks manage scope on `orgUnitId` |
| `DUPLICATE_EMPLOYEE_NUMBER` | 409 | Employee number already exists in this tenant |
| `INVALID_UNIT` | 400 | `orgUnitId` does not exist or is inactive |
| `INVALID_COMMANDER` | 400 | `commanderId` does not reference an active employee in this tenant |
| `VALIDATION_ERROR` | 400 | Any field fails validation (see field-level `details` array) |

**Business Rules Enforced:** VR-01 through VR-10, VR-15, VR-16, ER-01, ER-03, LR-06, ER-10

**Side Effects:**
- Creates an `EmployeeHistory` record with `changeType: EMPLOYEE_CREATED`
- Writes an `EMPLOYEE_CREATED` audit log entry

---

### GET /employees/{id}

**Purpose:** Returns the full profile of a single employee.

**Authorization:** Requires either:
- `employees.view` permission with scope on the employee's unit, **or**
- The operator is requesting their own profile (`user_id` matches the employee's `userId`)

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Response:**

```
{
  "success": true,
  "data": EmployeeProfileDTO
}
```

Field masking is applied based on the operator's role (see `employee-dtos.md` — Field Masking Rules).

The `preferences` group is only included when the operator is reading their own profile.

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks view scope on the employee's unit and is not reading own profile |
| `NOT_FOUND` | 404 | No employee with this ID exists in the tenant |

**Business Rules Enforced:** ER-02, ER-03

**Side Effects:**
- Writes an `EMPLOYEE_VIEWED` audit log entry

---

### PATCH /employees/{id}

**Purpose:** Updates one or more fields on an existing employee record. Partial update — only provided fields are changed.

**Authorization:** Requires `employees.manage` permission with scope on the employee's current Primary Unit.

If `orgUnitId` is changing (transfer), also requires manage scope on the target unit.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Request Body:** `UpdateEmployeeDTO`

**Response:**

```
{
  "success": true,
  "data": EmployeeProfileDTO
}
```

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks manage scope on source unit, or lacks scope on target unit during transfer |
| `NOT_FOUND` | 404 | Employee not found |
| `ARCHIVED_RECORD` | 409 | Employee is ARCHIVED — record is read-only (ER-12) |
| `IMMUTABLE_FIELD` | 409 | Attempt to change `employeeNumber` or `dateOfBirth` post-activation without admin override |
| `INVALID_COMMANDER` | 400 | New `commanderId` does not reference an active employee |
| `INVALID_STATUS_TRANSITION` | 400 | Requested `status` change violates the lifecycle state machine (LR-01) |
| `MISSING_CHANGE_REASON` | 400 | Status is transitioning to SUSPENDED, INACTIVE, or ARCHIVED but `changeReason` is absent |
| `VALIDATION_ERROR` | 400 | Any field fails validation |

**Business Rules Enforced:** VR-01 to VR-20, LR-01, LR-03, LR-04, LR-05, LR-06, ER-01, ER-03, ER-04, ER-05, ER-06, ER-09, ER-10, ER-11, ER-14

**Side Effects:**
- Creates an `EmployeeHistory` record with `changeType: EMPLOYEE_UPDATED` or `EMPLOYEE_TRANSFERRED`
- Writes an `EMPLOYEE_UPDATED` audit log entry
- If a certification field changed: triggers certification status re-evaluation (ER-13)

---

### DELETE /employees/{id}

**Purpose:** Soft-deletes an employee record. Sets `deletedAt` to the current timestamp. Requires an explicit reason.

**Authorization:** Requires `employees.manage` permission with scope on the employee's unit. Admin role required.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Request Body:**

```
{
  reason*: string    — minimum 5 characters
}
```

**Response:**

```
{
  "success": true,
  "data": {
    "id": string,
    "deletedAt": string (ISO 8601)
  }
}
```

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks manage scope or Admin role |
| `NOT_FOUND` | 404 | Employee not found |
| `ALREADY_DELETED` | 409 | Employee is already soft-deleted |
| `MISSING_REASON` | 400 | `reason` field is absent or too short |

**Business Rules Enforced:** LR-10, ER-01, ER-08, ER-09, ER-10

**Side Effects:**
- Sets `deletedAt` timestamp
- Creates an `EmployeeHistory` record with `changeType: EMPLOYEE_DELETED`
- Writes an `EMPLOYEE_DELETED` audit log entry

---

### PATCH /employees/{id}/status

**Purpose:** Dedicated endpoint for Employment Status transitions. Enforces the lifecycle state machine explicitly and requires a reason for sensitive transitions.

**Authorization:** Varies by target status:

| Target Status | Required Role |
|---|---|
| `ACTIVE` | Commander or Admin (manage scope) |
| `ON_LEAVE` | Commander or Admin (manage scope) |
| `TEMPORARY_ASSIGNMENT` | Commander or Admin (manage scope) |
| `SUSPENDED` | Admin only |
| `INACTIVE` | Admin only |
| `ARCHIVED` | Admin only |

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Request Body:**

```
{
  status*:        string    — the target status
  reason*:        string    — required for SUSPENDED, INACTIVE, ARCHIVED transitions
  returnDate:     string    — YYYY-MM-DD; required when transitioning to ON_LEAVE
  endDate:        string    — YYYY-MM-DD; optional for TEMPORARY_ASSIGNMENT
}
```

**Response:**

```
{
  "success": true,
  "data": {
    "id": string,
    "previousStatus": string,
    "currentStatus": string,
    "changedAt": string (ISO 8601)
  }
}
```

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks the required role for the target status |
| `NOT_FOUND` | 404 | Employee not found |
| `INVALID_STATUS_TRANSITION` | 400 | Transition not permitted by the state machine |
| `ARCHIVED_RECORD` | 409 | Cannot change status of an ARCHIVED employee |
| `MISSING_REASON` | 400 | Reason required but absent |
| `MISSING_RETURN_DATE` | 400 | `returnDate` required for ON_LEAVE transition but absent |

**Business Rules Enforced:** LR-01, LR-02, LR-03, LR-04, LR-05, LR-06, LR-07, LR-08, LR-09, ER-08, ER-09, ER-10

**Side Effects:**
- Creates an `EmployeeHistory` record with the appropriate `changeType`
- Writes an `EMPLOYEE_UPDATED` audit log entry

---

### PATCH /employees/{id}/preferences

**Purpose:** Updates the employee's self-service preferences. Only the fields in `UpdatePreferencesDTO` may be changed through this endpoint.

**Authorization:** Employee must be reading and updating their own record (`userId` matches the JWT identity). No other operator may call this endpoint.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Request Body:** `UpdatePreferencesDTO`

**Response:**

```
{
  "success": true,
  "data": EmployeePreferencesDTO
}
```

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Caller is not the employee themselves |
| `NOT_FOUND` | 404 | Employee not found |
| `VALIDATION_ERROR` | 400 | Invalid language code, unknown time zone, etc. |

**Business Rules Enforced:** ER-07

**Side Effects:**
- Writes an `EMPLOYEE_UPDATED` audit log entry (preferences section only)

---

### GET /employees/{id}/timeline

**Purpose:** Returns the complete chronological history of all changes and transfers for a specific employee, merged into a single descending timeline.

**Authorization:** Requires `employees.view` permission with scope on the employee's unit, or self-access.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `page` | number | No | Page number. Default: `1` |
| `pageSize` | number | No | Results per page. Default: `30`. Maximum: `100` |

**Response:**

```
{
  "success": true,
  "data": {
    "items": (EmployeeHistoryEntryDTO | EmployeeTransferEntryDTO)[],
    "total": number,
    "page": number,
    "pageSize": number,
    "totalPages": number
  }
}
```

Items are sorted by timestamp descending. The `type` field on each item distinguishes `HISTORY_CHANGE` from `TRANSFER`.

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks view scope and is not the employee |
| `NOT_FOUND` | 404 | Employee not found |

**Business Rules Enforced:** ER-02, ER-03, SR-08

**Side Effects:** None

---

### GET /employees/{id}/certifications

**Purpose:** Returns the complete certifications profile with derived statuses for a single employee.

**Authorization:** Requires `employees.view` scope on the employee's unit, or self-access.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Response:**

```
{
  "success": true,
  "data": EmployeeCertificationsDTO
}
```

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks view scope |
| `NOT_FOUND` | 404 | Employee not found |

**Business Rules Enforced:** ER-02, SR-06

---

### PATCH /employees/{id}/certifications

**Purpose:** Updates one or more certification fields on an employee record. Triggers immediate role eligibility re-evaluation.

**Authorization:** Requires Admin role or designated specialist role:
- Medical certifications: Admin or Medical Officer
- Security clearance: Admin or Security Officer
- Combat fitness: Admin or Medical Officer
- Driver license and weapons qualification: Admin or Commander

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The employee's ID |

**Request Body:**

```
{
  driverLicense: {
    class:      string | null
    expiryDate: string | null   — YYYY-MM-DD
  } | null,

  medicalCertification: {
    type:       string | null   — enum value
    expiryDate: string | null   — YYYY-MM-DD
  } | null,

  weaponsQualification: {
    type:              string | null
    qualificationDate: string | null   — YYYY-MM-DD
    expiryDate:        string | null   — YYYY-MM-DD
  } | null,

  securityClearance: {
    level:      string | null   — enum value
    expiryDate: string | null   — YYYY-MM-DD
  } | null,

  combatFitness: {
    classification:     string | null
    classificationDate: string | null   — YYYY-MM-DD
    expiryDate:         string | null   — YYYY-MM-DD
  } | null,

  additionalCertifications: {
    action:     "ADD" | "REMOVE" | "UPDATE"
    id:         string | null   — required for REMOVE and UPDATE
    name:       string | null   — required for ADD and UPDATE
    issueDate:  string | null   — YYYY-MM-DD
    expiryDate: string | null   — YYYY-MM-DD
  }[] | null,

  languageProficiencies: {
    action:     "ADD" | "REMOVE" | "UPDATE"
    language:   string
    level:      string   — enum value
  }[] | null
}
```

All top-level keys are optional. Only the keys provided are updated.

**Response:**

```
{
  "success": true,
  "data": EmployeeCertificationsDTO
}
```

**Error Responses:**

| Code | HTTP | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | Caller lacks the required role for this certification type |
| `NOT_FOUND` | 404 | Employee not found |
| `ARCHIVED_RECORD` | 409 | Employee is ARCHIVED |
| `INVALID_EXPIRY` | 400 | Expiry date is before issue or qualification date (VR-12) |
| `MISSING_EXPIRY` | 400 | Security clearance level set without expiry date (VR-19) |
| `VALIDATION_ERROR` | 400 | Invalid enum value or date format |

**Business Rules Enforced:** VR-12, VR-19, VR-20, ER-08, ER-09, ER-10, ER-12, ER-13

**Side Effects:**
- Creates an `EmployeeHistory` record with `changeType: EMPLOYEE_UPDATED`
- Writes an `EMPLOYEE_UPDATED` audit log entry
- Triggers certification status re-evaluation for the changed certifications
- Triggers role eligibility re-evaluation if a certification has lapsed (SR-06)

---

## Error Code Reference

| Code | HTTP | Meaning |
|---|---|---|
| `FORBIDDEN` | 403 | Operator lacks the required permission or scope |
| `NOT_FOUND` | 404 | Resource does not exist in this tenant |
| `VALIDATION_ERROR` | 400 | One or more request fields fail validation rules |
| `DUPLICATE_EMPLOYEE_NUMBER` | 409 | Employee number is already in use |
| `INVALID_UNIT` | 400 | Referenced unit does not exist or is not accessible |
| `INVALID_COMMANDER` | 400 | Referenced commander is not an active employee |
| `INVALID_STATUS_TRANSITION` | 400 | Status change violates the lifecycle state machine |
| `MISSING_CHANGE_REASON` | 400 | Sensitive status transition requires a reason |
| `MISSING_RETURN_DATE` | 400 | ON_LEAVE transition requires a return date |
| `IMMUTABLE_FIELD` | 409 | Attempt to modify a field that cannot be changed post-activation |
| `ARCHIVED_RECORD` | 409 | The employee is ARCHIVED and cannot be modified |
| `ALREADY_DELETED` | 409 | Employee has already been soft-deleted |
| `INVALID_EXPIRY` | 400 | Expiry date is before the issue or qualification date |
| `MISSING_EXPIRY` | 400 | An expiry date is required for this certification type |
| `SELF_REFERENCE` | 400 | A field references the employee's own record where not permitted |

---

## Authorization Summary

| Endpoint | Minimum Role | Scope |
|---|---|---|
| `GET /employees` | Commander | VIEW on unit |
| `POST /employees` | Commander | MANAGE on target unit |
| `GET /employees/{id}` | Any (view scope) | VIEW on unit or self |
| `PATCH /employees/{id}` | Commander | MANAGE on current unit |
| `DELETE /employees/{id}` | Admin | MANAGE on unit |
| `PATCH /employees/{id}/status` | Commander / Admin | Varies by target status |
| `PATCH /employees/{id}/preferences` | Employee self | Own profile only |
| `GET /employees/{id}/timeline` | Commander | VIEW on unit or self |
| `GET /employees/{id}/certifications` | Commander | VIEW on unit or self |
| `PATCH /employees/{id}/certifications` | Admin / Specialist | By certification type |

---

## Refresh Strategy

| Endpoint | Cache Recommended | Staleness Tolerance |
|---|---|---|
| `GET /employees` (list) | Yes — 30s on client | 30 seconds |
| `GET /employees/{id}` (profile) | Yes — 60s on client | 60 seconds |
| `GET /employees/{id}/timeline` | No — always fresh | None |
| `GET /employees/{id}/certifications` | Yes — 5m on client | 5 minutes (derived statuses change daily) |

Mutation endpoints (`POST`, `PATCH`, `DELETE`) must invalidate cached data for the affected employee on the client after a successful response.
