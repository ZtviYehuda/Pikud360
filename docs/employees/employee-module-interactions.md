# Employee Module Interactions

**Domain:** Employee
**Phase:** 12.1 — Employee Domain Architecture

---

## 1. Overview

The Employee is the central entity of Pikud360. Every major module depends on employee data in some capacity. This document defines exactly how each module interacts with the Employee domain — what data flows in which direction, what triggers the interaction, and who owns what.

### Interaction Principles

- **Employee → Module:** The Employee domain pushes events. Modules react to lifecycle changes.
- **Module → Employee:** Modules read employee data by `employee_id`. They do not own employee data.
- **No mutual ownership:** No module stores a copy of employee profile data. References are always by `employee_id`.
- **Dependency direction:** All modules depend on Employee. Employee does not depend on any module.

---

## 2. Organization Module

### Purpose

The Organization module defines the hierarchical structure of units (battalion, company, platoon, etc.). The Employee domain references this structure via `org_unit_id` — every employee belongs to exactly one unit at any time.

### Dependency Direction

```
Employee ──belongs to──► Organization
```

The Employee depends on Organization for unit resolution. Organization does not depend on Employee. Organization units may exist with zero employees.

### Interactions

| # | Interaction | Trigger | Data Exchanged | Owner |
|---|---|---|---|---|
| 1 | Employee creation | Operator creates new employee | Employee sends `org_unit_id`; Organization validates that the unit exists and is active | Employee reads; Organization owns unit |
| 2 | Employee transfer | Unit reassignment | Employee updates `org_unit_id`; both source and target units are validated | Employee writes; Organization owns unit |
| 3 | Org info enrichment | Employee profile fetch | Employee service queries organization closure table to build `organization_path` and `current_unit` enrichment | Employee reads from Organization |
| 4 | Command responsibility | Employee profile fetch | Employee service queries `organization_unit_commanders` to determine if the employee commands any units, and how many subordinates they have | Employee reads from Organization |
| 5 | Commander resolution | Employee profile fetch | Employee service resolves `commander_id` to a name via a workforce query | Employee reads from Employee (self-referential) |

### What Organization Owns

- `core.organization_units` table
- `core.organization_unit_closure` table (ancestry tree)
- `core.organization_unit_commanders` table (commander assignments)
- `core.organization_unit_types` table

### What Employee Reads

- Unit name, code, and active status
- Ancestor unit hierarchy path
- Command relationships

---

## 3. Workforce Schedule (Attendance) Module

### Purpose

The Workforce Schedule module owns the daily status of every employee — whether they are present, absent, sick, on vacation, assigned to a shift, or in training. It does not own the employee's identity or profile.

### Dependency Direction

```
WorkforceSchedule ──references──► Employee
```

The schedule module depends on Employee. Employee does not depend on the schedule module.

### Interactions

| # | Interaction | Trigger | Data Exchanged | Owner |
|---|---|---|---|---|
| 1 | Daily schedule entry creation | Commander submits attendance | Schedule module sends `employee_id`, `organization_unit_id`, `schedule_date`, `status_id` | Schedule owns the entry; Employee owns the identity |
| 2 | Employee list for scheduling | Commander opens scheduling view | Schedule module reads all employees in the unit from `workforce.employees` by `org_unit_id` | Employee owns the list |
| 3 | Active employee validation | Before creating a schedule entry | Schedule module validates that the `employee_id` is ACTIVE and not ARCHIVED | Employee provides status |
| 4 | Shift assignment | Commander creates shift | Schedule module references `employee_id` and `shift_type_id` | Schedule owns the assignment; Employee is referenced |
| 5 | Employee deactivation effect | Employee status changes to INACTIVE/ARCHIVED | Future: schedule module should receive `EmployeeDeactivated` event and nullify future schedule entries | Employee fires event; Schedule reacts |

### Data the Schedule Module Owns

```
workforce_schedule.employee_daily_schedules
├── employee_id      FK → workforce.employees
├── schedule_date
├── status_id        FK → workforce_schedule.schedule_statuses
├── shift_type_id    FK → workforce_schedule.shift_types
└── organization_unit_id
```

### Data the Schedule Module Does NOT Own

- Employee name, rank, position — always read from the Employee domain by `employee_id`
- Employee lifecycle state — always read from `workforce.employees.status`

---

## 4. Transfers Module

### Purpose

The Transfers module manages the workflow for moving an employee from one organizational unit to another. It is a process domain — it owns the transfer request, approval workflow, and completion state. It does not own the employee's assignment.

### Dependency Direction

```
Transfers ──references──► Employee
Transfers ──triggers change on──► Employee (via WorkforceService)
```

The Transfers module reads from Employee and triggers Employee mutations on approval.

### Interactions

| # | Interaction | Trigger | Data Exchanged | Owner |
|---|---|---|---|---|
| 1 | Transfer request creation | Commander requests a transfer | Transfers module records `employee_id`, `from_unit_id`, `to_unit_id`, `reason` | Transfers owns the request |
| 2 | Employee validation | Transfer request submitted | Transfers service validates that `employee_id` is ACTIVE | Employee provides status |
| 3 | Source unit validation | Transfer request submitted | Transfers service validates operator has manage scope on source unit | Employee provides `org_unit_id` |
| 4 | Target unit validation | Transfer request submitted | Transfers service validates operator has manage scope on target unit | Organization provides unit |
| 5 | Transfer approval execution | Approver approves the request | Transfers service calls `WorkforceService.update_employee()` to change `org_unit_id` | Transfers triggers; Employee owns the change |
| 6 | History recording | Transfer approved | `EmployeeHistory` entry with `change_type = EMPLOYEE_TRANSFERRED` is created | Employee owns history |
| 7 | Notification trigger | Transfer approved or rejected | Transfers service calls `NotificationService` to notify involved parties | Transfers triggers; Notifications delivers |
| 8 | Timeline entry | Employee timeline view | Employee timeline service aggregates transfer records alongside history entries | Employee reads from Transfers |

### Data the Transfers Module Owns

```
workforce.employee_transfers
├── employee_id      FK → workforce.employees
├── from_unit_id     FK → core.organization_units
├── to_unit_id       FK → core.organization_units
├── reason
├── status           PENDING | APPROVED | REJECTED | CANCELLED
├── requested_by     FK → security.users
├── approved_by      FK → security.users
├── requested_at
└── completed_at
```

### Key Rule

When a transfer is approved, the `org_unit_id` mutation happens **inside `WorkforceService`**, not inside `TransfersService`. The transfers module calls the workforce service. It does not write to `workforce.employees` directly.

---

## 5. Notifications Module

### Purpose

The Notifications module delivers messages to users. It is a delivery domain — it owns the message, its read state, and its routing. It does not own what triggered the notification.

### Dependency Direction

```
Notifications ──targets──► Employee (via user_id)
Employee events ──trigger──► Notifications
```

### Interactions

| # | Interaction | Trigger | Data Exchanged | Owner |
|---|---|---|---|---|
| 1 | Transfer approved notification | Transfers module approves a request | Notifications module receives `user_id`, `organization_unit_id`, message content, severity | Transfers triggers; Notifications owns the message |
| 2 | Transfer rejected notification | Transfers module rejects a request | Same as above | Transfers triggers; Notifications owns the message |
| 3 | Attendance reminder notification | Attendance submission incomplete | Intelligence/alerts module triggers; Notification sent to commander by `user_id` | Intelligence triggers; Notifications delivers |
| 4 | Alert notification | Threshold exceeded (sick, absent, shortage) | Notification sent to unit commander `user_id` | Intelligence triggers; Notifications delivers |
| 5 | Certification expiry notification | Certification expiry date approaches *(future)* | Employee domain raises `EmployeeCertificationExpired`; Notification sent to commander | Employee triggers *(future)*; Notifications delivers |
| 6 | Employee created confirmation | Employee record activated | Notification to admin confirming record creation *(future)* | Employee triggers *(future)*; Notifications delivers |

### Data the Notifications Module Owns

```
notifications.notifications
├── user_id          FK → security.users (nullable — unit-level notifications)
├── organization_unit_id  FK → core.organization_units
├── notification_type
├── severity
├── message
├── status           UNREAD | READ
└── read_at
```

### What the Notifications Module Does NOT Own

- Employee names or profiles — it references `user_id` for routing; display names are resolved at read time by the frontend via the employee API.
- Business rules that determine when to notify — these are owned by the triggering module.

---

## 6. Reports and Intelligence Module

### Purpose

The Reports and Intelligence module (`intelligence/`) aggregates employee data across units to produce workforce KPIs, alert thresholds, availability analysis, and commander dashboards. It is a read-only analytics domain relative to Employee.

### Dependency Direction

```
Intelligence ──aggregates──► Employee
Intelligence ──aggregates──► WorkforceSchedule
Intelligence ──reads──► Organization
```

### Interactions

| # | Interaction | Trigger | Data Exchanged | Owner |
|---|---|---|---|---|
| 1 | Dashboard summary | Commander opens dashboard | Intelligence queries `workforce.employees` and `employee_daily_schedules` by unit hierarchy to compute KPIs (total personnel, assigned, unassigned, availability %) | Intelligence reads; Employee and Schedule own data |
| 2 | Status distribution | Dashboard / report | Intelligence aggregates current-day status codes across all employees in scope | Intelligence reads from Schedule |
| 3 | Active alerts | Dashboard alerts widget | Intelligence evaluates threshold rules (sick %, shortage %) against current employee counts | Intelligence reads; Employee provides counts |
| 4 | Child unit summaries | Organization overview | Intelligence builds per-unit summaries for all child units in the org tree | Intelligence reads from Employee and Organization |
| 5 | Workforce planning | Planning views | `workforce_planning` module aggregates employee skills, service types, and availability for planning projections *(future)* | Intelligence reads; Employee will own profile attributes |
| 6 | Exports | Commander exports report | Reports module queries employee profile fields for export (name, rank, position, unit, status) | Reports reads from Employee |

### Data the Intelligence Module Does NOT Own

- Individual employee records — always reads from `workforce.employees`
- Schedule records — always reads from `workforce_schedule.employee_daily_schedules`
- Org structure — always reads from `core.organization_units`

### Performance Note

Intelligence queries involve cross-unit aggregations that may touch thousands of employee records. These should be served from read-optimized queries or materialized views, never from the live employee write path.

---

## 7. Commander Dashboard

### Purpose

The Commander Dashboard is the primary operational interface. It is a composition surface — it reads from multiple modules and displays a unified operational picture. It does not own any data.

### Dependency Direction

```
Dashboard ──reads from──► Intelligence
Dashboard ──reads from──► Employee (via Intelligence)
Dashboard ──reads from──► Transfers
Dashboard ──reads from──► Notifications
Dashboard ──reads from──► Organization
```

### Interactions

| # | Widget | Data Source | Data Requested |
|---|---|---|---|
| 1 | Workforce Summary KPIs | Intelligence → Employee + Schedule | Total personnel, present, absent, sick, vacation, course, reinforcement counts |
| 2 | Today's Readiness Score | Intelligence → Employee + Schedule | `availability_percentage` across unit hierarchy |
| 3 | Critical Alerts | Intelligence.alerts → Employee + Schedule | Active alerts (threshold breaches) per unit |
| 4 | Attendance Summary | Intelligence → Schedule | Daily reporting completion %, missing subunits |
| 5 | Pending Approvals | Transfers | Pending transfer requests requiring commander signature |
| 6 | Shift Coverage | Intelligence → Schedule | Filled vs. unfilled shift slots |
| 7 | Organization Overview | Intelligence → Employee + Organization | Per-unit readiness scores and status |
| 8 | Recent Activity | Employee History + Transfers | Chronological change feed |
| 9 | Notifications | Notifications | Unread system messages for the commander |
| 10 | Upcoming Events | Employee (future — certifications) | Expiring certifications and scheduled leave |
| 11 | Quick Actions | N/A | Links to Attendance, Scheduling, Reports pages |

### Key Rule

The dashboard never writes to employee data. All dashboard interactions with employee data go through read APIs. Action buttons (resolve alert, approve transfer) call the appropriate domain APIs — not the Employee API directly.

---

## 8. Audit and Security Module

### Purpose

The Security module owns the user authentication and authorization layer. The Audit module records every significant action in the system. The Employee domain is one of the heaviest producers of audit events.

### Dependency Direction

```
Employee ──writes to──► Audit
Employee ──reads permissions from──► Security
Security ──links to──► Employee (via user_id)
```

### Interactions

| # | Interaction | Trigger | Data Exchanged | Owner |
|---|---|---|---|---|
| 1 | Permission check on create | Employee creation | Employee service calls `can_manage_unit(user_id, tenant_id, org_unit_id)` | Security owns permission rules |
| 2 | Permission check on read | Employee profile view | Employee service calls `can_view_employee(user_id, tenant_id, org_unit_id)` | Security owns permission rules |
| 3 | Audit log: EMPLOYEE_CREATED | Employee created | Employee service writes to `security.audit_logs` | Employee triggers; Audit owns the log |
| 4 | Audit log: EMPLOYEE_UPDATED | Employee profile changed | Employee service writes to `security.audit_logs` | Employee triggers; Audit owns the log |
| 5 | Audit log: EMPLOYEE_TRANSFERRED | Employee unit changes | Employee service writes to `security.audit_logs` | Employee triggers; Audit owns the log |
| 6 | Audit log: EMPLOYEE_VIEWED | Employee profile read | Employee service writes to `security.audit_logs` | Employee triggers; Audit owns the log |
| 7 | Audit log: EMPLOYEE_DELETED | Employee soft-deleted | Employee service writes to `security.audit_logs` | Employee triggers; Audit owns the log |
| 8 | User account link | Employee created with `user_id` | `user_id` FK references `security.users.id` | Security owns the user; Employee references it |

### What Security Owns

- `security.users` — user accounts, credentials, JWT sessions
- `security.roles` and `security.permissions` — permission definitions
- `security.user_roles` — role assignments
- `security.audit_logs` — the immutable audit log table

### What Employee Reads

- `user_id` from the JWT claims (injected per-request)
- `tenant_id` from the JWT claims
- Permission checks via authorization functions

---

## 9. AI Assistant Module (Future)

### Purpose

The AI Assistant provides intelligent analysis, summaries, and recommendations for commanders. It needs access to employee data as operational context.

### Dependency Direction

```
AI ──reads context from──► Employee
AI ──reads context from──► Intelligence
AI ──reads context from──► WorkforceSchedule
```

### Planned Interactions

| # | Interaction | Trigger | Data Exchanged | Owner |
|---|---|---|---|---|
| 1 | Workforce context injection | Commander asks a question | AI receives unit summary: employee counts, readiness score, active alerts | Intelligence provides; Employee owns the data |
| 2 | Employee profile summarization | "Tell me about [name]" | AI receives employee profile data via workforce API | Employee provides |
| 3 | Historical trend analysis | "How has readiness changed?" | AI receives aggregated KPI history | Intelligence provides |
| 4 | Transfer recommendation | "Who should I transfer?" | AI reads employee rank, position, service type, and unit gaps *(future)* | Employee provides profile; Intelligence provides gaps |
| 5 | Certification alert reasoning | "Why is [name] flagged?" | AI reads certification records and expiry context *(future)* | Employee provides *(future)* |

### Key Rule

The AI Assistant must operate **read-only** with respect to employee data. It may not initiate mutations. All AI-suggested actions must be confirmed by the human commander through the standard UI.

---

## 10. Interaction Summary Matrix

| Module | Reads Employee | Writes to Employee | Triggers Employee Events | Employee Reads From |
|---|---|---|---|---|
| Organization | No | No | No | Yes — unit info, hierarchy |
| WorkforceSchedule | Yes — `employee_id`, `status` | No | No | No |
| Transfers | Yes — `employee_id`, `org_unit_id`, `status` | Via WorkforceService | Yes — transfer approved | No |
| Notifications | Indirectly via `user_id` | No | No | No |
| Intelligence / Reports | Yes — aggregation queries | No | No | Yes — org hierarchy |
| Dashboard | Via Intelligence APIs | No | No | No |
| Security / Audit | Yes — permission checks | No (receives audit writes) | No | Yes — permission functions |
| AI Assistant | Yes — profile, KPIs | No | No | Via Intelligence |

---

## 11. Data Flow Diagram

```
                          ┌──────────────────┐
                          │   Employee        │
                          │   (Aggregate Root)│
                          └────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
     ┌─────────────┐      ┌──────────────┐     ┌─────────────┐
     │ Organization │      │  Workforce   │     │  Transfers  │
     │  (reference) │      │  Schedule    │     │  (workflow) │
     └─────────────┘      └──────┬───────┘     └──────┬──────┘
                                  │                    │
                                  ▼                    ▼
                          ┌──────────────────────────────┐
                          │     Intelligence / Reports    │
                          │  (aggregation & KPI layer)    │
                          └──────────────┬───────────────┘
                                         │
                   ┌─────────────────────┼────────────────────┐
                   │                     │                    │
                   ▼                     ▼                    ▼
          ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
          │  Dashboard   │     │Notifications │    │ AI Assistant │
          │  (read only) │     │  (delivery)  │    │ (read only)  │
          └──────────────┘     └──────────────┘    └──────────────┘
                   │
                   ▼
          ┌──────────────┐
          │    Audit     │
          │  (write only)│
          └──────────────┘
```
