# dialogs.md

This document specifies the Enterprise Modal & Dialog System components defined in [dialog.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/dialog.tsx).

---

## 1. Design Principles

- **Pure Presentation**: Dialog wrappers and helpers manage layout and accessibility only. Confirmation, alert, or delete logic is supplied exclusively by the consuming screen.
- **Visual Sizing Hierarchy**: Uses size presets rather than arbitrary viewport values to match system layout grids.
- **Sticky Actions**: Footers remain locked at the bottom area while the dialog body scrolls internally, keeping confirmations accessible.
- **Accessibility Compliance**: Built on Radix UI, preserving native key navigation, focus traps, aria attributes, and focus restoration.

---

## 2. Anatomy

```
Dialog Content
├── Close Icon Button     (left-aligned for RTL support)
├── Dialog Header
│   ├── Icon Indicator    (optional)
│   ├── Dialog Title      (accessible name)
│   └── Dialog Description(supporting description)
├── Scrollable Body       (independently scrollable)
│   └── [Loading Indicator when loading=true]
└── Sticky Footer Slot    (pinned bottom wrapper)
    └── DialogActions
        ├── Cancel Button
        └── Action Button
```

---

## 3. Sizes & Breakpoints

| Size Preset | Max Width on Desktop | Mobile Presentation |
|---|---|---|
| `sm` | `sm:max-w-sm` | Centered modal with safe margins |
| `md` | `sm:max-w-md` | Centered modal with safe margins |
| `lg` | `sm:max-w-lg` | Centered modal with safe margins |
| `xl` | `sm:max-w-xl` | Centered modal with safe margins |

---

## 4. Component API

### `DialogContent`
The customized layout container wrapper.
- **Props**:
  - `title?: ReactNode` (accessible label)
  - `description?: ReactNode` (accessible description)
  - `icon?: ReactNode` (optional header icon)
  - `footer?: ReactNode` (sticky footer actions)
  - `loading?: boolean` (shows centered spinner)
  - `size?: "sm" | "md" | "lg" | "xl"` (default: `"md"`)

### `DialogActions`
Puts buttons side-by-side with wrapping behaviors.

---

## 5. Wrapper Components

To simplify common workflows, three preconfigured stateless dialog types are available:

### `ConfirmationDialog`
Prompt for confirmations.
- **Props**:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `title: ReactNode`
  - `description: ReactNode`
  - `onConfirm: () => void | Promise<void>`
  - `confirmLabel?: string`
  - `cancelLabel?: string`
  - `loading?: boolean`
  - `variant?: "primary" | "danger" | "warning" | "success" | "info"`

### `AlertDialog`
Informational warning or success alerts.
- **Props**:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `title: ReactNode`
  - `description: ReactNode`
  - `onClose?: () => void`
  - `closeLabel?: string`
  - `variant?: "info" | "warning" | "success" | "danger"`

### `DeleteDialog`
Pre-styled destructive delete confirmation dialog.
- **Props**:
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `itemName?: string` (dynamically builds warning description)
  - `onDelete: () => void | Promise<void>`
  - `loading?: boolean`

---

## 6. Usage Examples

### Delete Item
```tsx
import { DeleteDialog } from "@/components/ui/dialog";

<DeleteDialog
  open={showDeleteModal}
  onOpenChange={setShowDeleteModal}
  itemName="חייל ישראל ישראלי"
  onDelete={handleConfirmDelete}
  loading={isDeleting}
/>
```

### Confirmation Warning
```tsx
import { ConfirmationDialog } from "@/components/ui/dialog";

<ConfirmationDialog
  open={showConfirmModal}
  onOpenChange={setShowConfirmModal}
  title="שינוי שיבוץ יחידה"
  description="האם ברצונך להעביר את החייל ליחידה החדשה? פעולה זו תעדכן את כל מערכות הדיווח."
  variant="warning"
  onConfirm={handleUnitTransfer}
/>
```
