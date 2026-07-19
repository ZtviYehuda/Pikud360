# Organization Hierarchy Specification

**Domain:** Organization  
**Phase:** 15.2 — Organization Hierarchy  
**Depends on:** organization-domain.md

---

## 1. Overview

Pikud360 structures its tenant organization charts into a standardized **5-level strict tree hierarchy**. 

This document defines the purpose, valid parent-child relationships, leadership roles, and validation rules for each level.

```
Level 1: Organization (הארגון - שורש)
   │
   ▼ (contains multiple Brigades)
Level 2: Brigade (חטיבה)
   │
   ▼ (contains multiple Departments)
Level 3: Department (מחלקה)
   │
   ▼ (contains multiple Sections)
Level 4: Section (מדור)
   │
   ▼ (contains multiple Cells)
Level 5: Cell (חוליה)
```

---

## 2. Hierarchy Levels Reference

---

### 2.1 Level 1: Organization (הארגון)

- **Purpose:** The root node representing the entire tenant (e.g. Regional Command, Municipal Emergency Body, National Service Force). It acts as the global container for all sub-nodes and sets tenant-wide defaults.
- **Parent:** None (this is the absolute root node).
- **Children:** `Brigade` (Level 2).
- **Manager:** Chief Commander (מפקד הארגון / מפקד הפיקוד).
- **Business Rules:**
  - **Single Root Constraint:** A tenant can contain exactly **one** Organization root node.
  - **Implicit Scope Inheritance:** A manager assigned at the Organization level has implicit `manage` and `view` permissions across all descendant nodes in the entire tree.
  - **Global Configs Holder:** Global settings (e.g., geofencing enable, standard daily submission deadlines) are defined at this level.

---

### 2.2 Level 2: Brigade (חטיבה)

- **Purpose:** Represents major command blocks, regional sectors, or large functional groups (e.g., Infantry Brigade, Northern Brigade).
- **Parent:** `Organization` (Level 1).
- **Children:** `Department` (Level 3).
- **Manager:** Brigade Commander / Colonel (מח"ט / אל"ם).
- **Business Rules:**
  - Must belong to the Organization root node directly.
  - A Brigade cannot contain active personnel directly. Personnel must be assigned to leaf nodes (Level 4/5).

---

### 2.3 Level 3: Department (מחלקה)

- **Purpose:** Represents functional headquarters departments (e.g., Operations Department, Logistics Department, Medical Department).
- **Parent:** `Brigade` (Level 2).
- **Children:** `Section` (Level 4).
- **Manager:** Department Head (ראש מחלקה / רמ\"ח).
- **Business Rules:**
  - Must belong to a Brigade parent.
  - Serves as an administrative roll-up layer — aggregates coverage statistics and check-in compliance logs from child sections for headquarter review.

---

### 2.4 Level 4: Section (מדור)

- **Purpose:** The primary operational section where the majority of roster management, daily scheduling, and attendance reporting occurs (e.g. Operations Section, Dispatch Section, Rescue Section).
- **Parent:** `Department` (Level 3).
- **Children:** `Cell` (Level 5).
- **Manager:** Section Head / Commander (ראש מדור / רמ\"ד).
- **Business Rules:**
  - **Reporting Boundary:** This is the primary level at which the daily attendance report (roll call) is signed off and submitted (AR-04).
  - **Roster Assignment:** Active employees are assigned directly to this level as their permanent `Primary Section` (or to its child Cells).
  - **Settings Scope:** Specific operational overrides (e.g. custom shift templates) are owned and modified at this level.

---

### 2.5 Level 5: Cell (חוליה)

- **Purpose:** The lowest leaf level representing tactical groups, squads, or specific shift cells (e.g. Communications Cell, Dispatch Cell A, Rescue Cell 3).
- **Parent:** `Section` (Level 4).
- **Children:** None (terminal leaf node).
- **Manager:** Cell Leader (ראש חוליה / ראש צוות).
- **Business Rules:**
  - Cannot contain child nodes.
  - Used for granular, specialized daily shift assignments.
  - **Roll Call Delegation:** Cell leaders can fill out draft attendance logs for their cell, but final roll call submission authority remains locked to the Section Head (Level 4).

---

## 3. Structural Validation Rules

| Rule ID | Level | Rule Statement | Reason |
|---|---|---|---|
| **HR-01** | Global | A parent node must be exactly one level higher than its child nodes in the database schema. Level-skipping (e.g. a Brigade containing a Section directly) is prohibited. | Maintains uniform path-resolution algorithms and prevents reporting gaps. |
| **HR-02** | Root | The parent ID of the Organization level node must be `null`. | Establishes the canonical entry point for the hierarchy tree. |
| **HR-03** | Leaf | No node of type `Cell` can be set as a parent to any other node. | Prevents infinite tree extensions and locks Level 5 as the terminal layer. |
| **HR-04** | Commander | A user assigned as a manager at Level N inherits command authority over all descendants in Levels N+1 to N+max. | Ensures hierarchical approval flows map directly to command structures. |
| **HR-05** | Deletion | Modifying a node's parent node (moving a sub-node) is prohibited if it has active transfers pending. | Prevents routing conflicts in pending transfer workflows. |
| **HR-06** | Cardinality | A Brigade must contain at least 1 Department; a Department must contain at least 1 Section. Empty subtrees in active status are warned in administration views. | Identifies incomplete hierarchy setup structures. |
