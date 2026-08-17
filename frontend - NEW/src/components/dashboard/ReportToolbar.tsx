import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          "flex items-center gap-2 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 shrink-0 font-mono border-0 text-foreground",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 text-primary" />
        <span>שנת {format(date, "yyyy")}</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-9 px-3 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 rounded-xl transition-all gap-2 text-xs sm:text-sm font-bold shadow-none text-foreground border-0",
            viewMode === "custom" && "bg-primary/10 text-primary",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <span className="font-mono tracking-tight text-xs sm:text-sm">
            {viewMode === "monthly" ? (
              format(date, "MM/yy")
            ) : viewMode === "custom" && dateRange?.from ? (
              <>
                {format(dateRange.from, "dd/MM/yy")}
                {dateRange.to ? ` - ${format(dateRange.to, "dd/MM/yy")}` : ""}
              </>
            ) : (
              format(date, "dd/MM/yy")
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
    <div className="w-full flex flex-col items-stretch gap-2.5">
      {/* Optional Date Picker row if not placed in header */}
      {!hideDatePicker && (
        <div className="w-full flex items-center justify-start">
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

      {/* Segmented control bar (יומי, שבועי, חודשי, טווח) */}
      <Tabs
        value={viewMode}
        onValueChange={(val) => onViewModeChange(val as any)}
        className="w-full"
      >
        <TabsList
          dir="rtl"
          className="grid grid-cols-4 w-full h-10 p-1 gap-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border-0 shadow-none"
        >
          {[
            { id: "daily", label: "יומי" },
            { id: "weekly", label: "שבועי" },
            { id: "monthly", label: "חודשי" },
            { id: "custom", label: "טווח" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-lg py-1.5 text-xs sm:text-sm font-bold border-0 shadow-none transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}


