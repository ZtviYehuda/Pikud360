# Calendar Component Specification

**Spec Status:** ⚠️ Planned / Design Spec  
**Target Code Location:** `frontend/src/components/ui/calendar.tsx`  

---

## 1. Purpose
The `Calendar` component provides date picker and shift scheduling calendar grids for managing workforce availability, leave requests, and operational duties.

---

## 2. Requirements
- Full Hebrew localization (Sunday–Saturday week order: `א'`, `ב'`, `ג'`, `ד'`, `ה'`, `ו'`, `ש'`).
- Single date selection, date range selection, and multi-date shift allocation modes.
- Integrated reserve-duty and holiday indicators.
