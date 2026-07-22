import * as React from "react";
import { Columns, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface ColumnItem {
  id: string;
  label: string;
  visible: boolean;
}

export interface ColumnSelectorProps {
  columns: ColumnItem[];
  onToggleColumn: (id: string) => void;
  className?: string;
  label?: string;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  onToggleColumn,
  className,
  label = "עמודות",
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-9 px-3 rounded-xl bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground border border-border/50 hover:border-primary/40 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer",
            className
          )}
        >
          <Columns className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" dir="rtl" className="w-48 p-2 rounded-xl border border-border/60 shadow-lg space-y-1">
        <span className="text-[10px] font-black uppercase text-muted-foreground px-2 pb-1 block border-b border-border/40">
          הצגת עמודות
        </span>
        {columns.map((col) => (
          <label
            key={col.id}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 text-xs font-bold cursor-pointer transition-colors"
          >
            <span>{col.label}</span>
            <Checkbox
              checked={col.visible}
              onCheckedChange={() => onToggleColumn(col.id)}
              className="h-4 w-4 rounded-md"
            />
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
};
ColumnSelector.displayName = "ColumnSelector";
