# Commander Dashboard API Contract

This document outlines the logical REST API endpoints supporting the Commander Dashboard in the Pikud360 application.

---

## 1. Endpoints Specification

### 1.1 Get Dashboard Summary
- **Endpoint**: `GET /api/dashboard/summary`
- **Purpose**: Fetch high-level aggregated indicators for KPIs and widgets.
- **Input Parameters**:
  - `workspaceId` (Query parameter, string, required)
- **Output JSON Body**: `DashboardSummaryDTO`
- **Expected Errors**:
  - `400 Bad Request` (Missing workspaceId)
  - `403 Forbidden` (User does not have access to this unit workspace)
  - `404 Not Found` (Workspace context does not exist)
- **Authorization Requirements**: Role: `COMMANDER` or `MANAGER`.
- **Cache Strategy**: Cache-Control: `private, max-age=30`.
- **Refresh Strategy**: Polls every 60 seconds on the client.

---

### 1.2 Get Critical Alerts
- **Endpoint**: `GET /api/dashboard/alerts`
- **Purpose**: Fetch outstanding alert warnings requiring action.
- **Input Parameters**:
  - `workspaceId` (Query parameter, string, required)
- **Output JSON Body**: `AlertDTO[]`
- **Expected Errors**:
  - `400 Bad Request` (Missing workspaceId)
  - `403 Forbidden` (Insufficient security level to view alerts)
- **Authorization Requirements**: Role: `COMMANDER` or `MANAGER`.
- **Cache Strategy**: No cache (`no-store`).
- **Refresh Strategy**: Updates in real-time via WebSockets. Falls back to 30s polling if disconnected.

---

### 1.3 Get Pending Approvals
- **Endpoint**: `GET /api/dashboard/pending-approvals`
- **Purpose**: Retrieve personnel requests waiting for authorization signatures.
- **Input Parameters**:
  - `workspaceId` (Query parameter, string, required)
- **Output JSON Body**:
  ```json
  {
    "count": 3,
    "requests": [
      {
        "requestId": "req-981",
        "employeeName": "יוסף לוי",
        "type": "VACATION_LEAVE",
        "details": "vacation leave: 2026-07-20 to 2026-07-24",
        "createdAt": "2026-07-19T08:00:00Z"
      }
    ]
  }
  ```
- **Expected Errors**:
  - `403 Forbidden` (User lacks approval authority permissions)
- **Authorization Requirements**: Role: `COMMANDER` only.
- **Cache Strategy**: `private, no-cache`.
- **Refresh Strategy**: Pulls on page enter or when manually requested.

---

### 1.4 Get Shift Coverage
- **Endpoint**: `GET /api/dashboard/shift-coverage`
- **Purpose**: Tracks base roster coverage requirements.
- **Input Parameters**:
  - `workspaceId` (Query parameter, string, required)
  - `date` (Query parameter, string YYYY-MM-DD, optional, defaults to today)
- **Output JSON Body**:
  ```json
  {
    "date": "2026-07-19",
    "totalShifts": 8,
    "filledShifts": 7,
    "gapsCount": 1,
    "gapsList": [
      { "shiftId": "s-8", "role": "שומר שער", "timeSlot": "14:00 - 22:00" }
    ]
  }
  ```
- **Expected Errors**:
  - `404 Not Found` (No shifts defined for date)
- **Authorization Requirements**: Role: `COMMANDER` or `MANAGER`.
- **Cache Strategy**: `max-age=120`.
- **Refresh Strategy**: Updates on page navigation.

---

### 1.5 Get Activity Log
- **Endpoint**: `GET /api/dashboard/activities`
- **Purpose**: Retrieve timeline events.
- **Input Parameters**:
  - `workspaceId` (Query parameter, string, required)
  - `limit` (Query parameter, number, optional, default: 10)
- **Output JSON Body**: `ActivityDTO[]`
- **Expected Errors**:
  - `403 Forbidden` (Lacks audit log viewing permissions)
- **Authorization Requirements**: Role: `COMMANDER` or `MANAGER`.
- **Cache Strategy**: `max-age=300`.
- **Refresh Strategy**: Deferred lazy loading.

---

### 1.6 Update Alert Status
- **Endpoint**: `POST /api/dashboard/alerts/{id}/resolve`
- **Purpose**: Dismiss or mark a critical alert as addressed.
- **Input Parameters**:
  - `id` (Path parameter, string, required)
  - JSON Body:
    ```json
    {
      "resolutionNotes": "השיבוץ הושלם ידנית על ידי המפקד"
    }
    ```
- **Output JSON Body**:
  ```json
  {
    "success": true,
    "resolvedAt": "2026-07-19T08:15:00Z"
  }
  ```
- **Expected Errors**:
  - `404 Not Found` (Alert ID does not exist)
  - `409 Conflict` (Alert is already resolved)
- **Authorization Requirements**: Role: `COMMANDER` only.
- **Cache Strategy**: No cache (`no-store`).
- **Refresh Strategy**: Client triggers immediately, invalidating critical alerts queries.
