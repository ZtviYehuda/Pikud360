# Reusable Report Filters Specification

**Domain:** Reporting  
**Phase:** 17.3 — Report Filters  
**Depends on:** reporting-domain.md, organization-hierarchy.md, report-catalog.md

---

## 1. Overview

This document specifies the reusable filtering schema used across the Pikud360 reporting engine. 

Filter components are defined once at the API schema and UI layer, allowing reports in the catalog to bind parameters dynamically.

---

## 2. Reusable Filters Catalog

---

### 2.1 Date Range (טווח תאריכים)

- **Purpose:** Restricts query output to events occurring within a specified timeframe.
- **Parameters:**
  - `startDate`: string (Date, `YYYY-MM-DD`, Required)
  - `endDate`: string (Date, `YYYY-MM-DD`, Required)
- **Validation Rules:**
  - `startDate` must be less than or equal to `endDate`.
  - Maximum query range is **366 days** (1 year) for detailed records (to prevent database query timeouts), and **5 years** for aggregate statistics.
- **Default Value:** Predefined period: `CURRENT_MONTH` (start date of current month to today's date).
- **UI Control:** Horizontal date-picker component with shortcut buttons (היום, השבוע, החודש, רבעון אחרון, שנה אחרונה).

---

### 2.2 Organization (ארגון - שורש)

- **Purpose:** Restricts queries to the global root node container of the active tenant.
- **Parameters:**
  - `tenantId`: string (UUID, Required)
- **Validation Rules:**
  - Implicitly validated against the caller's JWT token context. Callers cannot query nodes outside their registered tenant.
- **Default Value:** Caller's tenant ID.
- **UI Control:** Read-only global context, hidden from standard forms.

---

### 2.3 Brigade (חטיבה - רמה 2)

- **Purpose:** Filters records by a specific level-2 command node.
- **Parameters:**
  - `brigadeId`: string (UUID, Optional)
- **Validation Rules:**
  - Must be a child of the root Organization.
  - If the caller's view scope is limited to a specific Department or Section, the Brigade filter is disabled and locked to the caller's parent Brigade ID.
- **Default Value:** All brigades (if caller holds tenant-level scope).
- **UI Control:** Dropdown list populated via `GET /organization/units?level=2`.

---

### 2.4 Department (מחלקה - רמה 3)

- **Purpose:** Filters records by a level-3 administrative HQ node.
- **Parameters:**
  - `departmentId`: string (UUID, Optional)
- **Validation Rules:**
  - Must be a child of the selected `brigadeId`.
- **Default Value:** All departments within the selected Brigade.
- **UI Control:** Dependent dropdown (loads child options only after `brigadeId` is selected).

---

### 2.5 Section (מדור - רמה 4)

- **Purpose:** Filters records by a level-4 operational node.
- **Parameters:**
  - `sectionId`: string (UUID, Optional)
- **Validation Rules:**
  - Must be a child of the selected `departmentId`.
- **Default Value:** Caller's assigned Section ID (if commander/operator level).
- **UI Control:** Scoped search autosuggest field.

---

### 2.6 Cell (חוליה - רמה 5)

- **Purpose:** Filters records by a level-5 tactical leaf node.
- **Parameters:**
  - `cellId`: string (UUID, Optional)
- **Validation Rules:**
  - Must be a child of the selected `sectionId`.
- **Default Value:** All cells within the selected Section.
- **UI Control:** Checkbox grid layout allowing multi-select of child cells.

---

### 2.7 Employee (עובד / איש סגל)

- **Purpose:** Restricts report output to a single target employee's records.
- **Parameters:**
  - `employeeId`: string (UUID, Optional)
- **Validation Rules:**
  - Target employee must belong to a unit within the caller's active organization view scope.
- **Default Value:** All employees.
- **UI Control:** Search autosuggest input showing employee names, ranks, and Section callsigns.

---

### 2.8 Status (סטטוס)

- **Purpose:** Filters records by employee operational or attendance status.
- **Parameters:**
  - `statuses`: string[] (Array of status tokens, Optional)
- **Validation Rules:**
  - Tokens must match values defined in either `WorkforceStatus` or `AttendanceStatus` depending on the target report.
- **Default Value:** All statuses.
- **UI Control:** Multi-select tag input.

---

### 2.9 Shift (משמרת / סוג משמרת)

- **Purpose:** Filters records by specific scheduling categories.
- **Parameters:**
  - `shiftTypeIds`: string[] (UUID arrays, Optional)
- **Validation Rules:**
  - Shift type IDs must exist in the active tenant catalog.
- **Default Value:** All shifts.
- **UI Control:** Checklist dropdown.

---

### 2.10 Employment Type (סוג שירות)

- **Purpose:** Filters employees based on active force classifications (e.g., permanent force, compulsory force, or reserve duty).
- **Parameters:**
  - `serviceType`: string ('MANDATORY' | 'CONTRACT' | 'RESERVE', Optional)
- **Validation Rules:** Must match the enum.
- **Default Value:** All service types.
- **UI Control:** Segmented toggle bar.

---

## 3. Filter Binding Matrix

This matrix maps which reusable filters are supported by each report in the catalog.

| Report | Date Range | Org / Brigade / Dept | Section / Cell | Employee | Status | Shift | Service Type |
|---|---|---|---|---|---|---|---|
| **Workforce Summary** | No | Yes | Yes | No | Yes | No | Yes |
| **Attendance Report** | Yes (max 366d) | Yes | Yes | Yes | Yes | No | Yes |
| **Shift Coverage** | Yes (max 90d) | Yes | Yes | No | No | Yes | Yes |
| **Organization Report**| No | Yes | Yes | No | No | No | No |
| **Employee Status** | Yes (max 366d) | Yes | Yes | Yes | Yes | No | Yes |
| **Birthday Report** | Yes (max 30d)  | Yes | Yes | No | No | No | No |
| **Certification** | No | Yes | Yes | Yes | Yes | No | Yes |
| **Audit Report** | Yes (max 366d) | Yes | Yes | Yes | No | Yes | No |
