import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const cardVariants = cva(
  "transition-all duration-enterprise-normal ease-enterprise-standard",
  {
    variants: {
      variant: {
        primary: "bg-enterprise-surface border border-enterprise-border rounded-enterprise-lg shadow-enterprise-card",
        secondary: "bg-enterprise-background border border-enterprise-border/60 rounded-enterprise-md shadow-enterprise-flat",
        kpi: "bg-enterprise-surface border border-enterprise-border rounded-enterprise-md shadow-enterprise-flat",
        interactive: "bg-enterprise-surface border border-enterprise-border hover:border-enterprise-primary/40 rounded-enterprise-lg shadow-enterprise-card hover:shadow-enterprise-floating cursor-pointer active:scale-[0.98]",
        alert: "rounded-enterprise-md",
        compact: "bg-enterprise-surface border border-enterprise-border rounded-enterprise-md",
        empty: "bg-enterprise-surface/50 border border-dashed border-enterprise-border rounded-enterprise-lg",
        loading: "bg-enterprise-surface/50 border border-enterprise-border/50 rounded-enterprise-lg animate-pulse"
      },
      severity: {
        info: "bg-enterprise-info/10 border border-enterprise-info/30 text-enterprise-info",
        success: "bg-enterprise-success/10 border border-enterprise-success/30 text-enterprise-success",
        warning: "bg-enterprise-warning/10 border border-enterprise-warning/30 text-enterprise-warning",
        danger: "bg-enterprise-danger/10 border border-enterprise-danger/30 text-enterprise-danger"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, severity, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, severity, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 md:p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-heading text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 md:p-6 pt-0 md:pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 md:p-6 pt-0 md:pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Reusable EnterpriseCard Props
export interface EnterpriseCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  loading?: boolean;
  error?: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  variant?: 
    | "statistic" 
    | "chart" 
    | "table" 
    | "list" 
    | "profile" 
    | "alert" 
    | "timeline" 
    | "settings" 
    | "quickaction" 
    | "insight" 
    | "status";
  severity?: "info" | "success" | "warning" | "danger";
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  isHoverable?: boolean;
  isSelected?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Unified EnterpriseCard Component
export const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  (
    {
      className,
      title,
      description,
      loading = false,
      error,
      empty = false,
      emptyMessage = "אין מידע להצגה",
      variant = "statistic",
      severity,
      toolbar,
      footer,
      isHoverable = false,
      isSelected = false,
      isCollapsed = false,
      onToggleCollapse,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden select-none transition-all duration-200 text-right w-full",
          isHoverable && "hover:border-cyan-550/40 hover:shadow-md cursor-pointer",
          isSelected && "ring-2 ring-cyan-600 border-transparent",
          className
        )}
        {...props}
      >
        {/* Header Block */}
        {(title || description || toolbar) && (
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-850/60">
            <div className="flex flex-col gap-0.5">
              {title && (
                <h3 className="font-heading text-xs font-bold text-slate-850 dark:text-white leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-[10px] text-slate-400 font-medium">
                  {description}
                </p>
              )}
            </div>
            {toolbar && <div className="flex items-center gap-1.5 shrink-0">{toolbar}</div>}
          </div>
        )}

        {/* Card Body */}
        {!isCollapsed && (
          <div className="p-4">
            {loading ? (
              <div className="space-y-2.5 animate-pulse py-4">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-3/4" />
                <div className="h-3 bg-slate-150 dark:bg-slate-850 rounded w-1/2" />
              </div>
            ) : error ? (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-650 dark:text-red-400 text-xs font-bold text-center py-6">
                {error}
              </div>
            ) : empty ? (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-600 font-semibold">
                {emptyMessage}
              </div>
            ) : (
              children
            )}
          </div>
        )}

        {/* Card Footer */}
        {footer && !isCollapsed && (
          <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850/60">
            {footer}
          </div>
        )}
      </div>
    );
  }
);
EnterpriseCard.displayName = "EnterpriseCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
