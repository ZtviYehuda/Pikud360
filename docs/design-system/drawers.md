# drawers.md

This document specifies the Enterprise Drawer System components defined in [drawer.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/drawer.tsx).

---

## 1. Design Principles

- **The One-Minute Rule**: Any action that takes less than one minute must open in a Drawer. Complex multi-step processes receive a full page.
- **Single Adaptive Implementation**: One component — zero duplicated Desktop vs. Mobile implementations. Responsive Tailwind `md:` breakpoint overrides handle the layout switch automatically.
- **Guaranteed Sticky Footer**: Primary and secondary actions are always accessible via the `footer` prop slot, which renders outside the scroll area regardless of content length.
- **Pure Presentation**: Drawers contain no business logic. Forms, workflows, and content are injected through `children` and `footer` props.
- **Native Accessibility**: Built on `@radix-ui/react-dialog` — focus trapping, ESC close, focus restoration, and ARIA roles are provided automatically.

---

## 2. Anatomy

```
DrawerContent
├── Drag Handle          (mobile only, decorative)
├── Panel Header
│   ├── Title            (DialogPrimitive.Title — accessible)
│   ├── Description      (DialogPrimitive.Description — accessible)
│   └── Close Button     (always visible)
├── Scrollable Body      ← children render here
│   └── [loading skeleton when loading=true]
└── Sticky Footer        ← footer prop renders here
    └── DrawerFooter
        └── DrawerActions
            ├── Secondary Button
            └── Primary Button
```

---

## 3. Responsive Behavior

| Viewport | Presentation | Entry Animation |
|---|---|---|
| **Mobile** (`< md`) | Bottom Sheet · rounded top · `max-h` bound by size preset | Slides from bottom |
| **Tablet / Desktop** (`≥ md`) | Right-side Panel · full height · `w` bound by size preset | Slides from right |

No conditional rendering. The same `<DrawerContent>` adapts automatically via responsive Tailwind classes.

---

## 4. Size Presets

| Preset | Mobile max-height | Desktop width |
|---|---|---|
| `sm` | 55vh | 340px |
| `md` *(default)* | 75vh | 480px |
| `lg` | 85vh | 600px |
| `xl` | 92vh | 720px |
| `full` | 100vh | 100vw |

Avoid arbitrary widths. Use only the defined presets.

---

## 5. Component API

### `<Drawer>`
Root context wrapper. Controls open/close state.

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | Radix open change handler |
| `onOpen` | `() => void` | Lifecycle callback — called when drawer opens |
| `onClose` | `() => void` | Lifecycle callback — called when drawer closes |

### `<DrawerContent>`
Adaptive panel shell. The main primitive.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — | Panel title (accessible) |
| `description` | `ReactNode` | — | Panel subtitle (accessible) |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | Size preset |
| `loading` | `boolean` | `false` | Shows loading skeleton instead of children |
| `footer` | `ReactNode` | — | Sticky footer slot (use `<DrawerFooter>`) |
| `children` | `ReactNode` | — | Scrollable body content |

### `<DrawerHeader>`
Optional semantic section header inside the **scrollable body**. Use for sub-section titles, entity names, etc.

### `<DrawerTitle>` / `<DrawerDescription>`
Standalone accessible title/description wrappers for use inside `<DrawerHeader>` (in-body sections). The panel-level title/description should use the props on `<DrawerContent>`.

### `<DrawerFooter>`
Wrapper for use inside the `footer` slot of `<DrawerContent>`. Provides visual grouping for actions.

### `<DrawerActions>`
Right-aligned action row. Place inside `<DrawerFooter>`. Primary action goes last (rightmost on desktop, bottommost stack on mobile).

### `<DrawerClose>`
Programmatic close button primitive. Wrap any element with this to make it close the drawer.

---

## 6. Accessibility

All accessibility is managed natively by `@radix-ui/react-dialog`:

| Concern | Implementation |
|---|---|
| **Focus trap** | Keyboard focus is contained within the open drawer |
| **ESC to close** | Pressing Escape dismisses the drawer automatically |
| **Focus restoration** | Focus returns to the trigger element after closing |
| **ARIA roles** | `role="dialog"`, `aria-modal="true"` applied automatically |
| **Labeling** | `aria-labelledby` / `aria-describedby` linked when `title`/`description` are provided |
| **Loading state** | `aria-busy="true"` applied to the scroll body during `loading` |
| **Close button** | `aria-label="סגור"` always present |
| **Visible focus** | `focus:ring-2 focus:ring-blue-500` on close button |

---

## 7. Usage Examples

### Standard Edit Drawer
```tsx
import { Drawer, DrawerContent, DrawerFooter, DrawerActions } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

<Drawer open={isOpen} onOpenChange={setIsOpen} onClose={resetForm}>
  <DrawerContent
    title="עריכת עובד"
    description="ערוך את פרטי העובד הנבחר"
    size="md"
    footer={
      <DrawerFooter>
        <DrawerActions>
          <Button variant="outline" onClick={() => setIsOpen(false)}>ביטול</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>שמור שינויים</Button>
        </DrawerActions>
      </DrawerFooter>
    }
  >
    <EmployeeForm employee={selected} />
  </DrawerContent>
</Drawer>
```

### Loading State
```tsx
<DrawerContent
  title="שיבוץ עובד"
  size="lg"
  loading={isLoadingEmployee}
  footer={
    <DrawerFooter>
      <DrawerActions>
        <Button variant="primary" disabled={isLoadingEmployee}>אשר שיבוץ</Button>
      </DrawerActions>
    </DrawerFooter>
  }
>
  <AssignmentForm />
</DrawerContent>
```

### Trigger via Button
```tsx
<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">
      <Eye className="h-4 w-4 ml-2" />
      פרטי עובד
    </Button>
  </DrawerTrigger>
  <DrawerContent title="פרטי עובד" size="sm">
    <EmployeeDetails id={employeeId} />
  </DrawerContent>
</Drawer>
```

### Large Drawer with Section Headers
```tsx
<DrawerContent title="העברת עובד" size="lg" footer={<DrawerFooter><DrawerActions>...</DrawerActions></DrawerFooter>}>
  <DrawerHeader>
    <p className="text-sm font-semibold text-slate-900">פרטי העובד</p>
  </DrawerHeader>
  <EmployeeDetailsSection />

  <DrawerHeader className="mt-6">
    <p className="text-sm font-semibold text-slate-900">יחידה מבקשת</p>
  </DrawerHeader>
  <UnitSelector />
</DrawerContent>
```
