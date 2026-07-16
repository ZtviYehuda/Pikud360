# drawers.md

This document specifies the Enterprise Drawer System components defined in [drawer.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/drawer.tsx).

---

## 1. Design Principles

- **The One-Minute Rule**: Any action that takes less than one minute to complete must open in a Drawer. Complex multi-step processes get a full page.
- **Single Adaptive Implementation**: One component — zero duplicated Desktop vs. Mobile versions. Responsive Tailwind `md:` prefixes automatically switch the layout.
- **Pure Presentation**: Drawers contain no business logic. Forms, workflows and content are injected via `children`.
- **Native Accessibility**: Built on Radix UI `@radix-ui/react-dialog` — focus trapping, ESC close, and focus restoration are provided automatically.

---

## 2. Responsive Behavior

| Viewport | Presentation | Entry Direction |
|---|---|---|
| **Mobile** (`< md`) | Bottom Sheet · rounded top · `max-h-[85vh]` | Slides from bottom |
| **Desktop** (`≥ md`) | Right-side Panel · `w-[480px]` · full height | Slides from right |

No separate component or conditional rendering needed. The same `<DrawerContent>` adapts automatically.

---

## 3. Component API

### `<Drawer>`
Root context wrapper. Controls open/close state.

```tsx
<Drawer open={open} onOpenChange={setOpen}>
  <DrawerTrigger asChild>
    <Button>פתח</Button>
  </DrawerTrigger>
  <DrawerContent title="שם הפעולה" description="תיאור קצר">
    {/* body */}
    <DrawerFooter>
      <DrawerActions>
        <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
        <Button variant="primary" onClick={handleSave}>שמור</Button>
      </DrawerActions>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

### `<DrawerContent>`
Adaptive panel shell. Accepts `title` and `description` for accessible labeling.

| Prop | Type | Description |
|---|---|---|
| `title` | `ReactNode` | Optional — rendered as accessible `<DialogPrimitive.Title>` |
| `description` | `ReactNode` | Optional — rendered as accessible `<DialogPrimitive.Description>` |
| `children` | `ReactNode` | Scrollable content area |

### `<DrawerHeader>`
Optional semantic block for a header section within the scrollable body.

### `<DrawerFooter>`
Sticky footer pinned below the scrollable body. Use for action buttons.

### `<DrawerActions>`
Row of action buttons inside `<DrawerFooter>`. Composes `ActionGroup` with end alignment.

### `<DrawerClose>`
Programmatic close button primitive (also available as the `×` icon built into `DrawerContent`).

---

## 4. Accessibility

All accessibility is managed by Radix UI `@radix-ui/react-dialog`:

- **Focus trap** — keyboard focus is contained within the open drawer.
- **ESC to close** — pressing Escape dismisses the drawer.
- **Focus restoration** — focus returns to the trigger element after closing.
- **ARIA roles** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` and `aria-describedby` applied automatically when `title`/`description` are provided.
- **Screen readers** — title and description are read aloud when the drawer opens.

---

## 5. Usage Examples

### Edit Employee
```tsx
<Drawer open={isEditing} onOpenChange={setIsEditing}>
  <DrawerContent
    title="עריכת עובד"
    description="ערוך את פרטי העובד הנבחר"
  >
    <EmployeeForm employee={selected} />
    <DrawerFooter>
      <DrawerActions>
        <Button variant="outline" onClick={() => setIsEditing(false)}>ביטול</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>שמור שינויים</Button>
      </DrawerActions>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

### Resolve Alert
```tsx
<Drawer open={isResolving} onOpenChange={setIsResolving}>
  <DrawerContent
    title="טיפול בהתראה"
    description="פרטי ההתראה הנוכחית"
  >
    <AlertDetails alert={alert} />
    <DrawerFooter>
      <DrawerActions>
        <Button variant="outline">דחה</Button>
        <Button variant="danger" onClick={handleResolve}>סמן כטופל</Button>
      </DrawerActions>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```
