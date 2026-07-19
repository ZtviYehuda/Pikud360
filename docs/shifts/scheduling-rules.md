# Workforce Scheduling Rules

**Domain:** Shift Management / Scheduling  
**Phase:** 14.3 — Scheduling Rules  
**Depends on:** shift-domain.md, shift-types.md

---

## 1. Overview

This document specifies the core operational constraints, safety policies, and manager override workflows that govern the assignment of personnel to shifts in Pikud360. 

These rules are evaluated by the backend scheduling validation engine and surfaced as error alerts or override prompts in the scheduling interface.

---

## 2. Maximum Shift Hours

Limits placed on an employee's shift time to prevent exhaustion and maintain operational safety.

---

### SR-01 — Maximum Daily Shift Hours

- **Statement:** An employee must not be scheduled to work more than 12 shift hours within any single 24-hour calendar day.
- **Exceptions:**
  - Emergency deployments (Special Assignment) under explicit commander override.
  - Active Standby duty (locked to exactly 12 hours - SR-02).
- **Enforcement:** The system blocks assignments exceeding this limit and returns error code `EXCEEDS_DAILY_LIMIT`.

---

### SR-02 — Maximum Weekly Shift Hours

- **Statement:** An employee must not exceed 48 scheduled shift hours within any single calendar week (Sunday-Saturday).
- **Exceptions:**
  - Extended emergency scenarios (Special Assignment).
- **Enforcement:** The system flags assignments that exceed 48 hours as "Over-Capacity" (see Section 7) and requires commander justification.

---

### SR-03 — Maximum Continuous Duty Duration

- **Statement:** An individual shift assignment must not exceed 12 continuous hours. Any duty block requiring presence longer than 12 hours must be split into multiple shifts with distinct personnel.
- **Reason:** Prevents fatigue-induced failures in high-vigilance roles (e.g. guard duty, monitoring).

---

## 3. Minimum Rest Buffers

Mandatory off-duty periods required between shift assignments to ensure physical recuperation.

---

### SR-04 — Standard Inter-Shift Rest Buffer

- **Statement:** Every employee must have a minimum of 8 continuous hours of off-duty rest between the end of one shift assignment and the start of the next.
- **Reason:** Protects the basic biological rest cycle of personnel.
- **Effect of violation:** The scheduling engine blocks the second assignment if the gap is less than 8 hours, returning `REST_BUFFER_VIOLATION`.

---

### SR-05 — Post-Overnight Shift Rest Buffer

- **Statement:** An employee completing a Night Shift (ending after 04:00 AM) or a 12-hour Standby Shift must be granted a minimum of 12 continuous hours of off-duty rest.
- **Reason:** Accounts for circadian disruption caused by night work.
- **Effect of violation:** Blocks subsequent assignments within the 12-hour window.

---

## 4. Consecutive Shift Limits

Constraints on repeating similar shift types to avoid burnout.

---

### SR-06 — Night Shift Consecutiveness

- **Statement:** An employee must not be scheduled for more than 2 consecutive Night Shifts.
- **Reason:** Avoids cumulative sleep debt.
- **Effect:** Selecting an employee for a 3rd consecutive night shift triggers a strict block.

---

### SR-07 — Standby Duty Consecutiveness

- **Statement:** An employee completing a 12-hour Standby Shift cannot be scheduled for another Standby Shift within 48 hours of checkout.
- **Reason:** High-vigilance duty slots require an extended rest recovery period.

---

## 5. Holidays & Weekend Rules

Rotation and fairness rules for non-working calendar dates.

---

### SR-08 — Weekend Duty Rotation

- **Statement:** An employee scheduled for weekend duty (Friday-Saturday) must be exempt from weekend duty on the subsequent calendar week. Weekend duties must rotate uniformly across the unit roster.
- **Reason:** Ensures fair distribution of weekend obligations.
- **Effect:** The scheduler displays a warning "Scheduled Last Weekend" when selecting an employee who served on the previous weekend.

---

### SR-09 — Holiday Rotation Alignment

- **Statement:** The system tracks major holidays. An employee who served on a holiday shift (e.g., Rosh Hashanah) must be prioritized for exemption on the next major holiday (e.g., Yom Kippur).
- **Reason:** Maintains equity in holiday roster assignments.
- **Effect:** Renders a list filter category: "Exempt due to previous holiday duty".

---

### SR-10 — Weekend Off-Duty Buffer

- **Statement:** An employee who is exempt from weekend duty must not have any shifts scheduled between Thursday 22:00 and Sunday 07:00.
- **Reason:** Protects the complete weekend rest period for non-duty personnel.

---

## 6. Overtime / Over-Capacity Definitions

Defining thresholds where personnel assignments enter high-workload states.

---

### SR-11 — Overtime Thresholds

- **Daily Overtime:** Scheduled hours exceeding 8 hours in a single day.
- **Weekly Overtime:** Scheduled hours exceeding 40 hours in a single week.
- **Roster Overtime:** Assigning an employee to a shift when the unit's coverage requirements are already met (superfluous staffing).
- **Effect:** Overtime hours are tracked separately in reports and exported for payroll validation.

---

## 7. Manager Approval Override Workflows

Enforces accountability when a commander intentionally violates a scheduling constraint due to operational necessity.

---

### SR-12 — Constraint Gating Levels

The scheduling engine categorizes rules into two gating levels:

1. **SOFT BLOCKS (warnings)**: Rules that can be overridden by a commander by providing a justification.
   - Rules: Weekly hours limit (SR-02), Weekend rotation (SR-08), Holiday rotation (SR-09).
2. **HARD BLOCKS (strict blocks)**: Rules that cannot be overridden by routine commanders. Updates require Admin override.
   - Rules: Daily max hours (SR-01), Continuous duration limits (SR-03), Standard rest buffers (SR-04), Post-night rest buffers (SR-05), Consecutive night shifts (SR-06).

---

### SR-13 — Override Justification Logging

- **Statement:** When a commander overrides a Soft Block in the scheduling interface:
  - The commander must select an override reason from a standard list (e.g. Operational Emergency, Roster Shortage) or write a custom justification.
  - The system creates a pending approval log or writes an immediate warning log to the shift audit history.
  - Sends a notification to the parent unit commander summarizing the override.

---

### SR-14 — Pending Approval Queue

- **Statement:** Any schedule containing a Soft Block override remains in `PENDING_APPROVAL` status. It cannot be `PUBLISHED` (visible to employees) until the commander signs off on the override summary screen.

---

## Rule Summary Index

| Rule ID | Category | Summary | Gating Level |
|---|---|---|---|
| **SR-01** | Max Hours | Max 12 shift hours in a 24-hour day | **HARD BLOCK** |
| **SR-02** | Max Hours | Max 48 shift hours in a calendar week | **SOFT BLOCK** |
| **SR-03** | Max Hours | Max 12 continuous hours in a single shift | **HARD BLOCK** |
| **SR-04** | Rest Gaps | Min 8 hours of rest between shifts | **HARD BLOCK** |
| **SR-05** | Rest Gaps | Min 12 hours of rest after night/standby shifts | **HARD BLOCK** |
| **SR-06** | Consecutiveness | Max 2 consecutive Night shifts | **HARD BLOCK** |
| **SR-07** | Consecutiveness | Min 48 hours between Standby shifts | **HARD BLOCK** |
| **SR-08** | Weekends | Weekend duty rotation (no back-to-back weekends) | **SOFT BLOCK** |
| **SR-09** | Holidays | Holiday duty rotation alignment | **SOFT BLOCK** |
| **SR-10** | Weekends | Non-duty weekend starts Thursday 22:00 to Sunday 07:00 | **SOFT BLOCK** |
| **SR-11** | Overtime | Defines daily (8h+) and weekly (40h+) overtime | **Report Only** |
| **SR-12** | Overrides | Defines rule categories (Soft Blocks vs. Hard Blocks) | **System** |
| **SR-13** | Overrides | Mandatory justification reason logging for overrides | **System** |
| **SR-14** | Overrides | Unresolved overrides keep schedule in PENDING_APPROVAL | **System** |
