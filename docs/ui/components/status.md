# Status System Specification

**Code Location:** `frontend/src/components/ui/status-badge.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The Status system provides a single reusable `StatusBadge` component that standardizes all operational status indicators across Pikud360.

---

## 2. Supported Status Presets

- **System:** `success`, `warning`, `error`, `online`, `offline`, `pending`
- **Workflow:** `approved`, `rejected`, `in-progress`
- **Attendance:** `vacation`, `sick`, `remote`, `office`, `reserve-duty`, `training`
- **Custom:** `custom` (allows custom label, icon, and color class)

---

## 3. Features & Configuration
- **Icon:** Automatic icon mapping per preset (Lucide icons).
- **Tooltip:** Built-in Hebrew tooltip description.
- **Animation:** Ping overlay animation for active live statuses (`online`, `in-progress`).
- **Theme & RTL:** HSL opacity colors, RTL label/icon alignment.
