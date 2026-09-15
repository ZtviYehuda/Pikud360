import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MonthPicker } from "@/components/common/MonthPicker";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

export interface ReportDatePickerProps {
  viewMode: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  date: Date;
  onDateChange: (date: Date) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  maxDate?: Date;
  className?: string;
}

export function ReportDatePicker({
  viewMode,
  date,
  onDateChange,
  dateRange,
  onDateRangeChange,
  maxDate,
  className,
}: ReportDatePickerProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (viewMode === "yearly") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-card dark:bg-card/70 shrink-0 font-mono border border-border/50 text-foreground shadow-xs whitespace-nowrap",
          className
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>שנת {format(date, "yyyy")}</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 sm:h-9 px-3.5 bg-card dark:bg-card/80 hover:bg-accent/60 border border-border/50 rounded-xl transition-all gap-2 text-xs font-bold shadow-xs text-foreground shrink-0 whitespace-nowrap min-w-fit active:scale-95 cursor-pointer",
            viewMode === "custom" && "border-primary/50 text-primary ring-1 ring-primary/20",
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-mono tracking-tight text-xs whitespace-nowrap">
            {viewMode === "monthly" ? (
              format(date, "MM/yyyy")
            ) : viewMode === "custom" && dateRange?.from ? (
              <>
                {format(dateRange.from, "dd/MM/yy")}
                {dateRange.to ? ` - ${format(dateRange.to, "dd/MM/yy")}` : ""}
              </>
            ) : (
              format(date, "dd/MM/yyyy")
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[94vw] sm:max-w-none p-0 rounded-2xl border-border/60 shadow-2xl overflow-y-auto max-h-[75vh] z-[100]"
        align={isMobile ? "center" : "start"}
        side={isMobile ? "top" : "bottom"}
        sideOffset={8}
      >
        {viewMode === "monthly" ? (
          <MonthPicker current={date} onSelect={onDateChange} />
        ) : viewMode === "custom" ? (
          <CalendarComponent
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            locale={he}
            initialFocus
            numberOfMonths={isMobile ? 1 : 2}
            disabled={(d) => (maxDate ? d > maxDate : false)}
            className="p-2 sm:p-3 bg-background rounded-2xl"
          />
        ) : (
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            locale={he}
            initialFocus
            disabled={(d) => (maxDate ? d > maxDate : false)}
            className="p-2 sm:p-3 bg-background rounded-2xl"
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

interface ReportToolbarProps {
  viewMode: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  onViewModeChange: (
    mode: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  ) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  maxDate?: Date;
  hideDatePicker?: boolean;
}

const PERIODS = [
  { id: "daily", label: "יומי" },
  { id: "weekly", label: "שבועי" },
  { id: "monthly", label: "חודשי" },
  { id: "custom", label: "טווח" },
] as const;

export function ReportToolbar({
  viewMode,
  onViewModeChange,
  date,
  onDateChange,
  dateRange,
  onDateRangeChange,
  maxDate,
  hideDatePicker = false,
}: ReportToolbarProps) {
  return (
    <div className="w-full flex items-center justify-between gap-3">
      {/* Clean Segmented Pill Container */}
      <div className="flex items-center bg-muted/60 dark:bg-muted/40 p-1 rounded-xl gap-1 shrink-0">
        {PERIODS.map((tab) => {
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onViewModeChange(tab.id as any)}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all text-center cursor-pointer select-none whitespace-nowrap",
                isActive
                  ? "bg-card dark:bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/30"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Picker Button */}
      {!hideDatePicker && (
        <div className="shrink-0">
          <ReportDatePicker
            viewMode={viewMode}
            date={date}
            onDateChange={onDateChange}
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  );
}
