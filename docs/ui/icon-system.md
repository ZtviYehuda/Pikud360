# Pikud360 UI Foundation — Icon System Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 33 — Iconography  
**Icon Library:** [Lucide React](https://lucide.dev)  
**Target Path:** [icon-system.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/icon-system.md)

---

## 1. Audit Findings

A codebase scan revealed **6 inconsistent icon sizes** across components with no governing rules:

| Size | Tailwind | Found In |
|---|---|---|
| 12px | `h-3 w-3` | Form error hints, undo button, filter chip X |
| 16px | `h-4 w-4` | Toolbar search, table clear, drawer close, buttons |
| 20px | `h-5 w-5` | Toast feedback icons, dialog headers, notification rows |
| 32px | `h-8 w-8` | Notification center empty state hero |
| 40px | `h-10 w-10` | Empty state primary illustration |

**Problem:** Same semantic role (e.g. "error") uses `h-3 w-3` in forms vs `h-5 w-5` in toasts — no consistent standard.

---

## 2. Standardized Size Scale

### The 6-Tier Scale

| Tier | Size | Tailwind | Lucide `size` prop | Use Context |
|---|---|---|---|---|
| `xs` | 12px | `h-3 w-3` | `size={12}` | Inline error/hint text, chip close buttons, micro badges |
| `sm` | 16px | `h-4 w-4` | `size={16}` | Button icons, table cell icons, toolbar actions, form labels |
| `md` | 20px | `h-5 w-5` | `size={20}` | Toast icons, dialog header icons, nav items, KPI trend arrows |
| `lg` | 24px | `h-6 w-6` | `size={24}` | Section header actions, widget control buttons, tab icons |
| `xl` | 32px | `h-8 w-8` | `size={32}` | Widget hero icons, notification empty state, chart type indicators |
| `2xl` | 40px | `h-10 w-10` | `size={40}` | Page-level empty state primary illustration |

### Rule

> Always use the Tailwind class approach (`className="h-4 w-4"`) for consistency with Tailwind's JIT scanner. The `size` prop is listed for reference only.

---

## 3. Stroke Weight

Lucide icons default to `strokeWidth={2}`. Pikud360 enforces:

| Context | Stroke Width | Reason |
|---|---|---|
| General UI | `2` (default) | Standard clarity |
| Empty state illustrations | `1.5` | Lighter, illustrative feel |
| Alert / critical icons | `2.5` | Higher visual urgency |

Apply via: `<AlertOctagon className="h-5 w-5" strokeWidth={2.5} />`

---

## 4. Spacing & Alignment

- **With text:** Always pair with `gap-1.5` (6px) between icon and label.
- **Icon-only buttons:** Wrap in a container with `h-8 w-8` (or `h-9 w-9`) and center with `flex items-center justify-center`.
- **Leading icon in inputs:** Position with `absolute right-3 top-2.5` (RTL: `left-3`).
- **Vertical alignment:** Use `shrink-0` on all inline icons to prevent flex compression.

---

## 5. Per-Context Icon Catalog

### Status Icons
| Status | Icon | Size | Color |
|---|---|---|---|
| Success | `CheckCircle2` | `md` | `text-emerald-500` |
| Warning | `AlertTriangle` | `md` | `text-amber-500` |
| Error / Danger | `XCircle` | `md` | `text-rose-500` |
| Critical | `AlertOctagon` | `md` | `text-red-600`, `strokeWidth={2.5}` |
| Info | `Info` | `md` | `text-cyan-500` |
| Offline | `WifiOff` | `md` | `text-slate-400` |
| Pending | `Clock` | `md` | `text-amber-400` |
| Online / Active | `CheckCircle` | `md` | `text-emerald-500` |
| In Progress | `Loader2` (spinning) | `md` | `text-blue-500` |

### Navigation Icons
| Item | Icon | Size |
|---|---|---|
| Dashboard | `LayoutDashboard` | `sm` |
| Employees | `Users` | `sm` |
| Attendance | `CalendarCheck` | `sm` |
| Shifts | `CalendarClock` | `sm` |
| Reports | `BarChart3` | `sm` |
| Settings | `Settings` | `sm` |
| Admin | `ShieldCheck` | `sm` |
| Notifications | `Bell` | `sm` |
| Chevron (sidebar expand) | `ChevronRight` | `sm` |
| Back | `ArrowRight` (RTL mirrored) | `sm` |

### Action Icons
| Action | Icon | Size |
|---|---|---|
| Create / Add | `Plus` | `sm` |
| Edit | `Pencil` | `sm` |
| Delete | `Trash2` | `sm` |
| Export | `Download` | `sm` |
| Import | `Upload` | `sm` |
| Refresh | `RefreshCw` | `sm` |
| Search | `Search` | `sm` |
| Filter | `SlidersHorizontal` | `sm` |
| Clear filter | `X` | `xs` |
| More options | `MoreHorizontal` | `sm` |
| Fullscreen | `Maximize2` | `sm` |
| Close | `X` | `sm` |
| Copy | `Copy` | `sm` |
| Share | `Share2` | `sm` |

### Chart Icons
| Chart Type | Icon | Size |
|---|---|---|
| Area / Line | `TrendingUp` | `sm` |
| Bar | `BarChart3` | `sm` |
| Pie / Donut | `PieChart` | `sm` |
| Trend up | `TrendingUp` | `sm`, `text-emerald-500` |
| Trend down | `TrendingDown` | `sm`, `text-rose-500` |
| Fullscreen | `Maximize2` | `sm` |

### Form Icons
| Context | Icon | Size | Stroke |
|---|---|---|---|
| Validation error | `AlertCircle` | `xs` | `2` |
| Hint / Info | `Info` | `xs` | `2` |
| Required marker | `Asterisk` | `xs` | `2` |
| Clear input | `X` | `xs` | `2` |
| Calendar picker | `Calendar` | `sm` | `2` |
| Time picker | `Clock` | `sm` | `2` |
| Password toggle | `Eye` / `EyeOff` | `sm` | `2` |
| File upload | `Upload` | `sm` | `2` |

### Notification Icons
| Type | Icon | Size |
|---|---|---|
| Bell (header) | `Bell` | `md` |
| Unread indicator | Dot `h-2 w-2 rounded-full` | — |
| Critical priority | `AlertOctagon` | `sm`, `strokeWidth={2.5}` |
| Warning priority | `AlertTriangle` | `sm` |
| Info priority | `Info` | `sm` |
| Success | `CheckCircle` | `sm` |
| Archive | `Archive` | `sm` |
| Delete | `Trash2` | `sm` |

### Empty State Icons (per page)
| Page | Icon | Size | Stroke |
|---|---|---|---|
| Employees (no results) | `Users` | `2xl` | `1.5` |
| Notifications (empty) | `BellOff` | `2xl` | `1.5` |
| Reports (no data) | `FileBarChart` | `2xl` | `1.5` |
| Shifts (no schedule) | `CalendarX` | `2xl` | `1.5` |
| Search (no results) | `SearchX` | `2xl` | `1.5` |
| Generic error | `AlertCircle` | `2xl` | `1.5` |
| Permission denied | `ShieldOff` | `2xl` | `1.5` |
| Loading / skeleton | *(no icon — use skeleton)* | — | — |

---

## 6. RTL Mirroring

Directional icons must flip in RTL layouts. Apply `rtl:scale-x-[-1]` via Tailwind:

```tsx
// Arrow (points right in LTR, should point left in RTL)
<ArrowRight className="h-4 w-4 rtl:scale-x-[-1]" />

// Chevron (sidebar collapse)
<ChevronRight className="h-4 w-4 rtl:scale-x-[-1]" />
```

**Icons that do NOT mirror:** Checkmarks, circles, alerts, clocks, calendars, trash, search.

---

## 7. Accessibility Rules

- All decorative icons: `aria-hidden="true"`
- All meaningful standalone icons: `aria-label` on the wrapping button/element
- Icon-only buttons require `title` attribute for tooltip fallback
- Never use color alone to convey status — always pair icon + color

```tsx
// Correct
<button aria-label="מחק רשומה">
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</button>

// Incorrect
<Trash2 className="h-4 w-4 text-rose-500" />
```

---

## 8. Animation Rules

| Icon | Animation | When |
|---|---|---|
| `Loader2` | `animate-spin` | Loading state |
| `RefreshCw` | `animate-spin` | Refresh in progress |
| `Bell` | `animate-pulse` (subtle) | Unread notifications present |
| `CheckCircle2` | `animate-[success-pop]` | Success feedback |

All animations respect `prefers-reduced-motion` — they collapse to instant state changes.
