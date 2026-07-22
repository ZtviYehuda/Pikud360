import React, { useMemo, useTransition } from "react";
import { format, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { RotateCcw, Calendar as CalendarIcon } from "lucide-react";
import { useDateContext } from "@/context/DateContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getJewishHoliday } from "@/lib/hebrewDate";

export const DateHeader: React.FC<{ className?: string }> = ({ className }) => {
  const { selectedDate, setSelectedDate } = useDateContext();
  const [isPending, startTransition] = useTransition();

  const handleToday = () => startTransition(() => setSelectedDate(new Date()));
  const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);
  const holiday = useMemo(() => getJewishHoliday(selectedDate), [selectedDate]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 rounded-xl transition-all",
              "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              isPending && "opacity-50"
            )}
          >
            <CalendarIcon className="hidden sm:block w-4 h-4 text-slate-400 dark:text-slate-500" />
            
            <div className="flex items-center text-[12px] sm:text-[13px] tracking-tight">
              {/* Day name (Hidden on mobile) */}
              <span className="hidden sm:inline font-normal mr-1.5">
                {format(selectedDate, "EEEE", { locale: he })}
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700 mx-1.5 font-light">|</span>
              
              <span className="font-semibold tabular-nums">
                {format(selectedDate, "dd/MM/yy")}
              </span>
            </div>

            {holiday && (
              <span className="flex items-center gap-1.5 mr-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-black border border-amber-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {holiday}
              </span>
            )}

            {/* "Today" badge - shown optionally if needed, but let's keep it very minimal */}
            {isToday && !holiday && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold">היום</span>
              </div>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl border-border/40" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && startTransition(() => setSelectedDate(date))}
            initialFocus
            locale={he}
            className="rounded-2xl border-none"
          />
        </PopoverContent>
      </Popover>

      {/* Quick Today Toggle */}
      {!isToday && (
        <button
          onClick={handleToday}
          className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-all hover:bg-primary/20 hover:scale-105 active:scale-95"
          title="חזרה להיום"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
