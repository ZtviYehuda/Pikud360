# Enterprise Design Foundation - Technical Design

## Executive Summary

This design document establishes a comprehensive design system for Pikud360 based on a thorough UI audit of the existing frontend codebase. The audit identified significant inconsistencies across five key areas: duplicated UI patterns, spacing variations, typography hierarchy issues, card style differences, and button implementation inconsistencies.

**Key Findings**:
- **17+ non-standard color values** used instead of Tailwind's standard scale
- **8 different padding values** for cards (ranging from p-3 to p-12)
- **6 different gap values** without systematic usage guidelines  
- **Arbitrary font sizes** (`text-[10px]`, `text-[9px]`) mixed with standard scale
- **Multiple empty state implementations** with different styling
- **Decorative animations** that contradict the clean/minimal design philosophy

**Solution Approach**:
1. Standardize design tokens (colors, spacing, typography, shadows, radii)
2. Refactor 7 core components to use standardized tokens
3. Establish clear usage guidelines for all design decisions
4. Implement comprehensive testing (visual regression, accessibility, performance)
5. Maintain full RTL support throughout all changes

**Impact**:
- Reduced CSS bundle size through design token consolidation
- Improved developer experience with clear component usage guidelines
- Enhanced user experience through consistent visual language
- Better maintainability with centralized design decisions

**No backend, API, database, or business logic changes are required.**

## Overview

The Enterprise Design Foundation establishes a comprehensive design system for Pikud360 that ensures visual consistency, accessibility, and maintainability across the entire platform. This design addresses current UI inconsistencies discovered through a comprehensive audit of the frontend codebase and establishes standardized design tokens, component patterns, and implementation guidelines.

### Goals

1. **Eliminate Visual Inconsistencies**: Address duplicated UI patterns, inconsistent spacing, typography variations, and card/button style differences
2. **Establish Design Tokens**: Create a centralized system of design variables that can be maintained and updated globally
3. **Improve Developer Experience**: Provide clear guidelines and reusable components that reduce decision fatigue
4. **Enhance User Experience**: Create a cohesive, enterprise-grade interface that feels professional, clean, and minimal
5. **Support RTL**: Ensure perfect Hebrew (RTL) support throughout all components and layouts

### Design Philosophy

The design system follows these core principles:

- **Clean & Minimal**: Remove decorative elements that don't serve a functional purpose
- **Enterprise-Grade**: Professional appearance suitable for command-level workforce management
- **Consistent**: Predictable spacing, typography, and component behavior
- **Accessible**: WCAG 2.1 AA compliant with proper contrast, focus states, and semantic HTML
- **Performance-Oriented**: Minimal CSS footprint, hardware-accelerated animations, respect reduced-motion preferences

## Architecture

### Technology Stack

- **Tailwind CSS v4**: Utility-first CSS framework with custom theme configuration
- **shadcn/ui**: Base component library built on Radix UI primitives
- **Framer Motion**: Subtle animations and transitions only (no decorative animations)
- **Lucide Icons**: Consistent icon library across the application
- **TypeScript**: Type-safe component props and design token definitions

### System Structure

```
frontend/src/
├── styles/
│   ├── index.css          # Global styles & Tailwind config
│   └── tokens.css         # Design token definitions (NEW)
├── components/
│   ├── ui/                # shadcn/ui base components
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── dashboard/         # Dashboard-specific compositions
│   └── common/            # Shared composite components (NEW)
├── lib/
│   └── design-tokens.ts   # TypeScript token definitions (NEW)
└── hooks/
    └── useDesignTokens.ts # Runtime token access (NEW)
```

## Components and Interfaces

### UI Audit Report

This section documents all inconsistencies found in the current implementation.

#### 1. Duplicated UI Patterns

**Finding**: Multiple implementations of empty state components

**Locations**:
- `frontend/src/components/ui/empty-state.tsx` (shadcn/ui base component)
- `frontend/src/components/dashboard/EmptyState.tsx` (wrapper that re-exports)
- Inline empty states in:
  - `CommanderDashboard.tsx` (EmptyState component usage)
  - `AlertPanel.tsx` (custom empty state with BellOff icon)

**Current Implementation**:
```tsx
// AlertPanel.tsx - custom implementation
<Card className="p-6 flex flex-col items-center justify-center text-center h-64">
  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600...">
    <BellOff className="h-6 w-6" />
  </div>
  <h4 className="text-xs font-bold...">...</h4>
  <p className="text-slate-450 dark:text-slate-400 text-2xs...">...</p>
</Card>

// empty-state.tsx - base component
<div className="...p-8 md:p-12...">
  <div className="p-4 bg-slate-50...">
    <Icon className="h-10 w-10..." />
  </div>
  <h3 className="text-base font-bold...">...</h3>
  <p className="text-xs...">...</p>
</div>
```

**Why It's Inconsistent**: Different padding values (`p-3` vs `p-4`), different icon sizes (`h-6 w-6` vs `h-10 w-10`), different text sizes (`text-xs` vs `text-base`)

**Impact**: Users see subtly different empty states, increasing cognitive load and making the UI feel unpolished

---

**Finding**: KpiCard component has decorative gradient that contradicts design philosophy

**Location**: `frontend/src/components/dashboard/KpiCard.tsx`

**Current Implementation**:
```tsx
<Card className="p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-brand-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>
  {/* ... */}
</Card>
```

**Why It's Inconsistent**: Decorative gradient contradicts "avoid decorative gradients" philosophy

**Impact**: Adds visual noise that doesn't serve a functional purpose

---

**Finding**: Loading skeleton implementations vary across components

**Locations**:
- `frontend/src/components/dashboard/LoadingSkeleton.tsx` (full-page skeleton)
- `frontend/src/components/dashboard/KpiCard.tsx` (inline loading state)
- Potential other inline loading states

**Current Implementation**:
```tsx
// KpiCard.tsx
if (loading) {
  return (
    <Card className="p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-16" />
    </Card>
  );
}
```

**Why It's Inconsistent**: Some use `space-y-3`, others use explicit margin classes

**Impact**: Different loading patterns create jarring user experience

#### 2. Spacing Inconsistencies

**Finding**: Card padding varies significantly across components

**Locations & Values**:
- `Card` component default: `p-4 md:p-6`
- `KpiCard`: `p-5`
- `AlertPanel`: `p-5`
- `StatusSummaryGrid`: `p-6`
- `EmptyState`: `p-8 md:p-12`
- `Dialog`: `p-6`
- `Sheet`: `p-6`
- `Sidebar` nav items: `px-3 py-2.5`
- `Topbar`: `px-4 md:px-6`

**Why It's Inconsistent**: No clear spacing scale - values range from `p-3` to `p-12` without systematic progression

**Impact**: Components feel misaligned, especially when nested or placed side-by-side

---

**Finding**: Gap values are inconsistent

**Locations & Values**:
- `gap-2`: Dialog footer, Sheet footer, dropdown menu separator spacing
- `gap-3`: Sidebar items, Topbar items, AlertPanel icon spacing, many others
- `gap-4`: Dialog content, StatusSummaryGrid, Employees page grid
- `gap-5`: Dashboard KPI grid, Employees card grid
- `gap-6`: Dashboard main content sections
- `gap-8`: Organization tree visual spacing

**Why It's Inconsistent**: No systematic relationship between gap values and their usage context

**Impact**: Spacing feels arbitrary, especially in complex layouts

---

**Finding**: Button padding doesn't follow a consistent scale

**Locations & Values**:
```tsx
// button.tsx
size: {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",  // Note: px-8 is much larger than default px-4
  icon: "h-9 w-9",
}
```

**Why It's Inconsistent**: Large button jumps from `px-4` to `px-8` (2x increase) instead of incremental scaling

**Impact**: Large buttons look disproportionately wide compared to default buttons

#### 3. Typography Inconsistencies

**Finding**: Font sizes don't follow a consistent type scale

**Documented Font Sizes** (from component audit):
- `text-2xs`: Used in badges, small metadata text
- `text-xs`: Used in Card descriptions, Dialog descriptions, Input fields, table text, most body text
- `text-sm`: Buttons, sidebar nav items, many component labels
- `text-base`: Dialog titles (lg), SheetTitle, empty state titles, card titles (lg)
- `text-lg`: Card titles, Dialog titles
- `text-3xl`: Page headers (Dashboard, CommanderDashboard, Employees, Organization)

**Custom/Non-Standard Sizes**:
- `text-[10px]`: AlertPanel metadata
- `text-[9px]`: AlertPanel unit label

**Why It's Inconsistent**: 
1. Mix of Tailwind standard sizes and arbitrary values
2. No clear hierarchy (when to use `text-xs` vs `text-sm` vs `text-base`)
3. Page headers all use `text-3xl` but with different spacing/weight combinations

**Impact**: Typography hierarchy is unclear, making it difficult to scan content

---

**Finding**: Font weights are used inconsistently

**Locations & Values**:
- `font-medium`: Small labels, metadata text
- `font-semibold`: Button text, badges, table cell text, many body elements
- `font-bold`: Card titles, page headers, most headings, table headers

**Why It's Inconsistent**: No clear distinction between `font-semibold` and `font-bold` usage - both used for similar purposes

**Impact**: Visual hierarchy is muddied when similar elements use different weights

---

**Finding**: Line height and tracking inconsistencies

**Locations**:
- `tracking-tight`: Page headers, card titles
- `tracking-wider`: KpiCard labels (uppercase), table headers (uppercase)
- `tracking-widest`: Sidebar admin section label
- `leading-none`: Card titles, some headings
- `leading-tight`: Some headings
- `leading-relaxed`: Descriptions, body text
- `leading-normal`: Some body text

**Why It's Inconsistent**: No systematic approach to when to use tight vs relaxed leading, or increased tracking

**Impact**: Text rhythm feels inconsistent across the application

#### 4. Card Style Variations

**Finding**: Card borders use different opacity values

**Locations & Values**:
- Base Card component: `border-slate-205/60` (custom color with 60% opacity)
- Empty state: `border-slate-200/60` (different base color, same opacity)
- Sidebar: `border-slate-800` (no opacity)
- Topbar: `border-slate-200/60`
- Tables: `border-slate-100` (light) and `border-slate-800/60` (dark)
- Employees search bar: `border-slate-205/60`

**Why It's Inconsistent**: Mix of `/60` opacity modifier and solid borders, plus non-standard color values like `slate-205`

**Impact**: Borders appear subtly different across components, especially noticeable in light mode

---

**Finding**: Card shadows vary significantly

**Locations & Values**:
- Card base: `shadow-xs`
- KpiCard: `shadow-xs`, `hover:shadow-md`
- Topbar: `shadow-sm`
- Dialog: `shadow-lg`
- Empty state: `shadow-2xs`
- Dropdown: `shadow-md`
- Employees page filter bar: `shadow-xs`
- StatusSummaryGrid cards: `shadow-2xs`

**Why It's Inconsistent**: Custom shadow values (`shadow-2xs`, `shadow-xs`) mixed with standard Tailwind shadows

**Impact**: Elevation hierarchy is unclear - cards at the same visual level have different shadows

---

**Finding**: Card border radius inconsistencies

**Locations & Values**:
- Card base: `rounded-xl`
- Button: `rounded-lg`
- Input: `rounded-lg`
- Dialog: `rounded-xl`
- Badge: `rounded-full`
- Dropdown: `rounded-md`
- StatusSummaryGrid items: `rounded-xl`
- AlertPanel items: `rounded-xl`
- Organization boxes: `rounded-xl`
- Sidebar nav items: `rounded-lg`

**Why It's Inconsistent**: Mix of `rounded-md`, `rounded-lg`, `rounded-xl`, and `rounded-full` without clear usage guidelines

**Impact**: Components feel less cohesive, especially when they're adjacent

---

**Finding**: Card background colors vary

**Locations**:
- Default cards: `bg-white` / `dark:bg-slate-900`
- Sidebar: `bg-slate-900` (always dark)
- Sheet: `bg-slate-900 text-slate-300` (always dark)
- Empty state: `bg-white dark:bg-slate-900`
- AlertPanel severity colors: `bg-rose-50`, `bg-amber-50`, `bg-blue-50`, `bg-emerald-50`
- StatusSummaryGrid status colors: Multiple semantic colors
- Input: `bg-slate-50` / `dark:bg-slate-950`

**Why It's Inconsistent**: Some components force dark mode (Sidebar, Sheet) while others respect theme

**Impact**: Visual disconnect when dark-mode-only components are shown alongside theme-aware components

#### 5. Button Style Variations

**Finding**: Button variants have inconsistent hover states

**Current Implementation**:
```tsx
variant: {
  default: "bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-800",
  destructive: "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800",
  outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900...",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200...",
  ghost: "hover:bg-slate-100 hover:text-slate-900...",
  link: "text-brand-600 underline-offset-4 hover:underline...",
}
```

**Why It's Inconsistent**:
- Default/destructive have `shadow-xs`, but outline/secondary/ghost don't
- Active states only defined for default/destructive
- Ghost and outline have identical hover colors in light mode

**Impact**: Button behavior feels inconsistent, especially when different variants are used side-by-side

---

**Finding**: Icon buttons have no dedicated variant

**Current Workaround**:
```tsx
<button className="p-2 rounded-lg text-slate-505 hover:bg-slate-55...">
  <Icon />
</button>
```

**Locations**: Topbar (theme toggle, notifications, mobile menu)

**Why It's Inconsistent**: Topbar creates custom icon buttons instead of using the Button component with `size="icon"`

**Impact**: Icon button styles must be manually maintained, leading to drift

---

**Finding**: Sidebar navigation uses custom button styling instead of Button component

**Location**: `frontend/src/components/Sidebar.tsx`

**Current Implementation**:
```tsx
<NavLink className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all..." />
```

**Why It's Inconsistent**: Recreates button-like styling manually rather than using `<Button as={NavLink} variant="ghost">`

**Impact**: Sidebar buttons have different interaction patterns than regular buttons

## Design Token System

### Color Palette

Following enterprise aesthetic guidelines and ensuring WCAG 2.1 AA contrast compliance:

#### Brand Colors (Violet-Blue)
Already defined in `frontend/src/styles/index.css`:
```css
--color-brand-50: #f5f3ff;   /* Lightest tint for backgrounds */
--color-brand-100: #ede9fe;  /* Light background states */
--color-brand-200: #ddd6fe;  /* Borders, dividers */
--color-brand-300: #c4b5fd;  /* Disabled states */
--color-brand-400: #a78bfa;  /* Secondary actions */
--color-brand-500: #8b5cf6;  /* Base brand color */
--color-brand-600: #7c3aed;  /* Primary actions (buttons, links) */
--color-brand-700: #6d28d9;  /* Hover states */
--color-brand-800: #5b21b6;  /* Active/pressed states */
--color-brand-900: #4c1d95;  /* Darkest brand shade */
```

**Standardization Needed**:
- Remove decorative brand gradients from KpiCard
- Use `brand-600` for all primary actions
- Use `brand-700` for hover states consistently
- Use `brand-800` for active states consistently

#### Neutral Colors (Slate)
Currently defined but usage is inconsistent:
```css
--color-slate-50: #f8fafc;    /* Page backgrounds (light mode) */
--color-slate-100: #f1f5f9;   /* Secondary backgrounds */
--color-slate-200: #e2e8f0;   /* Borders */
--color-slate-300: #cbd5e1;   /* Dividers */
--color-slate-400: #94a3b8;   /* Placeholder text */
--color-slate-500: #64748b;   /* Secondary text */
--color-slate-600: #475569;   /* Body text */
--color-slate-700: #334155;   /* Headings */
--color-slate-800: #1e293b;   /* Dark mode backgrounds */
--color-slate-900: #0f172a;   /* Sidebar, always-dark components */
--color-slate-950: #020617;   /* Darkest backgrounds */
```

**Issues Found**:
- Non-standard colors used: `slate-105`, `slate-205`, `slate-305`, `slate-450`, `slate-505`, `slate-555`, `slate-650`, `slate-805`, `slate-850`
- These should be mapped to standard Tailwind scale

**Standardization Plan**:
```
slate-105  → slate-100
slate-205  → slate-200  
slate-305  → slate-300
slate-450  → slate-400
slate-505  → slate-500
slate-555  → slate-500
slate-650  → slate-600
slate-805  → slate-800
slate-850  → slate-800
```

#### Semantic Colors

**Success (Emerald)**:
```css
--color-emerald-50: #ecfdf5;
--color-emerald-100: #d1fae5;
--color-emerald-400: #34d399;
--color-emerald-450: #10b981;  /* Custom - standardize to 500 */
--color-emerald-500: #10b981;
--color-emerald-600: #059669;
--color-emerald-700: #047857;
--color-emerald-800: #065f46;
--color-emerald-900: #064e3b;
--color-emerald-950: #022c22;
```

**Error/Destructive (Rose)**:
```css
--color-rose-50: #fff1f2;
--color-rose-100: #ffe4e6;
--color-rose-400: #fb7185;
--color-rose-455: #f43f5e;  /* Custom - standardize to 500 */
--color-rose-500: #f43f5e;
--color-rose-600: #e11d48;
--color-rose-655: #be123c;  /* Custom - standardize to 700 */
--color-rose-700: #be123c;
--color-rose-800: #9f1239;
--color-rose-900: #881337;
--color-rose-950: #4c0519;
```

**Warning (Amber)**:
```css
--color-amber-50: #fffbeb;
--color-amber-100: #fef3c7;
--color-amber-400: #fbbf24;
--color-amber-450: #f59e0b;  /* Custom - standardize to 500 */
--color-amber-500: #f59e0b;
--color-amber-600: #d97706;
--color-amber-700: #b45309;
--color-amber-800: #92400e;
--color-amber-900: #78350f;
--color-amber-950: #451a03;
```

**Info (Blue)**:
```css
--color-blue-50: #eff6ff;
--color-blue-105: #dbeafe;  /* Custom - standardize to 100 */
--color-blue-100: #dbeafe;
--color-blue-400: #60a5fa;
--color-blue-500: #3b82f6;
--color-blue-600: #2563eb;
--color-blue-700: #1d4ed8;
--color-blue-800: #1e40af;
--color-blue-900: #1e3a8a;
--color-blue-955: #172554;  /* Custom - standardize to 950 */
--color-blue-950: #172554;
```

### Typography Scale

**Current Issues**:
- Arbitrary values used: `text-[10px]`, `text-[9px]`
- Inconsistent line heights
- No clear hierarchy

**Standardized Scale**:
```typescript
const typography = {
  '2xs': { fontSize: '0.625rem', lineHeight: '1rem' },     // 10px - labels, metadata
  'xs': { fontSize: '0.75rem', lineHeight: '1.25rem' },    // 12px - body text, descriptions
  'sm': { fontSize: '0.875rem', lineHeight: '1.5rem' },    // 14px - buttons, nav items
  'base': { fontSize: '1rem', lineHeight: '1.75rem' },     // 16px - primary content
  'lg': { fontSize: '1.125rem', lineHeight: '1.875rem' },  // 18px - card titles
  'xl': { fontSize: '1.25rem', lineHeight: '2rem' },       // 20px - section headers
  '2xl': { fontSize: '1.5rem', lineHeight: '2.25rem' },    // 24px - page subtitles
  '3xl': { fontSize: '1.875rem', lineHeight: '2.5rem' },   // 30px - page headers
  '4xl': { fontSize: '2.25rem', lineHeight: '3rem' },      // 36px - hero text
  '5xl': { fontSize: '3rem', lineHeight: '3.75rem' },      // 48px - marketing/landing
};
```

**Usage Guidelines**:
- `2xs`: Badge text, tiny metadata, footnotes
- `xs`: Card descriptions, form labels, table text, placeholder text
- `sm`: Button text, navigation links, body text in dense layouts
- `base`: Default body text, dialog content
- `lg`: Card titles, modal titles
- `xl`: Section headers
- `2xl`: Secondary page headers
- `3xl`: Primary page headers
- `4xl`+: Large marketing content (rare in enterprise app)

**Font Weight Guidelines**:
```typescript
const fontWeights = {
  'font-normal': 400,    // NOT USED - remove for consistency
  'font-medium': 500,    // Small labels, metadata
  'font-semibold': 600,  // Body text that needs emphasis, button text
  'font-bold': 700,      // Headings, titles, important labels
  'font-extrabold': 800, // NOT USED - remove for consistency
};
```

**Standardization**:
- Use `font-medium` for: Small labels, timestamps, metadata
- Use `font-semibold` for: Button text, navigation items, emphasized body text
- Use `font-bold` for: All headings, card titles, page headers
- Remove: `font-normal`, `font-extrabold` (not needed)

### Spacing Scale

**Current Issues**:
- Inconsistent padding: `p-3`, `p-4`, `p-5`, `p-6`, `p-8`, `p-12`
- Inconsistent gaps: `gap-2`, `gap-3`, `gap-4`, `gap-5`, `gap-6`, `gap-8`
- No clear system for when to use which value

**Standardized Scale** (Tailwind default):
```
0.5 = 0.125rem = 2px
1   = 0.25rem  = 4px
1.5 = 0.375rem = 6px
2   = 0.5rem   = 8px
2.5 = 0.625rem = 10px
3   = 0.75rem  = 12px
3.5 = 0.875rem = 14px
4   = 1rem     = 16px
5   = 1.25rem  = 20px
6   = 1.5rem   = 24px
7   = 1.75rem  = 28px
8   = 2rem     = 32px
10  = 2.5rem   = 40px
12  = 3rem     = 48px
16  = 4rem     = 64px
20  = 5rem     = 80px
24  = 6rem     = 96px
```

**Usage Guidelines**:

**Component Padding**:
- **Dense components** (badges, small buttons): `px-2.5 py-0.5` or `px-3 py-1.5`
- **Standard components** (buttons, inputs, nav items): `px-4 py-2` or `px-3 py-2.5`
- **Cards (small)**: `p-4` (mobile), `p-5` (desktop)
- **Cards (default)**: `p-5` (mobile), `p-6` (desktop)
- **Cards (large)**: `p-6` (mobile), `p-8` (desktop)
- **Modals/Dialogs**: `p-6`
- **Empty states**: `p-8` (mobile), `p-12` (desktop)

**Gaps Between Elements**:
- **Tight layouts** (badges, inline elements): `gap-1` to `gap-2`
- **Standard layouts** (form fields, list items): `gap-3` to `gap-4`
- **Card grids**: `gap-4` (mobile), `gap-5` or `gap-6` (desktop)
- **Section spacing**: `gap-6` to `gap-8`
- **Page sections**: `space-y-6` or `space-y-8`

**Standardization Plan**:
```typescript
// Card padding standardization
CardSmall:   p-4 md:p-5
CardDefault: p-5 md:p-6  
CardLarge:   p-6 md:p-8

// Grid gaps standardization
ComponentGrid: gap-4 md:gap-5  // Employee cards, KPI cards
SectionLayout: gap-6           // Dashboard sections
PageSections:  space-y-6       // Between major page areas
```

### Border Radius

**Current Issues**:
- Mix of `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`
- No clear guidelines for when to use each

**Standardized Scale**:
```typescript
const borderRadius = {
  'rounded-sm': '0.125rem',  // 2px - NOT USED
  'rounded-md': '0.375rem',  // 6px - Dropdown items, small elements
  'rounded-lg': '0.5rem',    // 8px - Buttons, inputs, badges, nav items
  'rounded-xl': '0.75rem',   // 12px - Cards, dialogs, primary containers
  'rounded-2xl': '1rem',     // 16px - NOT USED
  'rounded-full': '9999px',  // Full rounding - badges, avatars, pills
};
```

**Usage Guidelines**:
- `rounded-md`: Dropdown menu items, table cells (rare)
- `rounded-lg`: Buttons, inputs, nav items, icon containers, small interactive elements
- `rounded-xl`: Cards, modals, dialogs, primary content containers
- `rounded-full`: Badges, avatars, notification dots, pill-shaped elements

**Standardization**:
- All cards: `rounded-xl`
- All buttons: `rounded-lg`
- All inputs: `rounded-lg`
- All badges: `rounded-full`
- Dropdown items: `rounded-md`

### Shadow System

**Current Issues**:
- Custom shadows: `shadow-2xs`, `shadow-xs`
- Inconsistent elevation hierarchy

**Standardized Scale**:
```typescript
const shadows = {
  '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',                    // Subtle elevation
  'xs': '0 1px 3px 0 rgb(0 0 0 / 0.1)',                      // Card default
  'sm': '0 2px 4px 0 rgb(0 0 0 / 0.1)',                      // Topbar, elevated cards
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',                   // Dropdowns, hover states
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',                 // Modals, dialogs
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',                 // Large modals
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',              // Overlays
};
```

**Usage Guidelines**:
- **No shadow** (`shadow-none`): Inline components, nested cards
- **2xs** (`shadow-2xs`): Very subtle elevation for status cards, grid items
- **xs** (`shadow-xs`): Default cards, standard elevation
- **sm** (`shadow-sm`): Topbar, persistent navigation elements
- **md** (`shadow-md`): Dropdowns, popovers, card hover states
- **lg** (`shadow-lg`): Modals, dialogs, sheets
- **xl**+ : Large overlays, marketing content (rare)

**Hover State Guidelines**:
- Cards can go from `shadow-xs` → `shadow-md` on hover
- Buttons should NOT change shadow on hover (use background color change only)

### Animation & Transition Tokens

**Current Issues**:
- Mix of `duration-150`, `duration-200`, `duration-250`, `duration-300`
- Inconsistent easing functions
- Decorative animations (KpiCard gradient scale) contradict design philosophy

**Standardized Durations**:
```typescript
const durations = {
  fast: '150ms',    // Color changes, opacity changes
  normal: '200ms',  // Default transitions, hover states
  slow: '300ms',    // Layout changes, sheet/dialog animations
};
```

**Standardized Easing**:
```typescript
const easing = {
  ease: 'ease',                           // Default browser easing
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',  // Accelerating
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)', // Decelerating (preferred for most UI)
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', // Smooth start and end
};
```

**Usage Guidelines**:
- **Color/opacity changes**: `transition-colors duration-150` or `transition-opacity duration-150`
- **Hover states**: `transition-all duration-200 ease-out`
- **Layout animations**: `transition-all duration-300 ease-in-out`
- **Framer Motion**: Only for complex animations (page transitions, slide-ins)
- **Respect reduced motion**: All animations must respect `prefers-reduced-motion: reduce`

**Prohibited**:
- Decorative scale animations (remove KpiCard gradient scale)
- Continuous animations (spinners are exception)
- Animations longer than 300ms (except page transitions)

## Data Models

### Design Token Type Definitions

```typescript
// lib/design-tokens.ts

export interface ColorToken {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SpacingScale {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

export interface TypographyScale {
  '2xs': { fontSize: string; lineHeight: string };
  xs: { fontSize: string; lineHeight: string };
  sm: { fontSize: string; lineHeight: string };
  base: { fontSize: string; lineHeight: string };
  lg: { fontSize: string; lineHeight: string };
  xl: { fontSize: string; lineHeight: string };
  '2xl': { fontSize: string; lineHeight: string };
  '3xl': { fontSize: string; lineHeight: string };
  '4xl': { fontSize: string; lineHeight: string };
  '5xl': { fontSize: string; lineHeight: string };
}

export interface ShadowScale {
  '2xs': string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface RadiusScale {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface AnimationTokens {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface DesignTokens {
  colors: {
    brand: ColorToken;
    slate: ColorToken;
    rose: ColorToken;
    emerald: ColorToken;
    amber: ColorToken;
    blue: ColorToken;
    indigo: ColorToken;
    purple: ColorToken;
  };
  spacing: SpacingScale;
  typography: TypographyScale;
  shadows: ShadowScale;
  radii: RadiusScale;
  animations: AnimationTokens;
}
```

### Component Prop Interfaces

```typescript
// Standardized component prop patterns

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  onClick?: () => void;
}

export interface FormComponentProps extends BaseComponentProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
}

export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'destructive';
```

## Component Standardization Plan

Based on the UI audit, the following components require standardization or consolidation.

### 1. Card Component Standardization

**Current State**: Card styling varies across usage contexts

**Standardization Plan**:

```tsx
// components/ui/card.tsx - Updated implementation
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base styles - standardized
        "rounded-xl border bg-white dark:bg-slate-900",
        // Variant-specific styles
        variant === 'default' && "border-slate-200/60 dark:border-slate-800 shadow-xs",
        variant === 'flat' && "border-slate-200/60 dark:border-slate-800", // No shadow
        variant === 'elevated' && "border-slate-200/60 dark:border-slate-800 shadow-md",
        className
      )}
      {...props}
    />
  )
);

// Standardized padding
const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-5 md:p-6", className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn("p-5 md:p-6 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-5 md:p-6 pt-0", className)} {...props} />
);
```

**Migration Strategy**:
1. Update base Card component with standardized padding (`p-5 md:p-6`)
2. Replace all `p-4`, `p-6`, `p-8` instances with new standard
3. Add variant prop for elevation control
4. Update KpiCard to use Card component properly

### 2. Button Component Standardization

**Current State**: Inconsistent hover states, missing icon button optimizations

**Standardization Plan**:

```tsx
// components/ui/button.tsx - Updated variants
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
        outline: "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
        ghost: "hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-brand-600 underline-offset-4 hover:underline dark:text-brand-400",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-xs rounded-md",
        lg: "h-10 px-6 py-2.5", // Changed from px-8 to px-6 for better progression
        icon: "h-9 w-9 p-0",
        iconSm: "h-8 w-8 p-0", // NEW: Small icon buttons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Changes**:
- Added `active:` states to all variants for consistent pressed feedback
- Standardized `duration-200` for all transitions
- Fixed large button padding (`px-6` instead of `px-8`)
- Added `iconSm` size for smaller icon buttons
- Removed shadows from buttons (shadows are for elevation, not buttons)

**Migration Strategy**:
1. Update Button component with new variants
2. Replace custom icon button implementations in Topbar with `<Button size="iconSm" variant="ghost">`
3. Update Sidebar navigation to use `<Button variant="ghost">` wrapped in NavLink

### 3. Empty State Component Consolidation

**Current State**: Multiple implementations of empty states

**Standardization Plan**:

```tsx
// components/ui/empty-state.tsx - Enhanced with size variants
export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  size = 'md',
  variant = 'default',
  className,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'p-6',
      iconWrapper: 'p-3',
      iconSize: 'h-6 w-6',
      titleSize: 'text-sm',
      descSize: 'text-xs',
    },
    md: {
      container: 'p-8 md:p-12',
      iconWrapper: 'p-4',
      iconSize: 'h-10 w-10',
      titleSize: 'text-base',
      descSize: 'text-xs',
    },
    lg: {
      container: 'p-12 md:p-16',
      iconWrapper: 'p-5',
      iconSize: 'h-12 w-12',
      titleSize: 'text-lg',
      descSize: 'text-sm',
    },
  };

  const variantClasses = {
    default: 'bg-slate-50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
    error: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400',
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-xs max-w-lg mx-auto w-full",
      classes.container,
      className
    )}>
      <div className={cn(
        "rounded-xl",
        classes.iconWrapper,
        variantClasses[variant]
      )}>
        <Icon className={cn(classes.iconSize, "shrink-0")} />
      </div>
      <h3 className={cn(
        "font-bold text-slate-800 dark:text-white mt-4",
        classes.titleSize
      )}>
        {title}
      </h3>
      <p className={cn(
        "text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mt-2",
        classes.descSize
      )}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          size={size === 'sm' ? 'sm' : 'default'}
          className="mt-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

**Migration Strategy**:
1. Update EmptyState component with size and variant props
2. Replace AlertPanel custom empty state with `<EmptyState size="sm" variant="success" />`
3. Standardize all empty state usages across dashboard components
4. Remove `/dashboard/EmptyState.tsx` wrapper (use ui component directly)

### 4. Badge Component Standardization

**Current State**: Good foundation but custom color values need cleanup

**Standardization Plan**:

```tsx
// components/ui/badge.tsx - Clean up color values
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900",
        secondary: "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
        destructive: "border-transparent bg-rose-100 text-rose-800 border-rose-200/40 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30",
        success: "border-transparent bg-emerald-100 text-emerald-800 border-emerald-200/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30",
        warning: "border-transparent bg-amber-100 text-amber-800 border-amber-200/40 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30",
        info: "border-transparent bg-blue-100 text-blue-800 border-blue-200/40 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

**Changes**:
- Standardized all color values to base Tailwind scale (removed `blue-105`, `blue-955`)
- Consistent border opacity across all variants

**Migration Strategy**:
1. No breaking changes - current API remains the same
2. Update color values to standard scale
3. Verify visual consistency across all badge usages

### 5. KpiCard Component Refactoring

**Current State**: Contains decorative gradient that contradicts design philosophy

**Standardization Plan**:

```tsx
// components/dashboard/KpiCard.tsx - Simplified version
export default function KpiCard({ icon: Icon, title, value, percentage, loading }: KpiCardProps) {
  if (loading) {
    return (
      <Card className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-16" />
        {percentage !== undefined && <Skeleton className="h-5 w-12" />}
      </Card>
    );
  }

  return (
    <Card className="p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          {title}
        </h3>
        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {percentage !== undefined && (
          <Badge variant="info">
            {percentage}%
          </Badge>
        )}
      </div>
    </Card>
  );
}
```

**Changes**:
- Removed decorative gradient background
- Removed group hover scale animation on gradient
- Simplified transition to just shadow change
- Standardized spacing with design tokens

**Migration Strategy**:
1. Update KpiCard component
2. Visual regression test to ensure KPIs still look professional
3. Verify across Dashboard and CommanderDashboard

### 6. Sidebar Navigation Standardization

**Current State**: Uses custom NavLink styling instead of Button component

**Standardization Plan**:

```tsx
// components/Sidebar.tsx - Refactored nav items
<NavLink
  key={item.path}
  to={item.path}
  onClick={handleLinkClick}
>
  {({ isActive }) => (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium",
        isActive && "bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!sidebarCollapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </Button>
  )}
</NavLink>
```

**Changes**:
- Use Button component with ghost variant as base
- Override active state styling with brand-600 background
- Maintain current visual appearance while using standardized component
- Better consistency with button hover/active states

**Migration Strategy**:
1. Refactor Sidebar NavLink elements to use Button component
2. Ensure Framer Motion animations still work
3. Test keyboard navigation and focus states
4. Verify in both collapsed and expanded states

### 7. Input Component Enhancement

**Current State**: Good foundation but could benefit from error state styling

**Standardization Plan**:

```tsx
// components/ui/input.tsx - Add error variant
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border bg-slate-50 px-3 py-1.5 text-xs shadow-2xs transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-slate-400",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Error state
          error
            ? "border-rose-300 focus-visible:ring-rose-500 focus-visible:border-rose-500 dark:border-rose-800 dark:focus-visible:ring-rose-500"
            : "border-slate-200 focus-visible:ring-brand-500 focus-visible:border-brand-500 dark:border-slate-800 dark:focus-visible:ring-brand-500",
          "dark:bg-slate-950 dark:text-white",
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
    );
  }
);
```

**Migration Strategy**:
1. Add error prop to Input component
2. Use in form validation contexts
3. Pair with error message components for full form field pattern

### Component Naming Conventions

To avoid confusion and maintain consistency:

**File Naming**:
- Base UI components: `kebab-case.tsx` (e.g., `button.tsx`, `card.tsx`)
- Composite components: `PascalCase.tsx` (e.g., `KpiCard.tsx`, `AlertPanel.tsx`)
- Page components: `PascalCase.tsx` (e.g., `Dashboard.tsx`, `Employees.tsx`)

**Component Exports**:
- Default exports for page components
- Named exports for UI components and composites
- Export types alongside components

**Props Interfaces**:
- Always define explicit prop interfaces
- Name with component name + `Props` suffix
- Export prop interfaces for reusability

**Example**:
```tsx
// Good
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(/*...*/);

// Bad - no prop interface
export const Button = ({ variant, size, ...props }) => {/*...*/};
```

### RTL Considerations

All component updates must maintain RTL support:

**Directional Properties**:
- Use `start`/`end` instead of `left`/`right` where possible
- Use `ms-*` and `me-*` for margin start/end
- Use `ps-*` and `pe-*` for padding start/end

**Icons**:
- Directional icons (arrows, chevrons) should flip in RTL
- Use `scale-x-[-1]` with `rtl:` modifier: `rtl:scale-x-[-1]`

**Text Alignment**:
- Use `text-start` and `text-end` instead of `text-left`/`text-right`
- Default to `text-right` for Hebrew content (current implementation is correct)

**Testing**:
- All component refactorings must be tested in RTL mode
- Verify icon directions, text alignment, and layout flow

## Error Handling

### Design Token Fallbacks

When design tokens are not available or invalid:

1. **Missing Token**: Log warning and fall back to nearest equivalent Tailwind class
2. **Invalid Token Value**: Log error and use default value from base theme
3. **Theme Not Loaded**: Use inline fallback values until theme loads

```typescript
// hooks/useDesignTokens.ts
export function useDesignTokens() {
  const theme = useTheme();
  
  const getToken = (path: string, fallback: string) => {
    try {
      const value = getTokenByPath(theme, path);
      if (!value) {
        console.warn(`Design token "${path}" not found, using fallback`);
        return fallback;
      }
      return value;
    } catch (error) {
      console.error(`Error accessing design token "${path}":`, error);
      return fallback;
    }
  };
  
  return { getToken };
}
```

### Component Error Boundaries

All complex composite components should be wrapped in error boundaries that:

1. Catch rendering errors gracefully
2. Display user-friendly fallback UI
3. Log errors for debugging
4. Provide recovery actions when possible

```typescript
// Example: Dashboard error boundary
<ErrorBoundary
  fallback={<EmptyState 
    icon={AlertTriangle}
    title="תקלה בטעינת הדשבורד"
    description="אירעה שגיאה בטעינת הנתונים. אנא נסה שנית."
    actionLabel="רענן"
    onAction={() => window.location.reload()}
  />}
>
  <Dashboard />
</ErrorBoundary>
```

## Testing Strategy

### Visual Regression Testing

**Tool**: Playwright with screenshot comparison

**Coverage**:
1. All UI components in isolation (Storybook stories)
2. Key user flows (dashboard, employees list, organization tree)
3. Theme switching (light/dark mode)
4. RTL layout rendering
5. Responsive breakpoints (mobile, tablet, desktop)

**Test Scenarios**:
```typescript
// Example: Card visual regression test
test('Card component appearance', async ({ page }) => {
  await page.goto('/storybook?path=/story/ui-card--default');
  await expect(page).toHaveScreenshot('card-default.png');
  
  // Test dark mode
  await page.click('[title="Toggle theme"]');
  await expect(page).toHaveScreenshot('card-dark.png');
  
  // Test hover state
  await page.hover('[data-testid="card"]');
  await expect(page).toHaveScreenshot('card-hover.png');
});
```

### Accessibility Testing

**Tool**: axe-core via @axe-core/playwright

**Coverage**:
1. Color contrast ratios (WCAG AA minimum 4.5:1)
2. Focus indicators on all interactive elements
3. Keyboard navigation (Tab, Enter, Escape, Arrow keys)
4. Screen reader compatibility (ARIA labels, semantic HTML)
5. Form field error association

**Test Scenarios**:
```typescript
// Example: Button accessibility test
test('Button accessibility', async ({ page }) => {
  await page.goto('/storybook?path=/story/ui-button--all-variants');
  
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.locator('button:focus')).toBeVisible();
  
  // Test screen reader labels
  const button = page.locator('button').first();
  await expect(button).toHaveAttribute('aria-label');
});
```

### Unit Testing

**Tool**: Vitest + React Testing Library

**Coverage**:
1. Component prop validation
2. Event handler execution
3. Conditional rendering logic
4. Design token hook behavior

**Test Scenarios**:
```typescript
// Example: KpiCard unit test
describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard icon={Users} title="סה״כ כוח אדם" value="1,248" />);
    expect(screen.getByText('סה״כ כוח אדם')).toBeInTheDocument();
    expect(screen.getByText('1,248')).toBeInTheDocument();
  });
  
  it('renders percentage badge when provided', () => {
    render(<KpiCard icon={Users} title="Test" value="100" percentage="+12" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });
  
  it('shows loading skeleton when loading prop is true', () => {
    render(<KpiCard icon={Users} title="Test" value="100" loading />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
```

### Integration Testing

**Tool**: Playwright E2E tests

**Coverage**:
1. Design system integration with real application pages
2. Theme persistence across navigation
3. Component composition in realistic scenarios
4. Performance impact of design system (Core Web Vitals)

**Test Scenarios**:
```typescript
// Example: Dashboard integration test
test('Dashboard uses design system correctly', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Verify consistent spacing
  const kpiCards = page.locator('[data-testid="kpi-card"]');
  const gaps = await kpiCards.evaluateAll((cards) => {
    const styles = window.getComputedStyle(cards[0].parentElement);
    return styles.gap;
  });
  expect(gaps).toBe('1.25rem'); // gap-5
  
  // Verify consistent card padding
  const padding = await kpiCards.first().evaluate((card) => {
    return window.getComputedStyle(card).padding;
  });
  expect(padding).toBe('1.25rem'); // p-5
});
```

### Performance Testing

**Metrics**:
1. CSS bundle size (target: < 50KB gzipped)
2. First Contentful Paint (target: < 1.5s)
3. Time to Interactive (target: < 3.5s)
4. Cumulative Layout Shift (target: < 0.1)

**Tools**:
- Lighthouse CI for automated performance regression detection
- Bundle analyzer for CSS size monitoring
- Web Vitals library for real-user monitoring

```javascript
// Example: Lighthouse CI configuration
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/dashboard',
        'http://localhost:5173/employees',
      ],
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

---

## Implementation Notes

This design document provides the comprehensive audit and technical foundation for implementing the Enterprise Design Foundation. The next phase will involve:

1. Creating design token definitions based on audit findings
2. Refactoring components to use standardized tokens
3. Implementing visual regression testing infrastructure
4. Documenting usage guidelines for developers

**No implementation changes should be made until this design is reviewed and approved.**
