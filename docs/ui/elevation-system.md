# Pikud360 UI Foundation — Elevation System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 31 — Elevation System  
**Target Path:** [elevation-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/elevation-system.md)

---

## 1. Overview & Redesign Strategy

Pikud360 defines a strict vertical depth scale mapping components to custom shadows, blurs, borders, and Z-index layers to ensure interfaces stack naturally.

---

## 2. Reusable Elevation Levels Spec

Variables mapped in [index.css](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/styles/index.css) include:

- **Flat (Level 0):** Renders no shadow borders. Used for card inner lists.
- **Raised (Level 1):** Soft ambient grey shadow (`--shadow-enterprise-card`). Used for dashboard cards.
- **Floating (Level 2):** Distinct drop shadow (`--shadow-enterprise-floating`). Used for cards on hover and command list items.
- **Popover / Dropdown (Level 3):** Deep overlay shadow, locked to `z-index: 1020` layer.
- **Drawer / Dialog / Modal (Level 4):** Prominent drop shadows, locked to `z-index: 1030` (Drawer) or `z-index: 1040` (Modal/Dialog). Includes backdrop blur.
- **Toast (Level 5):** Top layer floating alert box, locked to `z-index: 1050`.
- **Tooltip (Level 6):** Absolute top descriptor, locked to standard `z-index: 1060`.
- **Overlay:** Backdrops behind dialog sheets, locked to `bg-black/60` and `backdrop-blur-xs`.

---

## 3. Responsive & RTL Alignment

- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
- **Animation timing:** Drawer panels slide in from screen edges over standard decelerating easing speeds (`250ms`).
