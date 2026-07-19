# Employee List Experience

**Domain:** Employee
**Phase:** 12.10 — Employee List Experience
**Depends on:** employee-ui-architecture.md, employee-data-contracts.md

---

## Overview

The Employee List is the primary entry point into the Employee domain. It gives commanders and administrators a structured view of the people in their unit hierarchy — who is here, who is absent, who needs attention, and how to act quickly on individuals.

The design principle is **operational clarity first**: the most relevant information is visible at a glance, filters narrow the view to a meaningful subset, and every employee row gives the commander a path to act without requiring a full profile load.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Page Header                                              │
│   Title: "כוח אדם"     [+ הוסף עובד]                   │
│   Subtitle: "85 עובדים פעילים בטווח הגישה שלך"         │
├─────────────────────────────────────────────────────────┤
│ Summary Strip (KPI row)                                  │
│  [פעילים: 80]  [בחופשה: 3]  [מושעים: 1]  [טיוטות: 1]  │
├─────────────────────────────────────────────────────────┤
│ Filter Toolbar                                           │
│  [🔍 Search...] [יחידה ▾] [סטטוס ▾] [סוג שירות ▾]     │
│  [מיון: שם ▾] [↑↓]   [⊞ Grid] [☰ Table]  [← פילטרים] │
├─────────────────────────────────────────────────────────┤
│ Active Filter Pills (visible when filters applied)       │
│  × פעיל   × גדוד 51   × שירות קבע   [נקה הכול]        │
├─────────────────────────────────────────────────────────┤
│ Results Area                                             │
│   Grid View: 4-column card grid                          │
│   Table View: data table with sortable columns           │
├─────────────────────────────────────────────────────────┤
│ Pagination                                               │
│   Showing 1–50 of 85    [< 1 2 >]   [50 per page ▾]    │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Search

### Behavior

- A single text input in the toolbar accepts free-text input.
- Search is **debounced** — the query is sent to the API after 350ms of inactivity. No submit button is required.
- Search operates against: **first name**, **last name**, and **employee number**.
- The search is **not** applied client-side — it is sent as the `search` parameter on `GET /employees`.
- Search is compatible with all active filters — it narrows within the currently filtered result set.
- Clearing the search input immediately triggers a refresh of the full filtered list.

### Input States

| State | Visual |
|---|---|
| Empty | Placeholder: `חיפוש לפי שם, מספר אישי...` |
| Typing | Debounce in progress — no immediate change |
| Results loading | Spinner inside the input field |
| Results returned | List updates beneath |
| No results | Empty state appears in the results area |

### Search Scope

- Search is scoped to the operator's accessible units — an operator cannot search beyond their view scope regardless of the search term.
- Hebrew and Latin character input are both supported simultaneously.

---

## 2. Filters

Filters narrow the employee list to a meaningful operational subset. They are additive — multiple active filters combine with AND logic.

### Available Filters

---

#### Unit Filter (יחידה)

| Property | Value |
|---|---|
| Label | יחידה |
| Control | Dropdown — searchable tree of organization units |
| Default | All units within the operator's scope |
| Options | All units the operator has view access to |
| `includeDescendants` | Toggled with a sub-checkbox: "כולל תת-יחידות" |
| API param | `unitId` + `includeDescendants` |

**Behavior:**
When the operator selects a unit without `includeDescendants`, only employees directly assigned to that unit are shown. With `includeDescendants` enabled, employees in all child units at any depth are included.

---

#### Status Filter (סטטוס)

| Property | Value |
|---|---|
| Label | סטטוס |
| Control | Multi-select dropdown with checkboxes |
| Default | `ACTIVE` only |
| Options | ACTIVE, ON_LEAVE, TEMPORARY_ASSIGNMENT, SUSPENDED, INACTIVE, DRAFT (Admin only), ARCHIVED (Admin only) |
| API param | `status` (comma-separated) |

**Behavior:**
Multiple statuses may be selected simultaneously. Selecting "הכול" clears all individual selections and returns the full scoped list.

---

#### Service Type Filter (סוג שירות)

| Property | Value |
|---|---|
| Label | סוג שירות |
| Control | Multi-select dropdown |
| Default | No filter (all types) |
| Options | שירות חובה (MANDATORY), שירות קבע (CAREER), מילואים (RESERVE), עובד אזרחי (CIVILIAN) |
| API param | `serviceType` |

---

#### Certification Health Filter (תעודות)

| Property | Value |
|---|---|
| Label | תעודות |
| Control | Multi-select dropdown |
| Default | No filter |
| Options | תקין (ALL_VALID), פג בקרוב (EXPIRING_SOON), קריטי (CRITICAL), פג (EXPIRED) |
| API param | `certificationHealth` |

**Behavior:**
Selecting EXPIRING_SOON, CRITICAL, or EXPIRED surfaces employees who need certification attention. Useful for commanders doing a readiness review.

---

#### Command Capability Filter (כשירות פיקוד)

| Property | Value |
|---|---|
| Label | כשירות פיקוד |
| Control | Toggle (on/off) |
| Default | Off |
| Effect | When on, shows only employees with `commandCapability: true` |
| API param | `hasCommandRole: true` |

---

### Active Filter Pills

When any filter is active (beyond the defaults), a row of pill badges appears below the toolbar. Each pill shows the active filter label and has an × to remove it individually. A "נקה הכול" link clears all filters and resets to defaults.

```
× פעיל   × גדוד 51 (כולל תת-יחידות)   × שירות קבע   [נקה הכול]
```

Pills update in real time as filters are applied or removed.

---

## 3. Sorting

### Available Sort Fields

| Field | Label | Default Order |
|---|---|---|
| `lastName` | שם משפחה | A → Z (ascending) |
| `rank` | דרגה | High → Low |
| `employeeNumber` | מספר אישי | Low → High |
| `startDate` | תאריך התחלה | Newest first |
| `status` | סטטוס | Alphabetical |
| `yearsOfService` | ותק | Highest first |

### Behavior

- Default sort: **שם משפחה ascending**.
- Sort direction is toggled by clicking the current sort field again.
- Sort is applied server-side (`sortBy` + `sortOrder` query params) — not client-side.
- In table view, clicking a column header sorts by that column. Active sort column shows a direction arrow.
- In grid view, sort is controlled by the sort dropdown in the toolbar.

---

## 4. Pagination

### Behavior

- Default page size: **50 employees per page**.
- Page size options: **25**, **50**, **100**, **200**.
- Page size selection is persisted in `localStorage` per user.
- The pagination control shows:
  - "מציג 1–50 מתוך 85" — current range and total
  - Previous / Next buttons
  - Page number buttons (up to 5 visible; ellipsis for large ranges)
- Changing the page size resets to page 1.
- Applying any filter resets to page 1.
- URL query params reflect the current page and page size — the list is deep-linkable and browser-back-navigable.

### Pagination in Table View

- Table view supports an optional **infinite scroll** mode (alternative to page buttons) that appends the next page of results as the user scrolls to the bottom. This is opt-in per user preference.

---

## 5. View Modes

### Grid View (default)

- 4-column card grid on large screens (≥1280px)
- 3 columns on medium screens (1024–1280px)
- 2 columns on tablet (768–1024px)
- 1 column on mobile (<768px)
- Each card shows: avatar, full name, rank, position, unit name, status badge, certification health indicator
- Cards are clickable — clicking navigates to the employee's Details page

### Table View

- Compact, information-dense row layout
- Columns (configurable via column visibility toggle):

| Column | Default visible | Sortable |
|---|---|---|
| Avatar + Name | Yes | Yes (sort by lastName) |
| Employee Number | Yes | Yes |
| Rank | Yes | Yes |
| Position | Yes | No |
| Unit | Yes | No |
| Status | Yes | Yes |
| Service Type | No | Yes |
| Years of Service | No | Yes |
| Certification Health | Yes | No |
| Actions | Yes | No |

- Row click: navigates to Details page
- Actions column: shows quick action menu (see Section 6)

---

## 6. Quick Actions

Quick actions allow the operator to act on an individual employee without navigating to the full profile.

### Available Quick Actions

| Action | Label | Available When | Result |
|---|---|---|---|
| View Profile | צפה בפרופיל | Always | Navigates to Details page |
| Edit | ערוך | Operator has manage scope | Navigates to Edit page |
| Change Status | שנה סטטוס | Operator has manage scope | Opens status change inline dialog |
| View History | היסטוריה | Operator has view scope | Navigates to Details page, History tab open |
| Copy Employee Number | העתק מספר אישי | Always | Copies to clipboard with toast confirmation |

### Access Points

- **Grid view:** Hovering a card reveals a `⋯` button in the top-right corner. Clicking opens a dropdown menu with the quick actions.
- **Table view:** The rightmost "Actions" column renders the `⋯` button for every row.
- Actions are filtered by the operator's permissions — unauthorized actions are not shown.

### Status Change Inline Dialog

When "Change Status" is triggered from the quick action menu, a compact dialog appears (not a full page navigation) with:
- Current status shown
- Target status selection (only permitted transitions shown)
- Reason field (shown conditionally)
- Return date field (shown for ON_LEAVE)
- Confirm and Cancel buttons

On success, the employee's card/row updates in place without a full page reload.

---

## 7. Bulk Actions

Bulk actions allow the operator to act on multiple employees simultaneously. This is primarily useful for administrative tasks such as batch status changes or export.

### Activation

- **Grid view:** A checkbox appears on each card when hovering, or when any card is selected.
- **Table view:** A checkbox column is always visible.
- Selecting the header checkbox selects all employees on the current page.
- A "בחר הכול (85)" option extends selection to all pages of the current filter set.

### Selection Indicator

When employees are selected, the filter toolbar is replaced with a bulk action bar:

```
✓ 12 עובדים נבחרו   [ביטול בחירה]   [יצוא ▾]   [שנה סטטוס ▾]
```

### Available Bulk Actions

| Action | Label | Available When |
|---|---|---|
| Export | יצוא לאקסל | All operators with view scope |
| Change Status | שנה סטטוס | Admin only |
| Assign Commander | הקצה מפקד | Admin or Commander with manage scope |

### Bulk Status Change

When "שנה סטטוס" is triggered in bulk mode, a dialog shows:
- Number of selected employees
- Target status selection
- Warning: "פעולה זו תשפיע על N עובדים"
- Reason field
- Confirm / Cancel

Failed records (employees where the transition is not permitted) are reported individually after the operation completes, with a summary: "80 עודכנו בהצלחה. 2 נכשלו — ראה פירוט."

---

## 8. Empty State

### No Employees in Scope

Shown when the operator's account has view scope on units that contain zero active employees.

```
┌──────────────────────────────────┐
│            [icon: Users]         │
│      אין עובדים ברשותך           │
│  אין רשומות עובדים ביחידות       │
│  שיש לך גישה אליהן.              │
│  [צור עובד חדש]                  │
└──────────────────────────────────┘
```

The "צור עובד חדש" button is only shown if the operator has manage scope.

---

### No Results for Current Filters

Shown when filters or search produce zero results, but employees exist in scope.

```
┌──────────────────────────────────┐
│          [icon: SearchX]         │
│     לא נמצאו עובדים              │
│  הניסיון "כהן" עם הפילטרים       │
│  הנוכחיים לא הניב תוצאות.        │
│  [נקה פילטרים]   [נקה חיפוש]    │
└──────────────────────────────────┘
```

Two distinct recovery actions: clear just the filters, or clear just the search term.

---

### No Matching Search

Shown when search returns zero results but filters are not active.

```
┌──────────────────────────────────┐
│          [icon: SearchX]         │
│  לא נמצאו תוצאות עבור "xyz"     │
│  נסה מספר אישי, שם פרטי         │
│  או שם משפחה.                    │
│  [נקה חיפוש]                    │
└──────────────────────────────────┘
```

---

## 9. Loading State

### Initial Page Load

On first navigation to the list, before data arrives:
- The summary strip shows 4 skeleton blocks of the same dimensions as the KPI numbers.
- The results area shows a grid of **8 skeleton cards** (or 5 skeleton table rows) with animated pulse.
- The filter toolbar is rendered but inputs are disabled until data arrives.

### Filter / Search / Sort / Page Change

When a filter, search term, sort, or page number changes and new data is being fetched:
- The existing results remain visible (not replaced with skeletons).
- A thin **progress bar** appears at the top of the results area.
- Cards/rows are displayed with reduced opacity (0.5) to signal they are stale.
- After data arrives, the progress bar disappears and full opacity is restored.

This prevents layout shift and maintains the commander's spatial context during navigation.

### Skeleton Card Anatomy

Each skeleton card mimics the layout of a real `EmployeeCard`:
- Circle placeholder (avatar)
- Two text-line placeholders (name, rank)
- One short placeholder (unit)
- Badge-sized placeholder (status)

---

## 10. Error State

### Full Page Error

Shown when the initial data fetch fails entirely (network error, server error, or authorization error after loading).

```
┌──────────────────────────────────┐
│          [icon: AlertCircle]     │
│    לא ניתן לטעון את רשימת        │
│    העובדים כרגע.                 │
│  ייתכן שיש בעיה בחיבור לשרת.    │
│  [נסה שוב]                      │
└──────────────────────────────────┘
```

"נסה שוב" triggers a retry of the failed request without a page reload.

---

### Partial / Background Refresh Error

When a background refresh fails (after the list was already loaded), the list remains visible with its last successful data. A dismissible **toast notification** appears at the top of the screen:

```
⚠  הרענון האחרון נכשל — מוצגים נתונים מ-10:32    [נסה שוב]
```

The timestamp shows when the last successful data was fetched.

---

### Authorization Error

When the operator's token expires mid-session or their permissions are revoked:

```
┌──────────────────────────────────┐
│          [icon: ShieldOff]       │
│    אין לך הרשאה לצפות            │
│    ברשימת העובדים.               │
│  פנה למנהל המערכת.               │
│  [חזור לדף הבית]                │
└──────────────────────────────────┘
```

---

## 11. Summary Strip

A row of 4 KPI numbers displayed between the page header and the filter toolbar. These aggregate counts reflect the currently active filter set (not the entire tenant).

| KPI | Label | Source |
|---|---|---|
| Total in scope | סה"כ | All employees in operator's scope |
| Active | פעילים | Status = ACTIVE |
| On leave | בחופשה | Status = ON_LEAVE |
| Attention required | דורשים תשומת לב | SUSPENDED + lapsed certifications |

Clicking a KPI number applies the corresponding filter shortcut (e.g., clicking "בחופשה: 3" filters to ON_LEAVE).

---

## 12. URL State

All list state is reflected in the URL query string. The list is fully deep-linkable and shareable.

| URL Param | Controlled State |
|---|---|
| `q` | Search query |
| `status` | Status filter |
| `unit` | Unit filter |
| `descendants` | Include descendants toggle |
| `serviceType` | Service type filter |
| `certHealth` | Certification health filter |
| `sort` | Sort field |
| `order` | Sort direction |
| `page` | Current page |
| `size` | Page size |
| `view` | `grid` \| `table` |

**Example URL:**
```
/employees?status=ACTIVE&unit=abc-123&descendants=true&sort=lastName&order=asc&page=1&size=50&view=grid
```

Navigating back in the browser restores the complete list state including filters, page, and view mode.

---

## 13. Accessibility

| Requirement | Implementation |
|---|---|
| Filter controls keyboard accessible | All dropdowns operable via Tab + Enter/Space |
| Card grid keyboard navigable | Each card is a `<button>` or `<a>` element |
| Search announces result count | `aria-live="polite"` region updates with count on every search |
| Loading state announced | `aria-busy="true"` on the results container during loading |
| Empty state visible to screen readers | `role="status"` on the empty state container |
| Sort direction announced | `aria-sort` attribute on table column headers |
| Selected count announced | `aria-label` on bulk selection indicator updates with count |
| Status badge labels are text | `EmployeeStatusBadge` renders text, not color-only |
| Touch targets ≥ 44px | All interactive elements meet WCAG 2.5.5 minimum |
