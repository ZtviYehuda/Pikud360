# Pikud360 UI — Component Reusability Checklist

**Domain:** UI Quality Standards  
**Applies To:** Every component in `frontend/src/components/ui/`  
**Target Path:** [component-reusability-checklist.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/component-reusability-checklist.md)

---

## Purpose

Before any component is merged, promoted to shared, or referenced in new features, it must pass this checklist. The checklist is the gate between "it works" and "it's ready to ship."

---

## The 10 Criteria

### ✅ 1. Can this component be reused?

**Definition:** The component works correctly when consumed by at least two independent features — without modification.

**Pass if:**
- Props are generic (no feature-specific strings hardcoded inside)
- The component does not import from feature folders (`/features/`, `/pages/`)
- It can be dropped into any page without side effects

**Fail if:**
- Component contains hardcoded Hebrew strings that belong to one feature
- It imports a specific page's state or store slice

---

### ✅ 2. Can it replace an existing component?

**Definition:** Before adding a new component, the developer searched the library and confirmed no existing component covers the use case.

**Pass if:**
- A search of `/components/ui/` was performed
- The component either extends an existing one OR fills a clearly distinct gap
- Duplicate components are consolidated (one canonical version)

**Fail if:**
- There are two components doing the same job with different names (e.g. `Spinner` + `Loader`)
- A new component was created without checking existing ones

---

### ✅ 3. Is it configurable?

**Definition:** The component adapts to context through props — not through wrapper divs or CSS overrides.

**Pass if:**
- Variants are exposed as typed props (`variant`, `size`, `severity`)
- Optional slots exist for custom content (`icon`, `header`, `footer`, `actions`)
- `className` is accepted and merged with `cn()` — never replaced
- `...props` spread is forwarded to the root element via `React.forwardRef`

**Fail if:**
- Visual variants are achieved only by overriding from outside
- Props are typed as `string` where a union type would be clearer
- The root element is not ref-forwarded

---

### ✅ 4. Does it support RTL?

**Definition:** The component renders correctly in both `dir="ltr"` and `dir="rtl"` without layout breakage or visual inversion errors.

**Pass if:**
- Directional spacing uses `ps-` / `pe-` (logical) instead of `pl-` / `pr-`
- Directional icons use `rtl:scale-x-[-1]` where needed (arrows, chevrons)
- Text alignment uses `text-start` / `text-end` not `text-left` / `text-right`
- Absolute-positioned elements use `start-` / `end-` not `left-` / `right-`
- Tested visually in Hebrew (`dir="rtl"`) mode

**Fail if:**
- Physical margin/padding is used for spacing that will break in RTL
- Arrow icons point the same direction in both orientations

---

### ✅ 5. Does it support Light and Dark?

**Definition:** The component uses only semantic color tokens — never raw Tailwind palette colors or hardcoded hex values.

**Pass if:**
- All colors reference CSS custom properties (`text-enterprise-*`, `bg-enterprise-*`, `border-enterprise-*`)
- Tested in both `dark` and light mode
- No `text-slate-900` or `bg-white` used without a dark mode counterpart

**Fail if:**
- Any raw color class is used that has no `dark:` variant where the theme would require it
- `style={{ color: '#...' }}` appears

---

### ✅ 6. Does it support responsive layouts?

**Definition:** The component renders correctly and usably across all three breakpoints: mobile (`< 768px`), tablet (`768px – 1280px`), and desktop (`> 1280px`).

**Pass if:**
- Mobile layout stacks vertically or hides secondary elements appropriately
- No fixed widths cause horizontal overflow on mobile
- Touch targets are at minimum `44px × 44px` on mobile
- Tested at all three breakpoints

**Fail if:**
- The component is only designed for desktop
- Text overflows its container on narrow screens

---

### ✅ 7. Does it support keyboard navigation?

**Definition:** All interactive elements inside the component are reachable and operable without a mouse.

**Pass if:**
- All interactive elements receive focus in logical tab order
- Actions are triggered with `Enter` or `Space`
- Menus and dropdowns close on `Escape`
- `Tab` / `Shift+Tab` cycles through items in the correct order
- No keyboard trap exists (except modals, which are intentional)

**Fail if:**
- Any button or link is not reachable via `Tab`
- Dropdown open/close does not respond to `Escape`
- Custom interactive elements lack `role`, `tabIndex`, or keyboard handlers

---

### ✅ 8. Is it accessible?

**Definition:** The component meets WCAG 2.1 AA requirements.

**Pass if:**
- Decorative icons have `aria-hidden="true"`
- Meaningful standalone icons have `aria-label` on their wrapper
- Form elements are associated with labels via `htmlFor` / `aria-labelledby`
- Interactive elements have visible focus rings (not removed with `outline-none` alone)
- Color contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components
- Status changes are announced via `aria-live` where appropriate

**Fail if:**
- Icons convey meaning without text alternative
- Focus rings are suppressed with `outline-none` and no `:focus-visible` replacement
- Form inputs have no accessible label

---

### ✅ 9. Is it documented?

**Definition:** A developer can understand how to use the component from its source code alone — no tribal knowledge required.

**Pass if:**
- All exported props interfaces have JSDoc comments explaining each prop
- Non-obvious behavior is explained in inline comments
- A usage example exists (in Storybook, in the doc file, or in a `README.md`)
- The component is listed in the component index / design system docs

**Fail if:**
- Props are undocumented
- A developer would need to read the implementation to understand how to use it
- The component exists but is not listed anywhere in `/docs/ui/`

---

### ✅ 10. Is it tested?

**Definition:** The component's critical behavior is verified by automated tests.

**Pass if:**
- At least one test covers the component's primary use case (render test)
- Variant switching is tested (e.g. `variant="danger"` applies danger styles)
- Interactive behavior is tested (e.g. button click fires `onClick`)
- Edge cases are covered: empty props, missing optional props, error states

**Fail if:**
- No test file exists for the component
- Tests only exist at the page level, not the component level

---

## Scoring

Each criterion is worth **1 point**. Score the component out of 10.

| Score | Status | Action |
|---|---|---|
| **10 / 10** | ✅ **Production Ready** | Ship it |
| **8–9 / 10** | 🟡 **Conditional** | Document gaps, ship with known debt |
| **6–7 / 10** | 🟠 **Needs Work** | Block merge, create fix tickets |
| **< 6 / 10** | 🔴 **Not Ready** | Reject, rewrite required |

---

## Component Scorecard — Current State

Audit conducted: 2026-07-20. Score based on codebase evidence.

> **Legend:** ✅ Pass · ❌ Fail · ⚠️ Partial

| Component | Reusable | Replaces | Configurable | RTL | Dark | Responsive | Keyboard | A11y | Documented | Tested | **Score** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `button.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **7** |
| `card.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **7** |
| `data-table.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | **6** |
| `dialog.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **7** |
| `drawer.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **8** |
| `toolbar.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **8** |
| `toolbar-system.tsx` | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **7** |
| `status-badge.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **8** |
| `notification-center.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | **6** |
| `feedback-provider.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | **6** |
| `command.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **7** |
| `empty-state.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **8** |
| `skeleton.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **8** |
| `states.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **8** |
| `spinner.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | **7** |
| `form-helper.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | **8** |
| `form-primitives.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **7** |
| `dashboard-widget.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | **6** |
| `badge.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **8** |
| `page-layout.tsx` | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | **7** |

---

## Systemic Gaps

The scorecard reveals two systemic failures across **all 20 components**:

### ❌ Gap 1: Not Tested (0 / 20 components)
Tests exist only at the page/feature level (`/test/`). No component-level tests exist.

**Required Action:**
- Create `/frontend/src/components/ui/__tests__/` directory
- Write at minimum a render test + variant test for each component

### ❌ Gap 2: Not Documented (0 / 20 components)
No component has JSDoc on its props interface. No usage examples exist in docs.

**Required Action:**
- Add JSDoc comments to all exported props interfaces
- Each component entry should appear in the design system docs index

### ⚠️ Gap 3: RTL Partial (15 / 20 components)
Most components use physical spacing classes (`pl-`, `pr-`) instead of logical properties (`ps-`, `pe-`).

**Required Action:**
- Audit and replace physical spacing in all components with logical equivalents

### ⚠️ Gap 4: Accessibility Partial (18 / 20 components)
Only `drawer.tsx`, `toolbar.tsx`, `form-helper.tsx`, and `skeleton.tsx` have confirmed `aria-*` usage. Most components silence icons without `aria-hidden`.

**Required Action:**
- Apply icon accessibility rules from Sprint 33 icon-system spec
- Add `aria-live` regions to components that change state dynamically

---

## Usage — Review Process

When creating or reviewing a component:

1. Copy the checklist table row for the component
2. Score each criterion honestly
3. If score < 8: file a follow-up ticket, do not block merge
4. If score < 6: reject PR, rewrite required before merge
5. Update this scorecard after each sprint that touches components
