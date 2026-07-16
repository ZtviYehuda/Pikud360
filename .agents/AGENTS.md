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

