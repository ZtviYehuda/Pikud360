# Global UI Design System & Guidelines

All frontend pages and components in this application must follow these strict visual and code quality rules to maintain visual and functional consistency.

---

## 1. UI Framework

- **React 19**
- **Tailwind CSS v4**
- **shadcn/ui components**: Always prefer shadcn/ui components first. Do not build custom UI components if an equivalent shadcn component already exists.

---

## 2. Design Philosophy

The application is an enterprise workforce management system. The design should be clean, minimal, professional, modern, calm, fast to scan, and functional.
- The UI should feel similar to: **Linear**, **Vercel Dashboard**, **GitHub**, **Stripe Dashboard**, **Notion**, **Clerk Dashboard**.
- Do not build flashy, decorative, or "marketing-site-looking" interfaces.

---

## 3. Visual Rules

- **Whitespace**: Use generous whitespace to create hierarchy and readability.
- **Borders & Shadows**: Avoid excessive borders. Use subtle shadows only.
- **Corners**: Rounded corners should be consistent (use Tailwind default radius sizes).
- **Animations**: Minimal and purposeful animations only (e.g. state transitions, loading skeletons).
- **Colors & Backgrounds**: Avoid decorative gradients or backgrounds. Avoid glassmorphism unless explicitly requested.

---

## 4. Color Palette

Primary colors should remain neutral (Slate/Slate-zinc). Use standard status colors:
- **Green** → Available / Success
- **Blue** → Information
- **Amber** → Warning
- **Red** → Critical
- **Gray** → Neutral / Disabled

---

## 5. Components Layout

- **Cards**: Use shadcn Card components with clear titles, concise content, and consistent padding. No heavy borders or excessive elevation.
- **Tables**: Clean enterprise tables with sticky headers, subtle zebra rows, pagination, sorting, and row filtering. Compact row heights.
- **Forms**: Use shadcn Form components with labels consistently positioned above input fields and inline validation.
- **Buttons**: Use shadcn Button variants only (`default`, `outline`, `secondary`, `destructive`, `ghost`, `link`). Avoid custom button styles.
- **Dialogs**: Use shadcn Dialog.
- **Icons**: Use **Lucide** icons exclusively. Keep icons subtle and secondary to textual content.
- **Typography**: Use clean typography. Maximum of three font sizes on most screens. Avoid excessive bolding.

---

## 6. Layout & Responsiveness

- **Layout Structure**: Desktop-first layout, fully responsive on tablets and usable (simplified) on mobile.
- **RTL Layouts**: Maintain Right-to-Left (RTL) layout support across all pages, forms, tables, and charts.

---

## 7. Accessibility

- Maintain accessible contrast ratios.
- Support keyboard navigation and visible focus states.
- Ensure correct ARIA attributes where appropriate.

---

## 8. One Layout System

- **One Layout System. Many Screens. Zero Custom Layouts**:
  - No page or component should define arbitrary custom margins, paddings, or spacing (such as `gap-7`, `gap-9`, `mt-11` or arbitrary absolute margins).
  - All spacing, paddings, and alignment settings must come directly from the standardized spacing tokens of our Design System Layout System. This guarantees that all views remain visually consistent and professional.

---

## 9. UI Component Standards

Every new UI component must follow this exact architectural structure:

Component
│
├── Types
├── CVA Variants
├── Accessibility (A11y)
├── Composition
├── Documentation
└── Tests (where applicable)

Requirements:
1. **Valid TypeScript**: Strong typing for all component props, variant interfaces, and event handlers.
2. **CVA Variants**: Styling configurations defined strictly via `class-variance-authority` (CVA) using design tokens. No inline hardcoded Tailwind styling exceptions.
3. **Accessibility**: All icons, status indicators, and decorative elements must have `aria-hidden="true"`. Components must never rely solely on color to communicate state. Proper ARIA tags must be implemented for screen-readers.
4. **Composition**: Components are stateless, generic, and composed of reusable parts (e.g. dots, icons, and children wrappers). Avoid embedding business logic or domain-specific assumptions directly inside UI components.
5. **Documentation**: Every new component family must be documented in a separate file under the `docs/design-system/` folder.
6. **Tests**: Covered with relevant unit tests to prevent visual or functional regressions.

---

## 10. Screen State Completeness

Every page or screen component in the application must always support and be able to render four visual states cleanly:
- **Loading State**: Displays loading skeletons matching the page structure while data is loading.
- **Empty State**: Displays clear instructions and placeholder content when no records/items are found.
- **Error State**: Displays helpful error notifications and a retry trigger if loading failed.
- **Success State**: Displays standard dashboard grids, lists, tables, and metrics when data loaded successfully.

---

## 11. Global UX Workflows

### The One-Minute Rule
**Any action that takes less than one minute to complete must open in a Drawer. Only complex or multi-step processes that require their own dedicated context receive a full page.**

This rule preserves fast, focused mobile interaction without burdening the user with unnecessary page transitions.

### Decision Guide

| Pattern | When to use |
|---|---|
| **Drawer** | Single-step actions, quick edits, inline operations, contextual detail views |
| **Full Page** | Multi-step wizards, reports, dashboards, administration, analytics |

### Examples:
- **✓ Drawers (In-Context sheets)**:
  - שיבוץ עובד (Assign Personnel)
  - עדכון נוכחות (Update Attendance)
  - העברת עובד (Transfer Employee)
  - צפייה בפרטי עובד (View Employee Details)
  - טיפול בהתראה (Resolve Alert)
  - עריכת רשומה (Edit Record)
- **✗ Full Page Navigation**:
  - דוחות (Reports Center)
  - אנליטיקה (Analytics Dashboard)
  - ניהול מערכת (System Administration)
  - הגדרות (Settings)
  - אשף רב-שלבי (Multi-step Wizard)




