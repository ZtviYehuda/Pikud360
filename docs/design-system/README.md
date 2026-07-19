# Pikud360 Enterprise Design System Documentation

Welcome to the Pikud360 Enterprise Design System documentation repository. This directory houses the specifications, tokens, layout principles, and component APIs that form the visual foundation of the Pikud360 application.

## Directory Map

- **[README.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/README.md)**: Main portal and system overview.
- **[design-tokens.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/design-tokens.md)**: Dynamic variables for colors, typography scales, shadows, and spacing.
- **[layout.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/layout.md)**: Generic responsive layout primitives.
- **[cards.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/cards.md)**: Surfaces and card variant styles.
- **[buttons.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/buttons.md)**: Button variant props and loading state APIs.
- **[badges.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/badges.md)**: Accessible status badges and composition patterns.
- **[states.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/states.md)**: Standardized components for Empty, Loading, and Error page states.
- **[tables.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/tables.md)**: Unified responsive data tables and control toolbars.
- **[drawers.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/drawers.md)**: Adaptive Drawer system — bottom sheet on mobile, right-side panel on desktop.
- **[forms.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/forms.md)**: Reusable form layout primitives — sections, rows, field groups, labels, hints, errors.
- **[toolbars.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/toolbars.md)**: Standard interaction area components for filtering and searching.
- **[dialogs.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/dialogs.md)**: Enterprise Modal & Dialog wrappers, size presets, and layout helpers.
- **[command-palette.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/command-palette.md)**: Extensible command palette registry and global shortcut hooks.
- **[motion.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/motion.md)**: Semantic motion tokens, animation hierarchies, and reduced motion guidelines.
- **[application-shell.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/application-shell.md)**: Unified responsive application layout shell and switcher panels.
- **[commander-dashboard-architecture.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-architecture.md)**: Operational principles, widget profile inventory, and KPI definitions.
- **[commander-dashboard-wireframes.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-wireframes.md)**: Text-based layout wireframe designs for Desktop, Tablet, and Mobile.
- **[commander-dashboard-review.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-review.md)**: Architectural design reviews, open questions, and tradeoffs.
- **[accessibility.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/design-system/accessibility.md)**: Accessible guidelines, contrast principles, and screen reader markup details.

---

## Core Visual Identity

The Pikud360 interface is built to feel clean, minimal, calm, and professional. It maintains a **Mobile-First** responsiveness philosophy:
- **Clean white surfaces** with minimal card boundaries.
- **Enterprise blue accents** instead of flashy marketing-style color selections.
- Comfortable **`44px` minimum touch target sizes** for all mobile button layouts.
- **One Layout System**: Layout columns, margins, and gaps are structured from shared variables rather than hardcoded pixels.
