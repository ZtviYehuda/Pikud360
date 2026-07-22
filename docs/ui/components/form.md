# Form Components Specification

**Code Location:** `frontend/src/components/ui/form-helper.tsx`, `frontend/src/components/ui/form-primitives.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
Form helper primitives (`EnterpriseInput`, `EnterpriseSelect`, `EnterpriseTextarea`, `FormSection`, `FormRow`, `FormGrid`) provide a complete unified form layout system with label, helper text, error indicator, and section hierarchy.

---

## 2. Component Primitives

| Primitive | Purpose |
|---|---|
| `EnterpriseInput` | Text, number, password input with integrated label & error |
| `EnterpriseSelect` | Dropdown selector with options array |
| `EnterpriseTextarea` | Multi-line text field |
| `FormSection` | Grouping container with section title & description |
| `FormRow` | Flex container for inline controls |
| `FormGrid` | 1/2/3/4 column responsive form layout grid |

---

## 3. Usage Example

```tsx
import { FormSection, FormGrid, EnterpriseInput, EnterpriseSelect } from "@/components/ui/form-helper";

export function UserRegistrationForm() {
  return (
    <FormSection title="פרטים אישיים" description="הזן את פרטי החייל במערכת">
      <FormGrid cols={2}>
        <EnterpriseInput label="שם פרטי" required />
        <EnterpriseInput label="שם משפחה" required />
        <EnterpriseSelect 
          label="דרגה" 
          options={[
            { value: "sdt", label: "טוראי" },
            { value: "cpl", label: "רב\"ט" },
            { value: "sgt", label: "סמל" }
          ]} 
        />
      </FormGrid>
    </FormSection>
  );
}
```
