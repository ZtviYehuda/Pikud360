# UI Standardization & Component Reusability Guidelines (MANDATORY)

## 1. System Status

- [x] Design System
- [x] Global Header (`PageHeader`)
- [x] Sidebar (`AppSidebar`)
- [x] Theme System (Light / Dark Mode)
- [x] Component Library

---

## 2. Modules Overview

- [x] **Authentication** (`src/features/auth/`)
- [x] **Dashboard** (`src/features/dashboard/`)
- [ ] **Employees** (`src/pages/EmployeesPage.tsx`, `CreateEmployeePage.tsx`, `EmployeeViewPage.tsx`)
- [ ] **Attendance** (`src/pages/AttendancePage.tsx`)
- [ ] **Roster** (`src/pages/RosterPage.tsx`)
- [ ] **Transfers** (`src/pages/TransfersPage.tsx`)
- [ ] **Feedback** (`src/pages/FeedbackPage.tsx`)
- [ ] **Activity Log** (`src/pages/ActivityLogPage.tsx`)
- [ ] **Settings** (`src/pages/SettingsPage.tsx`)

---

## 3. Shared Components Registry

- `PageHeader`
- `PageToolbar`
- `SearchBar`
- `FilterBar`
- `DataTable`
- `StatusBadge`
- `EmptyState`
- `LoadingState`
- `ConfirmationDialog`
- `EntityForm`
- `PrimaryButton`
- `SecondaryButton`

---

## 4. UI Standardization (MANDATORY)

Every page in the application **must** use the shared UI components.

The approved components above are the **only allowed implementations**.

- **No duplicate implementations are allowed.**
- If a page requires one of these elements, it **must reuse the shared component**.
- Creating page-specific versions of existing shared components is prohibited.

---

## 5. Component Creation Rule (CRITICAL)

Before creating any new component:
1. **Search** the project for an existing reusable component.
2. If a suitable component exists, **extend it** instead of creating a new one.
3. Creating a new shared component is allowed **only** when no existing component can reasonably be reused.

**One UI pattern = One shared component.**

Never duplicate UI.
Always extend.
3. **Only create a new component** if no reusable solution already exists.

> **One UI pattern = One shared component.**

---

## 6. Component Ownership (MANDATORY)

Each reusable component has a single owner:

- `PageHeader` → Layout System
- `PageToolbar` → Layout System
- `SearchBar` → Search System
- `FilterBar` → Filter System
- `DataTable` → Table System
- `StatusBadge` → Status System
- `Button` → Button System
- `Dialog` → Dialog System
- `EmptyState` → Feedback System
- `LoadingState` → Feedback System

**Only the owner component may be modified.**

**Pages must never override shared component behavior.**

---

## 7. Standard Page Template (MANDATORY)

Every application page **must** follow this strict top-to-bottom layout structure:

```
Global Header (shared)
   ↓
Page Header
   ↓
Page Toolbar
   ↓
Page Content
   ↓
Dialogs / Drawers
   ↓
Notifications
```

**This layout is mandatory across the entire application.**

---

## 8. Component Reuse Hierarchy (MANDATORY)

Before creating a component, strictly evaluate through this hierarchy:

```
Page
 ↓
Feature Component
 ↓
Shared Component
 ↓
UI Primitive
```

**Never skip this hierarchy.**

**Never duplicate an existing shared component.**

---

## 9. Design Tokens (MANDATORY)

**Hardcoded values are prohibited.**

Always use semantic design tokens.

Never hardcode:
- Colors
- Spacing
- Border Radius
- Typography
- Shadow
- Animation

**Use the Design System variables only.**

---

## 10. Module Independence (MANDATORY)

Each feature module **must be self-contained**.

Modules communicate **only** through:
- API
- Shared Components
- Shared Types
- Global Store

**Cross-module imports are prohibited unless explicitly approved.**

---

## 11. Performance Standards (MANDATORY)

- Avoid unnecessary renders.
- Memoize expensive components (`React.memo`, `useMemo`, `useCallback`).
- Lazy load large modules (`React.lazy`).
- Virtualize large tables (`tanstack/react-virtual` / virtualization).
- Keep bundle size optimized (smart chunk splitting, tree-shaking).

**Performance improvements must never change the UI.**

---

## 12. Definition of Done (MANDATORY)

A module is considered complete only when:

- [ ] ✓ UI matches the approved design.
- [ ] ✓ Uses only shared components.
- [ ] ✓ No duplicated components exist.
- [ ] ✓ TypeScript compilation passes with 0 errors.
- [ ] ✓ Responsive layout verified.
- [ ] ✓ RTL verified.
- [ ] ✓ Dark Mode verified.
- [ ] ✓ Accessibility verified.
- [ ] ✓ Connected to backend APIs.
- [ ] ✓ Mock data removed.
- [ ] ✓ No console errors.
- [ ] ✓ No TODO comments remain.

---

## Golden Rule (CRITICAL)

- **Build once.**
- **Reuse everywhere.**
- **Never duplicate.**
- **Always extend.**
- **Consistency is more important than speed.**
