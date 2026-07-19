# Employee Business Rules

**Domain:** Employee
**Phase:** 12.4 — Employee Business Rules
**Depends on:** employee-business-model.md, employee-lifecycle.md, employee-field-catalog.md

---

## How to Read This Document

Rules are numbered with a prefix that indicates their category:

- `VR-` Validation Rule — governs what data is acceptable
- `LR-` Lifecycle Rule — governs state transitions and lifecycle behavior
- `SR-` Status Rule — governs how status affects system behavior
- `ER-` Editing Rule — governs who can change what and when

Each rule includes:
- **Rule ID** — Unique stable identifier for cross-referencing
- **Statement** — The rule in plain language
- **Reason** — Why this rule exists
- **Scope** — Which fields or operations it applies to

---

## Section 1: Validation Rules

Validation rules define what constitutes a valid employee record. These rules apply at creation and at every update.

---

### VR-01 — Required Fields at Activation

**Statement:** An employee record cannot be moved from `DRAFT` to `ACTIVE` unless all of the following fields are present and valid: First Name, Last Name, Employee Number, Date of Birth, Rank, Position, Service Type, Start Date, and Primary Unit.

**Reason:** An employee without these fields cannot be meaningfully tracked in scheduling, reporting, or the dashboard. Activating an incomplete record would corrupt operational data.

**Scope:** DRAFT → ACTIVE transition

---

### VR-02 — Employee Number Uniqueness

**Statement:** No two active or inactive employees within the same tenant may share the same Employee Number. The uniqueness constraint persists even after a record is archived — Employee Numbers are never recycled.

**Reason:** Employee Number is the canonical external key used in integrations with HR systems and official records. Reuse would create historical ambiguity.

**Scope:** Employee Number field

---

### VR-03 — Date of Birth Age Floor

**Statement:** The employee's Date of Birth must result in an age of at least 17 years at the time the record is created.

**Reason:** No person below 17 years of age can serve in a military organization under the applicable legal framework.

**Scope:** Date of Birth field

---

### VR-04 — Date of Birth Age Ceiling

**Statement:** The employee's Date of Birth must result in an age no greater than 80 years at the time of record creation.

**Reason:** Records older than 80 years almost certainly represent a data entry error. A ceiling prevents accidental digit transposition from creating implausible records.

**Scope:** Date of Birth field

---

### VR-05 — Date of Birth Format

**Statement:** Date of Birth must be provided in `YYYY-MM-DD` format and must be a valid calendar date. Invalid dates such as `2000-13-01` or `2000-02-30` are rejected.

**Reason:** Consistent format ensures reliable age calculations, report groupings, and expiry alert scheduling across all time zones.

**Scope:** Date of Birth field

---

### VR-06 — Name Character Set

**Statement:** First Name and Last Name fields accept only letters, including Hebrew, Arabic, and Latin characters. Digits, symbols, and control characters are not permitted.

**Reason:** Names are displayed in operational interfaces and formal reports. Non-letter characters in name fields are always a data entry error in this domain.

**Scope:** First Name, Last Name fields

---

### VR-07 — Phone Number Format

**Statement:** Phone numbers must contain between 7 and 20 characters, consisting of digits, spaces, dashes, and an optional leading `+`. Any other characters are rejected.

**Reason:** Phone numbers are used for emergency contact. A non-parseable phone number is worse than no phone number because it creates false confidence.

**Scope:** Military Phone, Personal Mobile Phone, Emergency Contact Phone fields

---

### VR-08 — Email Address Format

**Statement:** Email addresses must conform to the standard `user@domain.tld` pattern and must not exceed 254 characters.

**Reason:** 254 characters is the maximum defined by RFC 5321. Addresses that exceed this cannot be delivered.

**Scope:** Personal Email, Unit Email fields

---

### VR-09 — Start Date Cannot Be Future

**Statement:** The employee Start Date must not be in the future at the time of record creation.

**Reason:** An employee who has not yet started cannot be scheduled, counted in KPIs, or attributed to a unit. A future start date would produce incorrect operational data immediately upon activation.

**Scope:** Start Date field

---

### VR-10 — End Date Must Follow Start Date

**Statement:** Expected End Date and Actual End Date must both be on or after the employee's Start Date.

**Reason:** An end date before a start date is logically impossible and indicates a data entry error.

**Scope:** Expected End Date, Actual End Date fields

---

### VR-11 — Actual End Date Cannot Be Future

**Statement:** Actual End Date must not be in the future when set.

**Reason:** Actual End Date records when separation happened — a future date means it has not happened yet and belongs in Expected End Date instead.

**Scope:** Actual End Date field

---

### VR-12 — Certification Expiry Must Follow Issue Date

**Statement:** For every certification with both an issue date and an expiry date, the expiry date must be strictly after the issue date.

**Reason:** A certification that expires before it was issued is logically invalid and indicates a data entry error.

**Scope:** Driver License, Medical Certification, Weapons Qualification, Security Clearance, Combat Fitness Classification, Additional Certifications

---

### VR-13 — Temporary Assignment Requires Unit and Start Date

**Statement:** If Assignment Type is `TEMPORARY`, both Temporary Assignment Unit and Temporary Assignment Start Date must be provided. Neither field may be null when Assignment Type is `TEMPORARY`.

**Reason:** A temporary assignment without a unit or a start date cannot be tracked, cannot be displayed to commanders, and cannot be used to resolve scheduling scope.

**Scope:** Assignment Type, Temporary Assignment Unit, Temporary Assignment Start fields

---

### VR-14 — Temporary Assignment Unit Must Differ from Primary Unit

**Statement:** The Temporary Assignment Unit must be a different unit from the employee's Primary Unit.

**Reason:** An employee cannot be temporarily assigned to the unit they permanently belong to — this is a logical contradiction.

**Scope:** Primary Unit, Temporary Assignment Unit fields

---

### VR-15 — Commander Cannot Be Self-Referential

**Statement:** The Direct Commander field must not reference the employee's own record.

**Reason:** An employee cannot be their own direct commander. This would create circular authority relationships and cause infinite loops in hierarchy traversal.

**Scope:** Direct Commander field

---

### VR-16 — Commander Must Be Active

**Statement:** The employee referenced in the Direct Commander field must be an employee with Employment Status `ACTIVE` within the same tenant.

**Reason:** Assigning a suspended, inactive, or archived employee as a commander creates a command gap. Only active personnel can exercise command responsibility.

**Scope:** Direct Commander field

---

### VR-17 — Medical Limitation Description Required When Active

**Statement:** If Medical Limitation Active is set to `true`, Medical Limitation Description must be provided and must not be blank.

**Reason:** A limitation with no description is operationally useless. The commander cannot make informed scheduling decisions without knowing what the employee cannot do.

**Scope:** Medical Limitation Active, Medical Limitation Description fields

---

### VR-18 — Leave Balance Cannot Be Negative

**Statement:** Annual Leave Balance must be a non-negative number. A balance below zero is rejected.

**Reason:** Negative leave balance represents debt — a concept that may be valid in some HR systems but must not be imported as a negative number without explicit system support for leave debt.

**Scope:** Leave Balance field

---

### VR-19 — Security Clearance Requires Expiry

**Statement:** If Security Clearance Level is set to any value other than `NONE`, Security Clearance Expiry Date must also be provided.

**Reason:** A clearance with no expiry is operationally ambiguous. All clearances operate on renewal cycles. An expiry date is required to generate renewal alerts.

**Scope:** Security Clearance Level, Security Clearance Expiry fields

---

### VR-20 — Combat Fitness Requires Classification Date

**Statement:** If Combat Fitness Status is set, Combat Fitness Classification Date must also be provided.

**Reason:** A fitness profile without a date cannot be verified as current. The date is required to assess whether re-examination is due.

**Scope:** Combat Fitness Status, Combat Fitness Classification Date fields

---

## Section 2: Lifecycle Rules

Lifecycle rules govern when and how an employee's status may change. These rules enforce the state machine defined in `employee-lifecycle.md`.

---

### LR-01 — Status Must Follow the State Machine

**Statement:** An employee's Employment Status may only transition to states that are permitted from its current state. No arbitrary status change is allowed.

**Permitted transitions:**

| From | Permitted To |
|---|---|
| `DRAFT` | `ACTIVE`, `ARCHIVED` |
| `ACTIVE` | `ON_LEAVE`, `TEMPORARY_ASSIGNMENT`, `SUSPENDED`, `INACTIVE`, `ARCHIVED` |
| `ON_LEAVE` | `ACTIVE`, `INACTIVE` |
| `TEMPORARY_ASSIGNMENT` | `ACTIVE` |
| `SUSPENDED` | `ACTIVE`, `INACTIVE` |
| `INACTIVE` | `ACTIVE`, `ARCHIVED` |
| `ARCHIVED` | None |

**Reason:** Unrestricted status changes corrupt the audit trail and break module dependencies that rely on predictable state semantics.

**Scope:** Employment Status field

---

### LR-02 — ARCHIVED Is a Terminal State

**Statement:** Once an employee's status is set to `ARCHIVED`, no further status changes are permitted. The record becomes read-only for all operational purposes.

**Reason:** Archival is a deliberate, permanent administrative decision. Accidental reactivation of archived records would introduce ghost employees into operational data.

**Scope:** Employment Status = ARCHIVED

---

### LR-03 — Archival Requires Reason

**Statement:** Every transition to `ARCHIVED` must include a change reason recorded in the employee history. The reason field cannot be blank when archiving.

**Reason:** Archival is irreversible. The business reason must be documented for compliance, audit, and future reference.

**Scope:** INACTIVE → ARCHIVED, ACTIVE → ARCHIVED transitions

---

### LR-04 — Suspension Requires Reason

**Statement:** Every transition to `SUSPENDED` must include a reason. The reason field cannot be blank when suspending an employee.

**Reason:** Suspension has significant consequences for the individual. The business reason must be documented in the history record for legal protection and audit purposes.

**Scope:** ACTIVE → SUSPENDED transition

---

### LR-05 — Deactivation Requires Reason

**Statement:** Every transition to `INACTIVE` must include a reason (e.g., end of mandatory service, voluntary resignation, medical discharge). The reason field cannot be blank.

**Reason:** Separation is a significant lifecycle event. The reason determines how the record is used in historical reporting and whether reinstatement is possible.

**Scope:** ACTIVE → INACTIVE, ON_LEAVE → INACTIVE, SUSPENDED → INACTIVE transitions

---

### LR-06 — History Record Is Mandatory for Every Status Change

**Statement:** Every status transition must produce an immutable `EmployeeHistory` record before the change is committed. If history recording fails, the status change must be rolled back.

**Reason:** The audit trail is non-negotiable. A status change without a history record creates an untracked gap in the employee record that cannot be reconstructed.

**Scope:** All status transitions

---

### LR-07 — Temporary Assignment Cannot Transition Directly to INACTIVE

**Statement:** An employee in `TEMPORARY_ASSIGNMENT` status must first transition to `ACTIVE` before they can transition to `INACTIVE` or `ARCHIVED`.

**Reason:** Ending a temporary assignment and separating from the organization are two distinct business events. They must be recorded separately in the history.

**Scope:** TEMPORARY_ASSIGNMENT → INACTIVE / ARCHIVED

---

### LR-08 — Reactivation Is Permitted from INACTIVE Only

**Statement:** An employee in `ARCHIVED` status cannot be reactivated. Only employees in `INACTIVE` status may be transitioned back to `ACTIVE`.

**Reason:** Archival is terminal. Only inactive (not yet archived) employees retain the possibility of reinstatement (e.g., reserve soldiers recalled to active duty).

**Scope:** ARCHIVED status

---

### LR-09 — Leave Requires a Return Date

**Statement:** Every transition to `ON_LEAVE` must include an expected return date. The return date must be after the leave start date.

**Reason:** Open-ended leave with no return date cannot be tracked, cannot generate alerts, and makes scheduling impossible.

**Scope:** ACTIVE → ON_LEAVE transition

---

### LR-10 — Soft Delete Is the Only Delete Mechanism

**Statement:** Employee records are never permanently deleted from the system. Deletion is implemented exclusively as setting `deleted_at` to the current timestamp. Hard deletes are prohibited.

**Reason:** Employee records are referenced by scheduling history, attendance records, audit logs, and transfer records. Hard deletion would corrupt all referencing data and violate audit completeness requirements.

**Scope:** All delete operations

---

## Section 3: Status Rules

Status rules define what operational behaviors are permitted or prohibited based on the employee's current Employment Status.

---

### SR-01 — Only ACTIVE Employees Are Scheduled

**Statement:** Only employees with Employment Status `ACTIVE` or `TEMPORARY_ASSIGNMENT` may be assigned to daily schedule entries. All other statuses (DRAFT, ON_LEAVE, SUSPENDED, INACTIVE, ARCHIVED) are excluded from scheduling.

**Reason:** Scheduling non-active personnel would inflate unit headcounts, distort coverage metrics, and produce incorrect KPIs on the dashboard.

**Scope:** Scheduling module — all shift and status assignment operations

---

### SR-02 — Only ACTIVE Employees Count Toward Unit Headcount

**Statement:** The unit headcount used in KPI calculations (total personnel, availability percentage, shortage index) includes only employees with status `ACTIVE` or `TEMPORARY_ASSIGNMENT`. DRAFT, ON_LEAVE, SUSPENDED, INACTIVE, and ARCHIVED employees are excluded.

**Exception:** ON_LEAVE employees may be included in a separate "on leave" count for attendance reporting, but must not be included in the available-force calculation.

**Reason:** Headcount is an operational metric — it must reflect the force that is actually deployable, not the total roster.

**Scope:** Intelligence / dashboard KPI calculations

---

### SR-03 — SUSPENDED Employees Cannot Be Transferred

**Statement:** An employee with Employment Status `SUSPENDED` cannot be the subject of a transfer request. Transfer requests for suspended employees are rejected.

**Reason:** A suspension indicates an active disciplinary or administrative hold. Transferring the employee while a suspension is in progress would bypass the suspension's intent.

**Scope:** Transfers module — transfer request creation

---

### SR-04 — INACTIVE and ARCHIVED Employees Cannot Be Transferred

**Statement:** An employee with Employment Status `INACTIVE` or `ARCHIVED` cannot be the subject of a transfer request.

**Reason:** Transfers are an operational workflow for active workforce. Transfers for departed or archived personnel have no operational meaning.

**Scope:** Transfers module — transfer request creation

---

### SR-05 — DRAFT Employees Are Invisible to All Modules

**Statement:** Employees with Employment Status `DRAFT` must not appear in any module other than the employee management module itself. They must be excluded from: scheduling, KPI calculations, transfer lists, organization trees, notifications, reports, and the commander dashboard.

**Reason:** A DRAFT record is incomplete. Exposing it to operational modules would cause modules to make decisions based on partial data.

**Scope:** All modules

---

### SR-06 — Lapsed Certification Restricts Role Eligibility

**Statement:** When a certification expiry date has passed and no renewal has been recorded, the employee is automatically ineligible for any role that requires that certification. This restriction applies immediately on the expiry date.

Affected roles:
- Driver License lapsed → ineligible for driver roles
- Medical Certification lapsed → ineligible for medic roles
- Weapons Qualification lapsed → ineligible for armed roles
- Security Clearance lapsed → clearance treated as `NONE` pending renewal

**Reason:** Assigning an employee to a role they are not currently certified for is a safety and legal violation.

**Scope:** Scheduling module — role eligibility check

---

### SR-07 — Medical Limitation Restricts Shift Eligibility

**Statement:** When Medical Limitation Active is `true`, the employee must not be assigned to shift types or roles that conflict with the stated limitation. The scheduling module must enforce this restriction.

**Reason:** Assigning an employee to a role that conflicts with their medical restriction is a safety violation and may result in legal liability.

**Scope:** Scheduling module — shift assignment

---

### SR-08 — INACTIVE Employees Retain Historical Records

**Statement:** When an employee becomes `INACTIVE`, all of their historical scheduling records, attendance records, transfer records, and audit log entries are preserved and remain queryable.

**Reason:** Historical data is required for compliance, reporting, and legal purposes. Deactivation is not deletion.

**Scope:** All historical data modules

---

### SR-09 — Combat Fitness Classification Affects Deployment Eligibility

**Statement:** An employee with a Combat Fitness Classification below the minimum threshold for a specific role is ineligible for that role's scheduling assignments. When the classification expires, the employee's eligibility reverts to the next lower qualification tier pending re-examination.

**Reason:** Combat fitness classification is a legal prerequisite for frontline deployment. The system must enforce it, not just display it.

**Scope:** Scheduling module — role eligibility (future: role eligibility engine)

---

## Section 4: Editing Rules

Editing rules govern who may modify employee data, when, and under what conditions.

---

### ER-01 — Write Operations Require Scope Authorization

**Statement:** Any operation that creates, updates, or deletes an employee record requires the operator to hold `MANAGE` scope over the employee's Primary Unit within the same tenant. Without this scope, the operation is rejected with an access denied error.

**Reason:** Employee data is sensitive and operationally significant. Unrestricted editing would allow unauthorized personnel to corrupt workforce data.

**Scope:** All create, update, delete operations

---

### ER-02 — Read Operations Require View Scope or Self-Access

**Statement:** Reading an employee's profile requires either:
1. The operator holds `VIEW` scope over the employee's Primary Unit within the same tenant, **or**
2. The operator is querying their own profile (self-access).

**Reason:** Employee profiles contain personal information (contact details, medical limitations, certifications). Access must be limited to those with a legitimate operational need.

**Scope:** All read operations

---

### ER-03 — Cross-Tenant Access Is Prohibited

**Statement:** No operator may read or write employee records that belong to a different tenant. Tenant isolation is absolute.

**Reason:** Pikud360 is a multi-tenant system. Each tenant (military unit, organization) is an independent operational entity. Cross-tenant data access would violate confidentiality.

**Scope:** All operations

---

### ER-04 — Employee Number Is Immutable After Activation

**Statement:** The Employee Number cannot be changed once an employee record has been activated (status transitions from `DRAFT` to `ACTIVE`). Changes after activation require explicit admin override with a documented reason.

**Reason:** Employee Number is the canonical external key. Changing it after activation would break integrations, corrupt history records, and require system-wide record reconciliation.

**Scope:** Employee Number field, post-activation

---

### ER-05 — Date of Birth Is Immutable After Activation

**Statement:** Date of Birth cannot be changed after an employee record has been activated, except by an Admin with an explicit documented reason.

**Reason:** Date of Birth drives age calculations and eligibility rules. Changing it after the fact would retroactively alter historical compliance calculations.

**Scope:** Date of Birth field, post-activation

---

### ER-06 — Transfer Requires Scope on Both Units

**Statement:** Moving an employee to a new Primary Unit (a transfer) requires the operator to hold `MANAGE` scope over both the source unit and the target unit. Scope on only one unit is insufficient.

**Reason:** A transfer has operational consequences for two units — it removes a person from one and adds them to another. Both unit commanders must be in the operator's authority scope.

**Scope:** Primary Unit change (transfer) operation

---

### ER-07 — Self-Service Fields Are Limited

**Statement:** When an employee edits their own profile (self-service), they may only modify the following fields: Personal Mobile Phone, Personal Email, Emergency Contact details, Standard Shift Preference, Language Proficiency, Interface Language, Notification Preferences, Notification Channel, Dashboard Layout, Time Zone, Display Name, and Profile Picture.

All other fields require Commander or Admin authority to change.

**Reason:** Operational fields (rank, position, service type, unit, status, certifications) must be managed by authorized personnel. Allowing employees to edit these fields would enable unauthorized data manipulation.

**Scope:** Self-service editing operations

---

### ER-08 — Sensitive Fields Require Elevated Role

**Statement:** The following fields may only be edited by users with the `ADMIN` role or a designated specialist role:

| Field | Required Role |
|---|---|
| Date of Birth | Admin |
| National ID | Admin |
| Security Clearance Level and Expiry | Admin / Security Officer |
| Combat Fitness Classification | Admin / Medical Officer |
| Medical Limitation Active and Description | Admin / Medical Officer |
| Suspension reason and status | Admin |
| Archival reason and action | Admin |

**Reason:** These fields have legal, medical, or disciplinary significance. They must not be editable by commanders during routine operations.

**Scope:** Sensitive field edits

---

### ER-09 — History Must Be Written Before Returning Success

**Statement:** Every update operation must write an `EmployeeHistory` record before returning a success response to the caller. If history writing fails for any reason, the update must be rolled back entirely.

**Reason:** The history record is not optional logging — it is a compliance requirement. A successful update with no history record is a data integrity violation.

**Scope:** All update and delete operations

---

### ER-10 — Audit Log Must Be Written for Every Operation

**Statement:** Every create, read, update, and delete operation on an employee record must produce an entry in the security audit log. This includes read operations (EMPLOYEE_VIEWED events). Audit log failure must not silently suppress the operation — it must be logged as a system error.

**Reason:** Full audit coverage is a legal and operational requirement. The audit log must be complete enough to reconstruct every action performed on every record.

**Scope:** All CRUD operations

---

### ER-11 — Encrypted Fields Must Not Appear in Logs

**Statement:** The plaintext values of encrypted fields (Date of Birth, Phone numbers, Personal Email, National ID) must never appear in audit log entries, history snapshot records, application logs, or error messages.

**Reason:** Logging encrypted field values in plaintext would negate the encryption entirely, exposing personal data to anyone with log access.

**Scope:** Date of Birth, Phone, Email, National ID fields — all logging operations

---

### ER-12 — Archived Records Are Read-Only

**Statement:** Once an employee's status is `ARCHIVED`, the record becomes read-only. No field may be modified. Attempts to update an archived record are rejected without exception.

**Reason:** Archival is a deliberate terminal action. Modifying an archived record would corrupt the historical integrity of the record.

**Scope:** All update operations on ARCHIVED employees

---

### ER-13 — Certification Updates Trigger Re-Evaluation of Role Eligibility

**Statement:** Any change to a certification field (Driver License, Medical Certification, Weapons Qualification, Security Clearance, or Combat Fitness) must immediately trigger a re-evaluation of the employee's scheduling role eligibility. If the change results in a newly lapsed certification, any future shift assignments that depend on that certification must be flagged for review.

**Reason:** Allowing a shift assignment that was valid yesterday but is invalid today (due to a lapsed certification) is a safety violation. The system must react to certification changes in real time.

**Scope:** All certification field updates

---

### ER-14 — Fields Cannot Be Partially Updated to an Invalid State

**Statement:** An update that would leave the record in a logically inconsistent state must be rejected as a whole. Partial updates are not committed. Examples of rejected partial states:

- Medical Limitation Active = `true` with no Medical Limitation Description
- Security Clearance Level ≠ `NONE` with no Security Clearance Expiry
- Assignment Type = `TEMPORARY` with no Temporary Assignment Unit

**Reason:** Partial updates that produce inconsistent records are harder to detect than rejected updates. Rejection at the boundary protects data integrity.

**Scope:** All update operations

---

## Rule Summary Index

| ID | Category | Summary |
|---|---|---|
| VR-01 | Validation | Required fields at DRAFT → ACTIVE |
| VR-02 | Validation | Employee Number uniqueness, no recycling |
| VR-03 | Validation | Date of Birth minimum age (17) |
| VR-04 | Validation | Date of Birth maximum age (80) |
| VR-05 | Validation | Date of Birth format and validity |
| VR-06 | Validation | Name character set (letters only) |
| VR-07 | Validation | Phone number format |
| VR-08 | Validation | Email address format and length |
| VR-09 | Validation | Start Date cannot be future |
| VR-10 | Validation | End Dates must follow Start Date |
| VR-11 | Validation | Actual End Date cannot be future |
| VR-12 | Validation | Certification expiry after issue date |
| VR-13 | Validation | Temporary assignment requires unit and start date |
| VR-14 | Validation | Temporary unit must differ from primary unit |
| VR-15 | Validation | Commander cannot reference self |
| VR-16 | Validation | Commander must be ACTIVE |
| VR-17 | Validation | Medical description required when limitation is active |
| VR-18 | Validation | Leave balance cannot be negative |
| VR-19 | Validation | Security clearance requires expiry date |
| VR-20 | Validation | Combat fitness requires classification date |
| LR-01 | Lifecycle | Status must follow the state machine |
| LR-02 | Lifecycle | ARCHIVED is terminal |
| LR-03 | Lifecycle | Archival requires reason |
| LR-04 | Lifecycle | Suspension requires reason |
| LR-05 | Lifecycle | Deactivation requires reason |
| LR-06 | Lifecycle | History record mandatory on every status change |
| LR-07 | Lifecycle | TEMPORARY_ASSIGNMENT cannot go directly to INACTIVE |
| LR-08 | Lifecycle | Reactivation only from INACTIVE |
| LR-09 | Lifecycle | Leave requires a return date |
| LR-10 | Lifecycle | Soft delete is the only delete mechanism |
| SR-01 | Status | Only ACTIVE / TEMPORARY_ASSIGNMENT are scheduled |
| SR-02 | Status | Only ACTIVE / TEMPORARY_ASSIGNMENT count toward headcount |
| SR-03 | Status | SUSPENDED employees cannot be transferred |
| SR-04 | Status | INACTIVE / ARCHIVED employees cannot be transferred |
| SR-05 | Status | DRAFT employees are invisible to all modules |
| SR-06 | Status | Lapsed certification restricts role eligibility |
| SR-07 | Status | Medical limitation restricts shift eligibility |
| SR-08 | Status | INACTIVE employees retain all historical records |
| SR-09 | Status | Combat fitness classification affects deployment eligibility |
| ER-01 | Editing | Write operations require MANAGE scope |
| ER-02 | Editing | Read operations require VIEW scope or self-access |
| ER-03 | Editing | Cross-tenant access is prohibited |
| ER-04 | Editing | Employee Number immutable after activation |
| ER-05 | Editing | Date of Birth immutable after activation |
| ER-06 | Editing | Transfer requires scope on both source and target units |
| ER-07 | Editing | Self-service fields are strictly limited |
| ER-08 | Editing | Sensitive fields require elevated role |
| ER-09 | Editing | History must be written before returning success |
| ER-10 | Editing | Audit log required for every operation |
| ER-11 | Editing | Encrypted fields must not appear in logs |
| ER-12 | Editing | Archived records are read-only |
| ER-13 | Editing | Certification updates trigger role eligibility re-evaluation |
| ER-14 | Editing | Partial updates must not produce inconsistent state |
