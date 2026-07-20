# Pikud360 UI Foundation — Toolbar System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 17 — Toolbar System  
**Target Path:** [toolbar-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/toolbar-system.md)

---

## 1. Overview & Redesign Strategy

The Unified Toolbar System standardizes filters, search inputs, data export operations, density settings, and bulk actions.

---

## 2. Reusable Toolbar Controls

The [toolbar-system.tsx](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/components/ui/toolbar-system.tsx) component implements:

- **Debounced Search Input:** Focus rings border input boxes with Search magnifying icons.
- **Import/Export Button groups:** Standardizes file download triggers.
- **Density toggling dropdown:** Allows switching row heights (Compact, Standard, Relaxed).
- **Column Visibility checklist:** Dropdown checklists hiding or exposing columns dynamically.
- **Bulk Action Overlay panel:** Slides down if `selectionCount > 0`. Shows selections count and lists quick action triggers.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports (under 768px):** Toolbar items wrap into vertical stack layouts, keeping spacing consistent.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
