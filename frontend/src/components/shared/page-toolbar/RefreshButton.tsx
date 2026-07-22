import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  label?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  loading = false,
  className,
  label = "רענון",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={label}
      aria-label={label}
      className={cn(
        "h-9 px-3 rounded-xl bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground border border-border/50 hover:border-primary/40 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer disabled:opacity-50",
        className
      )}
    >
      <RefreshCw
        className={cn(
          "w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors",
          loading && "animate-spin text-primary"
        )}
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};
RefreshButton.displayName = "RefreshButton";
