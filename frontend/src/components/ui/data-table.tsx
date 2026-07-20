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
import { 
  Search, ArrowUpDown, Eye, Download, 
  ChevronRight, ChevronLeft, CheckSquare, Square
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "./dropdown-menu";

// ==========================================
// 1. Column Definition Type
// ==========================================
export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
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
// 4. DataTable Component (Legacy Backwards Compatibility)
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
      {/* Mobile view */}
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

      {/* Desktop/Tablet view */}
      <div className="hidden md:block w-full overflow-hidden border border-enterprise-border rounded-enterprise-lg bg-enterprise-surface shadow-enterprise-flat">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.id} className="text-enterprise-table-header text-slate-500 text-right">
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
                      "text-enterprise-body-sm text-right"
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
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || "חפש..."}
            className="w-full h-enterprise-btn-h-md pr-9 pl-3 rounded-enterprise-md border border-enterprise-border bg-enterprise-surface text-enterprise-neutral text-enterprise-body-sm focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
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
          className="flex items-center gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          הקודם
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-1"
        >
          הבא
          <ChevronLeft className="h-4 w-4" />
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

// ==========================================
// 8. Reusable EnterpriseTable Component (V3)
// ==========================================
export interface EnterpriseTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (val: string) => void;
  selectedRows?: string[];
  onSelectedRowsChange?: (rows: string[]) => void;
  rowIdKey?: keyof T;
  sortColumn?: string;
  onSortColumnChange?: (col: string) => void;
  sortDirection?: "asc" | "desc";
  onSortDirectionChange?: (dir: "asc" | "desc") => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onExport?: () => void;
  density?: "compact" | "standard";
  toolbarActions?: React.ReactNode;
}

export function EnterpriseTable<T>({
  columns,
  data,
  loading = false,
  searchQuery = "",
  onSearchQueryChange,
  selectedRows = [],
  onSelectedRowsChange,
  rowIdKey,
  sortColumn,
  onSortColumnChange,
  sortDirection = "asc",
  onSortDirectionChange,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onExport,
  density = "standard",
  toolbarActions,
}: EnterpriseTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(() =>
    columns.map((c) => c.id)
  );

  const activeColumns = columns.filter((c) => visibleColumns.includes(c.id));

  // Handles select all toggle action
  const handleToggleAll = () => {
    if (!onSelectedRowsChange || !rowIdKey) return;
    if (selectedRows.length === data.length) {
      onSelectedRowsChange([]);
    } else {
      const allIds = data.map((item) => String(item[rowIdKey]));
      onSelectedRowsChange(allIds);
    }
  };

  const handleToggleRow = (id: string) => {
    if (!onSelectedRowsChange) return;
    if (selectedRows.includes(id)) {
      onSelectedRowsChange(selectedRows.filter((r) => r !== id));
    } else {
      onSelectedRowsChange([...selectedRows, id]);
    }
  };

  const handleSort = (colId: string, sortable?: boolean) => {
    if (!sortable || !onSortColumnChange || !onSortDirectionChange) return;
    if (sortColumn === colId) {
      onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortColumnChange(colId);
      onSortDirectionChange("asc");
    }
  };

  if (loading) {
    return <TableLoadingState />;
  }

  return (
    <div className="w-full space-y-4 text-right select-none">
      
      {/* Search & Custom Toolbar Actions block */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          {onSearchQueryChange && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="חיפוש מהיר ברשומות..."
                className="w-64 h-9 pr-9 pl-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-cyan-500/40"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}
          
          {/* Column Visibility Selector dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Eye className="h-4 w-4" />
                <span>עמודות</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-lg">
              {columns.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => {
                    if (visibleColumns.includes(col.id)) {
                      if (visibleColumns.length > 1) {
                        setVisibleColumns(visibleColumns.filter((c) => c !== col.id));
                      }
                    } else {
                      setVisibleColumns([...visibleColumns, col.id]);
                    }
                  }}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <span>{col.header}</span>
                  {visibleColumns.includes(col.id) ? (
                    <CheckSquare className="h-4 w-4 text-cyan-600 shrink-0 ml-2" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300 dark:text-slate-700 shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          {toolbarActions}
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <Download className="h-4 w-4" />
              <span>יצוא לקובץ</span>
            </Button>
          )}
        </div>
      </div>

      {/* Renders mobile card views */}
      <div className="block md:hidden w-full space-y-3">
        {data.map((row, rowIdx) => (
          <Card key={rowIdx} variant="compact" className="p-4 space-y-2.5">
            {activeColumns.map((col) => (
              <div key={col.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2 last:border-0 last:pb-0 gap-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                  {col.header}
                </span>
                <span className="text-xs text-slate-800 dark:text-slate-200 text-left font-semibold">
                  {col.cell(row)}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Renders desktop tables */}
      <div className="hidden md:block w-full overflow-hidden border border-slate-200/60 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-200/60 dark:border-slate-800/80">
              {rowIdKey && onSelectedRowsChange && (
                <TableHead className="w-10 px-4 text-right">
                  <button onClick={handleToggleAll} className="focus:outline-hidden">
                    {selectedRows.length === data.length ? (
                      <CheckSquare className="h-4.5 w-4.5 text-cyan-600 cursor-pointer" />
                    ) : (
                      <Square className="h-4.5 w-4.5 text-slate-300 dark:text-slate-700 cursor-pointer" />
                    )}
                  </button>
                </TableHead>
              )}
              {activeColumns.map((col) => (
                <TableHead
                  key={col.id}
                  onClick={() => handleSort(col.id, col.sortable)}
                  className={cn(
                    "text-xs font-bold text-slate-500 py-3.5 px-4 text-right",
                    col.sortable && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/50 select-none"
                  )}
                >
                  <div className="flex items-center gap-1.5 justify-start">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        sortColumn === col.id ? "text-cyan-600" : "text-slate-350"
                      )} />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length + (rowIdKey ? 1 : 0)} className="text-center py-8 text-xs text-slate-400 dark:text-slate-600 font-semibold">
                  אין נתונים תואמים
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => {
                const rowId = rowIdKey ? String(row[rowIdKey]) : "";
                const isSelected = selectedRows.includes(rowId);
                
                return (
                  <TableRow
                    key={rowIdx}
                    className={cn(
                      "border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors",
                      isSelected && "bg-cyan-500/5 dark:bg-cyan-500/10"
                    )}
                  >
                    {rowIdKey && onSelectedRowsChange && (
                      <TableCell className="w-10 px-4 text-right">
                        <button onClick={() => handleToggleRow(rowId)} className="focus:outline-hidden">
                          {isSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-cyan-600 cursor-pointer" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-slate-300 dark:text-slate-700 cursor-pointer" />
                          )}
                        </button>
                      </TableCell>
                    )}
                    {activeColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(
                          density === "compact" ? "py-2 px-4" : "py-3.5 px-4",
                          "text-xs font-semibold text-slate-700 dark:text-slate-300 text-right"
                        )}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paging controls block */}
      {onPageChange && totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
