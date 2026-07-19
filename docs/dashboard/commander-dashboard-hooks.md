# Commander Dashboard Hooks Specification

This document defines the custom React hooks that manage data fetching, state updates, and real-time synchronization for the Commander Dashboard.

---

## 1. Custom Hooks Registry

### 1.1 `useDashboard`
- **Responsibility**: Coordinates top-level dashboard layout configs and workspace change triggers.
- **Inputs**:
  - `workspaceId: string` (Current active unit)
- **Outputs**:
  - `isInitialLoading: boolean` (True if core metadata hasn't loaded)
  - `isOffline: boolean` (True if websocket is disconnected)
- **Returned Actions**:
  - `refreshAll: () => Promise<void>` (Force re-fetches all widget query items)
- **Loading Behavior**: Set to true when workspace is swapped.
- **Error Behavior**: Global error indicator bubble is updated if fetch fails.
- **Refresh Behavior**: Manual refresh wrapper.
- **Dependencies**: React Context, API service layer.

---

### 1.2 `useDashboardSummary`
- **Responsibility**: Manages data fetching for Today's Readiness Score and subunit organization statuses.
- **Inputs**:
  - `workspaceId: string`
- **Outputs**:
  - `summary: DashboardSummaryDTO | null` (Current readiness and totals)
  - `loading: boolean`
  - `error: Error | null`
- **Returned Actions**:
  - `refetch: () => Promise<void>`
- **Loading Behavior**: Non-blocking background loader on poll, blocking on initial workspace load.
- **Error Behavior**: Returns error payload to trigger widget warning alerts.
- **Refresh Behavior**: Polls every 60 seconds.
- **Dependencies**: `useDashboard` context boundaries.

---

### 1.3 `useCriticalAlerts`
- **Responsibility**: Connects to the real-time websocket server for alert notifications.
- **Inputs**:
  - `workspaceId: string`
- **Outputs**:
  - `alerts: AlertDTO[]`
  - `loading: boolean`
  - `error: Error | null`
  - `connectionStatus: "CONNECTING" | "OPEN" | "CLOSED"`
- **Returned Actions**:
  - `resolveAlert: (id: string) => Promise<void>` (Triggers POST request to resolve warning)
- **Loading Behavior**: Displays skeletal layouts on initial connection.
- **Error Behavior**: Reconnects automatically (exponential backoff). Renders error warning on persistent closed connection.
- **Refresh Behavior**: Event-driven WebSockets.
- **Dependencies**: WebSocket event bus, `dashboardService.ts`.

---

### 1.4 `useAttendanceSummary`
- **Responsibility**: Manages attendance progression parameters.
- **Inputs**:
  - `workspaceId: string`
- **Outputs**:
  - `attendance: AttendanceSummaryDTO | null`
  - `loading: boolean`
  - `error: Error | null`
- **Returned Actions**:
  - `triggerReminder: (subunitName: string) => Promise<void>` (Sends SMS reminder ping)
- **Loading Behavior**: Background refresh indicates non-blocking update.
- **Error Behavior**: Captures error and retains stale values in cache.
- **Refresh Behavior**: Polls every 5 minutes.
- **Dependencies**: `dashboardService.ts`.

---

### 1.5 `useQuickActions`
- **Responsibility**: Maps active action items based on user credential permissions.
- **Inputs**:
  - `userRole: string` (Current user credential)
- **Outputs**:
  - `actions: QuickActionDTO[]`
  - `loading: boolean`
- **Returned Actions**:
  - `executeAction: (actionId: string) => void` (Triggers navigation or sheet modals)
- **Loading Behavior**: Renders static buttons immediately.
- **Error Behavior**: Non-applicable (client role mapping).
- **Refresh Behavior**: Static logic.
- **Dependencies**: Auth credentials provider.
