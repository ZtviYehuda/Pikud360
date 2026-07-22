# Pikud360 UI Foundation — Visual Density Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 22 — Visual Density  
**Target Path:** [visual-density.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/visual-density.md)

---

## 1. Overview & Redesign Strategy

Pikud360 maximizes visual density to support complex command actions without cluttering layouts. Every layout pixel is configured to convey relevant data points.

---

## 2. Density Standards & Limits

We standardize spacing variables as follows:

- **Layout Margins:** Screen margins use a standard width gap (`px-4 md:px-6 py-6`).
- **Paddings:** Dashboard cards and tables use compact margins (`p-4` or `gap-4`). Inside lists, gaps use `gap-2` (8px).
- **Heights matching:** Row elements use `items-stretch` to align columns to identical vertical sizes.
- **Header Heights:** Unified topbar heights are locked to a compact height of `h-14` (56px).
- **Sidebar Widths:** Locked at `w-64` (256px) on desktop, and collapses into floating sheet modals on smaller screens.
- **Compact Table rows:** Rows map standard paddings (`py-2.5 px-3`) and text dimensions (`text-xs`).
- **Compact Chart Containers:** Locked to standard viewport aspect parameters (`h-64` or `h-80` max-height) to prevent scrolling.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports (under 768px):** Paddings shrink (`p-3`), text wraps, and grids align to single vertical stacks.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
