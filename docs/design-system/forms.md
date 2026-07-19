# forms.md

This document specifies the Enterprise Form System primitives defined in [form-primitives.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/form-primitives.tsx).

---

## 1. Design Principles

- **Pure Presentation**: Form components define layout only. No validation logic, schemas, or business rules live here — those are injected by the consumer.
- **Standardized Spacing**: All field gaps, label margins, and hint/error placement are defined once and reused everywhere.
- **Responsive by Default**: Fields stack vertically on mobile. `FormRow` expands to multiple columns on larger viewports automatically.
- **Accessible by Construction**: `FormFieldGroup` wires `htmlFor`, `aria-describedby`, and `aria-invalid` automatically.

---

## 2. Form Anatomy

```
<form>
  └── FormSection  (logical group of fields)
      ├── Section title + description
      ├── FormRow  (responsive grid)
      │   ├── FormFieldGroup  (label + field + hint/error)
      │   │   ├── FormLabel   (with optional RequiredIndicator)
      │   │   ├── <Input />   (or Select, Textarea, etc.)
      │   │   ├── FormHint    (helper text — shown when no error)
      │   │   └── FormErrorMessage  (validation error — hides hint)
      │   └── FormFieldGroup  …
      ├── FormDivider  (visual separator)
      └── FormRow  …
  └── FormActions  (submit / cancel buttons)
```

---

## 3. Component API

### `<FormSection>`
Logical grouping of related fields with optional title and description.

| Prop | Type | Description |
|---|---|---|
| `title` | `ReactNode` | Section heading |
| `description` | `ReactNode` | Supporting text |

### `<FormRow>`
Responsive grid row. Children are stacked on mobile and placed side-by-side on larger viewports.

| Prop | Type | Default | Description |
|---|---|---|---|
| `cols` | `1 \| 2 \| 3 \| 4` | `1` | Number of columns on desktop |

| `cols` | Mobile | `sm` | `lg` |
|---|---|---|---|
| `1` | 1 col | 1 col | 1 col |
| `2` | 1 col | 2 cols | 2 cols |
| `3` | 1 col | 2 cols | 3 cols |
| `4` | 1 col | 2 cols | 4 cols |

### `<FormFieldGroup>`
Composed field wrapper. Automatically wires label association and ARIA attributes.

| Prop | Type | Description |
|---|---|---|
| `label` | `ReactNode` | Field label text |
| `htmlFor` | `string` | Links label to field `id` |
| `required` | `boolean` | Appends `RequiredIndicator` to label |
| `hint` | `ReactNode` | Helper text (hidden when `error` is set) |
| `error` | `ReactNode` | Validation error — triggers `aria-invalid` and `role="alert"` |

### `<FormLabel>`
Standard label element. Use `required` to append the `RequiredIndicator`.

### `<RequiredIndicator>`
Accessible asterisk marker. `aria-hidden="true"` with sr-only text "שדה חובה".

### `<FormHint>`
Helper text below a field. Wire with `id` + `aria-describedby` for screen reader support.

### `<FormErrorMessage>`
Validation error message. Uses `role="alert"` and `aria-live="polite"` for immediate announcement.

### `<FormDivider>`
Visual separator with optional label text.

| Prop | Type | Description |
|---|---|---|
| `label` | `ReactNode` | Optional centered label |

### `<FormActions>`
Action row for submit/cancel buttons. Mobile: full-width vertical stack. Desktop: horizontal right-aligned row.

---

## 4. Accessibility

| Concern | Implementation |
|---|---|
| Label association | `htmlFor` on `FormLabel` links to field `id` |
| Error announcement | `role="alert"` + `aria-live="polite"` on `FormErrorMessage` |
| Error state | `aria-invalid="true"` injected onto field when error present |
| Helper text | `aria-describedby` injected onto field pointing to hint/error `id` |
| Required fields | `RequiredIndicator` with `aria-hidden + sr-only` text |
| Touch targets | `Input` min-height of 36px (9 Tailwind units) — use `h-10` (40px) for larger targets |

---

## 5. Usage Examples

### Single-Section Form (in a Drawer)
```tsx
import {
  FormSection, FormRow, FormFieldGroup,
  FormActions, FormDivider
} from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

<form onSubmit={handleSubmit}>
  <FormSection title="פרטים אישיים" description="הזן את פרטי העובד">
    <FormRow cols={2}>
      <FormFieldGroup label="שם פרטי" htmlFor="first-name" required>
        <Input id="first-name" placeholder="ישראל" />
      </FormFieldGroup>
      <FormFieldGroup label="שם משפחה" htmlFor="last-name" required>
        <Input id="last-name" placeholder="ישראלי" />
      </FormFieldGroup>
    </FormRow>

    <FormRow>
      <FormFieldGroup
        label="מספר אישי"
        htmlFor="personal-id"
        required
        hint="7 ספרות"
        error={errors.personalId}
      >
        <Input id="personal-id" />
      </FormFieldGroup>
    </FormRow>
  </FormSection>

  <FormDivider label="פרטי שיבוץ" className="my-2" />

  <FormSection>
    <FormRow cols={2}>
      <FormFieldGroup label="יחידה" htmlFor="unit" required>
        <Input id="unit" />
      </FormFieldGroup>
      <FormFieldGroup label="תפקיד" htmlFor="role" required>
        <Input id="role" />
      </FormFieldGroup>
    </FormRow>
  </FormSection>

  <FormActions className="mt-6">
    <Button variant="outline" type="button">ביטול</Button>
    <Button variant="primary" type="submit" loading={submitting}>שמור</Button>
  </FormActions>
</form>
```

### Field with Error State
```tsx
<FormFieldGroup
  label="דוא״ל"
  htmlFor="email"
  required
  hint="לדוגמה: name@idf.il"
  error="כתובת דוא״ל אינה תקינה"
>
  <Input id="email" type="email" />
</FormFieldGroup>
```
