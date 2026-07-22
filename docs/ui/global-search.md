# Pikud360 UI Foundation — Global Search Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 26 — Global Search  
**Target Path:** [global-search.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/global-search.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises the global search modal to act as a fast, keyboard-navigable command center.

---

## 2. Command Palette Specs & Layout

The global search overlay integrates:

- **Hotkey Toggle trigger:** Users press `Ctrl+K` or `Cmd+K` to toggle the dialog overlay, and `Esc` to dissolve it.
- **Searchable Index Groups:**
  - **Workforce:** Profiles of soldiers and civilian personnel.
  - **Organizational Node Structures:** Divisions, command branches, and clinics.
  - **Reports & Records:** Staffing logs and attendance telemetry tables.
  - **System Notifications:** Alerts queue.
  - **Active settings commands:** User preference toggles.
- **Interactive keyboard focus mapping:** Arrow keys `↑` and `↓` navigate search matches, and `Enter` triggers navigation to the target path.
- **Recent Searches & Favorites:** Stores recent query logs.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports:** Modal overlay scales to fill the width of the display.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
