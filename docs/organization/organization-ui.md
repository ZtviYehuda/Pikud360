# Organization UI Architecture

**Domain:** Organization  
**Phase:** 15.6 — Organization UI Architecture  
**Depends on:** organization-data-contracts.md, organization-rules.md, organization-api.md

---

## 1. Overview

This document specifies the UI Architecture for the Organization and Hierarchy management module. It details layout structures, page navigation flows, component interfaces, state scopes, and global selector integrations.

---

## 2. Pages

---

### 2.1 Organization Tree (עץ יחידות)

**Route:** `/organization/tree`  
**Purpose:** Interactive visual mapping of the organization structure.

#### Responsibilities
- Renders the complete, expandable organization tree using the `TreeView` component.
- Highlights the caller's active view scope boundary using a distinct visual indicator.
- Provides quick actions on tree nodes (e.g. View Details, Add Sub-node, Assign Commander).
- Clicking a tree node focuses the sidebar details panel.
- Search filter matches node names and codes, auto-expanding the tree path to highlight results.

#### Layout Structure
- **Left Panel**: Interactive nested hierarchy canvas (the tree visualizer).
- **Right Sidebar Panel**: Slide-out preview showing the focused node's `NodeCard` and quick links.

---

### 2.2 Node Details (פרטי יחידה / מדור)

**Route:** `/organization/nodes/:id`  
**Purpose:** Comprehensive configuration profile of a single organizational node.

#### Responsibilities
- Loads the target node configuration (`OrganizationUnitDTO`) and aggregates (`OrganizationSummaryDTO`).
- Displays commander details and active metadata configuration blocks.
- Lists direct child sub-nodes as a grid of `NodeCard` elements.
- Lists active staff members assigned to this node (with links to Employee profiles).
- Exposes administrative actions (Edit, Deactivate, Delete) subject to authorization gates.

#### Layout Structure
- **Header**: Node name title, breadcrumb track, status badge, and action dropdown.
- **Top Row**: 3 KPI blocks: Sub-nodes count, Total Personnel, and Active vs. Temporary headcount counts.
- **Tab Panel**:
  - **שיוך מטה (Metadata Settings)**: Configuration fields.
  - **סגל היחידה (Roster Staff)**: Employee data table.
  - **תתי-מדור (Sub-nodes)**: Renders cards for level children.

---

### 2.3 Transfer Employee (טופס העברת עובד)

**Route:** `/organization/transfers/new` (or Dialog)  
**Purpose:** Initiate a permanent or temporary transfer request.

#### Responsibilities
- Selects the target employee to transfer (autosuggest search).
- Selects the destination node using the `OrganizationSelector`.
- Prompts for transfer properties: Permanent vs. Temporary (including duration dates for temporary assignments).
- Requires a mandatory explanation text note (`reason` - OR-14).
- Submits request to `POST /organization/transfer`.
- If the operator lacks scope on the target node, shows a notification banner: *"בקשת ההעברה תישלח לאישור מפקד מדור היעד"*.

---

### 2.4 Manager Assignment (מינוי מפקד)

**Component Scope:** Drawer / Modal  
**Purpose:** Re-assign the primary commander/manager of an organization unit node.

#### Responsibilities
- Displays the current commander's details (avatar, rank, position).
- Renders a searchable roster selector displaying active node employees eligible for command (enforcing status and rank rules: OR-04, OR-05).
- Displays validation alerts (e.g. if the selected employee is suspended or holds insufficient rank).
- Confirms replacement, writing a history log entry and updating the unit's `commanderId`.

---

## 3. Shared Components

---

### 3.1 Tree View (`OrgTreeView`)

**Purpose:**  
Renders the expandable, nested visual hierarchy tree.

**Responsibilities:**
- Renders hierarchy nodes recursively.
- Supports expanding/collapsing node tracks.
- Nodes display: node name, tier badge (e.g. חטיבה, מדור), and active status indicators.
- Emits node selection and click actions.
- Incorporates vertical guide-lines matching visual design themes.

---

### 3.2 Node Card (`OrgNodeCard`)

**Purpose:**  
Card representation of a single node and summary stats.

**Responsibilities:**
- Displays the node name, code, type, and commander name.
- Renders 3 aggregate KPIs: Sub-nodes count, Total Personnel, and Active staff count.
- Includes a direct link to the Node Details profile.
- Renders an orange indicator warning badge if the node contains 0 active personnel (HR-06).

---

### 3.3 Breadcrumb (`OrgBreadcrumb`)

**Purpose:**  
Displays the hierarchical parent path leading to the current node.

**Responsibilities:**
- Accepts a list of ancestor nodes (extracted from `OrganizationUnitDTO.metadata` or paths).
- Renders a horizontal list of links separated by `/` or `➔`.
- Each segment link navigates directly to that node's Details page.
- Handles truncation for deep trees (collapses middle layers into `...` on small screens).

---

### 3.4 Organization Selector (`OrgSelector`)

**Purpose:**  
A reusable dropdown component used globally across the system to pick nodes.

**Responsibilities:**
- **Reusability**: Used in Scheduling filters, Attendance workspaces, Dashboard node selection, and Transfer forms.
- **Scope Restriction**: Loads the organization tree, disabling or hiding nodes outside the user's view scope.
- Provides a clean search filter input to quickly narrow the tree hierarchy.
- Emits the selected node's ID and name.

---

## 4. Component Hierarchy Diagram

```
OrganizationTreePage
├── SearchInput
├── OrgTreeView (nested canvas)
│   └── TreeNodeElement
└── NodePreviewSidebar
    └── OrgNodeCard

NodeDetailsPage
├── OrgBreadcrumb
├── NodeHeader
│   └── ActionButtons (Edit, Deactivate, Delete)
├── SummaryStrip (KPI cards)
└── TabContainer
    ├── MetadataSettingsForm
    ├── PersonnelTable (Roster lists)
    └── SubnodeGrid
        └── OrgNodeCard (×n)

OrgSelector (Dropdown / Popover)
└── SearchInput
    └── TreeSelectorList (expandable dropdown list)
```

---

## 5. State Ownership & Data Flow

```
         API (GET /organization/tree)
                       │
                       ▼
            useOrgTree (Custom Hook)
                       │
                       ▼
           OrgSelector (owns expandedStates)
                       │
                       ▼ (emits nodeId selection)
    Selected Context (Scheduling, Attendance, Transfers)
                       │
                       ▼
                  API Query Refetch
```
 Rosa style sheets and FormPrimitives are reused to enforce premium visuals.
