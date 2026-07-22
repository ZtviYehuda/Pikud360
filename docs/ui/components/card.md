# Card Component Specification

**Code Location:** `frontend/src/components/ui/card.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The `Card` and `EnterpriseCard` components group related information, controls, and widgets into distinct visual surfaces across dashboards and operational pages.

---

## 2. Props Signature

```typescript
export interface EnterpriseCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  loading?: boolean;
  error?: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  variant?: 
    | "statistic" | "chart" | "table" | "list" 
    | "profile" | "alert" | "timeline" | "settings" 
    | "quickaction" | "insight" | "status";
  severity?: "info" | "success" | "warning" | "danger";
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  isHoverable?: boolean;
  isSelected?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
```

---

## 3. Usage Examples

```tsx
import { EnterpriseCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function OverviewCard() {
  return (
    <EnterpriseCard
      title="סיכום כוח אדם"
      description="סטטוס נוכחות יומי"
      toolbar={<Button size="sm" variant="ghost">ייצוא</Button>}
      footer={<span>עודכן לפני 5 דקות</span>}
    >
      <div className="text-2xl font-bold">84% נוכחות</div>
    </EnterpriseCard>
  );
}
```

---

## 4. Variants Matrix

| Variant | Purpose |
|---|---|
| `primary` / `statistic` | Standard elevated surface for metrics and indicators |
| `interactive` | Clickable card with hover elevation shift and cyan border glow |
| `alert` | High priority notice card colored by severity token |
| `empty` | Dashed border container for empty state displays |
| `loading` | Skeleton animated pulse placeholder |

---

## 5. Accessibility
- Interactive cards receive `role="button"` and keyboard listener when `onClick` is present.
- Alert severity cards announce via `role="alert"`.

---

## 6. RTL Support
- Text alignment defaulted to `text-right`.
- Header toolbar action items aligned to flex start/end based on RTL flow.

---

## 7. Theme Mapping
- Surface token: `bg-white dark:bg-slate-900`.
- Border token: `border-slate-200/60 dark:border-slate-800/80`.

---

## 8. Responsive Design
- Adaptive padding: `p-4 md:p-6`.
- Collapsible support for small viewports via `isCollapsed` prop.

---

## 9. Best Practices
- **DO** use header toolbars for secondary card actions.
- **DON'T** nest cards inside cards.
