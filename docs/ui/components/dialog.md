# Dialog Component Specification

**Code Location:** `frontend/src/components/ui/dialog.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The `Dialog` component displays modal popups for critical user confirmations, forms, and detail views. Built on `@radix-ui/react-dialog` primitives.

---

## 2. Props Signature

```typescript
export interface DialogContentProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}
```

---

## 3. Usage Example

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger">מחק משתמש</Button>
      </DialogTrigger>
      <DialogContent title="אישור מחיקה" description="האם אתה בטוח שברצונך למחוק משתמש זה?">
        <p className="text-sm">פעולה זו היא סופית ולא ניתן לבטלה.</p>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. Accessibility & Behavior
- Traps focus inside modal when open.
- Closes on `Escape` keypress.
- Backdrop blur backdrop overlay (`backdrop-blur-xs`).
- Announces title via `aria-labelledby`.
