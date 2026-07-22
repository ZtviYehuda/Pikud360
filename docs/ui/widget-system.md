# Pikud360 UI Foundation — Widget System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 23 — Widget System  
**Target Path:** [widget-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/widget-system.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises the dashboard widgets component wrapper to manage control buttons, live update status markers, permission access checking logic, and visual loaders.

---

## 2. Dashboard Widget Component Details

The [dashboard-widget.tsx](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/components/ui/dashboard-widget.tsx) component implements:

- **Unified Header Banner:** Renders bold titles, icons, status badges, and dynamic timestamps indicating update delays.
- **Actions Toolbar:**
  - **Refresh trigger:** Local update query button.
  - **Export trigger:** Mapped CSV reporting triggers.
  - **Settings & Help anchors:** Gear/question icons exposing settings dialog overlays.
  - **Fullscreen toggle:** Expands the card component to fill the viewport.
- **Permissions visible checks:** Renders a padlock warning screen if `hasPermission === false`.
- **Loading & Error bounds:** Spinner overlays for loading periods, and warning indicators for error retries.
- **Empty states:** Displayed when list values are empty.

---

## 3. Responsive & RTL Alignment

- **Mobile viewports:** Toolbar icons align next to each other, titles wrap, and screens stretch correctly.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
