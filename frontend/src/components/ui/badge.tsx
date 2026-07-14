import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
        destructive:
          "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/40 dark:border-rose-900/30",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-900/30",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/30",
        info:
          "border-transparent bg-blue-105 text-blue-800 dark:bg-blue-955/30 dark:text-blue-400 border-blue-200/40 dark:border-blue-900/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
