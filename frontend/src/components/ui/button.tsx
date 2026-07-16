import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-enterprise-component-gap whitespace-nowrap text-enterprise-btn-label font-weight-enterprise-bold transition-all duration-enterprise-fast ease-enterprise-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-enterprise-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary: "bg-enterprise-primary text-white shadow-enterprise-card hover:bg-enterprise-primary/95 active:bg-enterprise-primary/90 border border-transparent",
        default: "bg-enterprise-primary text-white shadow-enterprise-card hover:bg-enterprise-primary/95 active:bg-enterprise-primary/90 border border-transparent",
        secondary: "bg-enterprise-border/40 text-enterprise-neutral hover:bg-enterprise-border/70 active:bg-enterprise-border/80 border border-enterprise-border/20",
        outline: "border border-enterprise-border bg-enterprise-surface text-enterprise-neutral hover:bg-enterprise-background",
        ghost: "text-enterprise-neutral hover:bg-enterprise-background",
        danger: "bg-enterprise-danger text-white shadow-enterprise-card hover:bg-enterprise-danger/95 active:bg-enterprise-danger/90 border border-transparent",
        destructive: "bg-enterprise-danger text-white shadow-enterprise-card hover:bg-enterprise-danger/95 active:bg-enterprise-danger/90 border border-transparent",
        link: "text-enterprise-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-enterprise-btn-h-md px-4 rounded-enterprise-md text-enterprise-btn-label",
        sm: "h-enterprise-btn-h-sm px-3 rounded-enterprise-sm text-enterprise-caption",
        lg: "h-enterprise-btn-h-lg px-6 rounded-enterprise-lg text-enterprise-body",
        icon: "h-enterprise-btn-h-md w-enterprise-btn-h-md rounded-enterprise-md flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && "w-full",
          loading && "opacity-85 pointer-events-none"
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
