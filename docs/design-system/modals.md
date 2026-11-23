# Reusable Modal System (`AppModal`)

The `AppModal` component family provides an enterprise-grade, accessible, and visual consistency wrapper for all dialogs and modals in the application.

---

## 1. Architecture & Principles

- **Single Shell Architecture**: Every workflow modal shares identical outer geometry:
  - Presets for max width (`size="lg"` as default golden standard `sm:max-w-2xl sm:w-[95vw]`).
  - Standardized border radius (`sm:rounded-3xl rounded-t-[2.2rem] rounded-b-none`).
  - Standardized elevation (`shadow-2xl`), border styling, and backdrop blur.
- **RTL-Native Layout**: Close button anchored to the top-left, title and icon badge aligned to the top-right.
- **Composable Subcomponents**:
  - `AppModal`: Root dialog controller.
  - `AppModalContent`: Dialog surface with size variants.
  - `AppModalHeader`: Unified header with icon container, title, subtitle, badges, and sub-toolbars.
  - `AppModalBody`: Scrollable body area with custom scrollbars.
  - `AppModalFooter`: Standardized footer for actions and secondary buttons.

---

## 2. API & CVA Variants

### `AppModalContent`
```tsx
<AppModalContent size="sm" | "md" | "lg" | "xl" | "full">
```
- `sm`: `sm:max-w-md` (Confirmations, quick prompts)
- `md`: `sm:max-w-lg` (Forms, filter drawers)
- `lg`: `sm:max-w-2xl sm:w-[95vw]` (Standard workflows: Report Hub, Unit Event, WhatsApp Broadcast)
- `xl`: `sm:max-w-4xl sm:w-[95vw]` (Data-dense tables and wide workflows)
- `full`: `sm:max-w-6xl sm:w-[96vw]` (Wide previews and AI generators)

### `AppModalHeader`
```tsx
<AppModalHeader
  icon={Calendar}
  iconVariant="primary" | "blue" | "green" | "emerald" | "amber" | "purple" | "rose"
  title="הוספת אירוע יחידה"
  subtitle="קביעת יום מחלקה, מדור או חוליה"
  badge={...}
  toolbar={...}
  action={...}
  onBack={...}
/>
```

---

## 3. Standard Usage Example

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <AppModalContent size="lg">
    <AppModalHeader
      icon={FileText}
      iconVariant="blue"
      title="מרכז הפקת דוחות"
      subtitle="הפקה ושיתוף נתונים מבצעיים"
    />
    <AppModalBody>
      {/* Content */}
    </AppModalBody>
    <AppModalFooter>
      <Button variant="outline" onClick={onClose}>ביטול</Button>
      <Button onClick={onSave}>שמור</Button>
    </AppModalFooter>
  </AppModalContent>
</Dialog>
```
