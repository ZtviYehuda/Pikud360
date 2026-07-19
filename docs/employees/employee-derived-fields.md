# Employee Derived Fields

**Domain:** Employee
**Phase:** 12.5 — Employee Derived Fields
**Depends on:** employee-business-model.md, employee-field-catalog.md, employee-business-rules.md

---

## Overview

Derived fields are values that are **not stored on the employee record**. They are calculated at the moment they are needed, from data that already exists in the system.

A derived field has three properties that matter:

- **Business meaning** — what the value communicates to a human
- **Calculation** — what inputs are combined and how
- **Refresh trigger** — what event makes the current value stale

Derived fields must never be stored as columns on the employee record. Storing them would create two sources of truth and eventually produce inconsistencies that are difficult to detect and expensive to fix.

---

## 1. Age

### Business Meaning

Age is the employee's current age in completed years. It is used in demographic reports, eligibility checks (minimum service age, maximum service age), and workforce analytics. It communicates how long the person has been alive, which is distinct from how long they have served.

Age is displayed in:
- Employee profile view (read-only field)
- Demographic breakdown reports
- Age-based eligibility filters

### Calculation

```
Age = Current Date − Date of Birth (in completed years)

Example:
  Date of Birth: 1997-04-15
  Current Date:  2026-07-19
  Age = 29 years (the 2026 birthday has passed in April)

Example:
  Date of Birth: 1997-09-01
  Current Date:  2026-07-19
  Age = 28 years (the 2026 birthday has not yet occurred in July)
```

The calculation uses the calendar date only. Time of day is not relevant. The year boundary is crossed on the calendar day that matches the birth month and day.

### Refresh Trigger

Age changes once per year — on the employee's birthday. Any system that displays age must recalculate it from Date of Birth on each request. It must never be cached across days.

| Event | Effect on Age |
|---|---|
| Date of Birth field set or corrected | Age recalculates immediately |
| Each new calendar day | Age may increment if today is the employee's birthday |
| Any other field change | No effect on Age |

---

## 2. Years of Service

### Business Meaning

Years of Service is the total length of the employee's current continuous service period, expressed in completed years. It communicates seniority and is used in:

- Seniority-based scheduling priority
- Leave entitlement calculations (service length may affect leave quotas)
- Workforce tenure reports
- Eligibility for promotion consideration

Years of Service reflects how long the person has been serving in their current employment relationship — not their age, and not their lifetime military history. If an employee separates and is reinstated, the counter restarts from the new Start Date.

### Calculation

```
Years of Service = Current Date − Employment Start Date (in completed years)

Example:
  Start Date:   2020-03-01
  Current Date: 2026-07-19
  Years of Service = 6 years (6 full years since March 2020)
```

For employees with a manually entered Seniority Level (used when prior external service is credited), Years of Service is presented as:

```
Displayed Years of Service = Seniority Level (manual credit) + Years Since Start Date
```

When a manual Seniority Level is not set, the calculation uses Start Date alone.

### Refresh Trigger

Years of Service increments once per year on the anniversary of the employment Start Date.

| Event | Effect on Years of Service |
|---|---|
| Employment Start Date set or corrected | Recalculates immediately from the new start date |
| Seniority Level field updated | Display value updates immediately |
| Employee becomes INACTIVE | Freezes — no longer increments; reflects tenure at separation |
| Employee reinstated (INACTIVE → ACTIVE) | Calculation restarts from the new activation date unless a manual credit is applied |
| Each new calendar day | May increment if today matches the anniversary of Start Date |

---

## 3. Availability

Availability is a family of derived fields, not a single value. Different parts of the system need different views of an employee's availability.

---

### 3a. Today's Operational Availability

**Business Meaning**

A boolean indicator: is this employee operationally available right now, today?

Availability in this sense is the answer to the commander's primary question: *"Can I count on this person for duty today?"*

It is displayed in:
- Dashboard workforce summary (present / absent counts)
- Scheduling module (available vs. unavailable)
- Unit readiness calculation

**Calculation**

```
Today's Operational Availability =
  Employment Status is ACTIVE or TEMPORARY_ASSIGNMENT
  AND
  Today's daily schedule status is NOT in the absence category
  (i.e., not SICK, VACATION, UNASSIGNED, or equivalent absence status)
  AND
  Medical Limitation Active is false
  (or the medical limitation does not restrict the relevant role)
```

An employee is available today only if all three conditions are true simultaneously. A status of ACTIVE is necessary but not sufficient — they must also have reported as present on today's schedule.

**Refresh Trigger**

| Event | Effect |
|---|---|
| Today's schedule entry created or updated | Recalculates immediately |
| Employment Status changes | Recalculates immediately |
| Medical Limitation Active changes | Recalculates immediately |
| Date changes (midnight rollover) | Recalculates — yesterday's schedule entry no longer applies |

---

### 3b. Unit Availability Percentage

**Business Meaning**

The proportion of a unit's active workforce that is operationally available on a given day. This is the primary KPI displayed on the Commander Dashboard readiness gauge.

It communicates: *"What fraction of this unit's strength is on duty and capable right now?"*

**Calculation**

```
Unit Availability % =
  (Number of ACTIVE employees with a present schedule status today)
  ÷
  (Total number of ACTIVE employees in the unit)
  × 100

Rounded to the nearest whole number.

Example:
  Unit has 100 ACTIVE employees
  78 have a present schedule status today
  22 have absence statuses (sick, vacation, unassigned)

  Availability % = 78 / 100 × 100 = 78%
```

Employees in `DRAFT`, `ON_LEAVE`, `SUSPENDED`, `INACTIVE`, or `ARCHIVED` status are excluded from both numerator and denominator.

**Refresh Trigger**

| Event | Effect |
|---|---|
| Any employee's daily schedule status changes | Unit availability recalculates |
| Any employee joins or leaves the unit (transfer) | Unit availability recalculates |
| Any employee's Employment Status changes | Unit availability recalculates |
| Date changes (midnight rollover) | Availability resets — new day's schedule applies |

---

### 3c. Leave Days Remaining

**Business Meaning**

The number of unused vacation days the employee has available in the current calendar year. Used to assess whether a leave request can be approved and to display leave balance in the employee profile.

**Calculation**

```
Leave Days Remaining = Annual Leave Entitlement − Leave Days Used

Where:
  Annual Leave Entitlement = the leave balance granted for this calendar year
  Leave Days Used = total approved leave days recorded for this employee in the current year

Example:
  Entitlement: 21 days
  Used: 9 days
  Remaining: 12 days
```

Leave Days Used is itself derived from the count of approved leave records for the current year — it is not entered manually (see SR-01 in business rules).

**Refresh Trigger**

| Event | Effect |
|---|---|
| A leave request is approved | Leave Days Used increments; Remaining decrements |
| A leave request is cancelled after approval | Leave Days Used decrements; Remaining increments |
| Annual leave entitlement is updated (HR sync or admin change) | Remaining recalculates from the new entitlement |
| Calendar year rolls over | Entitlement resets to the new year's allocation; Used resets to zero |

---

## 4. Certification Status

Each certification tracked on an employee has a derived status value that describes its current validity. This value is not stored — it is calculated from the certification's recorded dates relative to today.

---

### 4a. Individual Certification Status

**Business Meaning**

A label that communicates the current state of a single certification to a commander or administrator at a glance:

| Status | Meaning |
|---|---|
| `VALID` | The certification is current and the employee is eligible for roles that require it |
| `EXPIRING_SOON` | The certification will expire within 30 days — a renewal action is needed |
| `CRITICAL` | The certification will expire within 7 days — urgent renewal action is needed |
| `EXPIRED` | The certification expiry date has passed — the employee is ineligible for roles requiring it |
| `NOT_HELD` | The employee does not hold this certification |

**Calculation**

```
Given: Expiry Date for the certification, Current Date

If Expiry Date is not set:
  Status = NOT_HELD

Else if Current Date > Expiry Date:
  Status = EXPIRED

Else if (Expiry Date − Current Date) ≤ 7 days:
  Status = CRITICAL

Else if (Expiry Date − Current Date) ≤ 30 days:
  Status = EXPIRING_SOON

Else:
  Status = VALID
```

This calculation applies independently to each certification: Driver License, Medical Certification, Weapons Qualification, Security Clearance, Combat Fitness Classification, and each entry in Additional Certifications.

**Refresh Trigger**

| Event | Effect |
|---|---|
| Certification expiry date set or updated | Status recalculates immediately |
| Current date advances past a threshold (30 days, 7 days, 0 days) | Status transitions at midnight on the threshold day |
| Certification renewed (new expiry date recorded) | Status returns to VALID immediately |

---

### 4b. Overall Certification Health

**Business Meaning**

A single summary label that reflects the worst-case status across all certifications held by the employee. This is the value displayed in list views and the commander dashboard where showing all individual certifications would be too verbose.

| Status | Meaning |
|---|---|
| `ALL_VALID` | All certifications are current |
| `EXPIRING_SOON` | At least one certification expires within 30 days |
| `CRITICAL` | At least one certification expires within 7 days |
| `EXPIRED` | At least one certification has expired |
| `NO_CERTIFICATIONS` | The employee holds no tracked certifications |

**Calculation**

```
Overall Health = worst status across all individual certification statuses

Priority order (worst to best):
  EXPIRED > CRITICAL > EXPIRING_SOON > VALID

If no certifications are recorded:
  Overall Health = NO_CERTIFICATIONS

If any certification is EXPIRED:
  Overall Health = EXPIRED

Else if any certification is CRITICAL:
  Overall Health = CRITICAL

Else if any certification is EXPIRING_SOON:
  Overall Health = EXPIRING_SOON

Else:
  Overall Health = ALL_VALID
```

**Refresh Trigger**

| Event | Effect |
|---|---|
| Any individual certification status changes | Overall Health recalculates immediately |
| A certification is added or removed | Overall Health recalculates immediately |

---

## 5. Command Scope

### Business Meaning

Command Scope describes the organizational level at which this employee exercises formal command authority — for example, Platoon, Company, or Battalion. It communicates the breadth of the commander's responsibility.

It is displayed in:
- Employee profile — organizational information section
- Dashboard organization tree
- Reports on command structure

### Calculation

```
Command Scope =
  The unit type name of the highest-level unit
  for which this employee is registered as an active commander
  in the organization_unit_commanders table.

Example:
  Employee is registered as commander of "פלוגה א'" (Company A)
  Company A has type "פלוגה" (Company)

  Command Scope = "פלוגה" (Company)

If the employee commands no unit:
  Command Scope = None
```

### Refresh Trigger

| Event | Effect |
|---|---|
| Employee is assigned as commander of a unit | Command Scope updates to reflect the new unit's type |
| Employee is removed as commander of a unit | Command Scope recalculates from remaining assignments |
| A commanded unit's type changes | Command Scope recalculates |

---

## 6. Subordinate Count

### Business Meaning

The total number of employees who fall under this person's command responsibility — directly or through subordinate units. It communicates the scale of the commander's operational responsibility.

It is displayed in:
- Employee profile — organizational information section
- Organization overview widget on the dashboard

### Calculation

```
Subordinate Count =
  COUNT of all ACTIVE employees
  in all units that are descendants of any unit
  for which this employee is registered as an active commander.

This includes employees in directly commanded units
and employees in all child units at any depth.

Example:
  Employee commands Company A
  Company A has 3 platoons
  Platoon 1: 28 employees
  Platoon 2: 31 employees
  Platoon 3: 25 employees
  Company HQ: 6 employees

  Subordinate Count = 28 + 31 + 25 + 6 = 90

Only ACTIVE employees are counted.
DRAFT, ON_LEAVE, SUSPENDED, INACTIVE, and ARCHIVED employees are excluded.
```

### Refresh Trigger

| Event | Effect |
|---|---|
| Any employee in a subordinate unit becomes ACTIVE | Count increments |
| Any employee in a subordinate unit becomes INACTIVE or ARCHIVED | Count decrements |
| A new unit is added as a child of a commanded unit | Count expands to include the new unit's employees |
| A unit is removed from the command hierarchy | Count contracts |
| The commander is assigned to or removed from a unit | Count fully recalculates |

---

## Summary

| Derived Field | Inputs | Refresh Frequency |
|---|---|---|
| Age | Date of Birth, Current Date | Daily (on birthday) |
| Years of Service | Start Date, Seniority Level, Current Date | Daily (on anniversary) |
| Today's Operational Availability | Employment Status, Today's Schedule Entry, Medical Limitation | Per schedule change; daily at midnight |
| Unit Availability % | All employees' schedule statuses, Employment Status | Per schedule change; daily at midnight |
| Leave Days Remaining | Leave Entitlement, Approved Leave Records | Per approved or cancelled leave |
| Individual Certification Status | Certification Expiry Date, Current Date | Daily (at threshold crossings) |
| Overall Certification Health | All individual certification statuses | Per certification change; daily |
| Command Scope | Organization unit commander assignments, Unit types | Per commander assignment change |
| Subordinate Count | All active employees in descendant units | Per employee status change, unit structure change |
