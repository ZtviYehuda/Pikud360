import * as React from "react";
import { cn } from "../../lib/utils";

// ==========================================
// 1. PageLayout (Main Component Wrapper)
// ==========================================
export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "constrained" | "wide" | "fluid";
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ className, mode = "fluid", children, ...props }, ref) => {
    const modeClasses = {
      constrained: "max-w-4xl mx-auto w-full",
      wide: "max-w-7xl mx-auto w-full",
      fluid: "w-full",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "px-4 md:px-6 py-6 transition-all duration-300 space-y-6 text-right select-none",
          modeClasses[mode],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageLayout.displayName = "PageLayout";

// ==========================================
// 2. PageHeader (Header Title & Actions)
// ==========================================
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  className,
  title,
  description,
  actions,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850",
        className
      )}
      {...props}
    >
      <div className="flex flex-col text-right">
        <h1 className="text-xl font-bold font-heading text-slate-900 dark:text-white leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 font-medium">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 self-end md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
PageHeader.displayName = "PageHeader";

// ==========================================
// 3. PageFilters (Filtering Row Toolbar)
// ==========================================
export interface PageFiltersProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageFilters: React.FC<PageFiltersProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between text-right select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
PageFilters.displayName = "PageFilters";

// ==========================================
// 4. PageContent (Grid layout with Sidebar option)
// ==========================================
export interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
  sidebarPosition?: "left" | "right";
}

export const PageContent: React.FC<PageContentProps> = ({
  className,
  sidebar,
  sidebarPosition = "right",
  children,
  ...props
}) => {
  if (!sidebar) {
    return (
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full",
        className
      )}
      {...props}
    >
      {sidebarPosition === "left" && (
        <aside className="col-span-1 lg:col-span-3 flex flex-col gap-6">
          {sidebar}
        </aside>
      )}
      <main className="col-span-1 lg:col-span-9 flex flex-col gap-6">
        {children}
      </main>
      {sidebarPosition === "right" && (
        <aside className="col-span-1 lg:col-span-3 flex flex-col gap-6">
          {sidebar}
        </aside>
      )}
    </div>
  );
};
PageContent.displayName = "PageContent";

// ==========================================
// 5. PageFooter (Bottom Quick Actions Bar)
// ==========================================
export interface PageFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageFooter: React.FC<PageFooterProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "pt-6 mt-6 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4 text-right select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
PageFooter.displayName = "PageFooter";
