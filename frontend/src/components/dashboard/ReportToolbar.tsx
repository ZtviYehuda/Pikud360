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
}

export function ReportToolbar({
  viewMode,
  onViewModeChange,
  date,
  onDateChange,
  dateRange,
  onDateRangeChange,
  maxDate,
}: ReportToolbarProps) {
  return (
    <div className="w-full flex flex-col items-stretch gap-2 sm:gap-3 p-0.5 sm:p-1 rounded-xl min-w-fit">
      <div className="flex items-center gap-1.5 sm:gap-2 w-full flex-nowrap">
        {/* View Mode Tabs - Flexible & Scrollable */}
        <Tabs
          value={viewMode}
          onValueChange={(val) => onViewModeChange(val as any)}
          className="flex-1 min-w-0 shrink-0"
        >
          <TabsList
            dir="rtl"
            className="flex items-center w-full h-10 p-1 gap-1 bg-slate-100/40 dark:bg-slate-800/25 border-0 shadow-none rounded-xl overflow-x-auto no-scrollbar scroll-smooth"
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
                className="shrink-0 rounded-lg px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Date Picker Area */}
        <div className="shrink-0 flex-shrink-0">
          {viewMode !== "yearly" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 px-2 sm:px-3 bg-slate-100/40 dark:bg-slate-800/25 border-0 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 rounded-xl transition-all gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold min-w-fit shadow-none",
                    viewMode === "custom" && "bg-primary/10 text-primary"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className={cn(
                    "truncate",
                    viewMode === "custom" ? "max-w-[100px] sm:max-w-[150px]" : "max-w-[70px] sm:max-w-[100px]"
                  )}>
                    {viewMode === "monthly" ? (
                      format(date, "MM/yy")
                    ) : viewMode === "custom" && dateRange?.from ? (
                      <>
                        {format(dateRange.from, "dd/MM")}
                        {dateRange.to
                          ? `-${format(dateRange.to, "dd/MM")}`
                          : ""}
                      </>
                    ) : (
                      format(date, "dd/MM/yy")
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
        className="w-auto p-0 rounded-xl border-border/60"
                align="center"
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
                    numberOfMonths={2}
                    disabled={(d) => (maxDate ? d > maxDate : false)}
                    className="p-3 bg-background rounded-xl"
                  />
                ) : (
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && onDateChange(d)}
                    locale={he}
                    initialFocus
                    disabled={(d) => (maxDate ? d > maxDate : false)}
                    className="p-3 bg-background rounded-xl"
                  />
                )}
              </PopoverContent>
            </Popover>
          )}
          {viewMode === "yearly" && (
            <div className="w-full sm:w-auto min-w-[120px] sm:min-w-[140px] flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-border/60 px-4 py-2.5 sm:py-3 rounded-xl bg-background/50 shrink-0">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>שנת {format(date, "yyyy")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

