# Button Component Specification

**Code Location:** `frontend/src/components/ui/button.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The `Button` component triggers immediate user actions or forms submission. It provides clear visual feedback for interactive states (default, hover, focus, active, disabled, loading).

---

## 2. Props Signature

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | string | `"primary"` | Visual hierarchy variant |
| `size` | string | `"default"` | Height and padding preset (`sm`: 32px, `md`: 36px, `lg`: 44px, `icon`: 36x36px) |
| `loading` | boolean | `false` | Displays spinning indicator and disables interactions |
| `fullWidth` | boolean | `false` | Expands button to 100% width of parent container |
| `leftIcon` | ReactNode | `undefined` | Icon positioned before children (respects RTL) |
| `rightIcon` | ReactNode | `undefined` | Icon positioned after children (respects RTL) |
| `disabled` | boolean | `false` | Standard HTML disabled state |

---

## 3. Usage Examples

### Basic Primary Button
```tsx
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function SaveAction() {
  return (
    <Button variant="primary" leftIcon={<Save className="h-4 w-4" />}>
      שמור שינויים
    </Button>
  );
}
```

### Loading State Button
```tsx
<Button variant="primary" loading>
  שומר נתונים...
</Button>
```

---

## 4. Variants Matrix

| Variant | Purpose | Visual Styling |
|---|---|---|
| `primary` | Main call-to-action per section | Brand primary background, white text, subtle shadow |
| `secondary` | Alternative actions | Muted border background, neutral text |
| `outline` | Low-emphasis secondary actions | Bordered surface, transparent background |
| `ghost` | Toolbar & icon-only actions | Transparent background, hover background fill |
| `danger` | Destructive operations | Red alert background, white text |
| `link` | Text navigation inline | Underlined link text styling |

---

## 5. Accessibility
- Focus visible indicator: `focus-visible:ring-2 focus-visible:ring-enterprise-primary`
- Disabled & loading buttons receive `disabled` attribute and `pointer-events-none`.
- SVG icons receive `aria-hidden="true"`.

---

## 6. RTL Support
- Uses `gap-enterprise-component-gap` (flex gap).
- `leftIcon` and `rightIcon` dynamically adapt to natural flex layout in `dir="rtl"`.
- Directional arrow icons inside buttons use `rtl:scale-x-[-1]`.

---

## 7. Theme Mapping
- Consumes semantic tokens: `--color-enterprise-primary`, `--color-enterprise-danger`, `--color-enterprise-surface`.
- Fully reactive to light and dark theme mode context changes.

---

## 8. Responsive Design
- Full width support via `fullWidth` prop for mobile bottom-sheet action bars.
- Touch targets strictly enforced at minimum height 32px (sm) up to 44px (lg).

---

## 9. Best Practices
- **DO** use one primary button per card / modal view.
- **DON'T** mix multiple primary buttons in a single action group.
- **DO** use `loading` prop instead of manually placing a spinner inside `children`.
