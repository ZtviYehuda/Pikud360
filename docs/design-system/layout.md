# layout.md

This document specifies the Enterprise Layout System primitives defined in [layout-primitives.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/layout-primitives.tsx).

---

## 1. Design Philosophy

- **One Layout System. Many Screens. Zero Custom Layouts**: Every page follows a unified composition model using layout primitives. Arbitrary custom layouts (e.g., `gap-7`, `mt-11`) are prohibited.
- **Mobile-First Responsive Flow**: Layout components adapt fluidly from mobile to desktop. On mobile devices, action controls wrap to full-width block formats and grids default to a single column to support quick, one-handed scanning.

---

## 2. Layout Component APIs

### `<PageLayout>`
Main parent wrapper for pages. Enforces page paddings and logical vertical spacing.
- **Styles**: `w-full flex flex-col gap-enterprise-section-gap p-enterprise-page-pad`
- **Usage**:
  ```tsx
  import { PageLayout } from "@/components/ui/layout-primitives";

  <PageLayout>
    {/* Page Content */}
  </PageLayout>
  ```

### `<PageHeader>`
Central page header. Organizes titles, breadcrumbs, descriptions, and page controls in a responsive layout.
- **Props**:
  - `title: ReactNode` (Page title, rendered with H1 styling)
  - `subtitle?: ReactNode` (Page subtitle)
  - `breadcrumbs?: ReactNode` (Breadcrumb context link path)
  - `actions?: ReactNode` (Slot for top right page controls)
- **Usage**:
  ```tsx
  import { PageHeader } from "@/components/ui/layout-primitives";
  import { Button } from "@/components/ui/button";

  <PageHeader
    title="ניהול כוח אדם"
    subtitle="תמונת מצב נוכחות"
    breadcrumbs={<a href="/dashboard">ראשי</a>}
    actions={<Button>קלוט חייל</Button>}
  />
  ```

### `<Section>`
A logical content layout block. Stacked vertically within `PageLayout`.
- **Styles**: `flex flex-col gap-enterprise-component-gap w-full`

### `<SectionHeader>`
Header component for standard Sections.
- **Props**:
  - `title: ReactNode` (Section title, rendered with H2 styling)
  - `description?: ReactNode` (Sub-header text description)
  - `actions?: ReactNode` (Slot for section controls)
- **Usage**:
  ```tsx
  import { SectionHeader } from "@/components/ui/layout-primitives";

  <SectionHeader
    title="חיילים ללא שיבוץ"
    description="רשימת כוח אדם הדורש טיפול מיידי"
  />
  ```

### `<ResponsiveGrid>`
Grid layout that adapts columns based on configuration properties. Employs pre-defined dictionary lookups to bypass Tailwind CSS v4 JIT compilation constraints.
- **Props**:
  - `cols?: { mobile?: number; tablet?: number; desktop?: number }` (Default: mobile=1, tablet=2, desktop=3)
- **Usage**:
  ```tsx
  import { ResponsiveGrid } from "@/components/ui/layout-primitives";

  <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }}>
    <div>Widget 1</div>
    <div>Widget 2</div>
  </ResponsiveGrid>
  ```

### `<ContentStack>`
Vertical stack helper providing visual separation.
- **Styles**: `flex flex-col gap-enterprise-component-gap w-full`

### `<ActionGroup>`
Toolbar container for action buttons. Reverses order on mobile screens so that primary controls stack above secondary ones, facilitating quick touch interaction.
- **Styles**: `flex flex-col-reverse sm:flex-row sm:items-center gap-enterprise-component-gap`
- **Usage**:
  ```tsx
  import { ActionGroup } from "@/components/ui/layout-primitives";
  import { Button } from "@/components/ui/button";

  <ActionGroup>
    <Button variant="outline">ביטול</Button>
    <Button variant="primary">שמור שינויים</Button>
  </ActionGroup>
  ```
