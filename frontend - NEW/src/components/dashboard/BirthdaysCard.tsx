import {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gift } from "lucide-react";

import { cn } from "@/lib/utils";
import { BirthdayGreetingsModal } from "./BirthdayGreetingsModal";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useEmployeeContext } from "@/context/EmployeeContext";

interface BirthdayEmployee {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone_number?: string;
  day: number;
  month: number;
}

interface BirthdaysCardProps {
  id?: string;
  birthdays: BirthdayEmployee[];
  selectedDate?: Date;
  loading?: boolean;
  unitName?: string;
  className?: string;
  filterTags?: string[];
}

const MONTH_LABELS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export const BirthdaysCard = forwardRef<any, BirthdaysCardProps>(
  ({ id, birthdays, selectedDate, className, filterTags = [] }, ref) => {
    const { openProfile } = useEmployeeContext();
    const [isGreetingsModalOpen, setIsGreetingsModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      share: handleSendWhatsApp,
    }));

    const referenceDate = selectedDate || new Date();

    const handleSendWhatsApp = () => {
      if (!birthdays.length) return;

      const title = `ימי הולדת השבוע (${birthdays.length})`;
      const list = birthdays
        .map((emp) => {
          const dateStr = `${emp.day} ב${MONTH_LABELS[emp.month - 1]}`;
          const cleanPhone = emp.phone_number ? emp.phone_number.replace(/\D/g, "") : "";
          const phoneStr = cleanPhone ? ` (${cleanPhone})` : "";
          return `- ${emp.first_name} ${emp.last_name} | ${dateStr}${phoneStr}`;
        })
        .join("\n");

      const message = `*${title}*\n\n${list}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    };

    return (
      <>
        <Card
          id={id || "birthdays-card"}
          className={cn(
            "bg-card/60 dark:bg-slate-900/60 backdrop-blur-2xl text-card-foreground rounded-[1.5rem] border-0 shadow-sm flex flex-col overflow-hidden h-full relative",
            className
          )}
        >
          <CardHeader className="px-4 sm:px-6 py-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex justify-between items-center gap-4 w-full">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-sm sm:text-base font-black text-foreground mb-0.5 flex items-center flex-wrap gap-2">
                    <span>ימי הולדת</span>
                    {filterTags.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar ml-1">
                        {filterTags.map((tag, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-[10px] h-6 px-2.5 font-black bg-primary/10 text-primary border-primary/30 rounded-lg whitespace-nowrap shadow-sm"
                          >
                           {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    חוגגים השבוע
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {birthdays.length > 0 && (
                  <>
                    <Button
                      onClick={() => setIsGreetingsModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex h-9 rounded-xl gap-2 font-black text-xs border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>שליחת ברכה</span>
                    </Button>
                    <WhatsAppButton
                      onClick={handleSendWhatsApp}
                      variant="outline"
                      className="h-9 w-9 p-0 rounded-xl border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                      skipDirectLink={true}
                    />
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col min-h-0 relative">
            <div
              ref={scrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar relative scroll-smooth"
            >
              {birthdays.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-12 opacity-40">
                  <Calendar className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="text-sm font-bold">אין ימי הולדת השבוע</p>
                </div>
              ) : (
                <div className="p-4 sm:p-6 h-full flex flex-col overflow-hidden">
                  <div className="w-full flex-1 flex flex-nowrap items-center gap-4 overflow-x-auto no-scrollbar pb-4 pr-1">
                    {birthdays.map((employee) => {
                      const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
                      const isToday =
                        employee.day === today.getDate() &&
                        employee.month === today.getMonth() + 1;
                      
                      const isTomorrow = !isToday && (() => {
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        return employee.day === tomorrow.getDate() && employee.month === tomorrow.getMonth() + 1;
                      })();

                      const dateLabel = isToday ? "היום" : isTomorrow ? "מחר" : `${employee.day} ב${MONTH_LABELS[employee.month - 1]}`;
                      const initials = `${employee.first_name[0]}${employee.last_name[0]}`;

                      return (
                        <div
                          key={employee.id}
                          onClick={() => openProfile(employee.id)}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-[2.5rem] border transition-all cursor-pointer group/mini relative overflow-hidden shrink-0",
                            // Cool Vertical Stretch Layout
                            "w-[110px] h-[160px] sm:w-[150px] sm:h-[220px] p-4 sm:p-6", 
                            isToday
                              ? "bg-primary/[0.04] border-primary/20 ring-8 ring-primary/5 shadow-xl shadow-primary/5"
                              : "bg-background/40 border-border/40 hover:border-primary/30 hover:bg-background/60 hover:shadow-lg hover:shadow-primary/5"
                          )}
                        >
                          {/* Decorative Background */}
                          <div className={cn(
                            "absolute -right-4 -bottom-4 opacity-[0.03] transition-transform duration-700 group-hover/mini:scale-110 group-hover/mini:-rotate-12",
                            isToday ? "text-primary" : "text-muted-foreground"
                          )}>
                            <Gift className="w-24 h-24 sm:w-32 sm:h-32" />
                          </div>

                          {/* Avatar */}
                          <div className="relative mb-3 sm:mb-6">
                            <div
                              className={cn(
                                "w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-sm sm:text-2xl font-black transition-all duration-500 group-hover/mini:scale-110 group-hover/mini:rotate-3",
                                isToday
                                  ? "bg-primary text-white shadow-2xl shadow-primary/40 ring-4 ring-primary/20"
                                  : "bg-primary/10 text-primary group-hover/mini:bg-primary/20"
                              )}
                            >
                              {initials}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex flex-col gap-1 sm:gap-2 w-full relative z-10">
                            <p className={cn(
                              "text-[12px] sm:text-[18px] font-black leading-tight px-1 text-center line-clamp-2 w-full",
                              isToday ? "text-primary" : "text-foreground group-hover/mini:text-primary transition-colors"
                            )}>
                              {employee.first_name?.split(" ")[0]} {employee.last_name}
                            </p>
                            <div className="flex items-center justify-center gap-1.5 opacity-60">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <p className="text-[10px] sm:text-[13px] font-bold uppercase tracking-widest">
                                {dateLabel}
                              </p>
                            </div>
                          </div>
                          
                          {/* View Profile Indicator (Desktop only) */}
                          <div className="mt-4 opacity-0 group-hover/mini:opacity-100 transition-all translate-y-2 group-hover/mini:translate-y-0 hidden sm:block">
                            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter">
                               פרופיל
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <BirthdayGreetingsModal
          open={isGreetingsModalOpen}
          onOpenChange={setIsGreetingsModalOpen}
          weeklyBirthdays={birthdays}
        />
      </>
    );
  },
);
