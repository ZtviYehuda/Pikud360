# Commander Dashboard Architecture Specification

This document details the operational architecture, widget profiles, key performance indicators (KPIs), user flows, and states of the **Commander Dashboard** in the Pikud360 application.

---

## 1. Dashboard Principles

The Commander Dashboard is built on the **Operational First** design philosophy:
1. **The 5-Second Readiness Rule**: A commander must understand the operational status, critical red zones, and immediate actions within 5–10 seconds of landing on the screen.
2. **Minimalist Information Density**: Every visual element must serve a command decision. Decorative features or aesthetic noise are prohibited.
3. **Actionable Triggers**: Visual values do not just state status—they serve as entry points to resolve exceptions immediately.
4. **Resiliency & Decoupled State**: The dashboard operates cleanly on partial data, offline cached states, and during alerts.

---

## 2. Operational Information Hierarchy

Widgets are organized by three core parameters: **Scanning Priority**, **Expected Action Speed**, and **Location on the page**.

| Scanning Level | Widgets | Operational Scan Target |
|---|---|---|
| **Level 1: Critical** | - Critical Alerts Feed<br>- Workforce Summary KPI Cards | **0 - 2 seconds**: To capture life-safety, force readiness, and missing commanders. |
| **Level 2: Important** | - Today's Readiness Chart<br>- Attendance Summary<br>- Shift Coverage Tracker | **3 - 5 seconds**: To analyze shifts, workforce shortages, and today's rosters. |
| **Level 3: Secondary** | - Pending Approvals list<br>- Organization Overview Tree | **6 - 10 seconds**: To process requests, approvals, and subunit structures. |
| **Level 4: Optional** | - Recent Activity Log<br>- System Notifications list | **Ad-hoc**: Auditing histories and system messages. |

---

## 3. Widget Inventory

Every widget features complete lifecycle behaviors to manage state transitions cleanly.

### 3.1 Workforce Summary
- **Purpose**: Displays counts of personnel by status (present, sick, vacation, course).
- **Business Value**: Immediate visibility of force readiness counts.
- **Priority**: Critical.
- **Refresh Frequency**: 60 seconds.
- **Primary Interaction**: Clicking cards redirects to the employee list filtered by status.
- **Secondary Interaction**: Long-press/hover previews a tooltip with percentages and trends.
- **Empty State**: Renders zeros in all fields.
- **Loading State**: Staggered grey rounded skeleton boxes matching layout metrics.
- **Error State**: Renders warning triangle text: "נכשלה טעינת נתונים" with a refresh icon.
- **Future Improvements**: Predictive sizing (e.g. expected sick count tomorrow based on patterns).

### 3.2 Attendance Summary
- **Purpose**: Tracks headcount reported vs headcount remaining for today.
- **Business Value**: Identifies unreported units immediately.
- **Priority**: Important.
- **Refresh Frequency**: 5 minutes.
- **Primary Interaction**: Click redirects to the Attendance reporting center.
- **Secondary Interaction**: Hover reviews list of departments missing reports.
- **Empty State**: "כל הדיווחים הושלמו" with green checkmark.
- **Loading State**: Horizontal progress bars animate inline.
- **Error State**: Displays inline warning icon with cached data stamp.
- **Future Improvements**: SMS alerts trigger to lazy report.

### 3.3 Today's Readiness
- **Purpose**: Combines attendance data with certification checklists to score readiness.
- **Business Value**: Confirms if the unit is operationally ready for dispatch.
- **Priority**: Important.
- **Refresh Frequency**: 5 minutes.
- **Primary Interaction**: Clicking the gauge redirects to the readiness summary page.
- **Secondary Interaction**: Open settings drawer to adjust weights of variables.
- **Empty State**: Gauge needle centered at 0% with warning: "אין נתוני כוח אדם".
- **Loading State**: Circular progress skeleton spinner.
- **Error State**: "נכשלה הערכת מוכנות" label.
- **Future Improvements**: Scenario simulation slider.

### 3.4 Critical Alerts
- **Purpose**: Highlight alerts requiring actions from the commander (e.g., missing commander, sick threshold exceeded).
- **Priority**: Critical.
- **Refresh Frequency**: Real-time (WebSockets).
- **Primary Interaction**: Clicking redirects to the warning details/resolution dialog.
- **Secondary Interaction**: "Dismiss" button clears warning from temporary view.
- **Empty State**: "אין התראות פעילות. המערכת תקינה."
- **Loading State**: Vertical stack of 2 pulsing lines.
- **Error State**: Red border warning box with inline retry button.
- **Future Improvements**: Escalation levels (Yellow, Orange, Red) mapping dynamically.

### 3.5 Pending Approvals
- **Purpose**: Lists requests (transfers, leaves, vacations) waiting for signature.
- **Business Value**: Prevents administrative bottlenecks.
- **Priority**: Secondary.
- **Refresh Frequency**: 5 minutes.
- **Primary Interaction**: Launches approval/rejection quick dialog.
- **Secondary Interaction**: Redirects to the request list page.
- **Empty State**: "אין בקשות הממתינות לאישורך".
- **Loading State**: Checklist placeholder items.
- **Error State**: "נכשלה טעינת בקשות".
- **Future Improvements**: Multi-select bulk approval.

### 3.6 Shift Coverage
- **Purpose**: Tracks role requirements against current rosters.
- **Business Value**: Highlights gaps in critical guard duties or shifts immediately.
- **Priority**: Important.
- **Refresh Frequency**: 5 minutes.
- **Primary Interaction**: Opens scheduling layout.
- **Secondary Interaction**: View details of missing role profile.
- **Empty State**: "כל המשמרות מאוישות במלואן".
- **Loading State**: Grid cells skeleton pulses.
- **Error State**: Cached scheduling table showing yellow warnings.
- **Future Improvements**: Auto-assign backup recommendations.

### 3.7 Organization Overview
- **Purpose**: Hierarchical subunit structure showing readiness colors.
- **Business Value**: Helps locate weak subunits instantly.
- **Priority**: Secondary.
- **Refresh Frequency**: 1 hour.
- **Primary Interaction**: Expands nested subunit nodes.
- **Secondary Interaction**: Focus node opens subunit detail dashboard.
- **Empty State**: "לא הוגדרו יחידות בארגון".
- **Loading State**: Tree skeleton outline nodes.
- **Error State**: Gray tree nodes with error alerts.
- **Future Improvements**: Heatmap view toggle.

### 3.8 Recent Activity
- **Purpose**: Timeline of actions performed.
- **Business Value**: Audit trail for commander overview.
- **Priority**: Optional.
- **Refresh Frequency**: 10 minutes.
- **Primary Interaction**: Click launches activity details log.
- **Secondary Interaction**: N/A.
- **Empty State**: "אין פעילויות אחרונות ב-24 שעות האחרונות".
- **Loading State**: Timeline visual bullet items pulsing.
- **Error State**: "נכשלה טעינת יומן פעילויות".
- **Future Improvements**: Custom activity search bar.

### 3.9 Quick Actions
- **Purpose**: Shortcuts to key actions.
- **Business Value**: Speed up routine admin tasks.
- **Priority**: Important.
- **Refresh Frequency**: Static.
- **Primary Interaction**: Opens action dialog (e.g. Add Employee dialog).
- **Secondary Interaction**: N/A.
- **Empty State**: N/A.
- **Loading State**: N/A.
- **Error State**: N/A.
- **Future Improvements**: Pin/unpin dynamic actions.

### 3.10 Notifications
- **Purpose**: System messages.
- **Business Value**: General announcements and system info.
- **Priority**: Optional.
- **Refresh Frequency**: Live.
- **Primary Interaction**: Opens notifications tray panel.
- **Secondary Interaction**: Marks as read.
- **Empty State**: "אין הודעות חדשות".
- **Loading State**: List skeleton rows.
- **Error State**: Inline retry label.
- **Future Improvements**: Email/push settings configuration.

---

## 4. KPI Definitions

| KPI Name | Operational Meaning | Business Value | Display Priority | Refresh Frequency | Critical Threshold |
|---|---|---|---|---|---|
| **Available Personnel Ratio** | Percentage of active personnel fit for duty out of total force size. | Direct measure of combat readiness. | Critical | 60 seconds | **< 85%** (Turns Red) |
| **Unreported Attendance Rate** | Count of subunits/employees who haven't reported attendance by target morning hour. | Identifies discipline or communication breakdowns. | Critical | 5 minutes | **> 5%** outstanding |
| **Commander Presence Status** | Checks if all critical team leaders are actively present on shifts. | Ensures leadership structures are operating. | Critical | Real-time | **Any critical commander missing** |
| **Mandatory Shift Coverage** | Ratio of assigned shifts vs required positions. | Highlights gaps in base security or monitoring. | Important | 5 minutes | **< 100%** coverage |
| **Expiring Certification Ratio** | Count of critical licenses (e.g., medics, drivers) expiring within 14 days. | Alerts for upcoming capabilities deficits. | Secondary | 1 hour | **> 3 expiring certs** |

---

## 5. User Journeys

### 5.1 Morning Readiness Review
- **Starting Point**: Dashboard home.
- **Goal**: Commander confirms the unit is fully operational at start of day.
- **Navigation Path**:
  1. Checks **Workforce Summary** KPIs (verify Present vs Sick).
  2. Scans **Critical Alerts Feed** for missing leadership positions.
  3. Checks **Today's Readiness** gauge score.
- **Expected Outcome**: Commander confirms 92% readiness or drills down to fix missing reports.

### 5.2 Attendance Exception
- **Starting Point**: Critical alerts banner showing "Missing reports in Subunit C".
- **Goal**: Resolve the attendance reporting delay.
- **Navigation Path**:
  1. Clicks the alert card.
  2. Redirects to attendance page filtered by Subunit C.
  3. Uses Quick Actions to send lazy report ping or calls commander.
- **Expected Outcome**: Subunit C reports attendance, and the warning is resolved.

### 5.3 Quick Employee Creation
- **Starting Point**: Quick Actions card.
- **Goal**: Register a reinforcement worker arriving at the base.
- **Navigation Path**:
  1. Clicks "Add Employee" button.
  2. Dialog sheet slide out.
  3. Fills fields and clicks "Submit".
- **Expected Outcome**: Employee is added, and the Workforce summary updates instantly.

---

## 6. Dashboard States

### 6.1 First Login / Empty Organization
- **Visible Widgets**: Quick Actions (showing "Configure Subunits", "Add first employee"), Empty Notifications.
- **Hidden Widgets**: Workforce Summary, Attendance Charts, Readiness Gauges, Shift Coverage trees.
- **User Messaging**: "ברוך הבא לפיקוד360. התחל בבניית המבנה הארגוני והוספת עובדים ראשונים."
- **Available Actions**: Add Subunit, Add Employee, Import CSV.

### 6.2 No Attendance Data
- **Visible Widgets**: Workforce Summary (showing totals, but zero present), Quick Actions, Critical Alerts (showing "התרעה: לא הוזן דיווח נוכחות להיום").
- **Hidden Widgets**: Today's Readiness gauge.
- **User Messaging**: "דיווח נוכחות יומי לא הוזן עדיין. אנא דאג להזנת נוכחות מכל המחלקות."
- **Available Actions**: Send Report reminder, Manually enter reports.

### 6.3 Offline Mode
- **Visible Widgets**: All widgets display cached database states.
- **Hidden Widgets**: Real-time alerts feed (replaced with static state warning).
- **User Messaging**: "המערכת במצב לא מקוון. הנתונים המוצגים נכונים לשעה 10:15."
- **Available Actions**: Local database entry cache (will sync when online).

### 6.4 High Alert
- **Visible Widgets**: Critical Alerts (expanded on top, taking 80% screen space), Workforce Summary (highly condensed).
- **Hidden Widgets**: Upcoming events, activity logs, notification panels.
- **User Messaging**: "מצב כוננות גבוהה פעיל. התרכז במענה להתראות מבצעיות."
- **Available Actions**: Broadcast warning, Emergency force call.

### 6.5 Maintenance Mode
- **Visible Widgets**: None.
- **Hidden Widgets**: All widgets.
- **User Messaging**: "המערכת בטיפול תחזוקה שוטף. נחזור לפעילות בשעה 12:00."
- **Available Actions**: N/A (Displays screen blocker).

---

## 7. Responsive Layout Strategy

- **Desktop**: 3-column modular layout. Sidebars handle quick commands and timelines, keeping the main view area focused on charts, KPI blocks, and organizational trees.
- **Tablet**: 2-column layout. Quick action toolbar is collapsed to icon buttons, while metrics and gauges occupy the right side.
- **Mobile**: 1-column layout. Swipeable horizontal lists are used for KPIs (Workforce cards) to prevent vertical scroll fatigue. Floating action buttons (FAB) replace the quick action box for single-thumb access.

---

## 8. Future Extensibility

- **AI Operational Assistant**: Exposes a docked floating widget slot at the bottom-right corner.
- **Live Personnel Map**: Main content panel is designed to swap layouts, rendering a GIS vector map component during exercises without affecting surrounding KPIs.
- **Incident Feed**: A dedicated alert group inside `Critical Alerts` registry permits injecting server-sent security logs.
