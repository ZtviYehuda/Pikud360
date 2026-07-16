import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./table";
import { Card } from "./card";
import { Button } from "./button";
import { EmptyState, LoadingState, EmptyStateProps } from "./states";
import { cn } from "../../lib/utils";

// ==========================================
// 1. Column Definition Type
// ==========================================
export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
}

// ==========================================
// 2. TableLoadingState Component
// ==========================================
export const TableLoadingState: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <LoadingState variant="table" rows={rows} />
);

// ==========================================
// 3. TableEmptyState Component
// ==========================================
export const TableEmptyState: React.FC<EmptyStateProps> = (props) => (
  <EmptyState
    {...props}
    className={cn("border-0 shadow-none bg-transparent my-6", props.className)}
  />
);

// ==========================================
// 4. DataTable Component
// ==========================================
export interface DataTableProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  density?: "compact" | "standard";
}

export function DataTable<T>({
  className,
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  density = "standard",
  ...props
}: DataTableProps<T>) {
  if (loading) {
    return <TableLoadingState />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        {emptyState || (
          <TableEmptyState
            title="אין נתונים להצגה"
            description="לא נמצאו רשומות תואמות"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      {/* Mobile view: sequence of cards */}
      <div className="block md:hidden w-full space-y-3">
        {data.map((row, rowIdx) => (
          <Card
            key={rowIdx}
            variant="compact"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "p-4 space-y-2.5",
              onRowClick && "cursor-pointer hover:border-enterprise-primary/30"
            )}
          >
            {columns.map((col) => (
              <div
                key={col.id}
                className="flex items-center justify-between border-b border-enterprise-border/40 pb-2 last:border-0 last:pb-0 gap-4"
              >
                <span className="text-enterprise-overline text-slate-400 font-bold uppercase shrink-0">
                  {col.header}
                </span>
                <span className="text-enterprise-body-sm text-slate-800 dark:text-slate-200 text-left">
                  {col.cell(row)}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Desktop/Tablet view: standard Table */}
      <div className="hidden md:block w-full overflow-hidden border border-enterprise-border rounded-enterprise-lg bg-enterprise-surface shadow-enterprise-flat">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.id} className="text-enterprise-table-header text-slate-500">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIdx) => (
              <TableRow
                key={rowIdx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && "cursor-pointer transition-colors"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      density === "compact" ? "py-2 px-3" : "py-3.5 px-4",
                      "text-enterprise-body-sm"
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ==========================================
// 5. TableToolbar Component
// ==========================================
export interface TableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  actions?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  className,
  search,
  actions,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-enterprise-component-gap w-full pb-4 border-b border-enterprise-border select-none",
        className
      )}
      {...props}
    >
      {search && (
        <input
          type="text"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder || "חפש..."}
          className="w-full sm:max-w-xs h-enterprise-btn-h-md px-3 rounded-enterprise-md border border-enterprise-border bg-enterprise-surface text-enterprise-neutral text-enterprise-body-sm focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary"
        />
      )}
      {actions && (
        <div className="flex items-center gap-enterprise-component-gap w-full sm:w-auto shrink-0 justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};
TableToolbar.displayName = "TableToolbar";

// ==========================================
// 6. TablePagination Component
// ==========================================
export interface TablePaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  className,
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage = currentPage < totalPages,
  hasPreviousPage = currentPage > 1,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-4 border-t border-enterprise-border select-none w-full",
        className
      )}
      {...props}
    >
      <span className="text-enterprise-caption text-slate-500 dark:text-slate-400 font-weight-enterprise-bold">
        עמוד {currentPage} מתוך {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          הקודם
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          הבא
        </Button>
      </div>
    </div>
  );
};
TablePagination.displayName = "TablePagination";

// ==========================================
// 7. TableRowActions Component
// ==========================================
export interface TableRowActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TableRowActions: React.FC<TableRowActionsProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex items-center justify-end gap-1.5", className)}
    {...props}
  />
);
TableRowActions.displayName = "TableRowActions";
