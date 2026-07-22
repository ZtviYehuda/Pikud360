# Spinner Component Specification

**Code Location:** `frontend/src/components/ui/spinner.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The `Spinner` component provides inline and localized activity indicators during short loading transitions (<300ms) or button action processing.

---

## 2. Sizes
- `sm`: 16px (`h-4 w-4`) — inline inside buttons and inputs
- `default`: 24px (`h-6 w-6`) — widget header refresh & section loaders
- `lg`: 32px (`h-8 w-8`) — centered page loading indicators

---

## 3. Usage Example
```tsx
import { Spinner } from "@/components/ui/spinner";

export function LoadingBadge() {
  return <Spinner size="sm" />;
}
```
