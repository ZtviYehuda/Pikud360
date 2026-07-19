# Global Report Catalog

**Domain:** Reporting  
**Phase:** 17.2 — Report Catalog  
**Depends on:** reporting-domain.md, organization-hierarchy.md

---

## 1. Overview

This document specifies the global report catalog for Pikud360. It defines the business purpose, database queries sources, filter inputs, and available download outputs (CSV, PDF) for the 8 core reports in the system.

---

## 2. Reports Reference

---

### 2.1 Workforce Summary (סיכום מצבת סגל)

- **Purpose:** Compiles a snapshot of unit strength, counts, and rank structures across the target organization subtree.
- **Data Source:** `workforce.employees` joined against `core.organization_units` and `core.organization_unit_closure` tables.
- **Filters:**
  - `scopeNodeId` (UUID of the target Brigade, Department, Section, or Cell).
  - `rank` (filter by specific rank values).
  - `employmentStatus` (Active, Suspended, Leave, Draft).
- **Export Formats:**
  - **CSV**: Details raw list fields (Employee ID, Name, Rank, Primary Unit, Assignment Date).
  - **PDF**: Renders a formatted layout containing headcount summarizations, rank percentages, and bar charts showing strength comparisons across sub-nodes.

---

### 2.2 Attendance Report (דוח נוכחות תקופתי)

- **Purpose:** Compiles daily check-in logs, presence statuses, late/absence tallies, and roll call sign-off flags for a specified date range.
- **Data Source:** `attendance.attendance_records` joined with `workforce.employees` and `core.organization_units`.
- **Filters:**
  - `scopeNodeId` (Brigade, Department, Section, or Cell scope).
  - `dateRange` (start and end date parameters).
  - `attendanceStatus` (Present, Late, Absent, Sick, Leave, AWOL).
  - `signOffStatus` (All, Signed off only, Unsigned only).
- **Export Formats:**
  - **CSV**: Detailed row listing of check-in times, coordinates, late minutes, and manager comments.
  - **PDF**: Monthly tabular calendar layout color-coding daily statuses (Green/Yellow/Red) per employee.

---

### 2.3 Shift Coverage (דוח כיסוי משמרות)

- **Purpose:** Analyzes scheduling coverage levels (filled slots vs. required slots) and lists unstaffed requirements.
- **Data Source:** `workforce_schedule.shift_assignments` joined with `workforce_schedule.shift_requirements` and `core.organization_units`.
- **Filters:**
  - `scopeNodeId` (Brigade, Department, or Section scope).
  - `dateRange` (week-to-week or month-to-month ranges).
  - `coveragePercentageThreshold` (e.g. show shifts with < 90% coverage).
- **Export Formats:**
  - **CSV**: Raw list of shift instances, slot positions, active assignees, and staffing gaps.
  - **PDF**: Operational planner report containing coverage graphs, unfilled alert sheets, and overtime index metrics.

---

### 2.4 Organization Report (מבנה יחידות ומפקדים)

- **Purpose:** Documents the organization hierarchy structure, listing active units, child node counts, and commander histories.
- **Data Source:** `core.organization_units` joined with `core.organization_unit_closure` and `workforce.employees`.
- **Filters:**
  - `scopeNodeId` (restrict tree generation to subtree path).
  - `includeInactive` (boolean to show deactivated nodes).
  - `level` (filter by Brigade, Department, Section, or Cell levels).
- **Export Formats:**
  - **CSV**: Flat list of nodes, levels, parent paths, and active commander details.
  - **PDF**: Organizational chart visualization mapping structure paths recursively.

---

### 2.5 Employee Status Report (דוח סטטוס סגל וזמינות)

- **Purpose:** Tracks availability logs, leave limits, sickness rates, and secondment details across the workforce.
- **Data Source:** `workforce.employees` joined with status tables.
- **Filters:**
  - `scopeNodeId` (Brigade, Department, Section, or Cell scope).
  - `statusCategory` (SICK_LEAVE, ANNUAL_LEAVE, SUSPENDED, DEPLOYED).
  - `dateRange` (active availability timeframes).
- **Export Formats:**
  - **CSV**: Roster grid detailing employee IDs, active availability states, start/end dates, and total leave days accumulated.
  - **PDF**: Summary dashboard containing leave percentage gauges and historical trend charts.

---

### 2.6 Birthday Report (דוח ימי הולדת)

- **Purpose:** Lists upcoming employee birthdays by week or month to support unit social management.
- **Data Source:** `workforce.employees` joined with `core.organization_units`.
- **Filters:**
  - `scopeNodeId` (Brigade, Department, Section, or Cell scope).
  - `month` (1 to 12).
  - `nextDays` (e.g. birthdays occurring in the next 7, 14, or 30 days).
- **Export Formats:**
  - **CSV**: Basic row list (Name, Rank, Node, Birthday Date).
  - **PDF**: Social calendar template.
  - **PII Guard**: The birth *year* and age fields are omitted from the export files (only birthday month and day are visible) to satisfy privacy requirements.

---

### 2.7 Certification Report (מעקב הסמכות וכשירות)

- **Purpose:** Tracks employee professional certifications (e.g. rescue driver, medic), validation states, and upcoming expirations.
- **Data Source:** `workforce.employee_certifications` joined with `workforce.employees` and `core.organization_units`.
- **Filters:**
  - `scopeNodeId` (Brigade, Department, Section, or Cell scope).
  - `certificationType` (filter by specific course qualifications).
  - `expiryStatus` (All, Active, Expired, Expiring in 30 days).
- **Export Formats:**
  - **CSV**: List of employees, qualifications, serial numbers, issue dates, and expiry dates.
  - **PDF**: Roster readiness report outlining qualified personnel counts and expiring warning alerts.

---

### 2.8 Audit Report (דוח חריגות ואירועי אבטחה)

- **Purpose:** Compiles a record of soft block scheduling overrides (safety rules bypassed), login failure logs, and tenant setting mutations.
- **Data Source:** `core.audit_logs` joined with `workforce.employees` and `core.organization_units`.
- **Filters:**
  - `scopeNodeId` (Brigade, Department, or Section scope).
  - `auditCategory` (SECURITY_BYPASS, RULES_OVERRIDE, SETTINGS_MUTATION).
  - `dateRange` (time boundary).
- **Export Formats:**
  - **CSV**: Log database rows (Event Name, Actor ID, Target ID, Timestamp, Override Reason text).
  - **PDF**: Compliance report highlighting warning logs, credential locks, and commander override logs.
