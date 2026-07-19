# motion.md

This document specifies the Enterprise Motion & Animation System defined in [index.css](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/styles/index.css).

---

## 1. Motion Principles

- **Semantic Animation Naming**: Animations are not named after visual effects (like fadeIn, zoom). Instead, they use semantic names related to the context of the user interface flow (like `page-enter`, `surface-open`, `feedback-success`).
- **Subtle Enterprise Styling**: Motion is brief, subtle, and clean. There are no purely decorative or distracting animations.
- **Hardware Acceleration**: Transitions focus on GPU-friendly properties (`transform` and `opacity`) to maintain smooth rendering without triggering layout shifts.
- **Respect User Accessibility**: Respects OS preferences (`prefers-reduced-motion: reduce`) and disables all motion effects globally for users who have requested it.

---

## 2. Motion Design Tokens

Design system tokens are fully defined in the CSS variables catalog:

### Duration
Standard durations mapped semantic-wise:
- `var(--duration-enterprise-instant)`: `0ms` (immediate changes)
- `var(--duration-enterprise-fast)`: `150ms` (feedback states, hover, micro-interactions)
- `var(--duration-enterprise-normal)`: `250ms` (standard page/card layout entry animations)
- `var(--duration-enterprise-slow)`: `350ms` (large containers opening/closing, like drawers/modals)

### Easing
Curves to direct movement pacing:
- `var(--ease-enterprise-standard)`: `cubic-bezier(0.4, 0, 0.2, 1)` (general component transition curves)
- `var(--ease-enterprise-decelerate)`: `cubic-bezier(0, 0, 0.2, 1)` (entrance curves for items coming into view)
- `var(--ease-enterprise-accelerate)`: `cubic-bezier(0.4, 0, 1, 1)` (exit curves for items leaving the viewport)

### Scale & Distance
- `var(--scale-enterprise-hover)`: `1.01` (micro-scale on hover)
- `var(--scale-enterprise-active)`: `0.98` (depression feedback on click)
- `var(--spacing-enterprise-slide-sm)`: `0.25rem` (`4px` offset distance)
- `var(--spacing-enterprise-slide-md)`: `0.5rem` (`8px` offset distance)
- `var(--spacing-enterprise-slide-lg)`: `1rem` (`16px` offset distance)

---

## 3. Motion Hierarchy

Animations are tiered to prevent visual clutter:

| Level | Component Mappings | Priority |
|---|---|---|
| **Critical** | Navigation transitions, Dialog overlays, Drawer side sheets | High (slow durations) |
| **Normal** | Cards entering layouts, dropdown menu items, toggle components | Medium (normal durations) |
| **Subtle** | Focus rings, hover states, status badge state updates | Low (fast/instant durations) |

---

## 4. Component Mapping Reference

Standard components utilize these specific semantic animation tags:

| Component | Semantic Motion / Keyframe | Class Utility |
|---|---|---|
| **Page** | `page-enter` | `.motion-page-enter` |
| **Table** | `list-enter` | `.motion-list-enter` |
| **Card** | `emphasis-hover` | `.motion-emphasis-hover` |
| **Dialog / Drawer** | `surface-open` / `surface-close` | (Handled natively by Dialog keyframes) |
| **Toast** | `notification-enter` | (Handled by alert feedback wrappers) |
| **Tooltip / Popover** | `tooltip-fade` | (Handled by focus transitions) |
| **Success Alert** | `feedback-success` | `.motion-feedback-success` |
| **Error Alert** | `feedback-error` | `.motion-feedback-error` |
| **Skeleton** | `skeleton-pulse` | `animate-skeleton-pulse` |
| **Loading Spinner** | `loading-spin` | `animate-loading-spin` |

---

## 5. Usage Examples

### Semantic Page Entrance
```tsx
export default function Dashboard() {
  return (
    <div className="motion-page-enter">
      <h1 className="text-enterprise-page-title">לוח בקרה</h1>
      ...
    </div>
  );
}
```

### Table Row Entrance Staggering
```tsx
<tr className="motion-list-enter" style={{ animationDelay: `${index * 50}ms` }}>
  <td>{row.name}</td>
</tr>
```

### Card Hover Focus Effect
```tsx
<div className="motion-emphasis-hover bg-white border rounded-enterprise-lg shadow-enterprise-card p-4">
  <h2 className="text-enterprise-card-title">יחידה א'</h2>
</div>
```

### Success Feedback Animation
```tsx
{showSuccess && (
  <div className="motion-feedback-success flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded">
    <CheckCircle className="h-5 w-5" />
    <span>השיבוץ בוצע בהצלחה!</span>
  </div>
)}
```
