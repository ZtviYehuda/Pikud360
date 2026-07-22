# Tooltip Component Specification

**Spec Status:** ⚠️ Planned / Design Spec  
**Target Code Location:** `frontend/src/components/ui/tooltip.tsx`  

---

## 1. Purpose
The `Tooltip` component provides hover or focus contextual helper text for icon buttons, status indicators, and truncated table cell strings.

---

## 2. Design Requirements
- Built on `@radix-ui/react-tooltip`.
- Delay duration: 200ms default.
- Background: `bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900`.
- Arrow indicator: integrated small pointer triangle.
- RTL-aware placement (`top`, `bottom`, `start`, `end`).
