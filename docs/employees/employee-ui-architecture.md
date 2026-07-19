# Employee UI Architecture

**Domain:** Employee
**Phase:** 12.9 — Employee UI Architecture
**Depends on:** employee-data-contracts.md, employee-api-design.md

---

## Overview

This document defines the page structure, component hierarchy, and component responsibilities for the Employee module UI.

The Employee module consists of four pages and a set of shared components that are reused across all of them. Components are organized by scope: page-level components own data and state; shared components are purely presentational and receive everything they need via props.

### Relationship to Existing Code

The following pages already exist and will be extended to conform to this architecture:

| Existing File | Role in Architecture |
|---|---|
| [`Employees.tsx`](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/pages/Employees.tsx) | Employee List page — currently uses mock data |
| [`EmployeeProfile.tsx`](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/pages/EmployeeProfile.tsx) | Employee Details page — partially implemented |
| [`EmployeeHistory.tsx`](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/pages/EmployeeHistory.tsx) | History tab, embedded in Details page |

Create Employee and Edit Employee do not yet exist as pages. They will be created as part of implementation.

The following existing shared UI primitives are reused throughout this module:

`Card`, `Badge`, `Button`, `Input`, `Dialog`, `Drawer`, `Skeleton`, `EmptyState`, `DataTable`, `Toolbar`, `FormPrimitives`, `EmployeeInfoRow`

---

## Folder Structure

```
src/features/employees/
├── pages/
│   ├── EmployeeListPage.tsx          — List page
│   ├── EmployeeDetailsPage.tsx       — Details / profile page
│   ├── CreateEmployeePage.tsx        — Create form page
│   └── EditEmployeePage.tsx          — Edit form page
│
├── components/
│   ├── shared/
│   │   ├── EmployeeCard.tsx          — Grid card for list view
│   │   ├── EmployeeAvatar.tsx        — Avatar with initials fallback
│   │   ├── EmployeeStatusBadge.tsx   — Status pill badge
│   │   ├── EmployeeHeader.tsx        — Profile page top section
│   │   └── EmployeeInfoSection.tsx   — Labeled group of fields
│   │
│   ├── list/
│   │   ├── EmployeeFilters.tsx       — Search + filter toolbar
│   │   ├── EmployeeGrid.tsx          — Card grid layout
│   │   └── EmployeeTable.tsx         — Table layout (alternative view)
│   │
│   ├── details/
│   │   ├── EmployeeIdentityTab.tsx   — Identity + employment group
│   │   ├── EmployeeOrgTab.tsx        — Org assignment + command info
│   │   ├── EmployeeContactTab.tsx    — Contact + emergency contact
│   │   ├── EmployeeAvailabilityTab.tsx — Availability + leave + medical
│   │   ├── EmployeeCertificationsTab.tsx — Certifications with status
│   │   ├── EmployeeOperationalTab.tsx — Operational role + fitness
│   │   └── EmployeeHistoryTab.tsx    — Timeline of changes + transfers
│   │
│   └── forms/
│       ├── EmployeeIdentityForm.tsx  — Identity + employment fields
│       ├── EmployeeOrgForm.tsx       — Unit + commander assignment
│       ├── EmployeeContactForm.tsx   — Contact fields
│       └── EmployeeCertificationsForm.tsx — Certifications section
│
├── hooks/
│   ├── useEmployeeList.ts            — Fetches + filters employee list
│   ├── useEmployeeDetails.ts         — Fetches single employee profile
│   ├── useCreateEmployee.ts          — Mutation: create
│   ├── useUpdateEmployee.ts          — Mutation: update
│   └── useEmployeeStatus.ts          — Mutation: status change
│
├── types/
│   └── index.ts                      — TypeScript types from DTOs
│
└── index.ts                          — Public exports
```

---

## Pages

---

### Employee List Page

**File:** `pages/EmployeeListPage.tsx`
**Route:** `/employees`

**Responsibilities:**

- Entry point for the Employee module. Presents all employees visible to the current operator within their scope.
- Owns the search and filter state (query text, status filter, unit filter, service type filter).
- Owns the pagination state (current page, page size).
- Calls `useEmployeeList` hook to fetch `EmployeeSummaryDTO[]` from `GET /employees`.
- Renders either a card grid (`EmployeeGrid`) or a table (`EmployeeTable`) depending on the selected view mode.
- Provides a "Add Employee" action button that navigates to `CreateEmployeePage`.
- Clicking any employee card or row navigates to `EmployeeDetailsPage`.
- Handles empty state (no employees in scope), loading state (skeletons), and error state.

**Children rendered:**

```
EmployeeListPage
├── Page header (title, description, Add Employee button)
├── EmployeeFilters            — search input + filter controls
├── EmployeeGrid               — card grid (default view)
│   └── EmployeeCard[]         — one per employee
└── EmployeeTable              — table view (alternative)
```

**State owned:**

| State | Type | Purpose |
|---|---|---|
| `searchQuery` | string | Free-text filter |
| `statusFilter` | string[] | Selected statuses |
| `unitFilter` | string \| null | Selected org unit ID |
| `serviceTypeFilter` | string[] | Selected service types |
| `viewMode` | `grid` \| `table` | Display mode toggle |
| `page` | number | Current page |
| `pageSize` | number | Items per page |

---

### Employee Details Page

**File:** `pages/EmployeeDetailsPage.tsx`
**Route:** `/employees/:id`

**Responsibilities:**

- The complete operational view of a single employee.
- Calls `useEmployeeDetails(id)` to fetch `EmployeeDetailsDTO` from `GET /employees/{id}`.
- Renders `EmployeeHeader` at the top with the employee's identity, avatar, status badge, and primary actions.
- Renders tabbed content below the header. Each tab maps to one section of the `EmployeeDetailsDTO`.
- Provides an "Edit" action that navigates to `EditEmployeePage`.
- Provides a "Change Status" action that opens the status change dialog.
- Handles the case where the current operator is viewing their own profile (shows `preferences` tab; masks fewer fields).
- Handles loading (skeleton layout), error, and not-found states.

**Children rendered:**

```
EmployeeDetailsPage
├── EmployeeHeader             — avatar, name, rank, status badge, action buttons
├── Tab navigation bar
│   ├── EmployeeIdentityTab    — identity, employment, dates
│   ├── EmployeeOrgTab         — unit, commander, org path, command scope
│   ├── EmployeeContactTab     — phones, email, work address, emergency contact
│   ├── EmployeeAvailabilityTab — work days, shift preference, leave, medical
│   ├── EmployeeCertificationsTab — all certifications with derived statuses
│   ├── EmployeeOperationalTab — role, weapon, specialty, fitness classification
│   └── EmployeeHistoryTab     — chronological timeline
└── Status Change Dialog       — shown when operator triggers a status action
```

**State owned:**

| State | Type | Purpose |
|---|---|---|
| `activeTab` | string | Which tab is currently visible |
| `statusDialogOpen` | boolean | Status change dialog visibility |
| `pendingStatus` | string \| null | Target status for confirmation dialog |

---

### Create Employee Page

**File:** `pages/CreateEmployeePage.tsx`
**Route:** `/employees/new`

**Responsibilities:**

- A multi-step form for creating a new employee record.
- Collects data conforming to `EmployeeCreateDTO` before submission.
- Submits to `POST /employees` via `useCreateEmployee` hook.
- Divided into logical steps matching the field groups: Identity → Employment → Organizational Assignment → Contact → (optional) Certifications.
- Validates each step before allowing progression. Does not submit until all required fields are valid.
- On success: navigates to the new employee's Details page.
- On error: displays field-level validation errors inline.
- Provides a "Save as Draft" option that submits with `status: "DRAFT"`.
- Provides a "Cancel" action that navigates back to the list with a discard confirmation if the form is dirty.

**Children rendered:**

```
CreateEmployeePage
├── Page header (title, breadcrumb, Cancel button)
├── Step progress indicator
├── Step 1 — EmployeeIdentityForm     (name, DOB, employee number, rank, position, service type)
├── Step 2 — EmployeeOrgForm           (unit, start date, commander)
├── Step 3 — EmployeeContactForm       (phones, email, work address)
├── Step 4 — EmployeeCertificationsForm (optional certifications)
└── Form footer (Back, Next/Save as Draft, Activate)
```

**State owned:**

| State | Type | Purpose |
|---|---|---|
| `currentStep` | number | Active form step index |
| `formData` | Partial\<EmployeeCreateDTO\> | Accumulated form values |
| `isDirty` | boolean | Whether any field has been changed |
| `isSubmitting` | boolean | Whether a submission is in progress |

---

### Edit Employee Page

**File:** `pages/EditEmployeePage.tsx`
**Route:** `/employees/:id/edit`

**Responsibilities:**

- A pre-populated edit form for modifying an existing employee record.
- Calls `useEmployeeDetails(id)` to prefill all form sections from the current `EmployeeDetailsDTO`.
- Submits to `PUT /employees/{id}` via `useUpdateEmployee` hook with only the changed fields (`EmployeeUpdateDTO`).
- Sections are the same as Create but rendered as a single scrolling form (not step-by-step), since all data is already populated.
- Field editability is enforced per the role-based editing rules — some fields render as read-only for non-Admin operators.
- Immutable fields (`employeeNumber`, `dateOfBirth` post-activation) are displayed as read-only with a visual lock indicator.
- On success: navigates back to the Details page.
- On error: displays field-level validation errors inline without discarding the form state.
- Provides a "Discard Changes" action with a confirmation if the form is dirty.

**Children rendered:**

```
EditEmployeePage
├── Page header (title, breadcrumb, Discard, Save buttons)
├── EmployeeIdentityForm     — prefilled; immutable fields locked
├── EmployeeOrgForm          — prefilled; unit change triggers transfer warning
├── EmployeeContactForm      — prefilled
├── EmployeeCertificationsForm — prefilled
└── Form footer (Discard, Save Changes)
```

**State owned:**

| State | Type | Purpose |
|---|---|---|
| `formData` | Partial\<EmployeeUpdateDTO\> | Changed values only (delta tracking) |
| `isDirty` | boolean | Whether any field has changed from the original |
| `isSubmitting` | boolean | Whether a save is in progress |
| `transferWarning` | boolean | Shown when `orgUnitId` is changed |

---

## Shared Components

---

### EmployeeCard

**File:** `components/shared/EmployeeCard.tsx`
**Used in:** Employee List page (grid view)

**Responsibilities:**

- Renders one employee as a clickable card in the list grid view.
- Displays: avatar, full name, rank, position, unit name, status badge, and certification health indicator.
- Emits a click event — the parent page handles navigation to the Details page.
- Has a hover state that reveals a quick-action menu (View Profile, Edit).
- Is purely presentational — receives one `EmployeeSummaryDTO` as its only data input.
- Handles the case where `profilePictureUrl` is null by delegating to `EmployeeAvatar`.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `employee` | `EmployeeSummaryDTO` | Yes | All displayed data |
| `onClick` | `() => void` | Yes | Navigation handler |
| `onEditClick` | `() => void` | No | Opens edit page |
| `isSelected` | `boolean` | No | Highlight state for multi-select |

---

### EmployeeAvatar

**File:** `components/shared/EmployeeAvatar.tsx`
**Used in:** `EmployeeCard`, `EmployeeHeader`, list table rows, dashboard widgets, notification items, transfer requests

**Responsibilities:**

- Renders an employee's visual identity as a circular avatar.
- If `profilePictureUrl` is provided: renders the image with alt text using the employee's full name.
- If `profilePictureUrl` is null: renders a colored circle with the employee's initials (first letter of first name + first letter of last name).
- The background color for the initials fallback is deterministically generated from the employee ID so the same employee always gets the same color across all views.
- Supports three sizes: `sm` (24px), `md` (40px), `lg` (64px).
- Does not handle clicks — the parent component wraps it in a button or link if interaction is needed.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `firstName` | `string` | Yes | Used for initials and alt text |
| `lastName` | `string` | Yes | Used for initials and alt text |
| `profilePictureUrl` | `string \| null` | No | Image source; falls back to initials |
| `employeeId` | `string` | Yes | Used to seed the initials background color |
| `size` | `sm \| md \| lg` | No | Default: `md` |
| `className` | `string` | No | Additional CSS classes |

---

### EmployeeStatusBadge

**File:** `components/shared/EmployeeStatusBadge.tsx`
**Used in:** `EmployeeCard`, `EmployeeHeader`, list table rows, status change dialog, dashboard widgets

**Responsibilities:**

- Renders the employee's Employment Status as a colored pill badge.
- Maps each status value to a specific visual style (color, label):

| Status | Color | Hebrew Label |
|---|---|---|
| `DRAFT` | Gray | טיוטה |
| `ACTIVE` | Green | פעיל |
| `ON_LEAVE` | Blue | בחופשה |
| `TEMPORARY_ASSIGNMENT` | Purple | שיבוץ זמני |
| `SUSPENDED` | Amber | מושעה |
| `INACTIVE` | Slate | לא פעיל |
| `ARCHIVED` | Dark gray | ארכיון |

- Is purely presentational — receives the status string, renders the appropriate visual.
- Does not handle status changes — that is owned by the page.
- Supports an optional `size` prop for compact (list rows) vs. standard (profile header) display.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | Employment status enum value |
| `size` | `sm \| md` | No | Default: `md` |
| `className` | `string` | No | Additional CSS classes |

---

### EmployeeHeader

**File:** `components/shared/EmployeeHeader.tsx`
**Used in:** `EmployeeDetailsPage`, `EditEmployeePage`

**Responsibilities:**

- Renders the top section of the Employee Details and Edit pages.
- Displays: large avatar, full name, rank + position, unit name + org path, status badge, years of service, and certification health summary.
- Renders a row of primary action buttons whose visibility depends on the operator's role:
  - **Edit Profile** — visible to commanders and admins with manage scope
  - **Change Status** — visible to commanders and admins; Admin-only for sensitive transitions
  - **View History** — visible to all with view scope
  - **Delete** — visible to Admin only
- Does not own the actions' logic — emits callback props that the parent page handles.
- Is fully presentational — receives `EmployeeDetailsDTO` and role context as props.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `employee` | `EmployeeDetailsDTO` | Yes | All displayed employee data |
| `canEdit` | `boolean` | Yes | Whether to show Edit button |
| `canChangeStatus` | `boolean` | Yes | Whether to show Change Status button |
| `canDelete` | `boolean` | Yes | Whether to show Delete button |
| `onEditClick` | `() => void` | No | |
| `onStatusClick` | `() => void` | No | |
| `onDeleteClick` | `() => void` | No | |
| `onHistoryClick` | `() => void` | No | |
| `isLoading` | `boolean` | No | Renders skeleton when true |

---

### EmployeeInfoSection

**File:** `components/shared/EmployeeInfoSection.tsx`
**Used in:** All detail tab components (`EmployeeIdentityTab`, `EmployeeOrgTab`, `EmployeeContactTab`, etc.)

**Responsibilities:**

- Renders a visually grouped block of labeled fields.
- Each field is a label-value pair. Handles null values gracefully (renders a dash or "לא צוין" placeholder).
- Supports a section title and an optional icon.
- Can render fields in a 1-column or 2-column grid layout depending on the `columns` prop.
- Does not know what fields it displays — it receives an array of `{ label, value, icon? }` items and renders them uniformly.
- Reuses the existing `EmployeeInfoRow` component from `components/ui/EmployeeInfoRow.tsx` for individual rows.

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Section heading text |
| `icon` | `React.ReactNode` | No | Icon displayed next to the title |
| `fields` | `FieldItem[]` | Yes | Array of `{ label, value, icon?, masked? }` |
| `columns` | `1 \| 2` | No | Layout columns. Default: `1` |
| `className` | `string` | No | Additional CSS classes |

Where `FieldItem` is:

```
{
  label:   string
  value:   string | number | null | React.ReactNode
  icon?:   React.ReactNode
  masked?: boolean      — renders value as "•••••••" when true
}
```

---

## Component Hierarchy Diagram

```
EmployeeListPage
├── EmployeeFilters
├── EmployeeGrid
│   └── EmployeeCard (×n)
│       ├── EmployeeAvatar
│       └── EmployeeStatusBadge
└── EmployeeTable
    └── rows: EmployeeAvatar + EmployeeStatusBadge (×n)

EmployeeDetailsPage
├── EmployeeHeader
│   ├── EmployeeAvatar
│   └── EmployeeStatusBadge
├── EmployeeIdentityTab
│   └── EmployeeInfoSection (×2)
├── EmployeeOrgTab
│   └── EmployeeInfoSection (×2)
├── EmployeeContactTab
│   └── EmployeeInfoSection (×2)
├── EmployeeAvailabilityTab
│   └── EmployeeInfoSection (×2)
├── EmployeeCertificationsTab
│   └── CertificationEntry (×n)
├── EmployeeOperationalTab
│   └── EmployeeInfoSection (×2)
└── EmployeeHistoryTab
    └── TimelineEntry (×n)

CreateEmployeePage
├── Step indicator
├── EmployeeIdentityForm
├── EmployeeOrgForm
├── EmployeeContactForm
└── EmployeeCertificationsForm

EditEmployeePage
├── EmployeeHeader (read-only mode)
├── EmployeeIdentityForm (prefilled)
├── EmployeeOrgForm (prefilled)
├── EmployeeContactForm (prefilled)
└── EmployeeCertificationsForm (prefilled)
```

---

## State Ownership

| State | Owner | Scope |
|---|---|---|
| Employee list data | `useEmployeeList` hook | List page |
| List filter and pagination | `EmployeeListPage` | List page |
| Single employee profile data | `useEmployeeDetails` hook | Details / Edit page |
| Active tab | `EmployeeDetailsPage` | Details page |
| Status dialog state | `EmployeeDetailsPage` | Details page |
| Create form data | `CreateEmployeePage` | Create page |
| Edit form delta | `EditEmployeePage` | Edit page |
| Avatar color | `EmployeeAvatar` (derived from ID) | Component |
| Status label + color | `EmployeeStatusBadge` (derived from status) | Component |

No shared component owns data. Data flows down through props. Events flow up through callbacks.

---

## Data Flow

```
API (GET /employees)
       │
       ▼
useEmployeeList (hook)
       │
       ▼
EmployeeListPage (owns filter + pagination state)
       │
       ├──► EmployeeFilters (receives + emits filter state)
       │
       └──► EmployeeGrid
               └──► EmployeeCard[] (receives EmployeeSummaryDTO)
                       ├──► EmployeeAvatar (receives name + id + picture)
                       └──► EmployeeStatusBadge (receives status string)


API (GET /employees/{id})
       │
       ▼
useEmployeeDetails (hook)
       │
       ▼
EmployeeDetailsPage (owns tab + dialog state)
       │
       ├──► EmployeeHeader (receives EmployeeDetailsDTO + role flags + callbacks)
       │       ├──► EmployeeAvatar
       │       └──► EmployeeStatusBadge
       │
       └──► [Active Tab Component] (receives slice of EmployeeDetailsDTO)
               └──► EmployeeInfoSection[] (receives field arrays)
```

---

## Reusability Outside the Employee Module

The following shared components are designed for use in other modules that display employee references:

| Component | Used by other modules |
|---|---|
| `EmployeeAvatar` | Dashboard widgets, Transfer request rows, Notification items, Scheduling grid cells |
| `EmployeeStatusBadge` | Dashboard workforce summary, Transfer list, Organization tree rows |
| `EmployeeInfoSection` | Any profile-style detail view in the system (future modules) |

`EmployeeCard` and `EmployeeHeader` are module-specific and are not intended for reuse outside the Employee feature.
