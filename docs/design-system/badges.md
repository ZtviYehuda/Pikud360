# badges.md

This document specifies the Enterprise Badge API defined in [badge.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/badge.tsx).

---

## 1. Composition Design

The Badge component is strictly presentation-only and decoupled from application state or business logic. Rather than nesting logic or hardcoding layouts inside the component, the badge is built via **Composition** of small optional parts:
- **Status Dot**: Renders a tiny circular indicator matching the variant color.
- **Icon**: Renders a leading icon next to children.
- **Label / Text**: Renders children inside the badge.

This composition allows future screens (e.g. Employee Status, Alert Severity, Assignment status) to reuse the Badge component consistently without modifying its code.

---

## 2. Component API

```typescript
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  showDot?: boolean;
}
```

---

## 3. Visual Variants Specs

- **`success`**: Light emerald background and text (`bg-enterprise-success/15 border-enterprise-success/30 text-enterprise-success`). Represents active status, available personnel, or successful operations.
- **`warning`**: Light amber background and text (`bg-enterprise-warning/15 border-enterprise-warning/30 text-enterprise-warning`). Represents pending items or unassigned workforce.
- **`danger`**: Light rose background and text (`bg-enterprise-danger/15 border-enterprise-danger/30 text-enterprise-danger`). Represents sick personnel or immediate action required.
- **`info`**: Light blue background and text (`bg-enterprise-info/15 border-enterprise-info/30 text-enterprise-info`). Renders informational badges.
- **`neutral`**: Gray border and background (`bg-enterprise-border/50 border-enterprise-border/80 text-enterprise-neutral`). Used for default badges.
- **`outline`**: Transparent background with gray borders (`border-enterprise-border bg-transparent text-enterprise-neutral`).

---

## 4. Sizes

- **`sm`**: Uses small padding and overline typography (`px-1.5 py-0.5 text-enterprise-overline`).
- **`md`**: Standard padding and caption typography (`px-2.5 py-0.5 text-enterprise-caption`).

---

## 5. Usage Examples

```tsx
import { Badge } from "@/components/ui/badge";
import { Check, ShieldAlert } from "lucide-react";

// Standard Success status badge
<Badge variant="success">
  פעיל
</Badge>

// Warning badge with dynamic status dot
<Badge variant="warning" showDot>
  ממתין לשיבוץ
</Badge>

// Danger status badge with custom icon
<Badge variant="danger" icon={<ShieldAlert />}>
  דורש טיפול
</Badge>
```
