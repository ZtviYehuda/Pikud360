import {
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
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

export const BirthdaysCard = forwardRef(
  function BirthdaysCard(
    { id, birthdays, selectedDate, className, filterTags = [] }: BirthdaysCardProps,
    ref: any
  ) {
    const { openProfile } = useEmployeeContext();
    const [isGreetingsModalOpen, setIsGreetingsModalOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      share: handleSendWhatsApp,
    }));

    const referenceDate = selectedDate || new Date();

    // Sort birthdays chronologically from referenceDate
    const sortedBirthdays = useMemo(() => {
      if (!birthdays || !birthdays.length) return [];
      const today = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate()
      );

      return [...birthdays].sort((a, b) => {
        const aDate = new Date(today.getFullYear(), a.month - 1, a.day);
        const bDate = new Date(today.getFullYear(), b.month - 1, b.day);
        // If date passed already this month and looking ahead
        if (aDate < today && a.month === 1 && today.getMonth() === 11) {
          aDate.setFullYear(today.getFullYear() + 1);
        }
        if (bDate < today && b.month === 1 && today.getMonth() === 11) {
          bDate.setFullYear(today.getFullYear() + 1);
        }
        return aDate.getTime() - bDate.getTime();
      });
    }, [birthdays, referenceDate]);

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
            "bg-card/70 dark:bg-card/50 backdrop-blur-md text-card-foreground rounded-2xl border border-border/60 shadow-xs flex flex-col overflow-hidden h-full relative transition-all",
            className
          )}
        >
          <CardHeader className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between space-y-0 border-b border-border/40 gap-3 shrink-0">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                  ימי הולדת
                </CardTitle>
                {filterTags.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {filterTags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-[9px] h-5 px-2 font-bold bg-primary/10 text-primary border-primary/30 rounded-md whitespace-nowrap"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground truncate">
                {birthdays.length > 0
                  ? `חוגגים השבוע (${birthdays.length})`
                  : "חוגגים השבוע"}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {birthdays.length > 0 && (
                <>
                  <Button
                    onClick={() => setIsGreetingsModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex h-8 px-2.5 rounded-lg gap-1.5 font-bold text-xs border-primary/20 hover:bg-primary/5 text-primary cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>שליחת ברכה</span>
                  </Button>
                  <WhatsAppButton
                    onClick={handleSendWhatsApp}
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                    skipDirectLink={true}
                    title="שתף רשימת ימי הולדת בוואטסאפ"
                  />
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-3 sm:p-4 flex flex-col min-h-0 relative justify-between">
            {sortedBirthdays.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full h-full min-h-[240px] text-center p-6 opacity-60">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-foreground">אין ימי הולדת השבוע</p>
                <p className="text-xs text-muted-foreground mt-1">כל החוגגים הבאים יוצגו כאן אוטומטית</p>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar justify-start space-y-2 pr-0.5">
                {sortedBirthdays.map((employee) => {
                  const today = new Date(
                    referenceDate.getFullYear(),
                    referenceDate.getMonth(),
                    referenceDate.getDate()
                  );
                  const isToday =
                    employee.day === today.getDate() &&
                    employee.month === today.getMonth() + 1;

                  const isTomorrow =
                    !isToday &&
                    (() => {
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);
                      return (
                        employee.day === tomorrow.getDate() &&
                        employee.month === tomorrow.getMonth() + 1
                      );
                    })();

                  const bdayDate = new Date(
                    referenceDate.getFullYear(),
                    employee.month - 1,
                    employee.day
                  );
                  const dayOfWeek = bdayDate.toLocaleDateString("he-IL", {
                    weekday: "long",
                  });

                  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`;

                  const cleanPhone = employee.phone_number
                    ? employee.phone_number.replace(/\D/g, "")
                    : "";
                  const waNumber = cleanPhone.startsWith("0")
                    ? "972" + cleanPhone.slice(1)
                    : cleanPhone;
                  const personalMsg = encodeURIComponent(
                    `מזל טוב ${employee.first_name}! 🎂 מאחל/ת לך יום הולדת שמח, בריאות, אושר והצלחה! 🎉`
                  );
                  const personalWaUrl = waNumber
                    ? `https://wa.me/${waNumber}?text=${personalMsg}`
                    : null;

                  return (
                    <div
                      key={employee.id}
                      onClick={() => openProfile(employee.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl border transition-all cursor-pointer group relative overflow-hidden",
                        isToday
                          ? "bg-primary/[0.06] dark:bg-primary/[0.08] border-primary/30 ring-1 ring-primary/20 shadow-xs hover:border-primary/50"
                          : "bg-background/50 dark:bg-card/40 border-border/50 hover:border-border hover:bg-muted/40 hover:shadow-2xs"
                      )}
                    >
                      {/* Right side (RTL): Avatar & Employee Details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <div
                            className={cn(
                              "w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black transition-all group-hover:scale-105 shadow-2xs",
                              isToday
                                ? "bg-primary text-primary-foreground shadow-primary/25"
                                : "bg-primary/10 text-primary border border-primary/20"
                            )}
                          >
                            {initials}
                          </div>
                          {isToday && (
                            <span className="absolute -top-1 -right-1 text-xs select-none">
                              🎂
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-right">
                          <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate font-medium">
                              {employee.day} ב{MONTH_LABELS[employee.month - 1]}
                              {!isToday && !isTomorrow && ` • ${dayOfWeek}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Left side (RTL): Status Badge & Direct Wish Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isToday ? (
                          <Badge className="bg-primary hover:bg-primary text-primary-foreground font-black text-[11px] px-2.5 py-0.5 shadow-2xs">
                            היום 🎉
                          </Badge>
                        ) : isTomorrow ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] px-2 py-0.5 font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                          >
                            מחר
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10.5px] px-2 py-0.5 font-bold text-muted-foreground border-0 bg-muted/70"
                          >
                            {dayOfWeek}
                          </Badge>
                        )}

                        {personalWaUrl && (
                          <a
                            href={personalWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={`שלח ברכת יום הולדת בוואטסאפ ל${employee.first_name}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
