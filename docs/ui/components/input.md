# Input & Form Components Specification

**Code Location:** `frontend/src/components/ui/input.tsx`, `frontend/src/components/ui/form-helper.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The Input component family (`Input`, `EnterpriseInput`, `EnterpriseSelect`, `EnterpriseTextarea`) captures user data input in forms, dialogs, and filters with built-in validation styling, labels, and helper messages.

---

## 2. Props Signatures

### Base Input
```typescript
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

### Enterprise Form Input
```typescript
export interface EnterpriseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
```

---

## 3. Usage Examples

```tsx
import { EnterpriseInput } from "@/components/ui/form-helper";

export function EmployeeForm() {
  return (
    <EnterpriseInput
      label="מספר אישי"
      placeholder="הכנס מס' אישי 7 ספרות"
      helperText="לדוגמה: 8123456"
      error={undefined}
    />
  );
}
```

---

## 4. Variants & States

- **Default:** Slate border, subtle shadow.
- **Focus:** Cyan glow ring (`ring-2 ring-cyan-500/20`), border accent.
- **Error:** Red border highlight (`border-red-500/50`), accompanied by `AlertCircle` micro-icon message.
- **Disabled:** 50% opacity, `cursor-not-allowed`.

---

## 5. Accessibility
- Inputs associate with error/helper text via DOM hierarchy.
- Visible focus rings with high contrast outline.
- Supports native keyboard navigation (`Tab`, `Shift+Tab`).

---

## 6. RTL Support
- Text alignment defaults to `text-right`.
- Search and clear icons positioned using `right-3` / `left-3` logical relative offsets.

---

## 7. Theme Mapping
- Consumes `--color-enterprise-surface`, `--color-enterprise-border`, dark mode slate tokens.

---

## 8. Responsive Design
- `w-full` expands smoothly inside grid layouts across mobile and desktop.
- Touch target height: 36px (`h-9`) minimum.

---

## 9. Best Practices
- **DO** always supply a `label` or `aria-label`.
- **DO** provide clear, actionable `error` messages.
- **DON'T** use placeholder text as a substitute for a field label.
