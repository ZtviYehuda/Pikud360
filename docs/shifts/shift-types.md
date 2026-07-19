# Shift Types Catalog

**Domain:** Shift Management  
**Phase:** 14.2 — Shift Types  
**Depends on:** shift-domain.md

---

## 1. Overview

This document specifies the standard catalog of **7 shift types** supported in Pikud360. 

These shift structures define default durations, operational roles, eligibility profiles, and rest buffers. Individual units reference these types when creating active weekly templates.

---

## 2. Shift Catalog Reference

---

### 2.1 Morning Shift (משמרת בוקר)

- **Description:** The primary daytime operational shift. Focuses on routine on-site operations, administrative tasking, and active base maintenance.
- **Default Hours:** `07:00` to `15:00` (8 hours duration).
- **Eligibility:**
  - Open to all active personnel in the unit.
  - Requires at least 1 Commander-qualified employee to be assigned to the shift leadership slot.
  - Medical limitations: Must check that assignees do not have limitations blocking "standard physical duty".
- **Business Rules:**
  - Counts as standard available presence.
  - Requires a minimum 12-hour rest buffer since the employee's last night shift.
  - Maximum consecutive morning shifts permitted for an employee: 5 within a single calendar week.

---

### 2.2 Evening Shift (משמרת ערב)

- **Description:** The secondary operational shift covering late afternoon and evening hours. Oversees operations continuity and shift handovers.
- **Default Hours:** `15:00` to `23:00` (8 hours duration).
- **Eligibility:**
  - Open to all active personnel.
  - Requires at least 1 shift leader slot to be staffed by a Sergeant rank or higher.
- **Business Rules:**
  - Counts as standard available presence.
  - Requires a minimum 8-hour rest buffer before the employee can start a subsequent morning shift.
  - Consecutive evening shifts permitted: Up to 4.

---

### 2.3 Night Shift (משמרת לילה)

- **Description:** The third daily operational shift covering night-time surveillance, security patrols, and critical systems monitoring.
- **Default Hours:** `23:00` to `07:00` (8 hours duration - crosses the midnight boundary).
- **Eligibility:**
  - Restricted to active personnel with current Weapons Qualification (AR-06) and a minimum Combat Fitness Status (פרופיל) of `72` if assigned to guard slots.
  - Ineligible: Employees with active medical restrictions blocking night shifts.
  - Restricted for mandatory service soldiers: Cannot exceed 2 night shifts per week.
- **Business Rules:**
  - Attributed entirely to the calendar date on which the shift **starts** (AR-09).
  - Enforces a mandatory **8-hour rest buffer** post-checkout (AR-10). Assignee cannot check in to any shift before 15:00.
  - Consecutive night shifts: Capped at 2.

---

### 2.4 Standby Shift (כוננות)

- **Description:** On-site readiness duty. Employees are present at the station, fully geared, and prepared to deploy immediately in response to an alert.
- **Default Hours:** `08:00` to `20:00` or `20:00` to `08:00` (12 hours duration).
- **Eligibility:**
  - Requires active personnel with weapons qualifications and high fitness profiles (`82` or higher).
  - Ineligible: Employees on light duty (פטור עבודה משרדית בלבד) or with physical restrictions.
- **Business Rules:**
  - Counts as "On-Duty" (Present) but flagged specifically as "Standby".
  - Staffing slots require a designated emergency driver slot (requires Driver License class `C1` or higher).
  - Maximum shift duration is locked to 12 hours. Requires a mandatory 24-hour rest buffer after completion.

---

### 2.5 On Call Shift (כוננות בית / הקפצה)

- **Description:** Off-site standby duty. The employee is off-site (usually at home) but must remain reachable and able to report to the station within a configured response window (e.g. 2 hours).
- **Default Hours:** `17:00` to `08:00` (15 hours duration) or full 24-hour blocks on weekends.
- **Eligibility:**
  - Open to all active personnel.
  - Must have active personal contact details registered (Personal Mobile Phone).
- **Business Rules:**
  - Counts as "On-Call" (Standby status in availability metrics, does not count as on-site physical headcount).
  - Notes field must specify the response time requirement (e.g., "כוננות הקפצה שעתיים").
  - Multiple concurrent on-call assignments are permitted if they do not conflict with the employee's physical shift rest windows.

---

### 2.6 Training (אימון / הדרכה)

- **Description:** Shift block allocated to courses, weapons retraining, professional certifications, or tactical exercise drills.
- **Default Hours:** `08:00` to `17:00` (9 hours duration).
- **Eligibility:**
  - Open to all active personnel.
  - Course instructor slots require specific instructor certifications (e.g., First Aid Instructor).
- **Business Rules:**
  - Counts as "Unavailable Today" for routine shift rotations (categorized under "Training" in KPIs).
  - Completion of a training shift updates the employee's weapons qualification date or certification fields (upon commander confirmation).
  - Ineligible for simultaneous duty shift assignments.

---

### 2.7 Special Assignment (משימה מיוחדת)

- **Description:** Off-schedule ad-hoc tasks, such as special operations, VIP escorts, external liaison meetings, or emergency reinforcement details.
- **Default Hours:** Custom start/end times (variable duration, custom defined per template).
- **Eligibility:**
  - Depends on the specific assignment scope (e.g., driver license or high security clearance required).
  - Requires commander review and manual bypass flags if assigning an employee with minor scheduling conflicts.
- **Business Rules:**
  - Counts as "Available Today" (but flagged as external assignment).
  - The notes field must document the operational task ID and authorization command.
  - Can overlap with standard shifts only under explicit commander authorization.

---

## 3. Comparative Summary

| Shift Type | Default Hours | Default Duration | Availability Category | Minimum Rest Buffer Post-Shift |
|---|---|---|---|---|
| **Morning** | 07:00–15:00 | 8 hours | AVAILABLE | 8 hours |
| **Evening** | 15:00–23:00 | 8 hours | AVAILABLE | 8 hours |
| **Night** | 23:00–07:00 | 8 hours | AVAILABLE | 8 hours |
| **Standby** | 08:00–20:00 | 12 hours | AVAILABLE | 24 hours |
| **On Call** | 17:00–08:00 | 15 hours | AVAILABLE (On-Call) | None (unless called up) |
| **Training** | 08:00–17:00 | 9 hours | UNAVAILABLE (Training) | 8 hours |
| **Special** | Custom | Custom | AVAILABLE (Special) | Varies (default 8h) |
