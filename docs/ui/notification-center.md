# Pikud360 UI Foundation — Notification Center Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 25 — Notification Center  
**Target Path:** [notification-center.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/notification-center.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises notifications into a unified, high-density, action-oriented Notification Center interface.

---

## 2. Notification Center Component Details

The [notification-center.tsx](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/components/ui/notification-center.tsx) component implements:

- **Filter Toolbar:** Contains search input text blocks, category dropdowns (`system`, `workforce`, `operations`, `access`), and priority selectors (`critical`, `high`, `normal`, `info`).
- **Notification Cards:**
  - **Read/Unread status:** Configured with active border indicators.
  - **Priority color indicators:** Critical/high priority badges use semantic state colors.
  - **Archiving & Deleting:** Dedicated icon buttons allowing immediate archiving or list removal.
  - **Jump Links:** Option to redirect view to the related feature page.
  - **Infinite Scroll Simulation:** Built-in "Load More" action button to fetch additional data points.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports:** Filter controls stack vertically, list elements scale to 100% width, and fonts wrap.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
