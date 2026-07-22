import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  value?: string;
  onRemove: () => void;
  color?: string;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onRemove,
  color,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold transition-all shadow-2xs animate-in fade-in zoom-in-95 duration-150",
        className
      )}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span>
        {label}
        {value ? `: ${value}` : ""}
      </span>
      <button
        type="button"
        onClick={onRemove}
        title="הסר סינון"
        className="p-0.5 rounded-md hover:bg-primary/20 transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
FilterChip.displayName = "FilterChip";
