# Commander Dashboard DTOs Specification

This document defines the TypeScript interfaces and JSON data transfer objects (DTOs) forming the communication contracts for the Commander Dashboard.

---

## 1. DTO Structure Inventory

### 1.1 DashboardSummaryDTO
Root aggregate payload returned on high-level dashboard entry.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `workspaceId` | `string` | No | ID of the active military unit/workspace context. |
| `readinessScore` | `number` | No | Percentage value (0-100) indicating force readiness. |
| `workforce` | `WorkforceSummaryDTO` | No | Workforce tallies and category counts. |
| `attendance` | `AttendanceSummaryDTO` | No | Daily attendance counts and reporting progress. |
| `alertsCount` | `number` | No | Count of active critical alerts. |

---

### 1.2 WorkforceSummaryDTO
Tallies and categorizations of the workforce force.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `totalPersonnel` | `number` | No | Total counts of personnel registered in this unit. |
| `presentCount` | `number` | No | Count of employees reported present on duty today. |
| `absentCount` | `number` | No | Count of employees absent without approved reason. |
| `sickCount` | `number` | No | Count of employees absent due to sick leave. |
| `vacationCount` | `number` | No | Count of employees absent due to approved vacation. |
| `courseCount` | `number` | No | Count of employees absent due to active training courses. |
| `reinforcementCount`| `number` | No | Count of external reinforcement personnel attached to unit. |

---

### 1.3 AttendanceSummaryDTO
Details of attendance reports submitted for today.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `reportingDate` | `string` | No | Target date formatted as YYYY-MM-DD. |
| `expectedReports` | `number` | No | Total number of employees expected to submit reports. |
| `submittedReports`| `number` | No | Total number of reports successfully submitted. |
| `percentComplete` | `number` | No | Progress percentage (submitted / expected). |
| `missingSubunits` | `string[]` | No | List of subunit names that have not submitted reporting logs. |

---

### 1.4 AlertDTO
A warning item requiring commander attention.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | Unique identifier for the alert. |
| `severity` | `"CRITICAL" \| "WARNING" \| "INFO"` | No | Urgency category mapping. |
| `title` | `string` | No | Alert headline text. |
| `description` | `string` | No | Additional contextual details. |
| `createdAt` | `string` | No | Timestamp formatted as ISO 8601. |
| `subunitId` | `string` | Yes | Target subunit associated with the warning. |
| `actionPath` | `string` | Yes | Navigation href hook to resolve the alert. |

---

### 1.5 KPIWidgetDTO
Readiness indicator score and variables mapping.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `kpiId` | `string` | No | Unique identifier for the KPI indicator. |
| `name` | `string` | No | Name of the KPI. |
| `score` | `number` | No | Score value (0-100). |
| `threshold` | `number` | No | Target threshold below which the status turns warning/red. |
| `trendDirection` | `"UP" \| "DOWN" \| "STABLE"` | No | Force trend comparison indicator. |

---

### 1.6 QuickActionDTO
Action button shortcut link.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | Unique action id. |
| `label` | `string` | No | Button label text. |
| `actionType` | `"NAVIGATE" \| "DIALOG"` | No | Target flow interaction mechanism. |
| `target` | `string` | No | target href path or dialog id name to open. |
| `requiredPermission`| `string` | Yes | Target role credential required to render the button. |

---

### 1.7 NotificationDTO
System status announcement.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | Unique notification ID. |
| `title` | `string` | No | Notification subject line. |
| `body` | `string` | No | Body text. |
| `isRead` | `boolean` | No | Read state of the notification. |
| `createdAt` | `string` | No | Timestamp formatted as ISO 8601. |

---

### 1.8 ActivityDTO
Timeline log trace entry.

| Property | Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | Unique audit log ID. |
| `actorName` | `string` | No | Name of the user who performed the action. |
| `actionDescription`| `string` | No | Action detail text (e.g. "עדכן נוכחות עבור מחלקה ב'"). |
| `timestamp` | `string` | No | ISO 8601 timestamp. |
| `category` | `"WORKFORCE" \| "SCHEDULING" \| "SYSTEM"` | No | Log category. |
