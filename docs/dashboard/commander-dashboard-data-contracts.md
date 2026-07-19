# Commander Dashboard Data Contracts Specification

This document defines the data requirements, mapping strategy, loading policies, and exception handling contracts between the frontend dashboard components and backend services.

---

## 1. Widget Data Mapping

| Widget | Data Source | Required DTO | Refresh Interval | Blocking / Non-blocking | Cacheable | Lazy-load Candidate | Permission Dependent |
|---|---|---|---|---|---|---|---|
| **Workforce Summary** | `/api/dashboard/workforce-summary` | `WorkforceSummaryDTO` | 60s | Blocking | Yes | No | Yes (Filtered by view permissions) |
| **Attendance Summary** | `/api/dashboard/attendance-summary` | `AttendanceSummaryDTO` | 5m | Non-blocking | Yes | Yes | Yes |
| **Today's Readiness** | `/api/dashboard/readiness-status` | `KPIWidgetDTO` | 5m | Blocking | Yes | No | Yes |
| **Critical Alerts** | `/api/dashboard/alerts` | `AlertListDTO` | Real-time | Blocking | No | No | Yes (Role specific alerts) |
| **Pending Approvals** | `/api/dashboard/pending-approvals` | `PendingApprovalsDTO` | 5m | Non-blocking | No | Yes | Yes (Approval authority role) |
| **Shift Coverage** | `/api/dashboard/shift-coverage` | `ShiftCoverageDTO` | 5m | Non-blocking | Yes | Yes | No |
| **Organization Overview**| `/api/dashboard/organization-tree` | `OrganizationTreeDTO` | 1h | Non-blocking | Yes (Persistent) | Yes | Yes (Subunit boundary check) |
| **Recent Activity** | `/api/dashboard/activities` | `ActivityLogDTO` | 10m | Non-blocking | Yes | Yes | Yes (Audit view permission) |
| **Quick Actions** | `/api/dashboard/quick-actions` | `QuickActionsListDTO`| Static | Non-blocking | Yes | No | Yes |
| **Notifications** | `/api/dashboard/notifications` | `NotificationListDTO` | Real-time | Non-blocking | No | Yes | No |

---

## 2. Refresh Strategy

### 2.1 Real-time (WebSockets / SSE)
- **Critical Alerts** & **Notifications**:
  - *Rationale*: Critical alerts like missing personnel or safety hazards must reach the commander immediately without requiring manual reloads.

### 2.2 Automatic Refresh (Periodic Polling - 60s to 5m)
- **Workforce Summary** (60s) & **Attendance Summary** (5m):
  - *Rationale*: Attendance reporting updates occur continuously during the morning shift. Periodic polling updates the figures without generating constant backend workload.

### 2.3 Manual Refresh Only (User-Triggered / Navigation)
- **Organization Overview** & **Shift Coverage**:
  - *Rationale*: Structural trees and schedules do not change frequently within minutes. Loading them on page enter or manual retry is optimal.

### 2.4 Static Configuration
- **Quick Actions**:
  - *Rationale*: Action buttons are derived from user role policies, changing only during system upgrades or role updates.

---

## 3. Loading Strategy

To optimize Cumulative Layout Shift (CLS) and ensure fast responsiveness, widgets are loaded in three distinct phases:

```
Page Load
  ├── Phase 1: Critical (Blocking API calls, immediate skeleton renders)
  │    ├── Critical Alerts Feed
  │    └── Workforce Summary KPIs
  ├── Phase 2: Deferred (Non-blocking APIs, fallback cached renders)
  │    ├── Today's Readiness gauge
  │    ├── Attendance Summary status
  │    └── Shift Coverage cells
  └── Phase 3: Lazy-Load (Triggered only when scrolled into viewport)
       ├── Organization Overview Tree
       ├── Recent Activity Log
       └── Upcoming Events lists
```

---

## 4. Error Contracts

The dashboard UI handles API exception codes using standardized component behaviors:

| Error Type | Status Code | Expected Frontend Behavior |
|---|---|---|
| **No Permission** | `403 Forbidden` | Widget displays inline lock icon: "אין הרשאה מתאימה לצפייה בווידג'ט זה." (No permission to view this widget). |
| **No Data** | `200 OK` (Empty payload) | Widget displays empty state placeholder (see section 5). |
| **Partial Data** | `206 Partial Content` | Renders available records and displays warning banner: "נתונים חלקיים בלבד. לחץ לרענון." |
| **Service Unavailable**| `503 Service Unavailable`| Displays warning icon with status: "שרת הדיווחים לא זמין. מציג נתונים שמורים." |
| **Timeout** | `408 Request Timeout` | Renders a "חיוג פג תוקף" message with a prominent "נסה שוב" (Retry) action button. |

---

## 5. Empty State Contracts

| State Scenario | Widget Target | Empty Check | Expected UI Layout | Available Actions |
|---|---|---|---|---|
| **First Login / No Employees** | Workforce Summary | `total_count === 0` | Displays illustration: "אין עובדים רשומים במערכת." | "הוסף עובד ראשון" button |
| **System Healthy** | Critical Alerts Feed | `alerts.length === 0` | Displays green shield icon: "המערכת תקינה, אין התראות פעילות." | "הצג התראות היסטוריות" |
| **Roster Untracked** | Shift Coverage | `shifts.length === 0` | Displays message: "לא נמצאו משמרות מוגדרות להיום." | "צור סידור עבודה" shortcut |
| **No Attendance Reports** | Attendance Summary | `reported_count === 0` | Displays alert text: "טרם הוזן דיווח נוכחות להיום." | "שלח תזכורת דיווח נוכחות" |
| **No Notifications** | Notifications | `items.length === 0` | Displays muted envelope icon: "תיבת ההודעות ריקה." | N/A |

---

## 6. API Strategy & Endpoint Grouping

API endpoints are logically grouped to optimize request batching and control auth layers.

### 6.1 Dashboard Scope `/api/dashboard/*`
- Aggregates high-level metrics for summaries.
- Supports cache headers (`max-age=60`).

### 6.2 Attendance Scope `/api/attendance/*`
- Detailed reporting paths for managers.
- Updates trigger invalidation flags for `WorkforceSummary`.

### 6.3 Admin/System Scope `/api/admin/*`
- Handles organization subunit configuration details.
- Access strictly limited to `ADMIN` roles.
