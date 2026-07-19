# Attendance REST API Design

**Domain:** Attendance  
**Phase:** 13.5 — Attendance API Design  
**Depends on:** attendance-data-contracts.md, attendance-rules.md

---

## 1. Overview

This document specifies the REST API design for the Attendance domain. 

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

### 2.1 GET /attendance

#### Purpose
Queries daily attendance records. Typically used by commanders to load the daily roll call workspace, and by dashboards to load unit aggregates.

#### Permissions Required

| Permission | Scope |
|---|---|
| `attendance.view` | `ORGANIZATION_UNIT` — results are filtered to units within the caller's view scope. |

#### Request Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `unitId` | string (UUID) | Yes | Target organizational unit to query |
| `date` | string (Date) | Yes | Target date in `YYYY-MM-DD` |
| `statusId` | string | No | Filter by specific status code |
| `search` | string | No | Free-text search matching name or employee number |
| `includeDescendants` | boolean | No | If true, includes recursive child unit records. Default: `false` |

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPersonnel": 45,
      "presentCount": 35,
      "absentCount": 1,
      "sickCount": 2,
      "vacationCount": 4,
      "otherCount": 3,
      "unassignedCount": 0,
      "submissionStatus": "SUBMITTED"
    },
    "records": [
      {
        "id": "s8s9s0s1-t2t3-4567-abcd-ef8901234567",
        "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "firstName": "נועה",
        "lastName": "כהן",
        "rank": "סרן",
        "position": "קצינת מבצעים",
        "date": "2026-07-19",
        "statusId": "OFFICE",
        "statusCategory": "AVAILABLE",
        "checkInTime": "07:55",
        "checkOutTime": "17:05",
        "checkInFlag": "ON_TIME",
        "checkOutFlag": "ON_TIME",
        "isOvernight": false,
        "notes": "עבודה במשרד חמ\"ל",
        "lastModifiedAt": "2026-07-19T07:55:00Z",
        "lastModifiedBy": "נועה כהן"
      }
    ]
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks scope on the requested `unitId` |
| 400 | `INVALID_DATE` | Date format is invalid |

---

### 2.2 GET /attendance/{id}

#### Purpose
Retrieves a single attendance record by its unique database identifier.

#### Permissions Required

| Permission | Scope |
|---|---|
| `attendance.view` | `ORGANIZATION_UNIT` — must have view scope on the employee's unit or be the employee themselves. |

#### Response (HTTP 200 OK)

Renders a standard `AttendanceRecordDTO` payload inside the data property.

```json
{
  "success": true,
  "data": {
    "id": "s8s9s0s1-t2t3-4567-abcd-ef8901234567",
    "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "firstName": "נועה",
    "lastName": "כהן",
    "rank": "סרן",
    "position": "קצינת מבצעים",
    "date": "2026-07-19",
    "statusId": "OFFICE",
    "statusCategory": "AVAILABLE",
    "checkInTime": "07:55",
    "checkOutTime": "17:05",
    "checkInFlag": "ON_TIME",
    "checkOutFlag": "ON_TIME",
    "isOvernight": false,
    "notes": "עבודה במשרד חמ\"ל",
    "lastModifiedAt": "2026-07-19T07:55:00Z",
    "lastModifiedBy": "נועה כהן"
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks access to the record's unit and is not the subject employee |
| 404 | `NOT_FOUND` | Record does not exist |

---

### 2.3 POST /attendance/check-in

#### Purpose
Enables an employee to log their check-in for their scheduled shift. Automatically determines compliance flags based on schedule start boundaries (AR-01).

#### Permissions Required
- Authorized user context (authenticated token). Self-service check-in requires no manager scope.

#### Request Body

```json
{
  "latitude": 31.7683,
  "longitude": 35.2137
}
```

*(Coordinates are optional, used to validate geofence constraints if configured by tenant)*

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "recordId": "s8s9s0s1-t2t3-4567-abcd-ef8901234567",
    "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "checkInTime": "07:55",
    "checkInFlag": "ON_TIME",
    "statusId": "PRESENT"
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 400 | `GEOFENCE_VIOLATION` | Coordinates are outside the permitted unit geofence radius (AR-03) |
| 409 | `ALREADY_CHECKED_IN` | Check-in has already been logged for this date |
| 400 | `NO_SCHEDULED_SHIFT` | Employee is not scheduled for a duty shift today |

---

### 2.4 POST /attendance/check-out

#### Purpose
Enables an employee to log their check-out, closing their active shift.

#### Permissions Required
- Authorized user context (authenticated token).

#### Request Body

```json
{
  "latitude": 31.7683,
  "longitude": 35.2137
}
```

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "recordId": "s8s9s0s1-t2t3-4567-abcd-ef8901234567",
    "checkOutTime": "17:05",
    "checkOutFlag": "ON_TIME"
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 409 | `NO_ACTIVE_CHECKIN` | The employee has not checked in today |
| 400 | `GEOFENCE_VIOLATION` | Checkout coordinate is outside geofence boundary |

---

### 2.5 PATCH /attendance/{id}

#### Purpose
Allows a unit commander (or admin) to manually update or correct an employee's daily status. Enforces history rules and requires justification reasons for finalized logs (AR-14).

#### Permissions Required

| Permission | Scope |
|---|---|
| `attendance.manage` | `ORGANIZATION_UNIT` — caller must have manage permissions on the unit containing the employee. |

#### Request Body

Conforms to `AttendanceUpdateDTO`:

```json
{
  "statusId": "SICK",
  "checkInTime": null,
  "checkOutTime": null,
  "notes": "שינוי בעקבות קבלת אישור מחלה רטרואקטיבית",
  "changeReason": "עדכון אישור מחלה (גימלים)"
}
```

#### Response (HTTP 200 OK)

Returns the updated `AttendanceRecordDTO` payload inside the data block.

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks manage scope on the employee's unit |
| 400 | `MISSING_REASON` | Modifying a submitted report without providing a `changeReason` (AR-14) |
| 409 | `LOCKED_PERIOD` | Attempting to update a record older than 30 days without Admin role (AR-13) |
| 400 | `INVALID_STATUS_TRANSITION` | Transition violates state rules defined in the status matrix |

---

### 2.6 GET /attendance/history

#### Purpose
Retrieves a paginated list of historical corrections and manual changes. Used by commanders to track modifications and verify roll call audit logs.

#### Permissions Required

| Permission | Scope |
|---|---|
| `attendance.view` | `ORGANIZATION_UNIT` |

#### Request Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `unitId` | string (UUID) | Yes | Target organizational unit to query history for |
| `startDate` | string (Date) | No | Filter history from `YYYY-MM-DD` |
| `endDate` | string (Date) | No | Filter history to `YYYY-MM-DD` |
| `page` | number | No | Page number. Default: `1` |
| `pageSize` | number | No | Page size limit. Default: `50` |

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "h1h2h3h4-i5i6-7890-abcd-ef1234567890",
        "scheduleId": "s8s9s0s1-t2t3-4567-abcd-ef8901234567",
        "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "date": "2026-07-18",
        "previousStatusId": "UNKNOWN",
        "newStatusId": "SICK",
        "changeReason": "העלאת אישור מחלה רטרואקטיבית (גימלים)",
        "modifiedAt": "2026-07-19T10:15:30Z",
        "modifiedBy": "רס\"ן דוד לוי"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```
