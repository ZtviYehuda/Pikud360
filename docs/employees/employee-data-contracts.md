# Employee Data Contracts

**Domain:** Employee
**Phase:** 12.7 — Employee Data Contracts
**Complements:** employee-dtos.md (full type definitions), employee-api-contracts.md (endpoint specs)

---

## Overview

This document defines the six primary data contracts used between the backend and frontend for the Employee domain. Each contract is implementation-ready: it specifies purpose, required fields, optional fields, field types, and a complete example payload.

### Naming Conventions

- Field names: `camelCase`
- Dates: `"YYYY-MM-DD"` string
- Timestamps: ISO 8601 string `"YYYY-MM-DDTHH:mm:ssZ"`
- IDs: UUID string
- Enums: `UPPER_SNAKE_CASE` string
- Absent optional fields: `null`
- Omitted-by-role fields: field not present in the response

---

## DTO Index

| DTO | Direction | Used In |
|---|---|---|
| `EmployeeSummaryDTO` | Backend → Frontend | List views, dashboard widgets, search results, org tree |
| `EmployeeDetailsDTO` | Backend → Frontend | Profile page, detail drawer, edit form prefill |
| `EmployeeCreateDTO` | Frontend → Backend | Create employee form submission |
| `EmployeeUpdateDTO` | Frontend → Backend | Edit employee form submission |
| `EmployeeStatusDTO` | Frontend → Backend | Status change actions (activate, leave, suspend, archive) |
| `EmployeeSearchDTO` | Frontend → Backend | List/search query parameters |

---

## EmployeeSummaryDTO

### Purpose

A compact representation of one employee. Used wherever the system needs to display an employee in a list, widget, dropdown, or organization tree row without loading the full profile.

Designed to be lightweight — all fields come from the employee record and its immediate relationships, with no deep aggregation.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Employee unique identifier |
| `employeeNumber` | `string` | Personnel number |
| `firstName` | `string` | Given name |
| `lastName` | `string` | Family name |
| `fullName` | `string` | Derived: `"{rank} {firstName} {lastName}"` |
| `rank` | `string` | Current military or civilian rank |
| `position` | `string` | Role title within the unit |
| `serviceType` | `string` | `MANDATORY` \| `CAREER` \| `RESERVE` \| `CIVILIAN` |
| `status` | `string` | `DRAFT` \| `ACTIVE` \| `ON_LEAVE` \| `TEMPORARY_ASSIGNMENT` \| `SUSPENDED` \| `INACTIVE` \| `ARCHIVED` |
| `orgUnitId` | `string` (UUID) | Primary unit ID |
| `orgUnitName` | `string` | Primary unit display name |
| `createdAt` | `string` (ISO 8601) | Record creation timestamp |
| `updatedAt` | `string` (ISO 8601) | Last update timestamp |

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `commanderId` | `string` \| `null` | UUID of the direct commander employee |
| `commanderName` | `string` \| `null` | Derived full name of the direct commander |
| `profilePictureUrl` | `string` \| `null` | URL of the employee's avatar image |
| `certificationHealth` | `string` \| `null` | `ALL_VALID` \| `EXPIRING_SOON` \| `CRITICAL` \| `EXPIRED` \| `NO_CERTIFICATIONS` |
| `yearsOfService` | `number` \| `null` | Derived: completed years since `startDate` |

### Example Payload

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "employeeNumber": "7845621",
  "firstName": "נועה",
  "lastName": "כהן",
  "fullName": "סרן נועה כהן",
  "rank": "סרן",
  "position": "קצינת מבצעים",
  "serviceType": "CAREER",
  "status": "ACTIVE",
  "orgUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "orgUnitName": "פלוגה א' — גדוד 51",
  "commanderId": "c1c2c3c4-d5d6-7890-efgh-ij1234567890",
  "commanderName": "רס\"ן דוד לוי",
  "profilePictureUrl": null,
  "certificationHealth": "EXPIRING_SOON",
  "yearsOfService": 6,
  "createdAt": "2020-08-01T07:00:00Z",
  "updatedAt": "2026-07-15T11:30:00Z"
}
```

---

## EmployeeDetailsDTO

### Purpose

The complete representation of a single employee. Returned by the profile endpoint (`GET /employees/{id}`). Contains all field groups from the business model: identity, employment, organizational assignment, contact, availability, certifications, operational information, and preferences.

Fields are conditionally included or masked based on the requesting operator's role. The `preferences` group is only included when the operator is reading their own profile.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | |
| `employeeNumber` | `string` | |
| `firstName` | `string` | |
| `lastName` | `string` | |
| `fullName` | `string` | Derived |
| `dateOfBirth` | `string` | `YYYY-MM-DD` — may be masked as `"****-**-**"` |
| `age` | `number` | Derived: completed years |
| `rank` | `string` | |
| `position` | `string` | |
| `serviceType` | `string` | Enum |
| `status` | `string` | Enum |
| `startDate` | `string` | `YYYY-MM-DD` |
| `yearsOfService` | `number` | Derived |
| `orgUnitId` | `string` (UUID) | |
| `orgUnitName` | `string` | |
| `orgUnitCode` | `string` | |
| `organizationPath` | `string[]` | Ordered from root to current unit |
| `assignmentType` | `string` | `PERMANENT` \| `TEMPORARY` |
| `isAvailableToday` | `boolean` | Derived |
| `certificationHealth` | `string` | Derived overall health enum |
| `createdAt` | `string` (ISO 8601) | |
| `updatedAt` | `string` (ISO 8601) | |

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `gender` | `string` \| `null` | Enum |
| `nationalId` | `string` \| `null` | Admin-only; omitted for other roles |
| `profilePictureUrl` | `string` \| `null` | |
| `expectedEndDate` | `string` \| `null` | `YYYY-MM-DD` |
| `actualEndDate` | `string` \| `null` | `YYYY-MM-DD` |
| `seniorityLevel` | `number` \| `null` | Manual credit years |
| `commanderId` | `string` \| `null` | UUID |
| `commanderName` | `string` \| `null` | Derived |
| `commandScope` | `string` \| `null` | Derived (e.g. `"פלוגה"`) |
| `subordinateCount` | `number` \| `null` | Derived |
| `temporaryAssignment` | `object` \| `null` | Present when `assignmentType` is `TEMPORARY` |
| `temporaryAssignment.unitId` | `string` | |
| `temporaryAssignment.unitName` | `string` | |
| `temporaryAssignment.startDate` | `string` | `YYYY-MM-DD` |
| `temporaryAssignment.endDate` | `string` \| `null` | `YYYY-MM-DD` |
| `militaryPhone` | `string` \| `null` | |
| `personalPhone` | `string` \| `null` | Masked for lower roles |
| `personalEmail` | `string` \| `null` | Masked for lower roles |
| `unitEmail` | `string` \| `null` | |
| `workAddress` | `string` \| `null` | |
| `emergencyContact` | `object` \| `null` | Omitted for non-commanders |
| `emergencyContact.name` | `string` | |
| `emergencyContact.phone` | `string` | |
| `emergencyContact.relationship` | `string` \| `null` | Enum |
| `standardWorkDays` | `string[]` \| `null` | e.g. `["SUN","MON","TUE","WED","THU"]` |
| `shiftPreference` | `string` \| `null` | Enum |
| `leaveBalance` | `number` \| `null` | Derived |
| `leaveUsed` | `number` \| `null` | Derived |
| `medicalLimitation` | `object` \| `null` | |
| `medicalLimitation.isActive` | `boolean` | |
| `medicalLimitation.description` | `string` \| `null` | |
| `medicalLimitation.expiryDate` | `string` \| `null` | `YYYY-MM-DD` |
| `reserveDutyPeriods` | `object[]` \| `null` | Array of `{ startDate, endDate }` |
| `certifications` | `object` | Full certifications block (see employee-dtos.md) |
| `operationalRole` | `string` \| `null` | |
| `primaryWeaponSystem` | `string` \| `null` | |
| `specialty` | `string` \| `null` | |
| `commandCapability` | `boolean` \| `null` | |
| `languageProficiencies` | `object[]` \| `null` | Array of `{ language, level }` |
| `preferences` | `object` \| `null` | Self-access only |
| `createdBy` | `string` \| `null` | Operator UUID |
| `updatedBy` | `string` \| `null` | Operator UUID |

### Example Payload

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "employeeNumber": "7845621",
  "firstName": "נועה",
  "lastName": "כהן",
  "fullName": "סרן נועה כהן",
  "dateOfBirth": "1997-04-15",
  "age": 29,
  "gender": "FEMALE",
  "nationalId": null,
  "profilePictureUrl": null,

  "rank": "סרן",
  "position": "קצינת מבצעים",
  "serviceType": "CAREER",
  "status": "ACTIVE",
  "startDate": "2020-08-01",
  "expectedEndDate": null,
  "actualEndDate": null,
  "seniorityLevel": null,
  "yearsOfService": 6,

  "orgUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "orgUnitName": "פלוגה א' — גדוד 51",
  "orgUnitCode": "PLG-A-51",
  "organizationPath": ["חטיבה 7", "גדוד 51", "פלוגה א'"],
  "commanderId": "c1c2c3c4-d5d6-7890-efgh-ij1234567890",
  "commanderName": "רס\"ן דוד לוי",
  "assignmentType": "PERMANENT",
  "temporaryAssignment": null,
  "commandScope": null,
  "subordinateCount": null,

  "militaryPhone": "052-8001234",
  "personalPhone": "***-***-****",
  "personalEmail": "***@***.***",
  "unitEmail": "ops.officer@unit51.idf",
  "workAddress": "בסיס צאלים",
  "emergencyContact": null,

  "isAvailableToday": true,
  "standardWorkDays": ["SUN", "MON", "TUE", "WED", "THU"],
  "shiftPreference": "MORNING",
  "leaveBalance": 12,
  "leaveUsed": 9,
  "medicalLimitation": null,
  "reserveDutyPeriods": [],

  "certificationHealth": "EXPIRING_SOON",
  "certifications": {
    "overallHealth": "EXPIRING_SOON",
    "driverLicense": {
      "type": "B",
      "issueDate": null,
      "expiryDate": "2028-03-31",
      "status": "VALID",
      "daysUntilExpiry": 620
    },
    "medicalCertification": {
      "type": "COMBAT_MEDIC",
      "issueDate": "2024-05-01",
      "expiryDate": "2026-08-01",
      "status": "EXPIRING_SOON",
      "daysUntilExpiry": 13
    },
    "weaponsQualification": {
      "type": "M16",
      "issueDate": "2026-01-15",
      "expiryDate": "2027-01-15",
      "status": "VALID",
      "daysUntilExpiry": 180
    },
    "securityClearance": {
      "level": "SECRET",
      "expiryDate": "2029-12-31",
      "status": "VALID",
      "daysUntilExpiry": 1261
    },
    "combatFitness": {
      "classification": "97",
      "classificationDate": "2025-11-01",
      "expiryDate": "2028-11-01",
      "status": "VALID",
      "daysUntilExpiry": 836
    },
    "additional": [],
    "languageProficiencies": [
      { "language": "he", "level": "NATIVE" },
      { "language": "en", "level": "FLUENT" }
    ]
  },

  "operationalRole": "קצינת מבצעים",
  "primaryWeaponSystem": "תבור",
  "specialty": null,
  "commandCapability": true,

  "preferences": null,

  "createdAt": "2020-08-01T07:00:00Z",
  "updatedAt": "2026-07-15T11:30:00Z",
  "createdBy": "admin-uuid-0001",
  "updatedBy": "admin-uuid-0001"
}
```

---

## EmployeeCreateDTO

### Purpose

The input payload sent by the frontend when creating a new employee record. Submitted to `POST /employees`.

### Required Fields

| Field | Type | Validation |
|---|---|---|
| `orgUnitId` | `string` (UUID) | Must be an active unit within operator's manage scope |
| `employeeNumber` | `string` | 2–50 chars; alphanumeric; unique within tenant |
| `firstName` | `string` | 1–100 chars; letters only |
| `lastName` | `string` | 1–100 chars; letters only |
| `dateOfBirth` | `string` | `YYYY-MM-DD`; age 17–80 |
| `rank` | `string` | 1–100 chars |
| `position` | `string` | 1–150 chars |
| `serviceType` | `string` | `MANDATORY` \| `CAREER` \| `RESERVE` \| `CIVILIAN` |
| `startDate` | `string` | `YYYY-MM-DD`; not in future |

### Optional Fields

| Field | Type | Default | Validation |
|---|---|---|---|
| `status` | `string` | `DRAFT` | `DRAFT` or `ACTIVE` only |
| `commanderId` | `string` \| `null` | `null` | UUID; must reference active employee |
| `userId` | `string` \| `null` | `null` | UUID; links to security user |
| `militaryPhone` | `string` \| `null` | `null` | 7–20 chars; digits/dashes/`+` |
| `personalPhone` | `string` \| `null` | `null` | 7–20 chars; digits/dashes/`+` |
| `personalEmail` | `string` \| `null` | `null` | valid email; max 254 chars |
| `unitEmail` | `string` \| `null` | `null` | valid email; max 254 chars |
| `workAddress` | `string` \| `null` | `null` | max 250 chars |
| `expectedEndDate` | `string` \| `null` | `null` | `YYYY-MM-DD`; after `startDate` |
| `seniorityLevel` | `number` \| `null` | `null` | 0–60 |
| `gender` | `string` \| `null` | `null` | `MALE` \| `FEMALE` \| `OTHER` \| `PREFER_NOT_TO_SAY` |
| `nationalId` | `string` \| `null` | `null` | 5–20 alphanumeric chars |

### Example Payload

```json
{
  "orgUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "employeeNumber": "7845622",
  "firstName": "יוסי",
  "lastName": "לוי",
  "dateOfBirth": "2000-03-20",
  "rank": "סמל",
  "position": "לוחם",
  "serviceType": "MANDATORY",
  "startDate": "2024-03-01",
  "status": "ACTIVE",
  "commanderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": null,
  "militaryPhone": "052-9000001",
  "personalPhone": null,
  "personalEmail": null,
  "expectedEndDate": "2026-03-01",
  "seniorityLevel": null,
  "gender": "MALE"
}
```

---

## EmployeeUpdateDTO

### Purpose

The input payload for updating an existing employee. Submitted to `PATCH /employees/{id}`. All fields are optional — only fields present in the payload are updated. Fields absent from the payload are left unchanged.

Changing `orgUnitId` initiates a transfer. Changing `status` enforces the lifecycle state machine. Sensitive transitions require `changeReason`.

### All Fields Optional

| Field | Type | Notes |
|---|---|---|
| `orgUnitId` | `string` \| `null` | Triggers transfer validation (ER-06) |
| `employeeNumber` | `string` \| `null` | Immutable post-activation without admin override (ER-04) |
| `firstName` | `string` \| `null` | |
| `lastName` | `string` \| `null` | |
| `dateOfBirth` | `string` \| `null` | Immutable post-activation without admin override (ER-05) |
| `rank` | `string` \| `null` | |
| `position` | `string` \| `null` | |
| `serviceType` | `string` \| `null` | Enum |
| `commanderId` | `string` \| `null` | Must reference active employee (VR-16) |
| `userId` | `string` \| `null` | |
| `militaryPhone` | `string` \| `null` | |
| `personalPhone` | `string` \| `null` | |
| `personalEmail` | `string` \| `null` | |
| `unitEmail` | `string` \| `null` | |
| `workAddress` | `string` \| `null` | |
| `startDate` | `string` \| `null` | `YYYY-MM-DD`; not in future |
| `expectedEndDate` | `string` \| `null` | `YYYY-MM-DD` |
| `actualEndDate` | `string` \| `null` | `YYYY-MM-DD`; not in future |
| `seniorityLevel` | `number` \| `null` | 0–60 |
| `gender` | `string` \| `null` | Enum |
| `nationalId` | `string` \| `null` | Admin-only field |
| `assignmentType` | `string` \| `null` | `PERMANENT` \| `TEMPORARY` |
| `temporaryAssignment` | `object` \| `null` | Required when `assignmentType` is `TEMPORARY` |
| `temporaryAssignment.unitId` | `string` | Must differ from primary unit |
| `temporaryAssignment.startDate` | `string` | `YYYY-MM-DD` |
| `temporaryAssignment.endDate` | `string` \| `null` | `YYYY-MM-DD` |
| `operationalRole` | `string` \| `null` | |
| `primaryWeaponSystem` | `string` \| `null` | |
| `specialty` | `string` \| `null` | |
| `commandCapability` | `boolean` \| `null` | |
| `standardWorkDays` | `string[]` \| `null` | Subset of `["SUN","MON","TUE","WED","THU","FRI","SAT"]` |
| `shiftPreference` | `string` \| `null` | Enum |
| `medicalLimitation` | `object` \| `null` | |
| `medicalLimitation.isActive` | `boolean` | |
| `medicalLimitation.description` | `string` \| `null` | Required if `isActive` is `true` |
| `medicalLimitation.expiryDate` | `string` \| `null` | `YYYY-MM-DD` |
| `changeReason` | `string` \| `null` | Required for SUSPENDED, INACTIVE, ARCHIVED transitions |

### Example Payload — Promotion and Phone Update

```json
{
  "rank": "רס\"ן",
  "position": "מפקד פלוגה",
  "militaryPhone": "052-8009999",
  "changeReason": null
}
```

### Example Payload — Transfer

```json
{
  "orgUnitId": "z9z8z7z6-y5y4-3210-wxvu-ts9876543210",
  "changeReason": "מינוי מחדש לפי צו"
}
```

---

## EmployeeStatusDTO

### Purpose

A focused payload for changing an employee's Employment Status. Submitted to `PATCH /employees/{id}/status`. Enforces the lifecycle state machine and requires structured context for transitions that have operational or legal significance.

This is a separate contract from `EmployeeUpdateDTO` because status transitions have distinct authorization rules, mandatory fields, and side effects that warrant an explicit, narrow interface.

### Required Fields

| Field | Type | Validation |
|---|---|---|
| `status` | `string` | Target status; must be a permitted transition from the current status (LR-01) |

### Conditional Fields

| Field | Type | Required When |
|---|---|---|
| `reason` | `string` | Transition to `SUSPENDED`, `INACTIVE`, or `ARCHIVED` |
| `returnDate` | `string` (`YYYY-MM-DD`) | Transition to `ON_LEAVE` |
| `endDate` | `string` (`YYYY-MM-DD`) | Optionally provided for `TEMPORARY_ASSIGNMENT` |

### Status Enum Values

`DRAFT` `ACTIVE` `ON_LEAVE` `TEMPORARY_ASSIGNMENT` `SUSPENDED` `INACTIVE` `ARCHIVED`

### Example Payload — Activate

```json
{
  "status": "ACTIVE"
}
```

### Example Payload — Send on Leave

```json
{
  "status": "ON_LEAVE",
  "returnDate": "2026-08-15"
}
```

### Example Payload — Suspend

```json
{
  "status": "SUSPENDED",
  "reason": "פתיחת הליך משמעתי — תיק מס' 2026/147"
}
```

### Example Payload — Deactivate

```json
{
  "status": "INACTIVE",
  "reason": "שחרור לאחר סיום שירות חובה"
}
```

### Example Payload — Archive

```json
{
  "status": "ARCHIVED",
  "reason": "רשומה לא פעילה מעל 3 שנים — ארכיון שנתי 2026"
}
```

---

## EmployeeSearchDTO

### Purpose

The query parameter contract for the employee list endpoint (`GET /employees`). Defines all filters, pagination, and sort options the frontend can send when requesting a list of employees.

All fields are optional. When no filters are provided, the endpoint returns all ACTIVE employees within the operator's scope, sorted by last name ascending.

### Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `unitId` | `string` (UUID) \| `null` | `null` | Filter to a specific unit. Must be within operator's scope. |
| `includeDescendants` | `boolean` | `false` | When `unitId` is set: include all child units recursively |
| `status` | `string[]` \| `null` | `["ACTIVE"]` | Filter by one or more Employment Status values |
| `serviceType` | `string[]` \| `null` | `null` | Filter by one or more service types |
| `search` | `string` \| `null` | `null` | Free-text search: first name, last name, employee number |
| `certificationHealth` | `string[]` \| `null` | `null` | Filter by overall certification health |
| `hasCommandRole` | `boolean` \| `null` | `null` | If `true`, returns only employees with command capability |
| `operationalRole` | `string` \| `null` | `null` | Filter by operational role value |
| `page` | `number` | `1` | Page number (1-indexed) |
| `pageSize` | `number` | `50` | Results per page (max: `200`) |
| `sortBy` | `string` | `lastName` | `lastName` \| `rank` \| `employeeNumber` \| `startDate` \| `status` \| `yearsOfService` |
| `sortOrder` | `string` | `asc` | `asc` \| `desc` |

### Example Payload — Active soldiers in a specific unit including sub-units

```json
{
  "unitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "includeDescendants": true,
  "status": ["ACTIVE"],
  "page": 1,
  "pageSize": 50,
  "sortBy": "lastName",
  "sortOrder": "asc"
}
```

### Example Payload — Expiring certifications across all visible units

```json
{
  "unitId": null,
  "includeDescendants": false,
  "status": ["ACTIVE", "TEMPORARY_ASSIGNMENT"],
  "certificationHealth": ["EXPIRING_SOON", "CRITICAL", "EXPIRED"],
  "page": 1,
  "pageSize": 100,
  "sortBy": "lastName",
  "sortOrder": "asc"
}
```

### Example Payload — Search by name fragment

```json
{
  "search": "כהן",
  "status": ["ACTIVE"],
  "page": 1,
  "pageSize": 20,
  "sortBy": "lastName",
  "sortOrder": "asc"
}
```

### Response Shape

Returned by `GET /employees` for all `EmployeeSearchDTO` queries:

```json
{
  "success": true,
  "data": {
    "items": [ /* EmployeeSummaryDTO[] */ ],
    "total": 87,
    "page": 1,
    "pageSize": 50,
    "totalPages": 2
  }
}
```

---

## Contract Summary

| DTO | Direction | HTTP Method | Endpoint |
|---|---|---|---|
| `EmployeeSummaryDTO` | Response | `GET` | `/employees` |
| `EmployeeDetailsDTO` | Response | `GET` | `/employees/{id}` |
| `EmployeeCreateDTO` | Request | `POST` | `/employees` |
| `EmployeeUpdateDTO` | Request | `PATCH` | `/employees/{id}` |
| `EmployeeStatusDTO` | Request | `PATCH` | `/employees/{id}/status` |
| `EmployeeSearchDTO` | Query params | `GET` | `/employees` |
