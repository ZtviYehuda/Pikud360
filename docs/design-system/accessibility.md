# accessibility.md

This document outlines the core accessibility principles and rules to follow across all frontend components of the Pikud360 application.

---

## 1. Do Not Rely on Color Alone

Color should never be the sole mechanism used to convey information or distinguish a visual element. Doing so makes the interface inaccessible to color-blind or low-vision users.

- **Status Badges**: Every status badge must include descriptive text (e.g. "פעיל", "לא משובץ") in addition to its color variant.
- **KPI Cards**: Emphasize state changes textually (e.g. "✓ משובץ", "⚠ דורש שיבוץ") rather than only showing green or red colors.
- **Charts & Reports**: Accompany colorful chart slices or bars with clear, readable legends, values, and text descriptors.

---

## 2. Screen Reader Compatibility

Ensure all interactive and visual components are parsed correctly by screen readers.

### Decorative Elements
Purely visual components must be hidden from screen readers using `aria-hidden="true"`.
- **Status Dots**: Inside `<Badge showDot>`, the circular colored dot is decorative and must carry `aria-hidden="true"`.
- **Icons**: Icons rendering inside `<Button leftIcon={...}>` or `<Badge icon={...}>` are secondary visual aids and must have `aria-hidden="true"`.

---

## 3. Accessible Touch Targets

Mobile devices require comfortable touch target sizes to prevent user frustration.
- All primary buttons, inputs, and interactive elements must have a minimum width and height of **`44px`** (`2.75rem` / `h-enterprise-btn-h-md`).
- Avoid clustering interactive elements close to each other. Use spacing tokens (such as `gap-enterprise-component-gap`) to separate them.
- Avoid using pure hover-based interactions on mobile. Actions must always be clickable or touch-triggerable.
