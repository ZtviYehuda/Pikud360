# Drawer & Sheet Component Specification

**Code Location:** `frontend/src/components/ui/drawer.tsx`, `frontend/src/components/ui/sheet.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The `Drawer` component provides side panels (desktop) and bottom sheets (mobile) for complex forms, filter sets, and detailed drill-down inspectors without losing main page context.

---

## 2. Responsive Transformation
- **Desktop (≥ md):** Right-side sliding panel (`md:w-[480px]`, `slide-in-from-right`).
- **Mobile (< md):** Bottom sheet sliding from screen bottom (`inset-x-0 bottom-0 rounded-t-2xl`, `slide-in-from-bottom`).

---

## 3. Usage Example

```tsx
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export function SettingsDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">פתח הגדרות מתקדמות</Button>
      </DrawerTrigger>
      <DrawerContent size="md">
        <div className="p-4">תוכן הפאנל</div>
      </DrawerContent>
    </Drawer>
  );
}
```
