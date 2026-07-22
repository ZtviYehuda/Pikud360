# Pikud360 UI Foundation — Dialog System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 20 — Dialog System  
**Target Path:** [dialog-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/dialog-system.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises overlay dialog alerts (confirmations, deletables, warnings, forms, and custom wizard panels) to ensure overlays look identical and support responsive viewport limitations.

---

## 2. Reusable Dialog Layout Specs

The core [dialog.tsx](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/components/ui/dialog.tsx) module implements:

- **Visual Header Zone:** Bold Hebrew titles paired with descriptive subtexts and visual icon slots.
- **Scrollable Body Zone:** Fits the layout grid dynamically with loading indicators and error states.
- **Sticky Actions Footer:** Aligns confirmation/dismiss buttons on standard horizontal lines.
- **Size configurations:**
  - **Small (`sm` - 384px max-width):** Used for confirmations and deletable boxes (e.g. `ConfirmationDialog` / `DeleteDialog`).
  - **Medium (`md` - 448px max-width):** Standard warning panels (e.g. `AlertDialog`).
  - **Large (`lg` - 512px max-width):** Complex forms screens (e.g. adding staff records).
  - **Extra Large (`xl` - 576px max-width):** Wizard stepper controls.
- **Escape Actions Close anchors:** Click overlays to dissolve modal overlays, or use the left-side close cross `X` button.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports (under 768px):** Modals expand to fill the screen width with bottom margins.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
