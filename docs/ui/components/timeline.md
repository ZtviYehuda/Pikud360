# Timeline Component Specification

**Spec Status:** ⚠️ Planned / Design Spec  
**Target Code Location:** `frontend/src/components/ui/timeline.tsx`  

---

## 1. Purpose
The `Timeline` component displays chronological events, activity logs, approval histories, and audit records in a vertical step flow.

---

## 2. Requirements
- Vertical line connector with status node dots (`success`, `warning`, `danger`, `info`).
- RTL connector alignment (line on right side of text content).
- Collapsible sub-event groups.
