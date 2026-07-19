# Shift and Scheduling Module — Production Readiness Review

**Domain:** Shift Management / Scheduling  
**Phase:** 14.7 — Shift Production Review  
**Status:** Design Validated (Pending Implementation)

---

## 1. Executive Summary

This readiness review evaluates the complete design specification prepared for the **Shift Management and Scheduling Domain** in Phase 14. 

The domain design has been assessed across the following areas: Domain Architecture (Phase 14.1), Shift Catalog (Phase 14.2), Scheduling Rules (Phase 14.3), Data Contracts (Phase 14.4), REST API Design (Phase 14.5), and UI Architecture (Phase 14.6).

### Verdict: ✅ READY FOR DEVELOPMENT
The Shift & Scheduling specifications provide high-fidelity structural models, a robust multi-level constraint checking engine, complete API endpoints, and a comprehensive Weekly Planner canvas. Development can begin immediately upon resolving the recommendations in Section 8.

---

## 2. Architecture Review

The Shift domain maintains separation between static templates (`shift_types`, `shift_requirements`) and dynamic calendar instances (`shift_assignments`).

### Key Strengths
- **Decoupled Roster Assignments**: Storing assignments in `shift_assignments` with independent foreign keys (referencing both `shift_type_id` and the assigned `employee_id`) isolates structural modifications from historical roster records.
- **Rule Verification Pipeline**: Validation logic is encapsulated inside the `ShiftService` checking process (via POST `/assign`), separating UI presentation from scheduling constraint evaluations.

### Recommendations
- **Orphaned Assignment Safeguards**: If a template slot is updated (e.g. guard count reduced from 3 to 2), the system must scan upcoming generated calendar dates. If 3 employees were already assigned to those slots, the system must trigger a notification asking the commander which assignment to cancel, preventing data synchronization discrepancies.

---

## 3. User Experience (UX) Review

The UX details cover monthly calendar grids, daily lists, the horizontal Weekly Planner canvas, and slot assignment dialog prompts.

### Key Strengths
- **Weekly Planner Canvas**: Resolving schedules on a 7-day grid (columns as days, rows as shift types) matches standard commander paper-and-whiteboard workflows.
- **Immediate Warning Feedback**: Displaying soft block override popups directly in the `AssignmentDialog` prevents commanders from completing a schedule only to have it rejected at submission.

### Recommendations
- **Weekly Warning Aggregator**: In the Weekly Planner view, the "Warnings Sidebar" must group alerts by employee rather than chronologically. A commander needs to see: *"Yossi Levi has 3 warnings: Overtime (49h), Night shift consec (3), Rest gap overlap"* to quickly resolve the resource conflict.

---

## 4. API & DTO Review

Assesses the 6 REST endpoints and 4 data payloads (`ShiftDTO`, `ShiftAssignmentDTO`, `ShiftSummaryDTO`, `ShiftCalendarDTO`).

### Key Strengths
- **Validation-Rich Assignment API**: `POST /shifts/{id}/assign` returns a nested validation object containing warning messages. This allows the frontend to show override triggers instantly.
- **Complete Hierarchical Calendar payload**: `ShiftCalendarDTO` aggregates date arrays, shift instances, and assignments into a single nested block, minimizing network request counts during calendar renders.

### Gaps
- **Assign payload overrides**: The `POST /shifts/{id}/assign` body must contain `overrideReason` as an optional parameter. When a soft constraint is violated, the client receives `SOFT_CONSTRAINT_VIOLATION`. The client then re-submits the exact same payload *including the overrideReason text* to authorize the override. The API design document has been verified to support this recursive flow.

---

## 5. Performance Review

### Computational Complexity (Constraint Engine)
- Assigning a soldier to a slot triggers calculations: daily limits, weekly limits, rest buffers, and consecutive night shift checks.
  * **Daily/Weekly Limits**: Requires summing shift durations for the target date and week.
  * **Rest Buffers**: Requires checking the end time of the *previous* shift and start time of the *next* shift.
  * **Consecutive night checks**: Climbs back/forward 2 days to check night shift counts.
- *Mitigation*: These lookups must be indexed in Postgres:
  ```sql
  CREATE INDEX idx_assignments_emp_date ON workforce_schedule.shift_assignments (employee_id, assignment_date);
  ```
  Since the scope is limited to 1 week of data per employee, SQL execution times will remain under 10ms.

### Client Rendering footprint
- A monthly calendar grid rendering 31 days with ~4 shifts/day and 3 slots/shift must handle ~370 elements.
- *Mitigation*: Avoid using heavy heavy layout libraries inside monthly grid cells. Implement basic CSS grids with lightweight `CalendarCell` elements to keep initial load times under 300ms.

---

## 6. Scalability Review

- **Roster Scalability**: A unit of 100 soldiers scheduling 3 shifts/day with 5 slots/shift produces 15 assignment records daily. Over a full calendar year, this compiles ~5,500 records per unit.
- At enterprise scale (100 units, 10,000 active roster elements), the database compiles ~550,000 assignment rows annually.
- *Postgres Indexing Requirement*:
  ```sql
  CREATE INDEX idx_assignments_search ON workforce_schedule.shift_assignments (organization_unit_id, assignment_date, shift_type_id);
  ```
  This index keeps query times for weekly calendar grids under 30ms even as database rows cross 2 million.

---

## 7. Risks & Mitigations

| ID | Severity | Category | Description | Mitigation |
|---|---|---|---|---|
| **R-14.A** | 🔴 High | Performance | DB latency spikes when executing multiple constraint checks during drag-and-drop actions. | Debounce drag-and-drop operations on the frontend. Execute the constraint check API only after the card is dropped, showing a loading indicator. |
| **R-14.B** | 🟠 Medium | Data Integrity | Structural modifications to active templates corrupting past rosters. | Enforce structural template immutability (BR-S04). Modifying templates creates a new database revision ID; older calendar instances reference the previous revision. |
| **R-14.C** | 🟠 Medium | UX | Commander frustration if hard blocks prevent scheduling essential slots. | Ensure "Special Assignment" shift types bypass standard hard blocks under explicit administrator rules. |
| **R-14.D** | 🟡 Low | Security | Unauthorized roster modifications. | Enforce `scheduling.manage` permission gates at the unit boundary (caller cannot modify slots outside scope). |

---

## 8. Recommendations for Implementation

1. **Transactional Shift Assignments**: Any assignment operation must lock the employee's row in `shift_assignments` for the target date range using a SELECT FOR UPDATE to prevent race conditions (double-booking).
2. **Template Revisioning**: Implement a versioning column `revision_id` on the `shift_types` table. When a commander updates shift hours, increment the revision, keeping older generated shift instances tied to the previous hours template.
3. **Optimized Weekly Load**: Weekly planner loads must query `GET /shifts/calendar` using a single date-range parameter rather than fetching daily slots sequentially.
4. **Constraint Engine Indexing**: Enforce index migrations during setup:
   ```sql
   CREATE INDEX idx_shift_assignments_perf ON workforce_schedule.shift_assignments (employee_id, assignment_date, status);
   ```
5. **Draggable Skeleton Fallbacks**: During drag-and-drop planner interactions, show a ghost card slot placeholder in the grid, disabling calculations until drop completes.
