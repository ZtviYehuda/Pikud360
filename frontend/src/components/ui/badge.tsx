import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 border font-weight-enterprise-bold select-none whitespace-nowrap rounded-full transition-colors",
  {
    variants: {
      variant: {
        success: "bg-enterprise-success/15 border-enterprise-success/30 text-enterprise-success",
        warning: "bg-enterprise-warning/15 border-enterprise-warning/30 text-enterprise-warning",
        danger: "bg-enterprise-danger/15 border-enterprise-danger/30 text-enterprise-danger",
        info: "bg-enterprise-info/15 border-enterprise-info/30 text-enterprise-info",
        neutral: "bg-enterprise-border/50 border-enterprise-border/80 text-enterprise-neutral",
        outline: "border-enterprise-border bg-transparent text-enterprise-neutral",
        // Backward compatibility mappings
        default: "bg-enterprise-border/50 border-enterprise-border/80 text-enterprise-neutral",
        secondary: "bg-enterprise-info/15 border-enterprise-info/30 text-enterprise-info",
        destructive: "bg-enterprise-danger/15 border-enterprise-danger/30 text-enterprise-danger",
      },
      size: {
        sm: "px-1.5 py-0.5 text-enterprise-overline [&_svg]:size-2.5",
        md: "px-2.5 py-0.5 text-enterprise-caption [&_svg]:size-3.5",
      }
    },
    defaultVariants: {
      variant: "neutral",
      size: "md"
    }
  }
);

const dotColors: Record<string, string> = {
  success: "bg-enterprise-success",
  warning: "bg-enterprise-warning",
  danger: "bg-enterprise-danger",
  info: "bg-enterprise-info",
  neutral: "bg-enterprise-neutral",
  outline: "bg-enterprise-neutral",
  default: "bg-enterprise-neutral",
  secondary: "bg-enterprise-info",
  destructive: "bg-enterprise-danger"
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  showDot?: boolean;
}

function Badge({
  className,
  variant = "neutral",
  size = "md",
  icon,
  showDot = false,
  children,
  ...props
}: BadgeProps) {
  const dotColor = dotColors[variant || "neutral"] || "bg-enterprise-neutral";

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {showDot && (
        <span
          className={cn("inline-block rounded-full w-1.5 h-1.5 shrink-0", dotColor)}
          aria-hidden="true"
        />
      )}
      {icon && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
