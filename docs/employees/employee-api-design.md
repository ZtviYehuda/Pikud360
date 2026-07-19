# Employee API Design

**Domain:** Employee
**Phase:** 12.8 — Employee API Design
**Depends on:** employee-data-contracts.md, employee-business-rules.md

---

## Overview

This document defines the REST API surface for the Employee domain. It covers every CRUD endpoint, its responsibilities, the DTOs it consumes and produces, the permissions it enforces, and the errors it may return.

### Base URL

```
/api/v1
```

### Standard Response Envelope

Every endpoint returns the system-standard `ApiResponse` wrapper.

**Success:**
```json
{
  "success": true,
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": [ ]
  }
}
```

### Authentication

All endpoints require a valid JWT in the `Authorization: Bearer <token>` header.
The token carries `user_id`, `tenant_id`, and permission claims.
Requests without a valid token receive `401 Unauthorized` before any business logic runs.

### Permission Model

| Permission | Meaning |
|---|---|
| `employees.view` | Read employee records in accessible units |
| `employees.manage` | Create, update, and delete employees in manageable units |
| `employees.status` | Change employment status (subset of manage) |

Scope is evaluated per unit. An operator with `manage` scope on Unit A has no access to Unit B.

---

## Endpoint Reference

---

## GET /employees

### Purpose

Returns a paginated, filtered list of employees scoped to the units the operator can view. The operator never receives employees outside their scope regardless of query parameters.

### Permissions

| Permission | Scope |
|---|---|
| `employees.view` | `ORGANIZATION_UNIT` |

### Request

No request body. All parameters are query string.

**Using `EmployeeSearchDTO` as query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `unitId` | UUID string | — | Restrict to a specific unit |
| `includeDescendants` | boolean | `false` | Include all child units when `unitId` is set |
| `status` | string (comma-separated) | `ACTIVE` | Filter by employment status |
| `serviceType` | string (comma-separated) | — | Filter by service type |
| `search` | string | — | Free-text across first name, last name, employee number |
| `certificationHealth` | string (comma-separated) | — | Filter by certification health status |
| `hasCommandRole` | boolean | — | `true` returns only command-capable employees |
| `operationalRole` | string | — | Filter by operational role |
| `page` | number | `1` | Page number |
| `pageSize` | number | `50` | Per page (max 200) |
| `sortBy` | string | `lastName` | `lastName` \| `rank` \| `employeeNumber` \| `startDate` \| `status` \| `yearsOfService` |
| `sortOrder` | string | `asc` | `asc` \| `desc` |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "data": {
    "items": [ "EmployeeSummaryDTO" ],
    "total": 87,
    "page": 1,
    "pageSize": 50,
    "totalPages": 2
  }
}
```

Each item in `items` conforms to `EmployeeSummaryDTO`.

### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired JWT |
| 403 | `FORBIDDEN` | Operator lacks `employees.view` permission |
| 400 | `INVALID_UNIT` | `unitId` is outside the operator's scope |
| 400 | `VALIDATION_ERROR` | Invalid query parameter values (bad enum, negative page, etc.) |

### Notes

- DRAFT employees are excluded unless `status=DRAFT` is explicitly requested, and only Admin operators may filter by `DRAFT`.
- When no `unitId` is provided, results span all units within the operator's view scope.
- Results are always tenant-isolated — cross-tenant access is structurally impossible.

---

## GET /employees/{id}

### Purpose

Returns the full profile of a single employee identified by their UUID. Field visibility is adjusted based on the operator's role — sensitive fields are masked or omitted for lower-privileged roles.

### Permissions

| Condition | Permission Required |
|---|---|
| Operator reading another employee | `employees.view` with scope on the employee's unit |
| Operator reading their own profile | No special scope required — self-access is always permitted |

### Request

| Location | Parameter | Type | Required | Description |
|---|---|---|---|---|
| Path | `id` | UUID string | Yes | The employee's unique identifier |

No request body.

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "data": "EmployeeDetailsDTO"
}
```

Response conforms to `EmployeeDetailsDTO`.

**Field masking applied by role:**

| Field | Non-privileged | Commander | Admin |
|---|---|---|---|
| `dateOfBirth` | `"****-**-**"` | `"****-**-**"` | Full value |
| `personalPhone` | `"***-***-****"` | Full value | Full value |
| `personalEmail` | `"***@***.***"` | Full value | Full value |
| `nationalId` | Omitted | Omitted | Full value |
| `emergencyContact` | Omitted | Full value | Full value |
| `preferences` | Omitted | Omitted | Omitted (self only) |
| `certifications.securityClearance.level` | Omitted | Full value | Full value |

### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired JWT |
| 403 | `FORBIDDEN` | Operator lacks view scope and is not the employee |
| 404 | `NOT_FOUND` | No employee with this ID exists in this tenant |

### Notes

- Every successful read writes an `EMPLOYEE_VIEWED` audit log entry.
- Soft-deleted employees (`deletedAt IS NOT NULL`) return 404 for all non-Admin operators. Admin operators receive the full record with a `deletedAt` timestamp.
- The `preferences` block is only present in the response when the operator is reading their own profile.

---

## POST /employees

### Purpose

Creates a new employee record. The record begins in `DRAFT` status by default and must be explicitly activated (via `PATCH /employees/{id}/status`) unless `status: "ACTIVE"` is provided in the request body and all required fields for activation are present.

### Permissions

| Permission | Scope |
|---|---|
| `employees.manage` | `ORGANIZATION_UNIT` — operator must have manage scope on the target `orgUnitId` |

### Request

**Content-Type:** `application/json`

Body conforms to `EmployeeCreateDTO`.

**Required fields in the body:**

| Field | Type |
|---|---|
| `orgUnitId` | UUID string |
| `employeeNumber` | string |
| `firstName` | string |
| `lastName` | string |
| `dateOfBirth` | string (YYYY-MM-DD) |
| `rank` | string |
| `position` | string |
| `serviceType` | string (enum) |
| `startDate` | string (YYYY-MM-DD) |

All other fields from `EmployeeCreateDTO` are optional.

### Response

**HTTP 201 Created**

```json
{
  "success": true,
  "data": "EmployeeDetailsDTO"
}
```

Response is the full `EmployeeDetailsDTO` of the newly created employee.

### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired JWT |
| 403 | `FORBIDDEN` | Operator lacks manage scope on the target unit |
| 400 | `VALIDATION_ERROR` | One or more required fields are missing or fail validation. `details` array lists all field-level failures. |
| 409 | `DUPLICATE_EMPLOYEE_NUMBER` | The employee number already exists in this tenant |
| 400 | `INVALID_UNIT` | `orgUnitId` does not exist or is inactive |
| 400 | `INVALID_COMMANDER` | `commanderId` does not reference an active employee in this tenant |
| 400 | `INVALID_DATE` | `dateOfBirth` or `startDate` fails format or range rules |

### Notes

- After a successful creation, an `EmployeeHistory` record with `changeType: EMPLOYEE_CREATED` is written before the response is returned.
- An `EMPLOYEE_CREATED` audit log entry is also written.
- If the employee is created directly as `ACTIVE`, all VR-01 required fields are validated before the record is committed.

---

## PUT /employees/{id}

### Purpose

Replaces the updatable fields of an existing employee record. The caller provides all fields they intend to have set — fields not present in the body are treated as intentional nullifications (where the field is nullable) or are left unchanged (where the field is required).

Unlike `PATCH`, `PUT` signals an intentional full replacement of the editable profile. Non-editable fields (id, tenant, employee number post-activation, date of birth post-activation, audit timestamps) are never replaced by this endpoint regardless of what is sent.

### Permissions

| Condition | Permission |
|---|---|
| Standard profile update | `employees.manage` — scope on the employee's current unit |
| Unit change (transfer) | `employees.manage` — scope on both source and target unit |
| Sensitive field update | Admin role required (in addition to manage scope) |

### Request

**Content-Type:** `application/json`

| Location | Parameter | Type | Required |
|---|---|---|---|
| Path | `id` | UUID string | Yes |

Body conforms to `EmployeeUpdateDTO`. All fields in the body are optional — only fields included are processed.

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "data": "EmployeeDetailsDTO"
}
```

Response is the updated `EmployeeDetailsDTO`.

### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired JWT |
| 403 | `FORBIDDEN` | Operator lacks manage scope on the employee's current unit |
| 403 | `FORBIDDEN` | Transfer attempted without manage scope on the target unit |
| 404 | `NOT_FOUND` | Employee does not exist in this tenant |
| 409 | `ARCHIVED_RECORD` | Employee is `ARCHIVED` — record is fully read-only |
| 409 | `IMMUTABLE_FIELD` | Attempt to change `employeeNumber` or `dateOfBirth` post-activation without admin authorization |
| 400 | `VALIDATION_ERROR` | Any field fails its validation rule. `details` lists all failures. |
| 400 | `INVALID_COMMANDER` | `commanderId` does not reference an active employee |
| 400 | `INVALID_STATUS_TRANSITION` | `status` field violates the lifecycle state machine — use `PATCH /employees/{id}/status` instead |
| 400 | `MISSING_CHANGE_REASON` | A sensitive field was changed without a `changeReason` |
| 400 | `INCONSISTENT_STATE` | Update would leave the record in a logically invalid state (e.g., temporary assignment without a unit) |

### Notes

- Every successful update writes an `EmployeeHistory` record before returning. The `changeType` is `EMPLOYEE_UPDATED` for profile changes and `EMPLOYEE_TRANSFERRED` when `orgUnitId` changes.
- An `EMPLOYEE_UPDATED` audit log entry is written for every successful call, even if no values effectively changed.
- Certification field changes trigger an immediate re-evaluation of role eligibility.
- Status transitions must use the dedicated `PATCH /employees/{id}/status` endpoint. Sending a `status` field in the body of this endpoint is rejected to prevent bypassing lifecycle enforcement.

---

## PATCH /employees/{id}/status

### Purpose

Changes the Employment Status of an employee. This endpoint enforces the lifecycle state machine strictly. Every permitted transition is documented; all others are rejected.

This endpoint is separate from `PUT /employees/{id}` because status transitions have distinct authorization rules, mandatory conditional inputs, and produce specifically typed history events that carry legal and operational significance.

### Permissions

| Target Status | Required Role |
|---|---|
| `ACTIVE` | Commander or Admin (manage scope) |
| `ON_LEAVE` | Commander or Admin (manage scope) |
| `TEMPORARY_ASSIGNMENT` | Commander or Admin (manage scope) |
| `SUSPENDED` | Admin only |
| `INACTIVE` | Admin only |
| `ARCHIVED` | Admin only |

### Request

**Content-Type:** `application/json`

| Location | Parameter | Type | Required |
|---|---|---|---|
| Path | `id` | UUID string | Yes |

Body conforms to `EmployeeStatusDTO`:

| Field | Type | Required |
|---|---|---|
| `status` | string (enum) | **Always required** |
| `reason` | string | Required when target is `SUSPENDED`, `INACTIVE`, or `ARCHIVED` |
| `returnDate` | string (YYYY-MM-DD) | Required when target is `ON_LEAVE` |
| `endDate` | string (YYYY-MM-DD) | Optional when target is `TEMPORARY_ASSIGNMENT` |

### Permitted Transitions

| From | Permitted To |
|---|---|
| `DRAFT` | `ACTIVE`, `ARCHIVED` |
| `ACTIVE` | `ON_LEAVE`, `TEMPORARY_ASSIGNMENT`, `SUSPENDED`, `INACTIVE`, `ARCHIVED` |
| `ON_LEAVE` | `ACTIVE`, `INACTIVE` |
| `TEMPORARY_ASSIGNMENT` | `ACTIVE` |
| `SUSPENDED` | `ACTIVE`, `INACTIVE` |
| `INACTIVE` | `ACTIVE`, `ARCHIVED` |
| `ARCHIVED` | **None — terminal state** |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "previousStatus": "ACTIVE",
    "currentStatus": "ON_LEAVE",
    "changedAt": "2026-07-19T10:30:00Z"
  }
}
```

### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired JWT |
| 403 | `FORBIDDEN` | Caller lacks the required role for the target status |
| 404 | `NOT_FOUND` | Employee does not exist in this tenant |
| 409 | `ARCHIVED_RECORD` | Employee is already `ARCHIVED` — no transitions permitted |
| 400 | `INVALID_STATUS_TRANSITION` | The target status is not reachable from the current status |
| 400 | `MISSING_REASON` | Transition to `SUSPENDED`, `INACTIVE`, or `ARCHIVED` without a `reason` |
| 400 | `MISSING_RETURN_DATE` | Transition to `ON_LEAVE` without a `returnDate` |
| 400 | `INVALID_DATE` | `returnDate` or `endDate` fails format or logic validation |

### Notes

- Every successful transition writes an `EmployeeHistory` record before returning. The `changeType` maps to the transition:
  - `ACTIVE` → `EmployeeActivated`
  - `ON_LEAVE` → `EmployeeOnLeaveStarted`
  - `SUSPENDED` → `EmployeeSuspended`
  - `INACTIVE` → `EmployeeDeactivated`
  - `ARCHIVED` → `EmployeeArchived`
- The reason provided is stored in the history record's `changeReason` field.
- If the history write fails for any reason, the status change is rolled back and a 500 is returned.

---

## DELETE /employees/{id}

### Purpose

Soft-deletes an employee record by setting its `deletedAt` timestamp to the current moment. The record is retained permanently in the database for audit, history, and compliance purposes. Hard deletion is not supported.

This action is irreversible without Admin intervention. It is functionally equivalent to transitioning the employee to `ARCHIVED` — after deletion the record is excluded from all operational queries.

### Permissions

| Permission | Scope |
|---|---|
| `employees.manage` | ORGANIZATION_UNIT — manage scope on the employee's unit |
| Admin role | Required in addition to manage scope |

### Request

**Content-Type:** `application/json`

| Location | Parameter | Type | Required |
|---|---|---|---|
| Path | `id` | UUID string | Yes |

Body:

| Field | Type | Required | Validation |
|---|---|---|---|
| `reason` | string | **Yes** | Minimum 5 characters |

### Response

**HTTP 200 OK**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "deletedAt": "2026-07-19T10:45:00Z"
  }
}
```

### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired JWT |
| 403 | `FORBIDDEN` | Operator lacks manage scope or does not hold the Admin role |
| 404 | `NOT_FOUND` | Employee does not exist in this tenant |
| 409 | `ALREADY_DELETED` | Employee has already been soft-deleted |
| 400 | `MISSING_REASON` | `reason` field is absent or too short |

### Notes

- An `EmployeeHistory` record with `changeType: EMPLOYEE_DELETED` is written before the response is returned.
- An `EMPLOYEE_DELETED` audit log entry is also written.
- All existing scheduling records, transfer records, and history entries that reference this employee are preserved and remain queryable.
- After deletion, `GET /employees/{id}` returns `404` for all non-Admin operators. Admin operators receive the record with `deletedAt` populated.
- The employee's `status` is set to `INACTIVE` as part of the soft-delete operation if not already in a terminal state.

---

## Quick Reference

| Method | Path | Auth | Request DTO | Response DTO | Status |
|---|---|---|---|---|---|
| `GET` | `/employees` | `employees.view` | `EmployeeSearchDTO` (query params) | `EmployeeSummaryDTO[]` (paginated) | 200 |
| `GET` | `/employees/{id}` | `employees.view` or self | — | `EmployeeDetailsDTO` | 200 |
| `POST` | `/employees` | `employees.manage` | `EmployeeCreateDTO` | `EmployeeDetailsDTO` | 201 |
| `PUT` | `/employees/{id}` | `employees.manage` | `EmployeeUpdateDTO` | `EmployeeDetailsDTO` | 200 |
| `PATCH` | `/employees/{id}/status` | Varies by target | `EmployeeStatusDTO` | Status change confirmation | 200 |
| `DELETE` | `/employees/{id}` | `employees.manage` + Admin | `{ reason }` | `{ id, deletedAt }` | 200 |

---

## Error Code Reference

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | No valid JWT token |
| `FORBIDDEN` | 403 | Valid token but insufficient permission or scope |
| `NOT_FOUND` | 404 | Resource not found in this tenant |
| `VALIDATION_ERROR` | 400 | One or more fields fail validation; see `details` |
| `DUPLICATE_EMPLOYEE_NUMBER` | 409 | Employee number already in use in this tenant |
| `INVALID_UNIT` | 400 | Unit does not exist, is inactive, or is out of scope |
| `INVALID_COMMANDER` | 400 | Commander reference is not an active employee |
| `INVALID_DATE` | 400 | Date fails format, range, or ordering rule |
| `INVALID_STATUS_TRANSITION` | 400 | Target status not reachable from current status |
| `MISSING_REASON` | 400 | Reason required for this operation but not provided |
| `MISSING_RETURN_DATE` | 400 | `returnDate` required for ON_LEAVE transition |
| `IMMUTABLE_FIELD` | 409 | Field cannot be changed after activation |
| `ARCHIVED_RECORD` | 409 | Record is ARCHIVED and fully read-only |
| `ALREADY_DELETED` | 409 | Record has already been soft-deleted |
| `INCONSISTENT_STATE` | 400 | Update would produce a logically invalid record |
