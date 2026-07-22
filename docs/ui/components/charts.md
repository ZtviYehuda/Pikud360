# Charts System Specification

**Spec Status:** ⚠️ Planned / Design Spec  
**Target Code Location:** `frontend/src/components/ui/charts/`  

---

## 1. Purpose
The Charts system provides Recharts-wrapper components for bar charts, area charts, donut charts, and readiness gauges across dashboard widgets.

---

## 2. Color Tokens
All charts strictly consume the chart semantic palette tokens:
- Primary Series: `--color-chart-1` (Cyan)
- Secondary Series: `--color-chart-2` (Blue)
- Tertiary Series: `--color-chart-3` (Indigo)
- Alert Series: `--color-chart-4` (Amber)
- Danger Series: `--color-chart-5` (Rose)

---

## 3. Tooltip & RTL Rules
- Recharts tooltips styled with enterprise surface background & rounded borders.
- X-Axis & Y-Axis labels formatted in Hebrew with RTL orientation.
