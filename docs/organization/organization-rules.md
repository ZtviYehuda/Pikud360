# Organization Business Rules

**Domain:** Organization  
**Phase:** 15.3 — Organization Business Rules  
**Depends on:** organization-domain.md, organization-hierarchy.md

---

## 1. Overview

This document specifies the validation rules, security behaviors, transfer controls, and naming constraints governing the organization hierarchy tree in Pikud360. 

These rules are enforced by the `OrganizationService` at the core boundary layer.

---

## 2. Employee Assignment Rules

Rules governing where and how employees may be assigned to nodes in the hierarchy tree.

---

### OR-01 — Leaf Node Assignment Only

- **Statement:** Active employees must only be assigned directly to terminal leaf nodes in the tree structure (Level 4: `Section` or Level 5: `Cell`). Direct assignment of general workforce personnel to Level 1 (`Organization`), Level 2 (`Brigade`), or Level 3 (`Department`) is prohibited.
- **Reason:** Prevents administrative nodes from accumulating personnel and skewing operational attendance roll calls.
- **Exceptions:**
  - Staff assigned as primary managers/commanders of administrative nodes (see Section 3).
  - High-level liaison officers whose operational assignment matches Level 3 HQ.

---

### OR-02 — Single Primary Assignment

- **Statement:** An employee must be assigned to exactly **one** primary organization node ID at any given time. Multi-node permanent assignments are prohibited.
- **Reason:** Prevents duplicate headcount aggregates and keeps reporting lines distinct.
- **Enforcement:** The database enforces a `NOT NULL` foreign key on the `org_unit_id` column of the employee record.

---

## 3. Manager / Commander Assignment Rules

Rules governing the assignment of node commanders.

---

### OR-03 — Commander Cardinality Constraint

- **Statement:** An organization node (at any level) can have at most **one** active employee assigned as its primary commander/manager at any target date.
- **Reason:** Enforces a single command line of authority (BR-O06).

---

### OR-04 — Commander Status Constraint

- **Statement:** An employee cannot be assigned as a node commander/manager if their current Employment Status is `SUSPENDED`, `INACTIVE`, `ARCHIVED`, or `DRAFT`. Only `ACTIVE` or `ON_LEAVE` (under temporary deputy assignment) personnel are eligible.
- **Reason:** Suspended or departed staff cannot exercise legal or operational command.

---

### OR-05 — Commander Rank Requirement

- **Statement:** Commanders assigned to Level 2 (`Brigade`) or Level 3 (`Department`) must hold a rank configured as "Senior Command" (e.g. Lieutenant Colonel / סא"ל, Colonel / אל"ם, or Brigadier General / תא"ל).
- **Reason:** Maintains alignment between hierarchical node importance and leadership ranks.

---

## 4. Transfer Rules

Controls for moving employees between organization nodes.

---

### OR-06 — Transfer Authorization Boundary

- **Statement:** Initiating a permanent transfer of an employee between Section A and Section B requires the requesting operator to hold `MANAGE` permissions on both the source section (A) and the target section (B). If the operator only holds scope over one section, the action is blocked and routed to the `Transfers` module workflow queue for approval (ER-06).
- **Reason:** Prevents commanders from "poaching" personnel or dumping staff without target section sign-off.

---

### OR-07 — Permanent vs. Temporary Assignment Logic

- **Statement:** When an employee is assigned to a `TEMPORARY` organization node:
  - Their `orgUnitId` (Primary Node) remains unchanged.
  - The `temporaryAssignment` block is populated.
  - Scheduling and dashboard metrics attribute their presence to the temporary node.
  - Command permissions to edit their profile (except preferences) temporarily extend to the target node commander while the assignment is active.

---

## 5. Inactive Unit Rules

Rules governing node deactivation.

---

### OR-08 — Cascade Inactivation

- **Statement:** A parent node (e.g. Department) cannot be set to inactive if any child node (e.g. Section) is active. Inactivating a parent node automatically cascades inactivation to all active descendants.
- **Reason:** Prevents orphaned active nodes under an inactive command path.

---

### OR-09 — Inactivation Blocker

- **Statement:** A node cannot be inactivated or deleted if it contains active child nodes with active assigned employees.
- **Reason:** Safeguards workforce integrity and prevents employees from losing their organizational placement.
- **Enforcement:** The system returns `400 ACTIVE_PERSONNEL_EXISTS` if inactivation is attempted on a populated subtree.

---

## 6. Visibility & Authorization Rules

Enforces scope boundaries on the tree.

---

### OR-10 — Subtree Visibility Scope

- **Statement:** An operator granted `VIEW` or `MANAGE` permission on Node ID `X` has implicit inherited visibility/manage rights over all descendant nodes of `X` recursively.
- **Reason:** Simplifies permission models and mirrors command chain dynamics (HR-04).
- **Enforcement:** Resolved efficiently via queries joining against the `core.organization_unit_closure` lookup table.

---

### OR-11 — Upward Visibility Limit

- **Statement:** An operator with scope on Node `X` cannot view details of any ancestor nodes (parent nodes) or sibling nodes (parallel nodes) beyond public node name metadata. They are restricted from viewing headcount details, rosters, or profiles outside their subtree.
- **Reason:** Protects operational security and limits data exposure to a need-to-know basis.

---

## 7. Naming & Code Conventions

Validation rules for node metadata.

---

### OR-12 — Node Name Format

- **Statement:** A node name must contain between 2 and 100 characters. Letters, digits, spaces, and standard Hebrew characters are permitted. Leading or trailing spaces are trimmed.
- **Reason:** Ensures display uniformity in dashboards and dropdown trees.

---

### OR-13 — Unique Node Code

- **Statement:** Every node must have a unique identifier code (e.g. `MDR-A-7`) configured at creation. Node codes are unique within the tenant and cannot be duplicated.
- **Reason:** Serves as the stable key for integration imports.

---

## Rule Summary Index

| Rule ID | Category | Summary |
|---|---|---|
| **OR-01** | Assignment | Employees must only be assigned directly to leaf nodes (Level 4/5) |
| **OR-02** | Assignment | Employee belongs to exactly one Primary Node |
| **OR-03** | Commander | Max 1 active commander per node |
| **OR-04** | Commander | Inactive/suspended employees cannot command nodes |
| **OR-05** | Commander | High-level nodes (Level 2/3) require senior command ranks |
| **OR-06** | Transfers | Transfer across scopes requires permissions on both nodes |
| **OR-07** | Transfers | Temporary assignment preserves primary node, delegates edit permissions |
| **OR-08** | Inactivation | Inactivating parent node cascades inactivation to descendants |
| **OR-09** | Inactivation | Cannot delete/inactivate nodes containing active staff |
| **OR-10** | Visibility | Visibility on Node X recursively propagates to all sub-units |
| **OR-11** | Visibility | No upward/sibling visibility beyond basic metadata |
| **OR-12** | Naming | Node names must be 2-100 characters, trimmed |
| **OR-13** | Naming | Node codes must be unique within the tenant |
