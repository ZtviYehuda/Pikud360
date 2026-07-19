import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "./button";
import { Spinner } from "./spinner";
import { cn } from "../../lib/utils";

// ==========================================
// 1. SearchBar Component
// ==========================================
export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "disabled"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  trailingActions?: React.ReactNode;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      className,
      value,
      onChange,
      onClear,
      placeholder = "חפש...",
      loading = false,
      disabled = false,
      leadingIcon,
      trailingActions,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative flex items-center w-full sm:max-w-xs gap-1.5 select-none", className)}>
        <div className="relative w-full">
          {/* Leading Icon / Loading spinner */}
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {loading ? (
              <Spinner size="sm" className="h-4 w-4" />
            ) : (
              leadingIcon || <Search className="h-4 w-4" aria-hidden="true" />
            )}
          </div>

          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full h-enterprise-btn-h-md pr-9 pl-8 rounded-enterprise-md border border-enterprise-border bg-enterprise-surface text-slate-900 dark:text-white text-enterprise-body-sm focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary transition-all placeholder:text-slate-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            {...props}
          />

          {/* Clear search trigger */}
          {value && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute inset-y-0 left-2 px-1 flex items-center text-slate-450 hover:text-slate-700 dark:hover:text-slate-300 transition-colors focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary rounded-enterprise-sm"
              aria-label="נקה חיפוש"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Custom trailing action controls (e.g. submit search button) */}
        {trailingActions && (
          <div className="flex items-center shrink-0">
            {trailingActions}
          </div>
        )}
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

// ==========================================
// 2. FilterBar Component
// ==========================================
export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  simpleFilters?: React.ReactNode;
  advancedFilters?: React.ReactNode;
  savedFilters?: React.ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
}

export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      simpleFilters,
      advancedFilters,
      savedFilters,
      activeFilterCount,
      onResetFilters,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3 w-full select-none", className)}
        {...props}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-enterprise-component-gap w-full">
          {/* Left / Main filter selectors */}
          <div className="flex flex-wrap items-center gap-enterprise-component-gap flex-1">
            {savedFilters && (
              <div className="flex items-center gap-1.5 border-l border-enterprise-border pl-3">
                {savedFilters}
              </div>
            )}
            {simpleFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {simpleFilters}
              </div>
            )}
            {children}
          </div>

          {/* Right actions, reset trigger and count status */}
          <div className="flex items-center gap-3 shrink-0">
            {activeFilterCount !== undefined && activeFilterCount > 0 && (
              <span className="text-enterprise-caption bg-enterprise-primary/10 text-enterprise-primary px-2.5 py-0.5 rounded-full font-bold">
                {activeFilterCount} מסננים פעילים
              </span>
            )}
            {onResetFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="h-8 text-enterprise-caption"
              >
                אפס מסננים
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Advanced filters drawer/section */}
        {advancedFilters && (
          <div className="pt-2 border-t border-enterprise-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
            {advancedFilters}
          </div>
        )}
      </div>
    );
  }
);
FilterBar.displayName = "FilterBar";

// ==========================================
// 3. ToolbarActions Component
// ==========================================
export interface ToolbarActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ToolbarActions = React.forwardRef<HTMLDivElement, ToolbarActionsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-enterprise-component-gap shrink-0 justify-end w-full sm:w-auto select-none",
          className
        )}
        {...props}
      />
    );
  }
);
ToolbarActions.displayName = "ToolbarActions";

// ==========================================
// 4. ToolbarStats Component
// ==========================================
export interface ToolbarStatsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ToolbarStats = React.forwardRef<HTMLDivElement, ToolbarStatsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-enterprise-caption text-slate-500 dark:text-slate-400 font-semibold select-none",
          className
        )}
        {...props}
      />
    );
  }
);
ToolbarStats.displayName = "ToolbarStats";

// ==========================================
// 5. FilterChips Component
// ==========================================
export interface FilterChipsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  label: string;
  onRemove: () => void;
}

export const FilterChips = React.forwardRef<HTMLDivElement, FilterChipsProps>(
  ({ className, title, label, onRemove, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-enterprise-caption select-none border border-slate-200 dark:border-slate-700",
          className
        )}
        {...props}
      >
        <span className="font-bold text-slate-500 dark:text-slate-400">{title}:</span>
        <span>{label}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-enterprise-primary rounded-full transition-colors"
          aria-label={`הסר סינון ${title}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }
);
FilterChips.displayName = "FilterChips";

// ==========================================
// 6. ActiveFilters Component
// ==========================================
export interface ActiveFiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  onClearAll?: () => void;
}

export const ActiveFilters = React.forwardRef<HTMLDivElement, ActiveFiltersProps>(
  ({ className, children, onClearAll, ...props }, ref) => {
    // If no children filters are present, don't render the panel
    if (React.Children.count(children) === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-2 pt-2 border-t border-enterprise-border select-none",
          className
        )}
        {...props}
      >
        <span className="text-enterprise-caption font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
          סינונים פעילים:
        </span>
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {children}
        </div>
        {onClearAll && (
          <Button
            variant="link"
            size="sm"
            onClick={onClearAll}
            className="text-enterprise-caption text-slate-500 hover:text-enterprise-danger dark:hover:text-enterprise-danger h-auto p-0 font-bold"
          >
            נקה הכל
          </Button>
        )}
      </div>
    );
  }
);
ActiveFilters.displayName = "ActiveFilters";

// ==========================================
// 7. Toolbar Component
// ==========================================
export interface ToolbarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-enterprise-component-gap w-full select-none pb-4 border-b border-enterprise-border",
          className
        )}
        {...props}
      />
    );
  }
);
Toolbar.displayName = "Toolbar";
