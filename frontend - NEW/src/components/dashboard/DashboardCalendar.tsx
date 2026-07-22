import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { DayButton } from "react-day-picker";

interface DashboardCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date | undefined) => void;
}

export function DashboardCalendar({
  selectedDate,
  onSelectDate,
}: DashboardCalendarProps) {
  const [month, setMonth] = useState<Date>(selectedDate || new Date());
  const [calendarStats, setCalendarStats] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const { getCalendarStats } = useEmployees();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const year = month.getFullYear();
      const m = month.getMonth() + 1; // 1-indexed for backend
      const data = await getCalendarStats(year, m);
      setCalendarStats(data || {});
      setLoading(false);
    };
    fetchStats();
  }, [month, getCalendarStats]);

  const CustomDayButton = useMemo(() => {
    return function CustomDayButton(
      props: React.ComponentProps<typeof DayButton>,
    ) {
      const { day, ...buttonProps } = props;
      const dateKey = format(day.date, "yyyy-MM-dd");
      const stats = calendarStats[dateKey] || [];

      // Or just simply show colored dots for top statuses
      const topStats = stats.sort((a, b) => b.count - a.count).slice(0, 3);

      return (
        <div className="relative w-full h-full">
          <Button
            variant="ghost"
            size="icon"
            {...buttonProps}
            className={cn(
              buttonProps.className,
              "w-full h-full flex flex-col items-center justify-start pt-1 font-normal text-sm",
              // day.date.getDate() === selectedDate.getDate() ? "bg-primary text-primary-foreground" : ""
            )}
            onClick={(e) => {
              if (buttonProps.onClick) buttonProps.onClick(e);
              setIsOpen(false);
            }}
          >
            <span>{day.date.getDate()}</span>
            {/* Status Dots */}
            <div
              className="flex gap-0.5 mt-1 flex-wrap justify-center content-center max-w-[2rem] px-0.5"
              style={{ height: "12px" }}
            >
              {topStats.map((stat: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-full"
                  style={{
                    backgroundColor: stat.color || "#ccc",
                    width: "4px",
                    height: "4px",
                  }}
                  title={`${stat.status}: ${stat.count}`}
                />
              ))}
            </div>
          </Button>
        </div>
      );
    };
  }, [calendarStats]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-right font-normal",
            !selectedDate && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP", { locale: he })
          ) : (
            <span>בחר תאריך</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            initialFocus
            month={month}
            onMonthChange={setMonth}
            locale={he}
            components={{
              DayButton: CustomDayButton,
            }}
            className="p-3"
            classNames={{
              day: "h-14 w-14 p-0 font-normal aria-selected:opacity-100",
              cell: "h-14 w-14", // Ensure cell takes space
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
