import * as React from "react";
import { ListFilter, Rows3, Component } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DensityMode = "compact" | "normal" | "spacious";

export interface DensitySelectorProps {
  density: DensityMode;
  onChangeDensity: (density: DensityMode) => void;
  className?: string;
  label?: string;
}

export const DensitySelector: React.FC<DensitySelectorProps> = ({
  density,
  onChangeDensity,
  className,
  label = "צפיפות",
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-9 px-3 rounded-xl bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground border border-border/50 hover:border-primary/40 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer",
            className
          )}
        >
          <Rows3 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent dir="rtl" align="end" className="rounded-xl border border-border/60 shadow-lg">
        <DropdownMenuItem
          onClick={() => onChangeDensity("compact")}
          className={cn(
            "text-xs font-bold gap-2 cursor-pointer",
            density === "compact" && "text-primary bg-primary/10"
          )}
        >
          <span>צפוף (Compact)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChangeDensity("normal")}
          className={cn(
            "text-xs font-bold gap-2 cursor-pointer",
            density === "normal" && "text-primary bg-primary/10"
          )}
        >
          <span>רגיל (Standard)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onChangeDensity("spacious")}
          className={cn(
            "text-xs font-bold gap-2 cursor-pointer",
            density === "spacious" && "text-primary bg-primary/10"
          )}
        >
          <span>מרווח (Spacious)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
DensitySelector.displayName = "DensitySelector";
