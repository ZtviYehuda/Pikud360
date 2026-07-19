# Organization Data Contracts

**Domain:** Organization  
**Phase:** 15.4 — Organization Data Contracts  
**Depends on:** organization-domain.md, organization-hierarchy.md, organization-rules.md

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) used to communicate organizational tree node elements, unit metadata summaries, and staff transfer requests between the frontend React application and backend services.

All payloads use `camelCase` parameters and adhere to ISO 8601 formatting conventions.

---

## 2. DTO Catalog

---

### 2.1 OrganizationTreeDTO

#### Purpose
Provides a hierarchical, nested representation of the organizational tree. Typically loaded in a single request to populate unit selection dropdowns, filter menus, and the sidebar navigation tree.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Unique identifier of the organization node |
| `name` | string | Yes | Display name of the unit (e.g. "מדור א'") |
| `code` | string | Yes | Unique organizational identifier code (e.g. `MDR-A-7`) |
| `level` | number | Yes | Structural tier index (1 to 5) |
| `typeName` | string | Yes | Display name of the tier type (e.g. `BRIGADE`, `DEPARTMENT`, `SECTION`, `CELL`) |
| `isActive` | boolean | Yes | True if the node is active |
| `commanderId` | string (UUID) | No | UUID of the assigned unit commander |
| `commanderName` | string | No | Derived full name of the unit commander |
| `children` | object[] | Yes | Array of child `OrganizationTreeDTO` nodes (empty if leaf) |

#### Example Payload

```json
{
  "id": "o1o2o3o4-p5p6-7890-abcd-ef1234567890",
  "name": "מחלקה א'",
  "code": "MHL-A",
  "level": 3,
  "typeName": "DEPARTMENT",
  "isActive": true,
  "commanderId": "c1c2c3c4-d5d6-7890-efgh-ij1234567890",
  "commanderName": "סא\"ל אהרון לוי",
  "children": [
    {
      "id": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
      "name": "מדור א'",
      "code": "MDR-A-7",
      "level": 4,
      "typeName": "SECTION",
      "isActive": true,
      "commanderId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
      "commanderName": "רס\"ן דוד לוי",
      "children": []
    }
  ]
}
```

---

### 2.2 OrganizationUnitDTO

#### Purpose
Represents the detailed configuration parameters and custom attributes of a single organizational node. Used in unit setup profiles and admin edit forms.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Unique identifier of the node |
| `name` | string | Yes | Display name |
| `code` | string | Yes | Unique unit code |
| `level` | number | Yes | Tier index (1 to 5) |
| `typeName` | string | Yes | Tier type string |
| `parentId` | string (UUID) | No | Parent node UUID (null for root) |
| `parentName` | string | No | Display name of the parent unit |
| `isActive` | boolean | Yes | Active status flag |
| `commanderId` | string (UUID) | No | Assigned commander UUID |
| `commanderName` | string | No | Commander full name |
| `createdAt` | string (DateTime) | Yes | Creation timestamp |
| `updatedAt` | string (DateTime) | Yes | Update timestamp |
| `metadata` | object | Yes | Tenant-specific JSON mapping of custom fields |

#### Example Payload

```json
{
  "id": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "name": "מדור א'",
  "code": "MDR-A-7",
  "level": 4,
  "typeName": "SECTION",
  "parentId": "o1o2o3o4-p5p6-7890-abcd-ef1234567890",
  "parentName": "מחלקה א'",
  "isActive": true,
  "commanderId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
  "commanderName": "רס\"ן דוד לוי",
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2026-07-10T12:30:00Z",
  "metadata": {
    "radioCallsign": "ברק-1",
    "gridCoordinate": "142-896",
    "maxBedCapacity": null
  }
}
```

---

### 2.3 OrganizationSummaryDTO

#### Purpose
Provides roll-up statistics summarizing active workforce allocations and capacity counts under the target node. Used to render unit index cards and dashboard overview grids.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `unitId` | string (UUID) | Yes | Target organization unit ID |
| `unitName` | string | Yes | Display name of the unit |
| `totalSubunits` | number | Yes | Count of direct children nodes |
| `totalPersonnel` | number | Yes | Total active personnel registered under this subtree |
| `activePersonnel` | number | Yes | Count of personnel in `ACTIVE` lifecycle state |
| `temporaryAssignedOutCount`| number | Yes | Count of unit staff seconded temporarily to other units |
| `temporaryAssignedInCount` | number | Yes | Count of external staff seconded temporarily to this unit |
| `unassignedCount` | number | Yes | Count of DRAFT or unassigned records in the unit |

#### Example Payload

```json
{
  "unitId": "o1o2o3o4-p5p6-7890-abcd-ef1234567890",
  "unitName": "מחלקה א'",
  "totalSubunits": 3,
  "totalPersonnel": 124,
  "activePersonnel": 115,
  "temporaryAssignedOutCount": 4,
  "temporaryAssignedInCount": 2,
  "unassignedCount": 3
}
```

---

### 2.4 TransferDTO

#### Purpose
Models the data schema of a staff transfer request between two organization units.

#### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Unique identifier of the transfer request |
| `employeeId` | string (UUID) | Yes | Target employee being transferred |
| `employeeName` | string | Yes | Derived full name of the employee |
| `employeeRank` | string | Yes | Rank of the employee |
| `fromUnitId` | string (UUID) | Yes | Source organization unit ID |
| `fromUnitName` | string | Yes | Source unit display name |
| `toUnitId` | string (UUID) | Yes | Destination organization unit ID |
| `toUnitName` | string | Yes | Destination unit display name |
| `status` | string | Yes | State: `PENDING` \| `APPROVED` \| `REJECTED` \| `CANCELLED` |
| `requestedAt` | string (DateTime) | Yes | Creation timestamp |
| `completedAt` | string (DateTime) | No | Confirmation timestamp |
| `requestedBy` | string | Yes | Operator name who initiated the request |
| `approvedBy` | string | No | Commander name who authorized the transfer |
| `reason` | string | Yes | Explanatory note justifying the transfer request |

#### Example Payload

```json
{
  "id": "f5f6f7f8-g9g0-1234-abcd-ef1234567890",
  "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
  "employeeName": "רב\"ט יוסי לוי",
  "employeeRank": "רב\"ט",
  "fromUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "fromUnitName": "מדור א' — מחלקה א'",
  "toUnitId": "z9z8z7z6-y5y4-3210-wxvu-ts9876543210",
  "toUnitName": "מדור ב' — מחלקה ב'",
  "status": "PENDING",
  "requestedAt": "2026-07-19T14:40:00Z",
  "completedAt": null,
  "requestedBy": "רס\"ן דוד לוי",
  "approvedBy": null,
  "reason": "שיבוץ מחדש לתפקיד נהג מדורי עקב סיום הסמכה"
}
```
