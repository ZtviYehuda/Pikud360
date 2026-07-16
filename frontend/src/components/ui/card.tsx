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

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
