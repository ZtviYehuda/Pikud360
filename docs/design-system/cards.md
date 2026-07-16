# cards.md

This document specifies the Enterprise Card visual surfaces and variants configured in [card.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/card.tsx).

---

## 1. Design Principles

- **Single Meaningful Surface**: A card represents one cohesive concept or actionable unit. Avoid nesting cards (placing cards inside cards) to prevent visual clutter.
- **Separation of Layout and Surface**: Card variants define strictly visual surfaces (backgrounds, borders, corners, shadows, hover transformations). Paddings and item flows are controlled by the consuming content containers or `<CardContent>`.

---

## 2. Card Variant Specs

### `primary`
Standard container for main dashboard elements and key workflows.
- **Styles**: White background, solid border, rounded-lg corners, standard card shadow.
- **Tokens**: `bg-enterprise-surface border border-enterprise-border rounded-enterprise-lg shadow-enterprise-card`

### `secondary`
Subdued containers for nested content blocks or sidebar information panels.
- **Styles**: Slate-50/950 background, light border, rounded-md corners, flat shadow.
- **Tokens**: `bg-enterprise-background border border-enterprise-border/60 rounded-enterprise-md shadow-enterprise-flat`

### `kpi`
Compact visual metrics containers.
- **Styles**: White background, solid border, rounded-md corners, flat shadow.
- **Tokens**: `bg-enterprise-surface border border-enterprise-border rounded-enterprise-md shadow-enterprise-flat`

### `interactive`
Clickable grid elements. Contains interactive hover scale transitions.
- **Styles**: White background, borders highlighting blue on hover, shadow scaling from card elevation to hover glow, and scale-down transition on active click.
- **Tokens**: `bg-enterprise-surface border border-enterprise-border hover:border-enterprise-primary/40 rounded-enterprise-lg shadow-enterprise-card hover:shadow-enterprise-floating cursor-pointer active:scale-[0.98]`

### `alert`
Severity-aware alerts (replaces ad-hoc warning banners). Requires `severity` prop.
- **Props**: `severity?: 'info' | 'success' | 'warning' | 'danger'`
- **Styles**:
  - `info`: `bg-enterprise-info/10 border-enterprise-info/30 text-enterprise-info`
  - `success`: `bg-enterprise-success/10 border-enterprise-success/30 text-enterprise-success`
  - `warning`: `bg-enterprise-warning/10 border-enterprise-warning/30 text-enterprise-warning`
  - `danger`: `bg-enterprise-danger/10 border-enterprise-danger/30 text-enterprise-danger`

### `compact`
Dense information lists.
- **Tokens**: `bg-enterprise-surface border border-enterprise-border rounded-enterprise-md`

### `empty`
Dashed bordered placeholders.
- **Tokens**: `bg-enterprise-surface/50 border border-dashed border-enterprise-border rounded-enterprise-lg`

### `loading`
Animated placeholder skeletons.
- **Tokens**: `bg-enterprise-surface/50 border border-enterprise-border/50 rounded-enterprise-lg animate-pulse`

---

## 3. Sub-Components

- `<CardHeader>`: flex heading layout (`p-4 md:p-6 flex flex-col space-y-1.5`).
- `<CardTitle>`: Title layout (`text-enterprise-card-title` weight 700 text-slate-900).
- `<CardDescription>`: Secondary subtitle metadata (`text-enterprise-caption` text-slate-500).
- `<CardContent>`: Content wrapper carrying inner padding (`p-4 md:p-6 pt-0 md:pt-0`).
- `<CardFooter>`: Footer wrapper carrying pad (`p-4 md:p-6 pt-0 md:pt-0`).

---

## 4. Usage Example

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Main layout card
<Card variant="primary">
  <CardHeader>
    <CardTitle>פרטי חייל</CardTitle>
  </CardHeader>
  <CardContent>
    {/* details */}
  </CardContent>
</Card>
```
