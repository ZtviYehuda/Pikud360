# Commander Dashboard State Management

This document defines the state ownership, context scopes, and variables synchronization guidelines for the Commander Dashboard.

---

## 1. State Classification Matrix

To prevent data duplications, state is divided into five distinct scopes:

| State Category | Ownership / Store | Scope / Lifecycle | Examples |
|---|---|---|---|
| **Local State** | React `useState` | Lives inside individual widget scope. | Collapsed tree nodes, modal toggles, current date offset. |
| **Shared State** | React `useContext` | AppShellContext or page provider context. | Workspace selections, sidebar collapse, mobile viewports. |
| **Derived State** | Calculated on render | Calculated on variables change. | Readiness scores colors (Green/Orange/Red), percentage ratios. |
| **URL State** | Router Query Params | Syncs between browser address bar and pages. | Active tab selection, filters (e.g. `?subunit=unit-a`). |
| **Server State** | TanStack Query Cache | Cached backend payloads. | `WorkforceSummaryDTO`, `AlertDTO[]`, shift cells lists. |

---

## 2. State Mapping Details

### 2.1 Workspace Switcher State
- **Type**: Shared / Context State.
- **Owner**: `AppShellContext` wrapper.
- **Description**: Exposes `currentWorkspaceId` and `workspacesList`. Swapping context automatically triggers re-fetches across all widget queries.

### 2.2 Alert Dismissals
- **Type**: Server State.
- **Owner**: TanStack Query Cache.
- **Description**: Clicking "Resolve" triggers a mutation which updates the server state and alerts count cache without requiring full page reloads.

### 2.3 Subunit Filtering
- **Type**: URL State.
- **Owner**: React Router query parameters.
- **Description**: Clicking a bar on *Today's Workforce Chart* writes `?subunitId=xyz` to the browser address. The *Shift Coverage* and *Employee Lists* subscribe to URL state changes, updating their views. This enables link sharing.

---

## 3. Context Boundaries

```
AppShellProvider (Global UI state)
└── DashboardPage (Page-level Container)
    ├── DashboardProvider (Lightweight page context for layout)
    └── Widgets (Subscribe to TanStack Queries)
```

No authentication tokens or credentials should be accessed inside the dashboard state provider context.
All widgets query their server states directly from the TanStack cache to ensure caching layers are managed correctly.
