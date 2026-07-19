# Shift REST API Design

**Domain:** Shift Management  
**Phase:** 14.5 — Shift API Design  
**Depends on:** shift-data-contracts.md, scheduling-rules.md

---

## 1. Overview

This document specifies the REST API surface for the Shift Management and Scheduling domain. 

All endpoints carry the base prefix `/api/v1` and are wrapped in the standard `ApiResponse` envelope.

### Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of the error",
    "details": []
  }
}
```

---

## 2. Endpoints Reference

---

### 2.1 GET /shifts

#### Purpose
Queries the structural shift templates configured for a specific organizational unit. Used in settings and schedule generation screens.

#### Permissions Required

| Permission | Scope |
|---|---|
| `shifts.view` | `ORGANIZATION_UNIT` — results are filtered to units within the caller's view scope. |

#### Request Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `unitId` | string (UUID) | Yes | Target organizational unit |
| `includeInactive` | boolean | No | If true, returns suspended templates. Default: `false` |

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "t1t2t3t4-u5u6-7890-abcd-ef1234567890",
      "name": "משמרת לילה חמ\"ל",
      "startTime": "23:00:00",
      "endTime": "07:00:00",
      "durationHours": 8.0,
      "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
      "isActive": true,
      "requirements": [
        {
          "role": "COMMANDER",
          "count": 1,
          "qualifications": ["SECURITY_CLEARANCE_SECRET"]
        },
        {
          "role": "GUARD",
          "count": 2,
          "qualifications": ["WEAPONS_QUALIFIED"]
        }
      ]
    }
  ]
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks scope on the requested `unitId` |

---

### 2.2 GET /shifts/{id}

#### Purpose
Retrieves a specific structural shift template by its unique template ID.

#### Permissions Required

| Permission | Scope |
|---|---|
| `shifts.view` | `ORGANIZATION_UNIT` — must have view scope on the template's owner unit. |

#### Response (HTTP 200 OK)

Renders a standard `ShiftDTO` payload inside the data property.

```json
{
  "success": true,
  "data": {
    "id": "t1t2t3t4-u5u6-7890-abcd-ef1234567890",
    "name": "משמרת לילה חמ\"ל",
    "startTime": "23:00:00",
    "endTime": "07:00:00",
    "durationHours": 8.0,
    "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "isActive": true,
    "requirements": [
      {
        "role": "COMMANDER",
        "count": 1,
        "qualifications": ["SECURITY_CLEARANCE_SECRET"]
      }
    ]
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks access to the template's unit |
| 404 | `NOT_FOUND` | Shift template does not exist |

---

### 2.3 POST /shifts

#### Purpose
Creates a new structural shift template with its associated slot requirements.

#### Permissions Required

| Permission | Scope |
|---|---|
| `shifts.manage` | `ORGANIZATION_UNIT` — caller must have manage scope on the `unitId` specified in the body. |

#### Request Body

Conforms to `ShiftDTO` (omitting the `id` field, which is generated server-side).

```json
{
  "name": "בוקר פטרול",
  "startTime": "08:00:00",
  "endTime": "16:00:00",
  "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "isActive": true,
  "requirements": [
    {
      "role": "DRIVER",
      "count": 1,
      "qualifications": ["DRIVER_LICENSE_C1"]
    }
  ]
}
```

#### Response (HTTP 201 Created)

Returns the fully created `ShiftDTO` including its server-generated ID.

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks manage scope on the target unit |
| 400 | `VALIDATION_ERROR` | Shift duration exceeds 24h, slots count is 0, or time format is invalid (BR-S02, BR-S03, BR-S06) |

---

### 2.4 PUT /shifts/{id}

#### Purpose
Updates the structural details (name, times, slot requirements) of an existing shift template.

#### Permissions Required

| Permission | Scope |
|---|---|
| `shifts.manage` | `ORGANIZATION_UNIT` |

#### Request Body

Conforms to `ShiftDTO` (excluding `id` and `unitId` which are immutable).

#### Response (HTTP 200 OK)

Returns the updated `ShiftDTO` payload.

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks manage scope on the unit |
| 404 | `NOT_FOUND` | Shift template does not exist |
| 400 | `VALIDATION_ERROR` | Validation constraints violated |

---

### 2.5 DELETE /shifts/{id}

#### Purpose
Soft-deletes a shift template by setting its `deleted_at` timestamp. Historical calendar instances referencing this template ID remain intact (BR-S07).

#### Permissions Required

| Permission | Scope |
|---|---|
| `shifts.manage` | `ORGANIZATION_UNIT` |

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": "t1t2t3t4-u5u6-7890-abcd-ef1234567890",
    "deletedAt": "2026-07-19T14:48:00Z"
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks manage scope |
| 404 | `NOT_FOUND` | Template not found |

---

### 2.6 POST /shifts/{id}/assign

#### Purpose
Assigns an employee to a specific role slot in a shift instance on a target calendar date. Triggers scheduling constraint validation (rest buffers, maximum hours, consecutive limits).

#### Permissions Required

| Permission | Scope |
|---|---|
| `scheduling.manage` | `ORGANIZATION_UNIT` — must have write scope on the target unit. |

#### Request Body

```json
{
  "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
  "date": "2026-07-20",
  "roleKey": "GUARD",
  "overrideReason": "צורך מבצעי דחוף — מחסור בכוח אדם עקב ימי מחלה",
  "notes": "שיבוץ שמירה מיוחד"
}
```

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "assignment": "ShiftAssignmentDTO",
    "validation": {
      "hasWarnings": false,
      "warnings": []
    }
  }
}
```

*(`assignment` returns the fully populated `ShiftAssignmentDTO`)*

#### Possible Errors (Enforcing Scheduling Rules)

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks manage scope on the unit |
| 400 | `HARD_CONSTRAINT_VIOLATION` | Assignment violates a Hard Block rule (e.g. daily limit SR-01, rest buffer SR-04, night limit SR-06). Request is blocked. |
| 400 | `SOFT_CONSTRAINT_VIOLATION` | Assignment violates a Soft Block rule (e.g. weekly limit SR-02, weekend rotation SR-08) and `overrideReason` was **not** provided. |
| 409 | `SLOT_ALREADY_FILLED` | The requested shift slot is already occupied |
| 404 | `EMPLOYEE_NOT_FOUND` | The employee does not exist or is inactive/archived |
