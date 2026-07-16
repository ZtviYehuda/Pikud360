# states.md

This document specifies the Enterprise State System components defined in [states.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/states.tsx) and [skeleton.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/skeleton.tsx).

---

## 1. Design Principles

- **Four States Completeness**: Every screen or page in Pikud360 must support and be able to render four states cleanly: **Loading**, **Empty**, **Error**, and **Success**.
- **Pure Presentation**: State components are stateless and independent of data fetching or business logic. Content parameters and callbacks are passed exclusively via props.
- **Composition-Based Loading**: Rather than creating monolithic feature-specific loading mockups, loading layouts compose standard visual mockup skeletons from reusable **Skeleton Primitives**.
- **Accessible State Mapping**: Icons and status indicators are marked with `aria-hidden="true"`. We never rely on color alone to communicate system states.

---

## 2. Skeleton Primitives

Standard block lines and avatar mocks defined in [skeleton.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/skeleton.tsx):

- **`<Skeleton>`**: Base animation block.
- **`<SkeletonLine>`**: Text line mockup wrapper.
- **`<SkeletonAvatar>`**: Circle avatar image placeholder.
- **`<SkeletonBlock>`**: Rectangular block mockup (useful for mockup tables, charts, or content boxes).
- **`<SkeletonCard>`**: Composed loading skeleton card mockup.
- **`<SkeletonTable>`**: Composed loading table row mockup.

---

## 3. EmptyState Component API

Displays instructions and action triggers when no records/items are found.
- **Props**:
  - `title: ReactNode` (Primary text description)
  - `description: ReactNode` (Supporting text description)
  - `icon?: ReactNode` (Optional visual graphic)
  - `primaryAction?: { label: string; onClick: () => void; disabled?: boolean }`
  - `secondaryAction?: { label: string; onClick: () => void; disabled?: boolean }`
- **Usage**:
  ```tsx
  import { EmptyState } from "@/components/ui/states";
  import { FileQuestion } from "lucide-react";

  <EmptyState
    icon={<FileQuestion />}
    title="אין חיילים להצגה"
    description="לא נמצאו חיילים התואמים את סינון החיפוש הנוכחי"
    primaryAction={{
      label: "הוסף חייל חדש",
      onClick: () => handleAdd()
    }}
  />
  ```

---

## 4. LoadingState Component API

Renders visual mockup skeleton representations while content loads.
- **Props**:
  - `variant?: 'card' | 'table' | 'list' | 'layout'` (Default: `card`)
  - `rows?: number` (For tabular or list-based loading structures)
- **Usage**:
  ```tsx
  import { LoadingState } from "@/components/ui/states";

  // Card view loading skeleton
  <LoadingState variant="card" />

  // Tabular loading skeleton with 5 mockup rows
  <LoadingState variant="table" rows={5} />
  ```

---

## 5. ErrorState Component API

Renders styled error boxes with reload buttons if loading fails.
- **Props**:
  - `title: ReactNode`
  - `description: ReactNode`
  - `icon?: ReactNode`
  - `retryAction?: { label: string; onClick: () => void; disabled?: boolean }`
  - `secondaryAction?: { label: string; onClick: () => void; disabled?: boolean }`
- **Usage**:
  ```tsx
  import { ErrorState } from "@/components/ui/states";
  import { AlertOctagon } from "lucide-react";

  <ErrorState
    icon={<AlertOctagon />}
    title="שגיאה בטעינת נתונים"
    description="אירעה תקשורת שרת לקויה. אנא נסה שוב מאוחר יותר."
    retryAction={{
      label: "נסה שנית",
      onClick: () => handleReload()
    }}
  />
  ```
