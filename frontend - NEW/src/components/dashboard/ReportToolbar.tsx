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
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="w-full flex flex-col items-stretch gap-2.5 sm:gap-3 p-1">
      {/* Row 1: Clean, uniform segmented control bar (יומי, שבועי, חודשי, טווח) */}
      <Tabs
        value={viewMode}
        onValueChange={(val) => onViewModeChange(val as any)}
        className="w-full"
      >
        <TabsList
          dir="rtl"
          className="grid grid-cols-4 w-full h-11 p-1 gap-1 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl"
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
              className="rounded-xl py-1.5 text-xs sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Row 2: Dedicated area for Date Picker display & Calendar Button */}
      <div className="w-full flex items-center justify-start">
        {viewMode !== "yearly" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-11 px-4 bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-2xl transition-all gap-2.5 text-xs sm:text-sm font-bold shadow-none text-foreground",
                  viewMode === "custom" && "bg-primary/10 text-primary border-primary/20"
                )}
              >
                <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono tracking-tight">
                  {viewMode === "monthly" ? (
                    format(date, "MM/yy")
                  ) : viewMode === "custom" && dateRange?.from ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")}
                      {dateRange.to
                        ? ` - ${format(dateRange.to, "dd/MM/yy")}`
                        : ""}
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
        )}
        {viewMode === "yearly" && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold border border-slate-200/50 dark:border-slate-700/50 px-4 py-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 shrink-0 font-mono">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span>שנת {format(date, "yyyy")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

