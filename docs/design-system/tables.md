# tables.md

This document specifies the Enterprise Table System components defined in [data-table.tsx](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/frontend/src/components/ui/data-table.tsx).

---

## 1. Design Principles

- **Enterprise Table Rule**: Desktop and Mobile layouts are different presentations of the exact same data source. They must share the same columns definitions, logic, and actions.
- **Mobile Gutter Constraint**: Do not allow horizontal scrolling. In mobile views, the standard table format is hidden, and rows are rendered as cards (`<Card variant="compact">`) with headers on the right and cell values on the left (RTL support).
- **Separation of Presentation & Business Logic**: The Table System is purely presentational. Sort keys, search hooks, filters, and row action triggers are injected directly through properties.

---

## 2. DataTable Component API

- **Props**:
  ```typescript
  export interface ColumnDef<T> {
    id: string;
    header: React.ReactNode;
    cell: (row: T) => React.ReactNode;
  }

  export interface DataTableProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    columns: ColumnDef<T>[];
    data: T[];
    loading?: boolean;
    emptyState?: React.ReactNode;
    onRowClick?: (row: T) => void;
    density?: "compact" | "standard";
  }
  ```
- **Usage**:
  ```tsx
  import { DataTable, ColumnDef } from "@/components/ui/data-table";

  interface User {
    id: string;
    name: string;
    role: string;
  }

  const columns: ColumnDef<User>[] = [
    { id: "name", header: "שם", cell: (row) => row.name },
    { id: "role", header: "תפקיד", cell: (row) => row.role }
  ];

  <DataTable
    columns={columns}
    data={users}
    density="compact"
    onRowClick={(row) => handleSelect(row)}
  />
  ```

---

## 3. Auxiliary Components

### `TableToolbar`
Top bar container for filters, actions, search inputs.
- **Props**: `search?: { value: string; onChange: (val: string) => void; placeholder?: string }`, `actions?: ReactNode`.

### `TableEmptyState`
Empty state layout wrapper inside tables.

### `TableLoadingState`
Tabular skeleton loader. Composes `<LoadingState variant="table">` skeleton.

### `TablePagination`
Footer pagination triggers.
- **Props**: `currentPage`, `totalPages`, `onPageChange(page)`, `hasNextPage?`, `hasPreviousPage?`.

### `TableRowActions`
Action button alignment container inside row cells.
