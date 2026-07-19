# Shift Data Contracts

**Domain:** Shift Management  
**Phase:** 14.4 — Shift Data Contracts  
**Depends on:** shift-domain.md, shift-types.md, scheduling-rules.md

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) used to communicate shift templates, calendar assignments, and capacity roll-ups between the frontend React application and backend services.

All payloads use `camelCase` field names and ISO 8601 formatting conventions.

---

## 2. DTO Catalog

---

### 2.1 ShiftDTO

#### Purpose
Defines the structural blueprint (template) of a shift type and its staffing slots. Used to list configured shift structures in the settings page or to load template options when generating weekly schedules.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Unique identifier of the shift template |
| `name` | string | Yes | Display name of the shift (e.g. "משמרת לילה חמ\"ל") |
| `startTime` | string (Time) | Yes | Start time in `HH:mm:ss` format |
| `endTime` | string (Time) | Yes | End time in `HH:mm:ss` format |
| `durationHours` | number | Yes | Calculated duration (decimal hours) |
| `unitId` | string (UUID) | Yes | Owner organizational unit ID |
| `isActive` | boolean | Yes | True if the template is available for active scheduling |
| `requirements` | object[] | Yes | Array of staffing slot requirements |
| `requirements[].role` | string | Yes | Roster role key (e.g. `COMMANDER`, `GUARD`, `DRIVER`) |
| `requirements[].count` | number | Yes | Number of personnel required for this role |
| `requirements[].qualifications`| string[] | No | List of required certification tags (e.g. `["WEAPONS_QUALIFIED"]`) |

#### Example Payload

```json
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
```

---

### 2.2 ShiftAssignmentDTO

#### Purpose
Represents a concrete binding of an employee to a specific slot within a shift instance on a target calendar date.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Unique identifier of the assignment record |
| `date` | string (Date) | Yes | Calendar date in `YYYY-MM-DD` |
| `shiftTypeId` | string (UUID) | Yes | Reference to the structural Shift DTO ID |
| `shiftName` | string | Yes | Display name of the shift |
| `startTime` | string (Time) | Yes | Actual start time `HH:mm` |
| `endTime` | string (Time) | Yes | Actual end time `HH:mm` |
| `employeeId` | string (UUID) | Yes | Unique identifier of the assigned employee |
| `firstName` | string | Yes | Employee first name |
| `lastName` | string | Yes | Employee last name |
| `rank` | string | Yes | Employee rank |
| `position` | string | Yes | Employee position title |
| `roleKey` | string | Yes | Staffing role assigned (e.g. `GUARD`) |
| `status` | string | Yes | Assignment state: `CONFIRMED` \| `PENDING_OVERRIDE` \| `DRAFT` |
| `overrideReason` | string | No | Justification text provided if a Soft Block constraint was bypassed |

#### Example Payload

```json
{
  "id": "a5a6a7a8-b9b0-1234-cdef-ab1234567890",
  "date": "2026-07-20",
  "shiftTypeId": "t1t2t3t4-u5u6-7890-abcd-ef1234567890",
  "shiftName": "משמרת לילה חמ\"ל",
  "startTime": "23:00",
  "endTime": "07:00",
  "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
  "firstName": "יוסי",
  "lastName": "לוי",
  "rank": "סמל",
  "position": "לוחם",
  "roleKey": "GUARD",
  "status": "CONFIRMED",
  "overrideReason": null
}
```

---

### 2.3 ShiftSummaryDTO

#### Purpose
Provides aggregated metrics tracking slot coverage and capacity alerts for a unit on a given date. Used to render calendar day cards and warning notifications.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | string (Date) | Yes | Calendar date in `YYYY-MM-DD` |
| `unitId` | string (UUID) | Yes | Target organizational unit ID |
| `totalShifts` | number | Yes | Total shift instances scheduled on this date |
| `totalSlotsRequired`| number | Yes | Total personnel slots needed across all shifts |
| `slotsFilled` | number | Yes | Total slots with assigned personnel |
| `slotsUnfilled` | number | Yes | Count of empty slots requiring staffing |
| `coveragePercentage`| number | Yes | Percentage of filled slots (`(slotsFilled / required) * 100`) |
| `overcapacityCount` | number | Yes | Count of assignments exceeding standard hours limits |
| `warnings` | string[] | Yes | Array of operational warnings (e.g. "Rest buffer violation: Yossi Levi") |

#### Example Payload

```json
{
  "date": "2026-07-20",
  "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "totalShifts": 3,
  "totalSlotsRequired": 9,
  "slotsFilled": 8,
  "slotsUnfilled": 1,
  "coveragePercentage": 88.8,
  "overcapacityCount": 0,
  "warnings": [
    "מחסור בכוח אדם: משמרת לילה חמ\"ל דורשת שומר נוסף"
  ]
}
```

---

### 2.4 ShiftCalendarDTO

#### Purpose
The primary dataset used to populate the main weekly and monthly scheduling grid boards. Consists of a list of days, each wrapping scheduled shift instances and their assignments.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `startDate` | string (Date) | Yes | Calendar start date of the dataset range |
| `endDate` | string (Date) | Yes | Calendar end date of the dataset range |
| `unitId` | string (UUID) | Yes | Target organizational unit ID |
| `days` | object[] | Yes | Array of daily schedule sets |
| `days[].date` | string (Date) | Yes | Date in `YYYY-MM-DD` |
| `days[].shifts` | object[] | Yes | Shift instances active on this day |
| `days[].shifts[].id` | string (UUID) | Yes | Shift instance ID |
| `days[].shifts[].name` | string | Yes | Shift display name |
| `days[].shifts[].startTime` | string (Time) | Yes | `HH:mm` |
| `days[].shifts[].endTime` | string (Time) | Yes | `HH:mm` |
| `days[].shifts[].assignments` | object[] | Yes | Array of `ShiftAssignmentDTO` elements |

#### Example Payload

```json
{
  "startDate": "2026-07-20",
  "endDate": "2026-07-21",
  "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "days": [
    {
      "date": "2026-07-20",
      "shifts": [
        {
          "id": "s1s2s3s4-t5t6-7890-abcd-ef1234567890",
          "name": "משמרת לילה חמ\"ל",
          "startTime": "23:00",
          "endTime": "07:00",
          "assignments": [
            {
              "id": "a5a6a7a8-b9b0-1234-cdef-ab1234567890",
              "date": "2026-07-20",
              "shiftTypeId": "t1t2t3t4-u5u6-7890-abcd-ef1234567890",
              "shiftName": "משמרת לילה חמ\"ל",
              "startTime": "23:00",
              "endTime": "07:00",
              "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
              "firstName": "יוסי",
              "lastName": "לוי",
              "rank": "סמל",
              "position": "לוחם",
              "roleKey": "GUARD",
              "status": "CONFIRMED",
              "overrideReason": null
            }
          ]
        }
      ]
    }
  ]
}
```
