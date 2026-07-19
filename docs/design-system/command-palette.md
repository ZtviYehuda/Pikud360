# command-palette.md

This document specifies the Enterprise Command Palette & Global Shortcut System defined in [command.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/command.tsx).

---

## 1. Design Principles

- **Registry Driven**: Actions are not hardcoded inside the command component. Future modules register commands dynamically, making the system extensible.
- **Categorization & Groups**: Grouping is presentational and configured by the consumer via metadata.
- **Unified Layout State**: Accommodates loading indicators and empty search states seamlessly without modal layout shifts.
- **RTL Support**: All labels, category headings, and shortcut symbols align cleanly to support RTL text layout flow.
- **Accessibility Integration**: Focus trapping, keyboard navigation, ESC closures, and Enter validations are handled natively by cmdk and Radix.

---

## 2. Anatomy

```
CommandPalette (Dialog Content)
├── CommandInput            (search input, search icon, immediately focused)
└── CommandList
    ├── Spinner             (when loading=true)
    ├── CommandEmpty        (no results fallback)
    ├── CommandGroup (מועדפים)(pinned actions)
    ├── CommandGroup (פקודות אחרונות) (recent actions)
    └── CommandGroup (Categories)
        └── CommandPaletteItem
            ├── Icon Indicator (optional)
            ├── Title Label
            ├── Secondary Description (optional)
            └── Shortcut Tag (optional)
```

---

## 3. Keyboard Shortcut Registration Hook

The `useKeyboardShortcut` hook provides a centralized registry for custom shortcut key combinations.

```typescript
import { useKeyboardShortcut } from "@/components/ui/command";

// Central registration example
useKeyboardShortcut(["Control", "k"], () => {
  setOpenPalette((prev) => !prev);
});

useKeyboardShortcut(["Control", "Shift", "d"], () => {
  triggerDataExport();
});
```

---

## 4. Component API

### `CommandPalette`
The wrapping Dialog component.
- **Props**:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `actions: CommandPaletteAction[]` (Main actions array)
  - `pinnedActions?: CommandPaletteAction[]` (Favorites/pinned actions list)
  - `recentActions?: CommandPaletteAction[]` (Recently used actions list)
  - `loading?: boolean` (Shows loading state)
  - `placeholder?: string` (Default: `"חפש פקודה..."`)

### `CommandPaletteAction` Schema
```typescript
export interface CommandPaletteAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string; // Shortcut visual indicator (e.g. "Ctrl+P")
  category: string;  // Category grouping label
  keywords?: string[]; // Match keywords for fuzzy searching
  disabled?: boolean;
  hidden?: boolean;
  onSelect: () => void;
}
```

---

## 5. Responsive Breakpoints

- **Desktop** (`≥ md`): Centered floating dialog window (`max-w-[550px]`, `max-h-[80vh]`).
- **Mobile** (`< md`): Full-screen command panel to maximize workspace for virtual keyboard layout and touch targets.

---

## 6. Usage Examples

### Custom Registry Registration
```tsx
import { CommandPalette, CommandPaletteAction } from "@/components/ui/command";
import { Users, Calendar, Settings } from "lucide-react";

const commandRegistry: CommandPaletteAction[] = [
  {
    id: "navigate-employees",
    title: "ניהול עובדים",
    description: "מעבר למסך רשימת העובדים",
    icon: <Users className="h-4 w-4" />,
    category: "ניווט",
    shortcut: "G + E",
    onSelect: () => navigate("/employees")
  },
  {
    id: "schedule-staff",
    title: "שיבוץ כוח אדם",
    description: "ניהול משמרות ושיבוצים יומיים",
    icon: <Calendar className="h-4 w-4" />,
    category: "תזמון",
    shortcut: "G + S",
    onSelect: () => openSchedulingDrawer()
  },
  {
    id: "system-settings",
    title: "הגדרות מערכת",
    icon: <Settings className="h-4 w-4" />,
    category: "ניהול",
    disabled: !isManager, // Permissions ready
    onSelect: () => navigate("/settings")
  }
];

<CommandPalette
  open={isOpen}
  onOpenChange={setIsOpen}
  actions={commandRegistry}
  pinnedActions={commandRegistry.filter(c => c.id === "schedule-staff")}
  recentActions={recentCommandsList}
/>
```
