import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/**
 * CVA Variants for standard Modal Width Presets
 */
export const modalContentVariants = cva(
  "p-0 border-none sm:border sm:border-border/60 bg-card text-foreground flex flex-col overflow-hidden transition-all duration-300 w-full rounded-t-[2.2rem] rounded-b-none sm:rounded-3xl max-h-[92dvh] sm:max-h-[86vh] shadow-2xl",
  {
    variants: {
      size: {
        sm: "sm:max-w-md",
        md: "sm:max-w-lg",
        lg: "sm:max-w-2xl sm:w-[95vw]", // Standard golden size for dashboard & management workflows
        xl: "sm:max-w-4xl sm:w-[95vw]",
        full: "sm:max-w-6xl sm:w-[96vw]",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
);

/**
 * CVA Variants for standard Header Icon Badges
 */
export const headerIconVariants = cva(
  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform shadow-2xs select-none",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary dark:text-primary-foreground",
        primary: "bg-primary/10 text-primary",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        green: "bg-green-500/10 text-green-600 dark:text-green-400",
        emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AppModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function AppModal({ open, onOpenChange, children }: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export interface AppModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent>,
    VariantProps<typeof modalContentVariants> {
  children: React.ReactNode;
}

export const AppModalContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  AppModalContentProps
>(({ className, size, children, ...props }, ref) => {
  return (
    <DialogContent
      ref={ref}
      className={cn(modalContentVariants({ size }), className)}
      dir="rtl"
      {...props}
    >
      <DialogDragHandle />
      {children}
    </DialogContent>
  );
});
AppModalContent.displayName = "AppModalContent";

export interface AppModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  iconVariant?: VariantProps<typeof headerIconVariants>["variant"];
  iconClassName?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  onBack?: () => void;
}

export function AppModalHeader({
  icon,
  iconVariant = "default",
  iconClassName,
  title,
  subtitle,
  badge,
  action,
  toolbar,
  onBack,
  className,
  children,
  ...props
}: AppModalHeaderProps) {
  return (
    <div
      className={cn(
        "px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-4 border-b border-border/40 bg-muted/20 shrink-0 text-right select-none relative",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0 active:scale-95"
              title="חזור"
              aria-label="חזור"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {icon && (
            <div
              className={cn(headerIconVariants({ variant: iconVariant }), iconClassName)}
              aria-hidden="true"
            >
              {React.isValidElement(icon) ? (
                icon
              ) : (
                React.createElement(icon as any, { className: "w-5.5 h-5.5" })
              )}
            </div>
          )}

          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug truncate">
                {title}
              </DialogTitle>
              {badge}
            </div>
            {subtitle && (
              <DialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground/80 leading-normal mt-0.5 truncate">
                {subtitle}
              </DialogDescription>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {toolbar && (
        <div className="mt-3.5 pt-3 border-t border-border/30">
          {toolbar}
        </div>
      )}

      {children}
    </div>
  );
}

export interface AppModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function AppModalBody({
  children,
  className,
  noPadding = false,
  ...props
}: AppModalBodyProps) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 overflow-y-auto custom-scrollbar",
        !noPadding && "p-5 sm:p-7 space-y-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AppModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AppModalFooter({
  children,
  className,
  ...props
}: AppModalFooterProps) {
  return (
    <div
      className={cn(
        "px-5 py-4 sm:px-7 sm:py-4.5 border-t border-border/40 bg-muted/10 shrink-0 flex items-center justify-between gap-3 relative z-20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
