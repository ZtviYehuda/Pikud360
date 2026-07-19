# application-shell.md

This document specifies the Enterprise Application Shell layout defined in [src/components/ui/app-shell/](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/app-shell).

---

## 1. Design Principles

- **RTL Adaptive Layout**: Supports right-to-left layout orientations (menus on the right, action slots on the left).
- **Presentation-Only Boundaries**: Context states and registries manage visual layout configurations only. Authentication states, credentials, or backend services are kept completely decoupled.
- **Slot-Based Architecture**: Exposes slot anchors to inject custom items dynamically:
  - `headerStart`, `headerCenter`, `headerEnd`
  - `sidebarTop`, `sidebarBottom`
  - `contentTop`, `contentBottom`
- **Hierarchical Dynamic Registry**: Features a Navigation Registry to allow modules to contribute navigation items independently during bootstrapping.
- **RTL Accessibility**: skip links let screen readers skip navigation structures immediately.

---

## 2. Directory Structure

```
src/components/ui/app-shell/
├── types.ts                (shared schemas and types)
├── context.tsx             (transient UI state AppShellContext)
├── hooks.ts                (responsive query viewport hooks)
├── navigation.ts           (NavigationRegistry class)
├── WorkspaceSwitcher.tsx   (Military division dropdown select box)
├── UserMenu.tsx            (Profile dropdown card switcher)
├── PageContainer.tsx       (constrained / wide / fluid size margins)
├── MobileNavigation.tsx    (mobile bottom bar and secondary drawer)
├── AppSidebar.tsx          (SidebarSection / SidebarItem navigation)
├── AppHeader.tsx           (Breadcrumbs and slots top header bar)
├── AppShell.tsx            (main Provider layout root)
└── index.ts                (barrel public exports index)
```

---

## 3. AppShellContext Responsibilities

The `AppShellContext` is constrained to transient UI presentation state:

### Allowed States
- `sidebarCollapsed: boolean`: Indicates if the desktop sidebar is collapsed.
- `mobileMenuOpen: boolean`: Triggers the mobile overlay drawer.
- `layoutMode: "dashboard" | "standard" | "table" | "full-width"`: Adjusts page paddings.
- `isMobile: boolean`: Reflects screen width viewport boundaries.

### Forbidden States
- User databases, authentication tokens, security rules, notification arrays, organization structures, and other business models must not be placed inside `AppShellContext`.

---

## 4. Navigation Registry

The `NavigationRegistry` allows pluggable modules to register links dynamically:

```typescript
import { NavigationRegistry } from "@/components/ui/app-shell";
import { Users } from "lucide-react";

// Employees Module registers itself during setup
NavigationRegistry.register({
  id: "employees",
  label: "עובדים",
  icon: <Users />,
  href: "/employees",
  group: "ראשי"
});
```

The shell calls `NavigationRegistry.getItems()` to build the menu tree.

---

## 5. Layout & Container Sizing

### Layout Modes (`layoutMode`)
- `dashboard`: `p-0` (no padding)
- `standard`: `p-4 md:p-6` (standard page spacing)
- `table`: `p-2 md:p-4` (compact spacing to fit larger tables)
- `full-width`: `p-0`

### Container Sizing Modes (`PageContainer mode`)
- `constrained`: `max-w-4xl` (forms, settings)
- `wide` *(default)*: `max-w-7xl` (standard grid tables)
- `fluid`: `w-full` (dashboard layout)

---

## 6. Component API

### `AppShell`
- **Props**:
  - `navigationItems: NavigationItem[]`
  - `currentPath: string`
  - `onNavigate?: (href: string) => void`
  - `layoutMode?: "dashboard" | "standard" | "table" | "full-width"`
  - `onLayoutModeChange?: (mode: string) => void`
  - `sidebarCollapsed?: boolean`
  - `onSidebarCollapseChange?: (collapsed: boolean) => void`
  - `user?: { name: string; role: string; avatarUrl?: string }`
  - `onLogout?: () => void`
  - `currentWorkspace?: WorkspaceItem`
  - `workspaces?: WorkspaceItem[]`
  - `onWorkspaceChange?: (workspaceId: string) => void`
  - `pageTitle?: string`
  - `breadcrumbs?: BreadcrumbItem[]`
  - `onSearchClick?: () => void`
  - `onCommandPaletteClick?: () => void`
  - `notificationCount?: number`
  - `onNotificationClick?: () => void`
  - `headerStart?: ReactNode`
  - `headerCenter?: ReactNode`
  - `headerEnd?: ReactNode`
  - `sidebarTop?: ReactNode`
  - `sidebarBottom?: ReactNode`
  - `contentTop?: ReactNode`
  - `contentBottom?: ReactNode`

---

## 7. Mobile Navigation Flow

- Renders up to the first 4 visible items as bottom tabs.
- Any remaining items are displayed under a "More" drawer overlay.
- Items are not duplicated between primary bottom tabs and secondary drawers.

---

## 8. Usage Example

```tsx
import { AppShell, PageContainer } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";

<AppShell
  navigationItems={navigationItems}
  currentPath={currentPath}
  onNavigate={handleNavigate}
  user={currentUser}
  onLogout={handleLogout}
  pageTitle="שיבוץ כוח אדם"
  layoutMode="standard"
  headerEnd={
    <Button variant="primary" size="sm" onClick={handlePublish}>
      פרסם שיבוץ
    </Button>
  }
>
  <PageContainer mode="fluid">
    <SchedulingGrid />
  </PageContainer>
</AppShell>
```
