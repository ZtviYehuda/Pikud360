# Data Table Component Specification

**Code Location:** `frontend/src/components/ui/data-table.tsx`  
**Spec Status:** ✅ Built & Verified  

---

## 1. Purpose
The `DataTable` component presents tabular operational records with sorting, filtering, selection, density toggle, responsive mobile stack view, empty state handling, and skeleton loading support.

---

## 2. Props Signatures

```typescript
export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  density?: "compact" | "standard";
}
```

---

## 3. Usage Example

```tsx
import { DataTable, ColumnDef } from "@/components/ui/data-table";

interface Employee {
  id: string;
  name: string;
  role: string;
}

const columns: ColumnDef<Employee>[] = [
  { id: "id", header: "מס' אישי", cell: (r) => r.id },
  { id: "name", header: "שם מלא", cell: (r) => r.name },
  { id: "role", header: "תפקיד", cell: (r) => r.role },
];

export function RosterTable({ employees }: { employees: Employee[] }) {
  return <DataTable columns={columns} data={employees} density="standard" />;
}
```

---

## 4. Key Features & Responsive Modes
- **Desktop (≥ md):** Full tabular layout with sticky/styled headers and density selection (`compact` vs `standard`).
- **Mobile (< md):** Automatically converts table rows into mobile cards with key-value pairs to prevent horizontal scrolling.

---

## 5. Accessibility & RTL
- Table uses native HTML `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` for full screen reader accessibility.
- Header and cell text aligned to `text-right` for Hebrew presentation.
