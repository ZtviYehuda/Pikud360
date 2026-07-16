# buttons.md

This document specifies the Enterprise Button API defined in [button.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/button.tsx).

---

## 1. Button API Specification

Every button in Pikud360 uses `<Button>`. We avoid separate layout wrappers (e.g. `PrimaryButton` or `IconButton`) and instead parameterize features through props.

### Props Definition

```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

---

## 2. Variants Specification

- **`primary`**: Main brand action. Renders in enterprise blue.
  - `bg-enterprise-primary text-white shadow-enterprise-card hover:bg-enterprise-primary/95`
- **`secondary`**: Subdued action button for auxiliary triggers.
  - `bg-enterprise-border/40 text-enterprise-neutral hover:bg-enterprise-border/70 border border-enterprise-border/20`
- **`outline`**: Bordered card button.
  - `border border-enterprise-border bg-enterprise-surface text-enterprise-neutral hover:bg-enterprise-background`
- **`ghost`**: Subdued action showing background only on hover.
  - `text-enterprise-neutral hover:bg-enterprise-background`
- **`danger`**: Destructive warning action.
  - `bg-enterprise-danger text-white shadow-enterprise-card hover:bg-enterprise-danger/95`
- **`link`**: Text link format.
  - `text-enterprise-primary underline-offset-4 hover:underline`

*Note: For backward compatibility, the variant `default` maps to `primary`, and `destructive` maps to `danger`.*

---

## 3. Sizes and Touch Targets

- **`default`**: Height is set to `44px` (`h-enterprise-btn-h-md`) to guarantee accessible mobile targets.
- **`sm`**: Height is set to `36px` (`h-enterprise-btn-h-sm`).
- **`lg`**: Height is set to `52px` (`h-enterprise-btn-h-lg`).
- **`icon`**: Square button (`44px` x `44px`) to support accessible thumb interactions.

---

## 4. Usage Examples

```tsx
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash } from "lucide-react";

// Primary action with left icon
<Button variant="primary" leftIcon={<Plus />}>
  הוסף שיבוץ
</Button>

// Destructive full-width loading state
<Button variant="danger" fullWidth loading>
  מחיקת נתונים
</Button>

// Icon only touch-friendly trigger
<Button variant="outline" size="icon">
  <Trash />
</Button>
```
