# Pikud360 UI Foundation — Command Palette Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 27 — Command Palette  
**Target Path:** [command-palette.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/command-palette.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises the command palette structure, integrating executable commands directly within the `GlobalSearch` overlay.

---

## 2. Command Palette Structure

The system unifies the search bar command list:

- **Type Trigger `>` Prefix:** Typing `>` at the beginning of the search input displays executable system commands:
  - `מעבר לדף הבית` (Go to Home Page)
  - `הוסף חייל / עובד` (Add Workforce Record)
  - `החלפת ערכת נושא` (Toggle Theme Mode)
  - `התנתק מהמערכת` (Sign Out)
- **Recent Commands History:** Remembers the last 5 executed commands.
- **Favorites list:** Users can pin commands for quicker access.
- **Keyboard-only Navigation:** Users navigate options list using the arrow keys `↑` and `↓`, and run commands using `Enter` without mouse clicks.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports:** Dialog containers scale dynamically, avoiding offscreen text cutoff.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
