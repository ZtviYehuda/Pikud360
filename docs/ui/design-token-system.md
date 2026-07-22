# Pikud360 UI Foundation — Design Token System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 28 — Design Token System  
**Target Path:** [design-token-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/design-token-system.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises global layout parameters (colors, margins, borders, shadows, and timings) into a centralized token system inside [index.css](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/styles/index.css).

---

## 2. Centralized Design Token Specifications

The system implements the following tokens:

- **Colors:**
  - **Light Mode:** Brand Blue (`#0052cc`), Background Grey (`#f4f5f7`), Surface White (`#ffffff`), Border Slate (`#dfe1e6`).
  - **Obsidian Dark Mode:** Command Blue (`#3b82f6`), Obsidian Navy (`#0a0d16`), Obsidian Surface (`#121826`), Separator Border (`#1f293d`).
  - **High Contrast (Future-Ready):** High contrast black background (`#000000`), white boundaries (`#ffffff`), and yellow focus rings.
- **Typography:** Display title (`2.25rem`), Section header (`1.125rem`), Body standard (`1.0rem`), Captions (`0.75rem`).
- **Spacing Scale:** Gaps and paddings are locked to 8px multiples (`0.25rem`, `0.5rem`, `1.0rem`, `1.5rem`).
- **Border Radius:** Mapped curves (`sm: 6px`, `md: 10px`, `lg: 14px`, `xl: 20px`).
- **Shadows:** ambient depth layers (`flat`, `card`, `floating`, `drawer`, `modal`).
- **Timings & Easings:** Instant (`0ms`), Fast (`150ms`), Standard Ease (`cubic-bezier(0.4, 0, 0.2, 1)`).
- **Z-Index scale:** Tooltip (`1060`), Toast (`1050`), Modal (`1040`), Drawer (`1030`), Dropdown (`1020`), Sticky (`1000`).

---

## 3. Responsive & RTL Alignment

- **Breakpoints:** Spans map to desktop (`1280px`), tablet (`768px`), and mobile screens (`320px`).
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
