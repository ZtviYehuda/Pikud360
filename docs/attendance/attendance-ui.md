# Attendance UI Architecture

**Domain:** Attendance  
**Phase:** 13.6 — Attendance UI Architecture  
**Depends on:** attendance-data-contracts.md, attendance-statuses.md

---

## 1. Overview

This document specifies the UI Architecture for the Attendance module. It defines the page structures, routing scopes, component relationships, state allocations, and responsibilities for all required views.

---

## 2. Pages

---

### 2.1 Attendance Dashboard

**Route:** `/attendance/dashboard`  
**Purpose:** High-level overview of unit readiness and reporting compliance.

#### Responsibilities
- Displays aggregate readiness KPIs across the commander's unit hierarchy.
- Tracks sub-unit reporting progress (reports submitted, draft, or overdue).
- Surfaces warning cards for overdue reports (past the 09:00 AM submission deadline - AR-04).
- Highlights critical indicators (e.g. sick leave thresholds exceeded, AWOL counts).

#### Layout Structure
- **Header**: Title "לוח בקרה — נוכחות", Date switcher, and "דיווח יומי" navigation shortcut.
- **KPI Block (`DailySummary`)**: Present, sick, absent, vacation, and unassigned counts.
- **Reporting Grid**: Lists child units recursively, showing status (green check for submitted, yellow draft, red overdue badge) and submission timestamps.

---

### 2.2 Daily Attendance (מנהלת נוכחות יומית)

**Route:** `/attendance/workspace`  
**Purpose:** The primary operational dashboard where commanders report and modify daily roll call.

#### Responsibilities
- Renders the list of active unit personnel for the selected date.
- Allows row-by-row status updates using the status picker dropdown.
- Implements bulk actions (select multiple, apply a status, add comments in bulk).
- Handles validation checks (disables fields if the record is locked - AR-13; disables submission if unassigned rows exist - AR-05).
- Displays inline check-in/out stamps and compliance flags (LATE, EARLY).
- Displays the "Submit Daily Report" confirmation action.

#### Layout Structure
- **Filter Toolbar**: Search, unit dropdown, status category filters (Available, Unavailable, Unassigned).
- **KPI Strip (`DailySummary`)**: Aggregated counts updating in real time.
- **Personnel Table**: Column headers for Name, Rank, Scheduled Shift, Daily Status (editable), Check-In, Check-Out, and Notes.

---

### 2.3 History (ארכיון תיקונים)

**Route:** `/attendance/history`  
**Purpose:** A dedicated audit view listing manual corrections.

#### Responsibilities
- Queries `GET /attendance/history` to load the list of adjustments.
- Filters corrections by date range, employee name, or unit.
- Displays previous status vs. corrected status, modified timestamp, operator name, and the mandatory correction reason.
- Renders the results as a scrolling chronological `Timeline` feed.

---

### 2.4 Employee Attendance (זמינות עובד)

**Route:** `/employees/:id/attendance` (or embedded in Employee Profile tab)  
**Purpose:** Historical presence record for an individual employee.

#### Responsibilities
- Loads the employee's attendance logs for a selected year/month.
- Renders a monthly heat-map grid (`Calendar`) showing daily status color codes.
- Lists accumulated summary stats for the current year (total present, sick days, vacations taken, AWOL counts).
- Integrates with the employee's active medical restrictions and leave periods.

---

### 2.5 Corrections (טופס תיקון ידני)

**Component Scope:** Dialog / Drawer  
**Purpose:** The interactive workflow to adjust a submitted daily entry.

#### Responsibilities
- Prefills the target date, current status, and check-in/out times.
- Disables fields if the entry is locked (> 30 days in the past - AR-13).
- Validates that a correction reason is selected or written before enabling save (AR-14).
- Submits changes to `PATCH /attendance/{id}`.
- Re-evaluates scheduling conflicts and fires warnings if overlaps are detected (AR-10).

---

## 3. Shared Components

---

### 3.1 Status Badge (`AttendanceStatusBadge`)

**Purpose:**  
Visual visualization of an employee's daily status.

**Responsibilities:**
- Renders a colored pill container containing the Hebrew status label and a status-specific icon.
- Mapped tokens (conforming to `attendance-statuses.md` definitions):
  - `PRESENT` → Emerald Green, `UserCheck` icon.
  - `SICK` → Rose Red, `Stethoscope` icon.
  - `VACATION` → Sky Blue, `Palmtree` icon.
  - `ABSENT` → Red, `UserX` icon.
  - `UNKNOWN` → Slate, `HelpCircle` icon.
- Supports `sm` (compact table cells) and `md` (cards/details views) sizes.

---

### 3.2 Timeline (`AttendanceTimeline`)

**Purpose:**  
Displays historical correction audit logs.

**Responsibilities:**
- Accepts an array of `AttendanceHistoryDTO` objects.
- Renders a vertical dotted timeline track.
- Each event card displays:
  - Timestamp (`modifiedAt`) formatted as `DD/MM/YYYY HH:mm`.
  - Operator description (e.g. "עודכן על ידי רס\"ן דוד לוי").
  - Status transition indicator (`[משרד] ➔ [מחלה]`).
  - Correction justification note in a callout block.

---

### 3.3 Calendar (`AttendanceCalendar`)

**Purpose:**  
Grid visualization of an individual's attendance history.

**Responsibilities:**
- Renders a standard 7-column calendar month grid (Sunday-Saturday).
- Each date cell displays the day number and is colored according to the employee's status code for that date.
- Hovering over a date cell displays a tooltip containing status details, check-in/out times, and notes.
- Clicking an active date cell (for authorized operators) opens the `Corrections` dialog.

---

### 3.4 Daily Summary (`AttendanceDailySummary`)

**Purpose:**  
KPI aggregate summary strip placed above workspaces.

**Responsibilities:**
- Displays a horizontal sequence of 5 count cards: Total, Present, Absent, Sick, and Unassigned.
- Number elements animate on update.
- Each card can be clicked to apply a filter shortcut (e.g., clicking the "Absent" card immediately filters the workspace table to show only absent employees).

---

### 3.5 Attendance Card (`AttendanceCard`)

**Purpose:**  
Renders individual status panels in mobile responsive layouts.

**Responsibilities:**
- Responsive fallback for table rows on smaller viewports.
- Displays: avatar, name, rank, status badge picker, check-in/out times, and a text icon button for notes.
- Renders a validation alert indicator if the entry is unassigned or flagged as late.
- Includes a checkbox for bulk selection.

---

## 4. Component Hierarchy Diagram

```
AttendanceListPage (Daily Attendance Workspace)
├── AttendanceDailySummary (KPI aggregate strip)
├── FilterToolbar (Search + Unit selector + Status category filters)
├── DataTable (Table view for desktop)
│   ├── TableHeaders (Sortable columns)
│   └── TableRows (Employee info + AttendanceStatusBadge + check times)
└── CardGrid (Responsive grid view for mobile)
    └── AttendanceCard
        ├── EmployeeAvatar
        └── AttendanceStatusBadge

EmployeeProfilePage
└── AttendanceTab
    ├── AttendanceDailySummary (Individual annual stats)
    └── AttendanceCalendar (Month grid view)
        └── Tooltip details

HistoryPage
└── AttendanceTimeline (Correction feed)
```

---

## 5. State Ownership & Data Flow

```
          API (GET /attendance)
                 │
                 ▼ (JSON payloads)
       useAttendanceList (Custom Hook)
                 │
                 ▼ (state: records, summary, loading, error)
         DailyAttendancePage (owns Date, Unit, Selection state)
                 │
                 ├─────► AttendanceDailySummary (receives summary counts)
                 │
                 ├─────► FilterToolbar (receives/emits query filters)
                 │
                 └─────► Table / Grid Components
                             │
                             ▼ (updates triggered row-by-row)
                    Status Picker Dropdown
                             │
                             ▼ (emits Update DTO)
                     Corrections Dialog (validates changeReason)
                             │
                             ▼ (PATCH /attendance/{id})
                            API
```
