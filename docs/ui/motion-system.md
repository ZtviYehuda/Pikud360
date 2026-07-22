# Pikud360 UI Foundation — Motion System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 32 — Motion System  
**Target Path:** [motion-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/motion-system.md)

---

## 1. Overview & Design Philosophy

Pikud360 enforces a purposeful animation language — every motion communicates a state change and never distracts from operational decision-making. All animations respect `prefers-reduced-motion`.

---

## 2. Duration Scale

Mapped as CSS custom variables in [index.css](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/frontend/src/styles/index.css):

| Token | Value | Use |
|---|---|---|
| `--duration-enterprise-instant` | `0ms` | No-op / immediate |
| `--duration-enterprise-fast` | `150ms` | Hover, focus rings, badge counters |
| `--duration-enterprise-normal` | `250ms` | Drawers, dropdowns, page transitions |
| `--duration-enterprise-slow` | `350ms` | Chart renders, skeleton fades |

---

## 3. Easing Scale

| Token | Curve | Use |
|---|---|---|
| `--ease-enterprise-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `--ease-enterprise-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Enter / open (things arriving) |
| `--ease-enterprise-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Exit / close (things leaving) |

---

## 4. Component Animation Map

| Interaction | Duration | Easing | Effect |
|---|---|---|---|
| **Hover** | 150ms | standard | `opacity`, `bg-color`, `shadow` shift |
| **Focus ring** | 150ms | standard | Ring expand + color fill |
| **Dropdown open** | 150ms | decelerate | `opacity 0→1` + `translateY(-4px→0)` |
| **Dropdown close** | 100ms | accelerate | `opacity 1→0` + `translateY(0→-4px)` |
| **Drawer open** | 250ms | decelerate | Slide in from edge (`translateX`) |
| **Drawer close** | 200ms | accelerate | Slide out to edge |
| **Dialog open** | 200ms | decelerate | `scale(0.96→1)` + `opacity 0→1` |
| **Dialog close** | 150ms | accelerate | `scale(1→0.96)` + `opacity 1→0` |
| **Toast enter** | 250ms | decelerate | Slide up + fade in |
| **Toast exit** | 200ms | accelerate | Slide right + fade out |
| **Page change** | 200ms | decelerate | `opacity 0→1` + `translateY(8px→0)` |
| **Skeleton pulse** | `2s` loop | standard | `opacity 1↔0.55` infinite |
| **Loading spinner** | `0.8s` loop | linear | `rotate(0→360deg)` infinite |
| **Sort / Filter** | 200ms | standard | Row `opacity` cross-fade |
| **Expand / Collapse** | 250ms | standard | `max-height` + `opacity` |
| **Refresh indicator** | 350ms | decelerate | Spin + fade, then content fade-in |

---

## 5. Semantic Keyframe Tokens

Pre-built animation shorthand tokens in `index.css`:

```css
--animate-page-enter:       page-enter 250ms ease-decelerate forwards;
--animate-skeleton-pulse:   pulse-subtle 2s ease-standard infinite;
--animate-loading-spin:     spin-linear 0.8s linear infinite;
--animate-feedback-success: success-pop 250ms ease-decelerate forwards;
--animate-feedback-error:   shake-error 0.4s ease-standard;
```

---

## 6. Reduced Motion

All animations are wrapped in a `prefers-reduced-motion: reduce` media query override:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Skeleton loaders switch from `pulse-subtle` animation to a static muted fill. Drawers and dialogs appear instantly without slide/scale transitions.

---

## 7. RTL Motion Mirroring

Drawer slides use `translateX` direction-aware values. In RTL mode (`dir="rtl"`), drawers enter from the left instead of the right. Page enter animation uses vertical `translateY` and is direction-agnostic.
