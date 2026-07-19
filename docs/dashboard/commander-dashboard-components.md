# Commander Dashboard Component Architecture

This document defines the component hierarchy, parent-child flows, and folder structure for the Commander Dashboard in the Pikud360 application.

---

## 1. Complete Component Hierarchy

```
DashboardPage (Container - Coordinates data queries & contexts)
└── DashboardLayout (Responsible for responsive grid arrangement)
    ├── DashboardHeader (Breadcrumbs, title, quick toggle actions)
    └── WidgetGrid (Coordinates grid placement offsets)
        ├── WorkforceSummaryWidget (Parent widget)
        │   ├── KPIStatsGroup (Renders numeric metrics)
        │   └── KPIStatCard (Individual Present/Sick/Absent card UI)
        ├── AttendanceSummaryWidget
        │   └── ReportingProgressBar (Percentage indicator visualizer)
        ├── TodayReadinessWidget
        │   └── ReadinessGauge (SVG circular gauge indicator)
        ├── CriticalAlertsWidget
        │   └── AlertListItem (Warning item with action buttons)
        ├── PendingApprovalsWidget
        │   └── ApprovalListItem (Item containing approve/reject triggers)
        ├── ShiftCoverageWidget
        │   └── ShiftCoverageGrid (Renders time blocks)
        ├── OrganizationOverviewWidget
        │   └── OrgUnitTreeNode (Collapsible/expandable hierarchy tree node)
        ├── RecentActivityWidget
        │   └── ActivityTimelineItem (Vertical timeline log bullet point)
        ├── QuickActionsWidget
        │   └── ActionGridButton (Icon trigger buttons)
        └── NotificationsWidget
            └── NotificationListItem (Announcements item)
```

---

## 2. Shared UI Components Candidates

The dashboard composition reuses the following core shared presentation components from `src/components/ui/`:
- `<Card>`, `<CardHeader>`, `<CardContent>` (from [cards.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/cards.md))
- `<Button>` (from [buttons.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/buttons.md))
- `<Badge>` (from [badges.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/badges.md))
- `<Drawer>`, `<DrawerContent>` (from [drawers.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/drawers.md))
- `<Dialog>`, `<DialogContent>` (from [dialogs.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/dialogs.md))
- `<PageContainer>` (from [application-shell.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/application-shell.md))

---

## 3. Widget Composition

### 3.1 Workforce Summary Widget
- **Parent**: `WorkforceSummaryWidget` (fetches workforce summary details)
- **Children**: `KPIStatsGroup`, `KPIStatCard`
- **Shared UI**: `<Card>`, `<Badge>`
- **Required Hooks**: `useWorkforceSummary()`
- **Required DTOs**: `WorkforceSummaryDTO`
- **External Dependencies**: Lucide icons.

### 3.2 Critical Alerts Widget
- **Parent**: `CriticalAlertsWidget`
- **Children**: `AlertListItem`
- **Shared UI**: `<Card>`, `<Button>`, `<Badge>`
- **Required Hooks**: `useCriticalAlerts()`
- **Required DTOs**: `AlertDTO`
- **External Dependencies**: WebSockets connection.

### 3.3 Today's Readiness Widget
- **Parent**: `TodayReadinessWidget`
- **Children**: `ReadinessGauge` (stateless SVG renderer)
- **Shared UI**: `<Card>`
- **Required Hooks**: `useDashboardSummary()`
- **Required DTOs**: `KPIWidgetDTO`
- **External Dependencies**: SVG geometry engines.

### 3.4 Attendance Summary Widget
- **Parent**: `AttendanceSummaryWidget`
- **Children**: `ReportingProgressBar`
- **Shared UI**: `<Card>`, `<Button>`
- **Required Hooks**: `useAttendanceSummary()`
- **Required DTOs**: `AttendanceSummaryDTO`
- **External Dependencies**: None.

### 3.5 Pending Approvals Widget
- **Parent**: `PendingApprovalsWidget`
- **Children**: `ApprovalListItem`
- **Shared UI**: `<Card>`, `<Button>`
- **Required Hooks**: `useDashboard()`
- **Required DTOs**: `PendingApprovalsDTO`
- **External Dependencies**: Context action modals.

### 3.6 Shift Coverage Widget
- **Parent**: `ShiftCoverageWidget`
- **Children**: `ShiftCoverageGrid`
- **Shared UI**: `<Card>`, `<Badge>`
- **Required Hooks**: `useDashboard()`
- **Required DTOs**: `ShiftCoverageDTO`
- **External Dependencies**: Date helper utilities.

### 3.7 Organization Overview Widget
- **Parent**: `OrganizationOverviewWidget`
- **Children**: `OrgUnitTreeNode` (Recursive tree structure)
- **Shared UI**: `<Card>`
- **Required Hooks**: `useDashboard()`
- **Required DTOs**: `OrganizationTreeDTO`
- **External Dependencies**: None.

### 3.8 Recent Activity Widget
- **Parent**: `RecentActivityWidget`
- **Children**: `ActivityTimelineItem`
- **Shared UI**: `<Card>`, `<Button>` (pagination loader)
- **Required Hooks**: `useDashboard()`
- **Required DTOs**: `ActivityLogDTO`
- **External Dependencies**: Auditing log schemas.

### 3.9 Quick Actions Widget
- **Parent**: `QuickActionsWidget`
- **Children**: `ActionGridButton`
- **Shared UI**: `<Card>`, `<Button>`
- **Required Hooks**: `useQuickActions()`
- **Required DTOs**: `QuickActionsListDTO`
- **External Dependencies**: Dialog launchers.

### 3.10 Notifications Widget
- **Parent**: `NotificationsWidget`
- **Children**: `NotificationListItem`
- **Shared UI**: `<Card>`, `<Badge>`
- **Required Hooks**: `useDashboard()`
- **Required DTOs**: `NotificationListDTO`
- **External Dependencies**: Real-time event notifications.

---

## 4. Feature Folder Structure

To scale dashboard expansion, we group modules under `src/features/dashboard/`:

```
src/features/dashboard/
├── components/           (Shared components used only inside dashboard feature)
│   ├── DashboardHeader.tsx
│   ├── DashboardLayout.tsx
│   └── WidgetGrid.tsx
├── widgets/              (Main widget entry wrappers, linking hooks to UI)
│   ├── WorkforceSummaryWidget.tsx
│   ├── CriticalAlertsWidget.tsx
│   ├── TodayReadinessWidget.tsx
│   ├── AttendanceSummaryWidget.tsx
│   ├── PendingApprovalsWidget.tsx
│   ├── ShiftCoverageWidget.tsx
│   ├── OrganizationOverviewWidget.tsx
│   ├── RecentActivityWidget.tsx
│   ├── QuickActionsWidget.tsx
│   └── NotificationsWidget.tsx
├── hooks/                (Dashboard hooks coordinating queries and states)
│   ├── useDashboard.ts
│   ├── useDashboardSummary.ts
│   ├── useCriticalAlerts.ts
│   ├── useAttendanceSummary.ts
│   └── useQuickActions.ts
├── types/                (Dashboard-specific Type definitions)
│   └── index.ts
├── services/             (API fetch functions and WebSockets connectors)
│   └── dashboardService.ts
├── utils/                (Helper calculations e.g. gauge arc coordinates)
│   └── gaugeHelpers.ts
└── constants/            (Static configs e.g. fallback metric icons)
    └── index.ts
```
