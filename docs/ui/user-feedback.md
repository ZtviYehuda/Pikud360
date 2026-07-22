# Pikud360 UI Foundation — User Feedback Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 19 — User Feedback  
**Target Path:** [user-feedback.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/user-feedback.md)

---

## 1. Overview & Redesign Strategy

Pikud360 provides instant user feedback for actions. We standardize feedback modules (Toasts, dialogs, undo overlays) to maintain consistent status cues.

---

## 2. Reusable Feedback System

The new [feedback-provider.tsx](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/components/ui/feedback-provider.tsx) component implements:

- **Floating Toaster alerts:** Success/warning/error banners appearing at the bottom right corner with status checkmarks/triangles and auto-dismiss schedules (4000ms).
- **Undo triggers:** Allow undoing recent changes (e.g. `סובב רשומה אחורה`).
- **Confirmation Overlays:** Centered backdrop blur modals demanding confirmation for high-risk actions (e.g. deletion triggers).
- **Progress spinners:** High density circle animation models showing import statuses.

---

## 3. Responsive & RTL Alignment

- **Mobile Viewports (under 768px):** Toasts scale to full screen width at the bottom, and buttons wrap neatly.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
