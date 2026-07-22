# Pikud360 UI Foundation — Status System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 24 — Status System  
**Target Path:** [status-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/status-system.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises statuses across lists, rosters, and profiles, mapping states (approved, pending, sick, reserve-duty, remote) to unified colors, text translations, and icons.

---

## 2. Reusable Status Badge Mappings

The new [status-badge.tsx](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/components/ui/status-badge.tsx) component implements:

- **Workforce Presets:**
  - `online` / `approved`: emerald green background with checkmarks/thumbs-up icons.
  - `pending` / `in-progress`: amber clock/activity elements.
  - `error` / `rejected`: red cross icons.
  - `vacation`: sky blue airplane icons.
  - `sick`: rose pill/heart icons.
  - `remote`: indigo home icons.
  - `office`: blue building icons.
  - `reserve-duty`: purple shield icons.
  - `training`: teal open-book icons.
- **Pulsing dots:** Optional live status animation overlays for active states (`online` or `in-progress`).
- **Interactive Tooltip description:** Binds native focus descriptors using HTML title attributes.

---

## 3. Responsive & RTL Alignment

- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
- **Compact size limits:** Height is locked at `h-6` (24px) with rounded pill borders, ensuring badges align cleanly next to profile headers and list rows.
