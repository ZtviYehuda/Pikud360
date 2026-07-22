import * as React from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangeFilterProps {
  selectedDate?: Date;
  onSelectDate: (date: Date | undefined) => void;
  label?: string;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  selectedDate,
  onSelectDate,
  label,
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("flex flex-col gap-1 min-w-[140px]", className)}>
      {label && (
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 px-1 truncate">
          {label}
        </span>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 px-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 focus:border-primary/60 text-xs font-bold justify-between transition-all shadow-2xs cursor-pointer",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>
                {selectedDate
                  ? format(selectedDate, "d בMMMM yyyy", { locale: he })
                  : "בחר תאריך..."}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl border border-border/60 shadow-xl" align="start" dir="rtl">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onSelectDate(date);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
DateRangeFilter.displayName = "DateRangeFilter";
