# Pikud360 UI Foundation — Loading Experience Spec

**Domain:** UI Component Specifications  
**Phase:** Sprint 34 — Loading Experience  
**Target Path:** [loading-experience.md](file:///C:/Users/nafta/OneDrive/שולחן%2520העבודה/Pikud360/docs/ui/loading-experience.md)

---

## 1. Core Rules

> **Never leave blank screens. Never freeze the UI.**

| Rule | Enforcement |
|---|---|
| Every data fetch must show a skeleton or spinner immediately | No raw empty containers allowed |
| No UI element should become unresponsive during loading | Keep navigation, sidebars, and headers always interactive |
| Every loading state must have a defined timeout threshold | See timing thresholds below |
| Every error must offer a retry path | Use `ErrorState` with `retryAction` |
| Animations respect `prefers-reduced-motion` | Skeleton pulse collapses to static fill |

---

## 2. Timing Thresholds

| Threshold | Duration | Action |
|---|---|---|
| **Instant feedback** | 0ms | Apply loading state synchronously before any await |
| **Fast response** | < 300ms | Show spinner inline — no full skeleton needed |
| **Normal load** | 300ms – 3s | Show full skeleton layout |
| **Slow connection warning** | > 3s | Show slow-connection banner above content skeleton |
| **Timeout** | > 10s | Dismiss skeleton, show `TimeoutState` with retry |
| **Stale data** | Configurable (e.g. 5min) | Show stale indicator + background refresh trigger |

---

## 3. Existing Components

### `skeleton.tsx`
| Component | Use |
|---|---|
| `Skeleton` | Base pulsing block — any shape via className |
| `SkeletonLine` | Text line placeholder (`h-4 w-full` default) |
| `SkeletonAvatar` | Circular avatar placeholder (`h-10 w-10`) |
| `SkeletonBlock` | Content area block (`h-24 w-full`) |
| `SkeletonCard` | Full card: avatar + lines + button row |
| `SkeletonTable` | Configurable rows table (`rows` prop, default 5) |

### `states.tsx`
| Component | Variant | Use |
|---|---|---|
| `LoadingState` | `card` | Single card loading |
| `LoadingState` | `table` | Table row skeletons |
| `LoadingState` | `list` | Avatar + text list skeletons |
| `LoadingState` | `layout` | Full page 2/3 + 1/3 layout skeleton |
| `EmptyState` | — | No data: icon + title + description + actions |
| `ErrorState` | — | Fetch error: danger card + retry button |

### `spinner.tsx`
| Size | Pixels | Use |
|---|---|---|
| `sm` | 16px | Inline button loading state |
| `default` | 24px | Widget toolbar refresh |
| `lg` | 32px | Page-level centered loading |

---

## 4. Missing Patterns — Specification

### 4.1 Progress Bar

**When:** File upload, bulk export/import, multi-step wizard progression.

**Pattern:**
```tsx
// Indeterminate (unknown duration)
<div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
  <div className="h-full bg-enterprise-primary animate-[progress-slide_1.5s_ease-in-out_infinite]" />
</div>

// Determinate (known percentage)
<div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
  <div
    className="h-full bg-enterprise-primary transition-[width] duration-300"
    style={{ width: `${percent}%` }}
  />
</div>
```

**Rules:**
- Always show percentage label for determinate bars
- Indeterminate bars use a sliding shimmer animation
- Height: `h-1` (4px) for inline, `h-2` (8px) for standalone

---

### 4.2 Streaming / Progressive Rendering

**When:** Large lists, AI-generated content, real-time event feeds.

**Pattern:** Render rows/items as they arrive. Append with a fade-in animation on each new item.

```tsx
// Each new streamed item
<div className="animate-[page-enter_200ms_ease-out_forwards]">
  {item}
</div>
```

**Rules:**
- Show the first batch immediately — never wait for all data
- Display a subtle "loading more…" spinner at the bottom of the list
- Do not re-render or shift existing items when new ones arrive (use `append-only` pattern)
- Stop the bottom spinner when the stream ends

---

### 4.3 Optimistic UI

**When:** Toggling a status, archiving a notification, approving a request, submitting a form.

**Pattern:**
1. Update local state immediately (before server response)
2. Apply a subtle muted visual on the affected element (`opacity-70`)
3. On success: restore full opacity, show success toast
4. On failure: revert state, show error toast with retry

**Rules:**
- Only use for reversible, low-risk actions
- Never use for destructive operations (delete, terminate) — always wait for confirmation
- The element must remain interactive during optimistic state (do not disable)
- Revert animation: use `animate-[shake-error_0.4s]` on failure

---

### 4.4 Timeout State

**When:** Any request exceeds 10 seconds without response.

**Component to create:** `TimeoutState` (extends `ErrorState` pattern)

```tsx
<TimeoutState
  title="הבקשה לוקחת יותר מדי זמן"
  description="השרת מגיב לאט. אנא נסה שוב."
  retryAction={{ label: "נסה שוב", onClick: retry }}
  secondaryAction={{ label: "חזור לדשבורד", onClick: goHome }}
/>
```

**Visual:** Same as `ErrorState` but with a `Clock` icon and `text-amber-500` accent (warning, not danger — server may still respond).

**Rules:**
- Dismiss the skeleton and show `TimeoutState` at exactly 10s
- Do not show the timeout state on background refreshes — only on primary page loads
- Log the timeout event to the audit trail

---

### 4.5 Offline State

**When:** `navigator.onLine === false` or network request fails with no connection.

**Banner pattern** (shown at top of app, above header):
```tsx
<div className="fixed top-0 inset-x-0 z-[1070] bg-rose-600 text-white text-sm px-4 py-2 flex items-center justify-center gap-2">
  <WifiOff className="h-4 w-4 shrink-0" />
  <span>אין חיבור לאינטרנט — הנתונים עשויים להיות לא עדכניים</span>
</div>
```

**Rules:**
- Show immediately on `offline` event — do not wait for a failed request
- Dismiss automatically on `online` event with a green "חיבור חודש" confirmation banner for 3s
- While offline: disable all submit/save buttons, mark data as stale
- Cache the last loaded state — never show blank screens

---

### 4.6 Slow Connection Warning

**When:** A request has been pending for > 3s but not yet timed out.

**Banner pattern** (shown inside the widget/section, not global):
```tsx
<div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
  <Clock className="h-3 w-3 shrink-0" />
  <span>החיבור איטי — ממתין לנתונים…</span>
</div>
```

**Rules:**
- Show after exactly 3s of pending state
- Show above the skeleton content, not replacing it
- Do not show for background refreshes (stale-while-revalidate pattern)
- Dismiss immediately when data arrives

---

### 4.7 Partial Loading

**When:** A list/table loads in batches. First batch is displayed while more are incoming.

**Pattern:**
- Render loaded rows immediately
- Append a `SkeletonTable` with `rows={3}` below the loaded rows
- Show "טוען עוד…" below the skeleton
- Replace with real rows as batches arrive

**Rules:**
- Maintain scroll position when new rows are appended
- Do not re-render existing rows on new batch arrival
- Show total count in the toolbar: "מציג 20 מתוך 847"
- Stop skeleton when all batches are complete

---

### 4.8 Refresh In-Place (Stale Data)

**When:** Data is older than the configured stale threshold (default: 5 minutes) and a background refresh is in progress.

**Pattern:**
```tsx
// Subtle stale indicator in widget header
<span className="text-xs text-amber-500 flex items-center gap-1">
  <RefreshCw className="h-3 w-3 animate-spin" />
  מרענן…
</span>
```

**Rules:**
- Never blank the existing data during background refresh — keep it visible
- Replace with fresh data smoothly (no flash/jump) once received
- Show stale timestamp: "עודכן לאחרונה: לפני 7 דקות"
- On refresh error: keep stale data visible, show `WifiOff` icon + error tooltip

---

## 5. Per-Surface Application Matrix

| Surface | Initial Load | Background Refresh | Error | Empty |
|---|---|---|---|---|
| **Dashboard widgets** | `SkeletonBlock` per widget | Spinner in widget header | `ErrorState` in widget | `EmptyState` in widget |
| **Full page** | `LoadingState variant="layout"` | Stale indicator in header | Full-page `ErrorState` | Full-page `EmptyState` |
| **Data table** | `LoadingState variant="table"` | Spinner in toolbar + stale rows | `ErrorState` replacing table | `EmptyState` in table body |
| **List views** | `LoadingState variant="list"` | Append skeletons at bottom | `ErrorState` + retry | `EmptyState` |
| **Drawer / Sheet** | `LoadingState variant="card"` | Spinner in drawer header | Inline error message | Inline empty message |
| **Dialog** | `Spinner` centered | — | Inline error + retry | — |
| **Inline button** | `Spinner sm` inside button | — | Reset button state + toast | — |
| **Search results** | `SkeletonCard` × 3 | — | Error toast | `EmptyState` with SearchX icon |
| **File upload** | Determinate progress bar | — | Error + retry | — |
| **Chart** | `SkeletonBlock h-40` | Spinner in chart header | `ErrorState` in chart area | `EmptyState` |

---

## 6. Decision Tree

```
User triggers data load
       │
       ▼
Show skeleton / spinner immediately (0ms)
       │
   300ms elapsed?
   ├─ No  → Keep showing skeleton (normal)
   └─ Yes →
       │
   3s elapsed?
   ├─ No  → Keep showing skeleton (normal)
   └─ Yes → Show slow-connection banner above skeleton
       │
   10s elapsed?
   ├─ No  → Keep showing (with banner)
   └─ Yes → Replace with TimeoutState + retry
       │
   Offline detected?
   └─ Yes → Show global offline banner, disable submits
```

---

## 7. Reduced Motion

All skeleton pulses collapse to a static `bg-slate-200/bg-slate-800` fill under `prefers-reduced-motion: reduce`. Progress bars switch to a static filled state at the last known percentage. Spinners stop but remain visible as a static ring.
