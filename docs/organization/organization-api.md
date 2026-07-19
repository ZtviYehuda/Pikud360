# Organization REST API Design

**Domain:** Organization  
**Phase:** 15.5 — Organization API Design  
**Depends on:** organization-data-contracts.md, organization-rules.md

---

## 1. Overview

This document specifies the REST API surface for the Organization domain. 

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

### 2.1 GET /organization/tree

#### Purpose
Loads the complete nested unit hierarchy tree. Typically used to populate navigation menus, unit select dropdowns, and search filter lists.

#### Permissions Required

| Permission | Scope |
|---|---|
| `organization.view` | `TENANT` — returns the tree structure. The subtree nodes are filtered dynamically to display only elements within the caller's view scope. |

#### Request Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `rootUnitId` | string (UUID) | No | Restricts tree output to the specified node and its descendants. |
| `includeInactive` | boolean | No | If true, returns deactivated units. Default: `false` |

#### Response (HTTP 200 OK)

Returns an array containing the root `OrganizationTreeDTO` node.

```json
{
  "success": true,
  "data": [
    {
      "id": "o1o2o3o4-p5p6-7890-abcd-ef1234567890",
      "name": "מחלקה א'",
      "code": "MHL-A",
      "level": 3,
      "typeName": "DEPARTMENT",
      "isActive": true,
      "commanderId": "c1c2c3c4-d5d6-7890-efgh-ij1234567890",
      "commanderName": "סא\"ל אהרון לוי",
      "children": []
    }
  ]
}
```

---

### 2.2 GET /organization/units

#### Purpose
Returns a flat list of organization units. Used for grid tables, administration overview rows, and simple search queries.

#### Permissions Required

| Permission | Scope |
|---|---|
| `organization.view` | `ORGANIZATION_UNIT` |

#### Request Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `level` | number | No | Filter by hierarchy level index (1 to 5) |
| `search` | string | No | Search text matching unit name or code |
| `isActive` | boolean | No | Filter by active flag |

#### Response (HTTP 200 OK)

Returns an array of flat unit objects conforming to `OrganizationUnitDTO` (without nested children).

---

### 2.3 GET /organization/unit/{id}

#### Purpose
Retrieves the profile configuration and custom attributes of a single organizational node.

#### Permissions Required

| Permission | Scope |
|---|---|
| `organization.view` | `ORGANIZATION_UNIT` — must have view permissions on the unit. |

#### Response (HTTP 200 OK)

Renders the target `OrganizationUnitDTO` inside the data block.

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 403 | `FORBIDDEN` | Caller lacks access to this unit |
| 404 | `NOT_FOUND` | Unit does not exist |

---

### 2.4 POST /organization/unit

#### Purpose
Creates a new organizational unit node in the hierarchy.

#### Permissions Required

| Permission | Scope |
|---|---|
| `organization.manage` | `TENANT` — creating or restructuring hierarchy trees is restricted to tenant admins. |

#### Request Body

Conforms to `OrganizationUnitDTO` (omitting the `id` field).

```json
{
  "name": "חוליה 3",
  "code": "HL-3-MDR-A",
  "level": 5,
  "typeName": "CELL",
  "parentId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
  "isActive": true,
  "metadata": {
    "radioCallsign": "ברק-3"
  }
}
```

#### Response (HTTP 201 Created)

Returns the fully created `OrganizationUnitDTO` including its server-generated ID.

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 400 | `CIRCULAR_REFERENCE` | The parent node selection creates a tree loop (OR-02) |
| 400 | `INVALID_HIERARCHY_LEVEL` | Level value skips a step from the parent level (HR-01) |
| 409 | `DUPLICATE_UNIT_CODE` | The unit code is already in use (OR-13) |

---

### 2.5 PUT /organization/unit/{id}

#### Purpose
Updates the name, code, commander, or metadata attributes of an existing organization node.

#### Permissions Required

| Permission | Scope |
|---|---|
| `organization.manage` | `TENANT` |

#### Request Body

Conforms to `OrganizationUnitDTO` (immutable fields like `id` and `level` are excluded).

#### Response (HTTP 200 OK)

Returns the updated `OrganizationUnitDTO`.

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 400 | `ACTIVE_TRANSFERS_PENDING` | Attempting to move a node's parent while active transfers are routing (HR-05) |

---

### 2.6 DELETE /organization/unit/{id}

#### Purpose
Soft-deletes a unit node. Sets the `deleted_at` timestamp and deactivates the node.

#### Permissions Required

| Permission | Scope |
|---|---|
| `organization.manage` | `TENANT` |

#### Response (HTTP 200 OK)

```json
{
  "success": true,
  "data": {
    "id": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "deletedAt": "2026-07-19T14:59:00Z"
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 400 | `ACTIVE_PERSONNEL_EXISTS` | Node (or its child subtrees) contains active employees (OR-09) |
| 400 | `ACTIVE_CHILDREN_EXIST` | Attempting to delete a parent unit node before its children are deleted |

---

### 2.7 POST /organization/transfer

#### Purpose
Initiates an employee transfer request to permanently relocate an employee to a new primary unit.

#### Permissions Required

| Permission | Scope |
|---|---|
| `transfers.manage` | `ORGANIZATION_UNIT` — if the operator has scope on both units, the transfer completes immediately (OR-06). If not, the request is created in `PENDING` status. |

#### Request Body

Conforms to the request schema for `TransferDTO`:

```json
{
  "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
  "toUnitId": "z9z8z7z6-y5y4-3210-wxvu-ts9876543210",
  "reason": "מעבר לתפקיד חדש במדור שכן"
}
```

#### Response (HTTP 200 OK / 201 Created)

Returns the created `TransferDTO` tracking payload.

```json
{
  "success": true,
  "data": {
    "id": "f5f6f7f8-g9g0-1234-abcd-ef1234567890",
    "employeeId": "e1e2e3e4-f5f6-7890-abcd-ef1234567890",
    "employeeName": "רב\"ט יוסי לוי",
    "employeeRank": "רב\"ט",
    "fromUnitId": "u1u2u3u4-v5v6-7890-wxyz-ab1234567890",
    "fromUnitName": "מדור א'",
    "toUnitId": "z9z8z7z6-y5y4-3210-wxvu-ts9876543210",
    "toUnitName": "מדור ב'",
    "status": "PENDING",
    "requestedAt": "2026-07-19T14:59:00Z",
    "completedAt": null,
    "requestedBy": "רס\"ן דוד לוי",
    "approvedBy": null,
    "reason": "מעבר לתפקיד חדש במדור שכן"
  }
}
```

#### Possible Errors

| HTTP | Code | Condition |
|---|---|---|
| 404 | `EMPLOYEE_NOT_FOUND` | Employee does not exist |
| 404 | `UNIT_NOT_FOUND` | Target unit ID `toUnitId` does not exist |
| 400 | `TRANSFER_ALREADY_PENDING` | The employee already has a pending transfer request |
