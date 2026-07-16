# design-tokens.md

This document covers all Enterprise Design System visual tokens configured in the `@theme` directive of `src/styles/index.css`.

## 1. Theme-Aware Colors

Colors map dynamically to Light/Dark modes using CSS custom properties (`var(--enterprise-*)`):

| Variable Token | Color (Light Mode) | Color (Dark Mode) | Purpose |
| :--- | :--- | :--- | :--- |
| `bg-enterprise-primary` | `#2563eb` (Blue-600) | `#60a5fa` (Blue-400) | Brand colors and primary active actions |
| `bg-enterprise-secondary` | `#475569` (Slate-600) | `#94a3b8` (Slate-400) | Secondary subtitles and text metadata |
| `bg-enterprise-success` | `#10b981` (Emerald-500) | `#34d399` (Emerald-400) | Success statuses, approved items, availability |
| `bg-enterprise-warning` | `#f59e0b` (Amber-500) | `#fbbf24` (Amber-400) | Warning levels, pending elements, unassigned items |
| `bg-enterprise-danger` | `#f43f5e` (Rose-500) | `#fb7185` (Rose-400) | Danger status, errors, critical warnings |
| `bg-enterprise-info` | `#0ea5e9` (Sky-500) | `#38bdf8` (Sky-400) | Informational tags, badges, secondary status |
| `bg-enterprise-neutral` | `#334155` (Slate-700) | `#cbd5e1` (Slate-300) | Default gray annotations, system state logs |
| `bg-enterprise-background` | `#f8fafc` (Slate-50) | `#020617` (Slate-950) | Core viewport screen backgrounds |
| `bg-enterprise-surface` | `#ffffff` (White) | `#0f172a` (Slate-900) | Card boundaries, dashboards, modals backgrounds |
| `border-enterprise-border` | `#e2e8f0` (Slate-200) | `#1e293b` (Slate-800) | Card dividers, dialog frames, outline borders |

---

## 2. Typography Scale

Unified typography sizes mapped under Tailwind v4 `@theme`:

- **Display**: `text-enterprise-display` (`2.25rem`) - Large metrics.
- **Page Title**: `text-enterprise-page-title` (`1.25rem`) - View titles.
- **Section Title**: `text-enterprise-section-title` (`1.125rem`) - Widget/Section titles.
- **Card Title**: `text-enterprise-card-title` (`0.875rem`) - Data grid card header titles.
- **Table Header**: `text-enterprise-table-header` (`0.75rem`, weight 600) - Data table column header.
- **Button Label**: `text-enterprise-btn-label` (`0.875rem`, weight 700) - Button trigger label.
- **Body**: `text-enterprise-body` (`1rem`) - standard user interface content copy.
- **Body Small**: `text-enterprise-body-sm` (`0.875rem`) - Subtitle descriptions.
- **Caption**: `text-enterprise-caption` (`0.75rem`) - Metadata, timestamps, helper text.
- **Overline**: `text-enterprise-overline` (`0.625rem`, uppercase, tracking-wider) - Compact status chips.

---

## 3. Spacing Metrics

Layout spacings, gaps, and margins:

- **Page Padding**: `--spacing-enterprise-page-pad` (`1rem` / `16px`) - Core page gutter pads.
- **Card Padding**: `--spacing-enterprise-card-pad` (`1rem` / `16px`) - Inner card gutters.
- **Section Gap**: `--spacing-enterprise-section-gap` (`1.5rem` / `24px`) - Spacing between sections.
- **Grid Gap**: `--spacing-enterprise-grid-gap` (`1rem` / `16px`) - Spacing inside card grids.
- **Component Gap**: `--spacing-enterprise-component-gap` (`0.75rem` / `12px`) - Margin gap between components, buttons, and headers.

---

## 4. Component Sizing

Interactive height parameters:

- **Sm Button/Input Height**: `h-enterprise-btn-h-sm` (`2.25rem` / `36px`)
- **Md Button/Input Height (Default)**: `h-enterprise-btn-h-md` (`2.75rem` / `44px`) - standard touch target.
- **Lg Button/Input Height**: `h-enterprise-btn-h-lg` (`3.25rem` / `52px`)
- **Icon Sizing**: `size-3.5` (Sm) / `size-4.5` (Md) / `size-6` (Lg)
- **Avatar Sizes**: `w-enterprise-avatar-sm` (32px) / `w-enterprise-avatar-md` (40px) / `w-enterprise-avatar-lg` (48px)
- **Badge Height**: `h-5` (Sm) / `h-6` (Md)

---

## 5. Border Radiuses

Visual corners configuration:

- **Small**: `rounded-enterprise-sm` (`0.375rem` / `6px`) - Inputs, small badges, buttons.
- **Medium**: `rounded-enterprise-md` (`0.625rem` / `10px`) - Secondary cards, tables frame, alerts.
- **Large**: `rounded-enterprise-lg` (`0.875rem` / `14px`) - Primary main content cards, dialog content frames.
- **Extra Large**: `rounded-enterprise-xl` (`1.25rem` / `20px`) - Floating drawers, action sheets.

---

## 6. Shadows

Visual elevation mappings:

- **Flat**: `shadow-enterprise-flat` (Clean border boundary shadow)
- **Card**: `shadow-enterprise-card` (standard card elevation drop shadow)
- **Floating**: `shadow-enterprise-floating` (Hover elevation glow)
- **Drawer**: `shadow-enterprise-drawer` (Lateral side slides shadow)
- **Modal**: `shadow-enterprise-modal` (Center screen overlay box shadow)
