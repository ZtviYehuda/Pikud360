# Pikud360 UI Foundation — Typography System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 29 — Typography System  
**Target Path:** [typography-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/typography-system.md)

---

## 1. Overview & Redesign Strategy

Pikud360 standardises typographic sizes to ensure that headings, table columns, and form fields look visually balanced and are readable under different themes.

---

## 2. Reusable Typography Levels

The typography scale maps variables in [index.css](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/styles/index.css):

- **Display (`text-enterprise-display` - 2.25rem):** Used for landing titles and metrics overview.
- **H1 / Page title (`text-enterprise-page-title` - 1.25rem):** Used for primary route title headers.
- **H2 / Section title (`text-enterprise-section-title` - 1.125rem):** Standard card headers.
- **H3 / Card title (`text-enterprise-card-title` - 0.875rem):** Smaller subcard labels.
- **H4 / Subtext (`0.8125rem`):** Small label structures.
- **Body Large (`1.125rem`):** Descriptive texts.
- **Body (`text-enterprise-body` - 1.0rem):** Default read text blocks.
- **Body Small (`text-enterprise-body-sm` - 0.875rem):** Default secondary elements.
- **Caption (`text-enterprise-caption` - 0.75rem):** Under-labels and timestamps.
- **Label / Form fields (`0.875rem`):** Inputs and options labels.
- **Badge / Button (`text-enterprise-btn-label` - 0.875rem):** Clickable triggers.
- **Table density cells:** Configured at compact `text-xs` (12px).
- **Tooltip texts:** Configured at compact `text-[10px]` (10px).

---

## 3. Responsive & RTL Alignment

- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
- **Responsive viewport limits:** Under 768px viewports, Display font scales down to `1.75rem` and H1 headings scale to `1.125rem` automatically to prevent text truncation.
- **Line Heights:** Configured with loose settings (e.g. `leading-normal` for body reading blocks, and `leading-none` for button anchors).
- **Accessibility:** Maintains a minimum contrast ratio of 4.5:1.
