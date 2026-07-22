import * as React from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClearFiltersButtonProps {
  onClick: () => void;
  hasActiveFilters?: boolean;
  className?: string;
  label?: string;
}

export const ClearFiltersButton: React.FC<ClearFiltersButtonProps> = ({
  onClick,
  hasActiveFilters = true,
  className,
  label = "אפס הכל",
}) => {
  if (!hasActiveFilters) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "h-9 px-3 rounded-xl bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border/50 hover:border-destructive/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer",
        className
      )}
    >
      <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-90 duration-300" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};
ClearFiltersButton.displayName = "ClearFiltersButton";
