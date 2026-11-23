import React, { useMemo, useTransition, useState } from "react";
import { format, isSameDay, subMonths, startOfDay, isBefore } from "date-fns";
import { he } from "date-fns/locale";
import { RotateCcw, Calendar as CalendarIcon, Archive } from "lucide-react";
import { useDateContext } from "@/context/DateContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RestorationRequestDialog } from "@/components/dashboard/RestorationRequestDialog";
import { cn } from "@/lib/utils";
import { getJewishHoliday } from "@/lib/hebrewDate";

export const DateHeader: React.FC<{ className?: string }> = ({ className }) => {
  const { selectedDate, setSelectedDate } = useDateContext();
  const [isPending, startTransition] = useTransition();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [targetArchiveDate, setTargetArchiveDate] = useState<Date>(new Date());

  const handleToday = () => startTransition(() => setSelectedDate(new Date()));
  const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);
  const holiday = useMemo(() => getJewishHoliday(selectedDate), [selectedDate]);
  const threeMonthsAgo = useMemo(() => subMonths(startOfDay(new Date()), 3), []);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (isBefore(date, threeMonthsAgo)) {
      setTargetArchiveDate(date);
      setRestoreOpen(true);
      setCalendarOpen(false);
      return;
    }
    startTransition(() => setSelectedDate(date));
    setCalendarOpen(false);
  };

  return (
    <>
      <div className={cn("flex items-center gap-1.5", className)}>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "group flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all select-none cursor-pointer outline-none",
                "text-foreground hover:bg-muted/60 dark:hover:bg-slate-800/60 active:scale-95",
                isPending && "opacity-50"
              )}
            >
              <CalendarIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              
              <div className="flex items-center text-sm tracking-tight font-medium">
                {/* Day name */}
                <span className="font-semibold text-foreground">
                  {format(selectedDate, "EEEE", { locale: he })}
                </span>
                <span className="text-muted-foreground/30 font-bold mx-1.5">•</span>
                
                {/* Date numbers */}
                <span className="font-bold tabular-nums text-foreground">
                  {format(selectedDate, "dd/MM/yy")}
                </span>
              </div>

              {holiday && (
                <span className="inline-flex items-center gap-1.5 mr-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {holiday}
                </span>
              )}

              {/* "Today" indicator - clean and border-free */}
              {isToday && !holiday && (
                <span className="inline-flex items-center gap-1.5 mr-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  היום
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border-border/40 shadow-xl" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={he}
              className="rounded-2xl border-none"
            />
            <div className="px-3 py-2 border-t border-border/30 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Archive className="w-3 h-3 text-amber-500" />
                מעל 3 חודשים בארכיון
              </span>
              {!isToday && (
                <button
                  type="button"
                  onClick={() => { handleToday(); setCalendarOpen(false); }}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  חזרה להיום
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Today Toggle */}
        {!isToday && (
          <button
            type="button"
            onClick={handleToday}
            className="w-7 h-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/60 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="חזרה להיום"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <RestorationRequestDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        targetDate={targetArchiveDate}
      />
    </>
  );
};
