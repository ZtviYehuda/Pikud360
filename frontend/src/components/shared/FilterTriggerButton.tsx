import React from "react";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterTriggerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  hasActiveFilters?: boolean;
  activeCount?: number;
  onReset?: (e: React.MouseEvent) => void;
  className?: string;
  variant?: "ghost" | "outline" | "default";
}

export const FilterTriggerButton = React.forwardRef<
  HTMLButtonElement,
  FilterTriggerButtonProps
>(
  (
    {
      label = "סינון",
      hasActiveFilters = false,
      activeCount,
      onReset,
      className,
      variant = "ghost",
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative group inline-flex items-center">
        <Button
          ref={ref}
          variant={variant}
          className={cn(
            "h-9 rounded-xl flex-col gap-0.5 font-black transition-all px-2 xl:px-3.5 text-primary hover:bg-primary/5 text-sm min-w-[60px] py-1 relative border-none bg-transparent cursor-pointer",
            hasActiveFilters && "bg-primary/10 text-primary font-bold",
            className,
          )}
          {...props}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[8.5px] xl:text-[9.5px] leading-tight">
            {label}
          </span>
          {activeCount !== undefined && activeCount > 0 && (
            <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center shadow-2xs">
              {activeCount}
            </span>
          )}
        </Button>

        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset(e);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-125 active:scale-90 z-20 text-primary/70 hover:text-destructive cursor-pointer"
            title="נקה הכל"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  },
);
FilterTriggerButton.displayName = "FilterTriggerButton";
