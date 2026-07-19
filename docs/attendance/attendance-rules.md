# Attendance Business Rules

**Domain:** Attendance  
**Phase:** 13.3 — Attendance Business Rules  
**Depends on:** attendance-domain.md, attendance-statuses.md

---

## 1. Overview

This document specifies the validation rules, status flags, and reporting deadlines governing the daily attendance cycle in Pikud360. 

These rules are enforced by the `AttendanceService` on the backend and mapped to warning indicators in the frontend UI.

---

## 2. Check-In & Check-Out Rules

Check-In and Check-Out actions define the boundaries of the employee's physical presence at their station.

---

### AR-01 — Daily Check-In Window

- **Statement:** Employees scheduled for an on-site shift (e.g. Present, Office, Field) must log their Check-In between 30 minutes prior to the shift start time and up to 15 minutes after the shift start time.
- **Reason:** Validates punctual presence while allowing a reasonable transition window.
- **Effect of violation:**
  - Check-in before `Start - 30 min`: Flagged as "Early Check-In" (allows check-in but triggers warning log).
  - No check-in by `Start + 15 min`: Triggers "Late Arrival" state (see Section 4).

---

### AR-02 — Check-Out Window

- **Statement:** Check-Out is allowed from 15 minutes prior to the shift end time up to 2 hours after the shift end time.
- **Reason:** Enforces complete shift presence while preventing stale active sessions if an employee forgets to check out.
- **Effect of violation:**
  - Check-out before `End - 15 min`: Flagged as "Early Departure" (see Section 5).
  - No check-out by `End + 2 hours`: System automatically issues an auto-check-out flag with a status warning "Forgot Check-Out".

---

### AR-03 — Geofencing Restraints (Future Capability)

- **Statement:** Check-In and Check-Out actions must originate within the GPS geofence configured for the target organizational unit (e.g. within 200 meters of the base coordinate), unless the employee's status is `REMOTE` or `BUSINESS_TRIP`.
- **Reason:** Prevents fraudulent check-ins from off-site locations.
- **Effect of violation:** Blocks the action and returns error code `GEOFENCE_VIOLATION`.

---

## 3. Missing Reports (דוחות חסרים)

Unsubmitted daily roll calls distort organization-level readiness metrics.

---

### AR-04 — Daily Unit Submission Deadline

- **Statement:** Unit commanders must submit their finalized daily attendance report (roll call) by 09:00 AM daily.
- **Reason:** Ensures parent units (battalions, brigades) have an accurate readiness assessment for morning briefs.
- **Effect of violation:**
  - At 09:01 AM: The unit status is flagged as "MISSING_REPORT" (דיווח חסר).
  - Sends a high-priority notification to the unit commander and a warning summary to the parent commander.

---

### AR-05 — Unassigned Fields Block Submission

- **Statement:** A commander cannot submit the daily report if any active employee in the unit remains with the status `UNKNOWN` (unassigned).
- **Reason:** Enforces complete personnel accountability.
- **Effect of violation:**
  - The submit button is disabled in the UI.
  - API returns `400 UNREPORTED_PERSONNEL_EXISTS` with the list of unassigned employee IDs.

---

## 4. Late Arrivals (הגעה מאוחרת)

Punctuality rules identify operational gaps early in the shift cycle.

---

### AR-06 — Late Arrival Threshold

- **Statement:** An employee who has not checked in by `Start + 15 minutes` is flagged as "LATE".
- **Reason:** Identifies potential absenteeism or travel delays.
- **Effect:**
  - Renders a yellow indicator badge in the daily scheduling monitor.
  - If no check-in is received by `Start + 60 minutes`, status is automatically updated to `ABSENT` (AWOL), triggering rule AR-07.

---

### AR-07 — AWOL Escalation

- **Statement:** When an employee is flagged as `ABSENT` (AWOL) due to missing check-in or manual commander reporting:
  - An immediate notification is sent to the direct commander.
  - The employee's readiness indicator for the day is set to `false`.

---

## 5. Early Departures (עזיבה מוקדמת)

Rules to verify that employees complete their scheduled obligation.

---

### AR-08 — Early Departure Threshold

- **Statement:** A Check-Out logged more than 15 minutes before the scheduled shift end time is flagged as "EARLY_DEPARTURE".
- **Reason:** Tracks compliance with shift schedules.
- **Effect:**
  - Requires the employee (or commander) to select a reason dropdown (e.g. Medical, Approved Release).
  - Renders an alert indicator on the shift summary page.

---

## 6. Overnight Shifts (משמרות לילה ורצף)

Special date boundary rules for shifts that cross midnight.

---

### AR-09 — Midnight Date Allocation

- **Statement:** A shift that crosses midnight (e.g. 22:00 to 06:00) is attributed entirely to the calendar date on which the shift **started**.
- **Reason:** Prevents a single shift from appearing as two separate, partial days in payroll and attendance reports.
- **Example:** A shift starting Monday at 22:00 and ending Tuesday at 06:00 is recorded as a Monday attendance record.

---

### AR-10 — Rest Period Restraints

- **Statement:** An employee completing an overnight shift (ending after 04:00 AM) cannot be scheduled for a new shift or reported as `Present` within 8 hours of their checked-out time.
- **Reason:** Enforces mandatory rest periods for physical safety.
- **Effect:** The scheduling interface displays a conflict warning if a new shift overlaps with the rest window.

---

## 7. Holidays & Weekends (חגים וסופי שבוע)

Automatic status templates for non-working calendar dates.

---

### AR-11 — Weekend Auto-Populate

- **Statement:** For days not configured in the employee's `standardWorkDays` (typically Friday-Saturday), the system auto-populates the daily status to `WEEKEND` (or the tenant's configured weekend status) at 00:00 AM.
- **Reason:** Eliminates the need for manual submission on standard non-working days.
- **Effect:** These entries do not trigger missing report alerts.

---

### AR-12 — Holiday Calendar Sync

- **Statement:** The system imports the tenant's regional holiday calendar. On official holidays, active personnel default to `HOLIDAY` (חופשת חג) status unless explicitly scheduled for an essential duty shift.
- **Reason:** Automates attendance reporting for standard holiday closures.

---

## 8. Manual Corrections (תיקון ידני)

Audit trail rules for changes made after a report is finalized.

---

### AR-13 — Correction Window Limits

- **Statement:** Unit commanders may modify or correct submitted attendance records up to 30 days in the past. Corrections beyond 30 days are locked and require Admin authorization.
- **Reason:** Protects historical payroll and integrity audits from retroactive tampering.

---

### AR-14 — Mandatory Correction Justification

- **Statement:** Any manual correction to a submitted or overridden attendance record requires the operator to provide an explicit reason from a catalog or write a text note.
- **Reason:** Ensures accountability for changes to finalized records.
- **Effect:** The PATCH API rejects updates where `changeReason` is absent.

---

## Rule Summary Index

| Rule ID | Category | Summary |
|---|---|---|
| **AR-01** | Check-In | Check-in window is `Start - 30m` to `Start + 15m` |
| **AR-02** | Check-Out | Check-out window is `End - 15m` to `End + 2h`. Auto-closes after 2h. |
| **AR-03** | Check-In/Out | GPS Geofencing verification (except Remote/Trip) |
| **AR-04** | Missing Report | Unit roll call submission deadline is 09:00 AM daily |
| **AR-05** | Missing Report | UNKNOWN status blocks final submission |
| **AR-06** | Late Arrival | Late flag at `Start + 15m`. Auto-AWOL at `Start + 60m`. |
| **AR-07** | Late Arrival | AWOL triggers commander alert and strips availability |
| **AR-08** | Early Departure | Check-out before `End - 15m` requires release reason |
| **AR-09** | Overnight Shift | Cross-midnight shifts match the start date |
| **AR-10** | Overnight Shift | Mandatory 8-hour rest after overnight shift |
| **AR-11** | Holidays | Weekends auto-populate based on standard work days |
| **AR-12** | Holidays | Holiday sync defaults non-duty staff to holiday status |
| **AR-13** | Corrections | Retroactive changes limited to 30 days (Admin-only after) |
| **AR-14** | Corrections | Mandatory justification text for all manual updates |
