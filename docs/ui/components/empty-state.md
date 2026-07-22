# Empty State & Error State Specification

**Code Location:** `frontend/src/components/ui/states.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
`EmptyState` and `ErrorState` components inform users when views contain no data or when server requests fail, providing actionable recovery buttons.

---

## 2. EmptyState Props
```typescript
export interface EmptyStateProps {
  title: React.ReactNode;
  description: React.ReactNode;
  icon?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
}
```

---

## 3. Usage Example
```tsx
import { EmptyState } from "@/components/ui/states";
import { Users } from "lucide-react";

export function NoEmployeesState() {
  return (
    <EmptyState
      title="אין חיילים ביחידה"
      description="לא נמצאו חיילים משויכים ליחידה זו."
      icon={<Users className="h-8 w-8 text-slate-400" />}
      primaryAction={{ label: "הוסף חייל חדש", onClick: () => {} }}
    />
  );
}
```
