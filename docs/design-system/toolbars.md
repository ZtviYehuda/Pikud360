# toolbars.md

This document specifies the Enterprise Search, Filter & Toolbar System components defined in [toolbar.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/toolbar.tsx).

---

## 1. Design Principles

- **Unified Component Flow**: Toolbar elements layout flow is standardized to wrap dynamically between screen form-factors.
- **Mobile First Formatting**: Mobile view renders search field at full width, wrapping action buttons below the search field and letting select options flow naturally without causing horizontal overflow.
- **Pure Presentation**: Search query logic, filter criteria hooks, and pagination details are kept outside components. Actions and states are fully driven by props callbacks.
- **Accessibly Tagged Control Bar**: All icon triggers include alternative descriptive titles (`aria-label`), active select controls maintain focus highlights, and chips are fully navigable.

---

## 2. Anatomy

```
Toolbar
├── First Row (Main Controls)
│   ├── SearchBar           (search text input, search icon, clear button)
│   ├── ToolbarStats        (item totals / count statistics)
│   └── ToolbarActions      (flex buttons row - stacked on mobile, right-aligned on desktop)
├── Second Row (Filter Options)
│   └── FilterBar           (selectors / dropdown filters container)
└── Third Row (Active States)
    └── ActiveFilters       (list of active chips + "Clear All" link)
        └── FilterChips     (individual filter badge with clear trigger)
```

---

## 3. Component API

### `SearchBar`
Text input with search icon on the right and clear (X) trigger on the left.
- **Props**:
  - `value: string` (Current search query)
  - `onChange: (value: string) => void` (Query change handler)
  - `onClear?: () => void` (Clear button callback trigger)
  - `placeholder?: string` (Default: `"חפש..."`)
  - `loading?: boolean` (When `true`, swaps search icon with a Spinner loader)
  - `disabled?: boolean` (Disabled state for input and clear actions)
  - `leadingIcon?: ReactNode` (Custom leading icon inside input area)
  - `trailingActions?: ReactNode` (Action widgets rendered directly adjacent to the input field)

### `FilterBar`
Flex wrapping container for select dropdowns and filter buttons.
- **Props**:
  - `simpleFilters?: ReactNode` (Slot for quick inline selectors like select boxes)
  - `advancedFilters?: ReactNode` (Slot for collapsible advanced filter panels)
  - `savedFilters?: ReactNode` (Slot for saved view dropdown triggers)
  - `activeFilterCount?: number` (Dynamically renders the active filter count badge)
  - `onResetFilters?: () => void` (Renders reset button and binds click handler)

### `ToolbarActions`
End-aligned flex wrapping container for custom action triggers (e.g. "Add Employee").

### `ToolbarStats`
Typography element for showing current subset totals (e.g. "Showing 25 items").

### `FilterChips`
Individual active filter tag pill showing filter type name, filter value label, and clear icon.
- **Props**:
  - `title: string` (e.g. `"יחידה"`)
  - `label: string` (e.g. `"פלוגה א'"`)
  - `onRemove: () => void`

### `ActiveFilters`
Row listing active `FilterChips` with a "Clear All" button.
- **Props**:
  - `onClearAll?: () => void`

### `Toolbar`
Top-level wrapping vertical stack container.

---

## 4. Usage Examples

### Refined Page Toolbar
```tsx
import {
  Toolbar,
  SearchBar,
  FilterBar,
  ToolbarActions,
  ToolbarStats,
  ActiveFilters,
  FilterChips
} from "@/components/ui/toolbar";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

<Toolbar>
  {/* Row 1: Search, Stats & Actions */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <SearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      onClear={() => setSearchQuery("")}
      loading={isSearching}
      placeholder="חפש עובדים..."
      trailingActions={
        <Button variant="outline" size="sm" onClick={toggleAdvancedFilters}>
          <Filter className="h-4 w-4 ml-1.5" />
          מסננים
        </Button>
      }
    />
    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
      <ToolbarStats>מציג 12 עובדים</ToolbarStats>
      <ToolbarActions>
        <Button variant="primary">הוסף עובד</Button>
      </ToolbarActions>
    </div>
  </div>

  {/* Row 2: Select Filters */}
  <FilterBar
    savedFilters={
      <select className="border rounded px-2 py-1 bg-white text-xs">
        <option>מבטים שמורים</option>
      </select>
    }
    simpleFilters={
      <div className="flex items-center gap-2">
        <select className="border rounded px-3 py-1.5 bg-white text-xs">
          <option>כל היחידות</option>
        </select>
      </div>
    }
    activeFilterCount={activeCount}
    onResetFilters={handleResetAll}
    advancedFilters={
      isAdvancedOpen && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-enterprise-md grid grid-cols-2 gap-4">
          <input type="date" className="border rounded p-1.5 text-xs" />
          <input type="text" placeholder="חיפוש מתקדם..." className="border rounded p-1.5 text-xs" />
        </div>
      )
    }
  />

  {/* Row 3: Active Filter Indicators */}
  <ActiveFilters onClearAll={handleClearAllFilters}>
    {selectedUnit && (
      <FilterChips
        title="יחידה"
        label={selectedUnit}
        onRemove={() => handleRemoveFilter("unit")}
      />
    )}
  </ActiveFilters>
</Toolbar>
```
