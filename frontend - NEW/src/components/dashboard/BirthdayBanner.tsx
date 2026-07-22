import { motion, AnimatePresence } from "framer-motion";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployeeContext } from "@/context/EmployeeContext";

interface BirthdayEmployee {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string;
  day: number;
  month: number;
}

interface BirthdayBannerProps {
  birthdays: BirthdayEmployee[];
  selectedDate?: Date;
  className?: string;
}

const MONTH_LABELS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function BirthdayBanner({ birthdays, selectedDate, className }: BirthdayBannerProps) {
  const { openProfile, employees } = useEmployeeContext();
  const referenceDate = selectedDate || new Date();

  if (!birthdays || birthdays.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="birthday-banner"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "w-full rounded-2xl relative",
          "bg-card/45 backdrop-blur-md",
          "border border-border/40 shadow-sm",
          "p-4",
          "flex flex-col gap-3",
          className
        )}
        dir="rtl"
      >
        {/* Header Row */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary/10 text-primary">
            <Gift className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-foreground tracking-tight">
            חוגגים ימי הולדת השבוע 🎉
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/20 w-full" />

        {/* Responsive Grid Layout — wraps naturally, completely visible */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 w-full">
          {birthdays.map((emp) => {
            const today = new Date(
              referenceDate.getFullYear(),
              referenceDate.getMonth(),
              referenceDate.getDate()
            );
            const isToday =
              emp.day === today.getDate() && emp.month === today.getMonth() + 1;

            const initials = `${emp.first_name?.[0] ?? ""}${emp.last_name?.[0] ?? ""}`;
            const dateLabel = isToday
              ? "היום!"
              : `${emp.day} ב${MONTH_LABELS[emp.month - 1]}`;

            return (
              <button
                key={emp.id}
                onClick={() => {
                  if (emp.id === -999) {
                    const realEmp = employees.find(e => e.id !== -999 && e.is_active);
                    if (realEmp) openProfile(realEmp.id);
                  } else {
                    openProfile(emp.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-300 text-right w-full",
                  "bg-background/40 hover:bg-background active:scale-[0.98] cursor-pointer",
                  "border border-border/50 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5",
                  isToday && "bg-primary/5 border-primary/20 hover:border-primary/45"
                )}
              >
                {/* Soft initials avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                    isToday
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {initials}
                </div>

                {/* Name & Date */}
                <div className="flex flex-col items-start leading-snug min-w-0 flex-1">
                  <span className="text-[11px] sm:text-xs font-bold text-foreground truncate w-full">
                    {emp.first_name?.split(" ")[0]} {emp.last_name}
                  </span>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold mt-0.5",
                    isToday ? "text-primary animate-pulse" : "text-muted-foreground/60"
                  )}>
                    {dateLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
