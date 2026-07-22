# Pikud360 UI Foundation — Semantic Color System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 30 — Semantic Color System  
**Target Path:** [semantic-colors.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/semantic-colors.md)

---

## 1. Overview & Redesign Strategy

Pikud360 enforces a semantic color token system to guarantee readable color contrast ratios across Light, obsidian Dark, and High Contrast environments.

---

## 2. Reusable Semantic Color Mappings

All colors are mapped to CSS custom variables in [index.css](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/styles/index.css):

### Base Palette Tokens
- **Primary:** `--enterprise-primary` (Blue: `#0052cc` / `#3b82f6`) - primary accents, links, active nodes.
- **Secondary:** `--enterprise-secondary` (Slate grey: `#42526e` / `#707f94`) - secondary text labels.
- **Success:** `--enterprise-success` (Teal Green: `#36b37e` / `#10b981`) - positive confirmation cards.
- **Warning:** `--enterprise-warning` (Warm yellow: `#ffab00` / `#f59e0b`) - warning alerts.
- **Danger / Critical:** `--enterprise-danger` (Red: `#ff5630` / `#ef4444`) - critical errors.
- **Info:** `--enterprise-info` (Cyan Blue: `#00b8d9` / `#06b6d4`) - system logs details.
- **Muted / Disabled:** (`text-slate-400` / `opacity-50`) - disabled button controls.
- **Background:** `--enterprise-background` (`#f4f5f7` / `#0a0d16`).
- **Surface:** `--enterprise-surface` (`#ffffff` / `#121826`).
- **Border:** `--enterprise-border` (`#dfe1e6` / `#1f293d`).

---

## 3. High Contrast & Accessibility

- **High Contrast Theme (Future-Ready):** Mapped with pure black backgrounds (`#000000`), stark white bounds (`#ffffff`), and neon yellow highlights for active focus states.
- **RTL Sequence Mapping:** All layout sections load Hebrew text right-to-left naturally.
- **Contrast Check:** Ensures readability compliance.
