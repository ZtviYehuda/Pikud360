import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  color?: string;
}

export interface FilterSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  disabled?: boolean;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "בחר...",
  icon: Icon,
  className,
  disabled = false,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("flex flex-col gap-1 min-w-[130px]", className)}>
      {label && (
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 px-1 truncate">
          {label}
        </span>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 px-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 text-xs font-bold text-foreground transition-all shadow-2xs cursor-pointer">
          <div className="flex items-center gap-2 truncate">
            {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            {selectedOption?.color && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent dir="rtl" className="rounded-xl border border-border/60 shadow-lg">
          {options.map((option) => {
            const OptionIcon = option.icon;
            return (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-xs font-bold py-2 px-3 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2 truncate">
                    {OptionIcon && <OptionIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                    {option.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                  {option.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-muted text-muted-foreground">
                      {option.badge}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
FilterSelect.displayName = "FilterSelect";
