# Attendance Data Contracts

**Domain:** Attendance  
**Phase:** 13.4 — Attendance Data Contracts  
**Depends on:** attendance-domain.md, attendance-statuses.md

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) used to exchange attendance data between the frontend React application and the backend Flask services.

All contracts are represented in JSON structure and enforce:
- Naming convention: `camelCase`
- Time formatting: ISO 8601 strings (`YYYY-MM-DDTHH:mm:ssZ`) or time-only strings (`HH:mm`) where applicable.
- Date formatting: `"YYYY-MM-DD"` string.
- Multitenancy isolation: Handled implicitly at the request boundary (via JWT tenant claim) — the tenant identifier is omitted from these payloads to prevent tampering.

---

## 2. DTO Catalog

---

### 2.1 AttendanceSummaryDTO

#### Purpose
Used to populate dashboard widgets, the organization tree overview, and high-level readiness summaries. It provides daily roll-up metrics for a specific organizational unit on a target calendar date.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `unitId` | string (UUID) | Yes | Unique identifier of the organizational unit |
| `unitName` | string | Yes | Display name of the unit |
| `date` | string (Date) | Yes | Calendar date in `YYYY-MM-DD` |
| `totalPersonnel` | number | Yes | Total active personnel in the unit |
| `presentCount` | number | Yes | Count of available employees on-site (`Present` + `Office` + `Field`) |
| `absentCount` | number | Yes | Count of unauthorized absences (`Absent`) |
| `sickCount` | number | Yes | Count of employees on medical leave (`Sick Leave`) |
| `vacationCount` | number | Yes | Count of employees on annual leave (`Vacation`) |
| `otherCount` | number | Yes | Count of employees in `Training`, `Remote`, or `Business Trip` |
| `unassignedCount` | number | Yes | Count of employees remaining in `Unknown` state |
| `submissionStatus` | string | Yes | Submission workflow state: `DRAFT` \| `SUBMITTED` \| `OVERDUE` |
| `submittedAt` | string (DateTime) | No | Timestamp when the report was confirmed |
| `submittedBy` | string | No | Full name of the commander who submitted the report |

#### Example Payload

```json
{
  "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "unitName": "פלוגה א' — גדוד 51",
  "date": "2026-07-19",
  "totalPersonnel": 45,
  "presentCount": 35,
  "absentCount": 1,
  "sickCount": 2,
  "vacationCount": 4,
  "otherCount": 3,
  "unassignedCount": 0,
  "submissionStatus": "SUBMITTED",
  "submittedAt": "2026-07-19T08:45:12Z",
  "submittedBy": "רס\"ן דוד לוי"
}
```

---

### 2.2 AttendanceRecordDTO

#### Purpose
Represents the detailed daily status entry of an individual employee. Used to display row values in the daily attendance workspace and the status panel in the employee profile.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Unique identifier of the attendance record |
| `employeeId` | string (UUID) | Yes | Unique identifier of the employee |
| `firstName` | string | Yes | First name of the employee (from profile) |
| `lastName` | string | Yes | Last name of the employee (from profile) |
| `rank` | string | Yes | Current rank of the employee (from profile) |
| `position` | string | Yes | Position title (from profile) |
| `date` | string (Date) | Yes | Calendar date in `YYYY-MM-DD` |
| `statusId` | string | Yes | The active status code (e.g. `PRESENT`, `SICK`, `VACATION`) |
| `statusCategory` | string | Yes | Unified availability category: `AVAILABLE` \| `UNAVAILABLE` \| `UNREPORTED` |
| `checkInTime` | string (Time) | No | Time checked in (`HH:mm`), or null if not checked in |
| `checkOutTime` | string (Time) | No | Time checked out (`HH:mm`), or null |
| `checkInFlag` | string | No | Compliance flag: `ON_TIME` \| `LATE` \| `EARLY` \| null |
| `checkOutFlag` | string | No | Compliance flag: `ON_TIME` \| `EARLY_DEPARTURE` \| `AUTO_CLOSED` \| null |
| `isOvernight` | boolean | Yes | True if the shift crosses the midnight boundary |
| `notes` | string | No | Optional notes or justification text |
| `lastModifiedAt` | string (DateTime) | Yes | Time when the record was last changed |
| `lastModifiedBy` | string | Yes | Full name of the operator who made the change |

#### Example Payload

```json
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
  "lastModifiedBy": "נועה כהן (Check-In)"
}
```

---

### 2.3 AttendanceHistoryDTO

#### Purpose
Represents a change log entry for manual adjustments. Returned in historical audit timelines.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Unique identifier of the history log entry |
| `scheduleId` | string (UUID) | Yes | Reference to the primary attendance record ID |
| `employeeId` | string (UUID) | Yes | Reference to the employee ID |
| `date` | string (Date) | Yes | Calendar date of the corrected record (`YYYY-MM-DD`) |
| `previousStatusId` | string | Yes | Status ID before the correction |
| `newStatusId` | string | Yes | Status ID after the correction |
| `changeReason` | string | Yes | Explanatory note or category justifying the manual update |
| `modifiedAt` | string (DateTime) | Yes | Timestamp when the update was recorded |
| `modifiedBy` | string | Yes | Username of the operator who executed the change |

#### Example Payload

```json
{
  "id": "h1h2h3h4-i5i6-7890-abcd-ef1234567890",
  "scheduleId": "s8s9s0s1-t2t3-4567-abcd-ef8901234567",
  "employeeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2026-07-18",
  "previousStatusId": "UNKNOWN",
  "newStatusId": "SICK",
  "changeReason": "העלאת אישור מחלה רטרואקטיבית (גימלים) — אושר על ידי מפקד",
  "modifiedAt": "2026-07-19T10:15:30Z",
  "modifiedBy": "רס\"ן דוד לוי"
}
```

---

### 2.4 AttendanceUpdateDTO

#### Purpose
The request payload sent by the client when a commander updates an employee's daily status or submits a manual correction. Enforces rules regarding reasons for modifying submitted entries (AR-14).

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `statusId` | string | Yes | The target status code to set |
| `checkInTime` | string (Time) | No | Manual override check-in time (`HH:mm`) |
| `checkOutTime` | string (Time) | No | Manual override check-out time (`HH:mm`) |
| `notes` | string | No | Explanatory text for the daily entry |
| `changeReason` | string | No | Mandatory reason when editing a finalized or submitted record |

#### Example Payload — Standard Reporting

```json
{
  "statusId": "VACATION",
  "notes": "אישור חופשה שנתית מאושרת מראש"
}
```

#### Example Payload — Retroactive Correction (Submitted Record)

```json
{
  "statusId": "SICK",
  "changeReason": "תיקון נוכחות: עודכן אישור מחלה עבור אתמול"
}
```
