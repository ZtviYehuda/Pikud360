import { useRef, useMemo, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, parseISO, startOfMonth, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";

interface TrendData {
  date_str: string;
  date: string;
  total_employees: number;
  present_count: number;
}

interface AttendanceTrendCardProps {
  data: TrendData[];
  loading?: boolean;
  range: number;
  className?: string;
  unitName?: string;
  subtitle?: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onRangeChange?: (range: number) => void;
  filterTags?: string[];
  hideHeader?: boolean;
  compact?: boolean;
  totalEmployees?: number;
}

export const AttendanceTrendCard = forwardRef<any, AttendanceTrendCardProps>(
  (
    {
      data,
      loading,
      range,
      className,
      unitName = "כלל היחידה",
      subtitle,
      selectedDate = new Date(),
      onDateSelect,
      onRangeChange,
      hideHeader = false,
      compact = false,
      filterTags = [],
      totalEmployees = 0,
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const chartData = useMemo(() => {
      if (range < 365) return data;

      const monthlyMap = new Map<
        string,
        { month: string; present: number; total: number; count: number }
      >();

      data.forEach((item) => {
        const date = parseISO(item.date);
        const monthKey = format(startOfMonth(date), "yyyy-MM");
        const existing = monthlyMap.get(monthKey) || {
          month: format(date, "MMMM", { locale: he }),
          present: 0,
          total: 0,
          count: 0,
        };

        monthlyMap.set(monthKey, {
          month: existing.month,
          present: existing.present + item.present_count,
          total: existing.total + item.total_employees,
          count: existing.count + 1,
        });
      });

      return Array.from(monthlyMap.values()).map((m) => ({
        date_str: m.month,
        present_count: Math.round(m.present / m.count),
        total_employees: Math.round(m.total / m.count),
      }));
    }, [data, range]);

    const stats = useMemo(() => {
      if (!data.length) return null;
      const avgPresence = Math.round(
        data.reduce((acc, curr) => acc + curr.present_count, 0) / data.length,
      );
      const maxPresence = Math.max(...data.map((d) => d.present_count));
      const peakDay = data.find((d) => d.present_count === maxPresence);

      return {
        avgPresence,
        peakDay: peakDay ? format(parseISO(peakDay.date), "dd/MM") : "-",
        maxPresence,
      };
    }, [data]);

    const handleDownload = async () => {
      if (cardRef.current === null) return;

      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "static";
              dateEl.style.opacity = "1";
              dateEl.style.marginTop = "1rem";
              dateEl.innerText = `תאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);
        const link = document.createElement("a");
        link.download = `attendance-trend-${range}-days.png`;
        link.href = dataUrl;
        link.click();
        toast.success("הגרף יוצא כתמונה בהצלחה");
      } catch (err) {
        console.error("Failed to download image", err);
        toast.error("שגיאה בייצוא הגרף");
      }
    };

    const handleWhatsAppShare = async () => {
      if (cardRef.current === null) return;

      try {
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "static";
              dateEl.style.opacity = "1";
              dateEl.style.marginTop = "1rem";
              dateEl.innerText = `תאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);

        if (!blob) throw new Error("Failed to capture image");

        const rangeText =
          range === 7 ? "שבועית" : range === 30 ? "חודשית" : "שנתית";
        const statsText = stats
          ? `\n*נתונים עיקריים:* \n- ממוצע נוכחות: ${stats.avgPresence} שוטרים\n- שיא נוכחות: ${stats.maxPresence} (${stats.peakDay})`
          : "";
        const filterText = subtitle ? `\n*סינון:* ${subtitle}` : "";
        const title = `דוח מגמת זמינות ${rangeText} - ${unitName}`;
        const message = `*${title}*\nתאריך הפקה: ${format(new Date(), "dd/MM/yyyy")}\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}${filterText}${statsText}`;

        const file = new File([blob], `trend-${range}.png`, {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: title,
              text: message,
            });
            toast.success("הדוח שותף בהצלחה");
            return;
          } catch (shareErr) {
            if ((shareErr as Error).name !== "AbortError") {
              console.warn("Web Share failed:", shareErr);
            } else {
              return;
            }
          }
        }

        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.warn("Clipboard copy failed:", clipErr);
        }

        const dataUrl = await toPng(cardRef.current, {
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "static";
              dateEl.style.opacity = "1";
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);
        const link = document.createElement("a");
        link.download = `מגמת_זמינות_${format(new Date(), "dd-MM-yyyy")}.png`;
        link.href = dataUrl;
        link.click();

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

        toast.success("התמונה הועתקה! נא לבצע 'הדבק' (Ctrl+V) בווצאפ");
      } catch (err) {
        console.error("WhatsApp share failed", err);
        toast.error("שגיאה בהכנת הדוח ל-WhatsApp");
      }
    };




    if (loading) {
      return (
        <Card className={cn("h-full", className)}>
          <CardHeader>
            <CardTitle className="text-lg animate-pulse bg-muted h-6 w-32 rounded"></CardTitle>
            <CardDescription className="animate-pulse bg-muted h-4 w-48 rounded mt-2"></CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        id="attendance-chart"
        ref={cardRef}
        className={cn(
          "bg-card/60 dark:bg-slate-900/60 backdrop-blur-2xl text-card-foreground rounded-[1.5rem] border-0 shadow-sm flex flex-col overflow-hidden h-full relative transition-all",
          className,
          hideHeader && "border-none bg-transparent backdrop-blur-none py-0",
          compact && "bg-transparent backdrop-blur-none border-0 shadow-none"
        )}
      >
        <div className={cn(
          "pt-1.5 pb-3 px-3 sm:pt-2 sm:pb-4 sm:px-4 md:pt-2.5 md:pb-6 md:px-6 flex-1 flex flex-col",
          compact && "pt-1 pb-1.5 px-2 sm:pt-1.5 sm:pb-2 sm:px-3",
          hideHeader && "p-0"
        )}>
          {!hideHeader && (
            <div className="flex flex-row justify-between items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2.5 relative z-10">
              <div className="flex gap-2 sm:gap-3 items-center">
                <div className="text-right flex flex-col">
                  <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight flex items-center flex-wrap gap-2">
                    <span>מגמת זמינות</span>
                    <span className="hidden sm:inline text-muted-foreground font-medium text-xs sm:text-sm">— {range === 7 ? "שבועי" : "חודשי"}</span>
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
                  </h3>
                </div>
              </div>

              {/* Toggle Row */}
              {onRangeChange && (
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg no-export shrink-0">
                  <button
                    onClick={() => onRangeChange(7)}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-all",
                      range === 7
                        ? "bg-white text-primary dark:bg-slate-700 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    שבועי
                  </button>
                  <button
                    onClick={() => onRangeChange(30)}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-all",
                      range === 30
                        ? "bg-white text-primary dark:bg-slate-700 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    חודשי
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col relative p-0 mt-0 min-h-[170px] sm:min-h-[240px] md:min-h-[320px]">
            <div className="w-full h-full flex-1" style={{ direction: "ltr", minHeight: compact ? "150px" : "200px" }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={compact ? 150 : 200}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: isMobile ? 5 : 10, left: -25, bottom: isMobile ? 0 : 5 }}
                  style={{ cursor: 'pointer' }}
                  onMouseDown={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const dateStr = state.activePayload[0].payload.date;
                      if (dateStr) {
                        onDateSelect?.(parseISO(dateStr));
                      }
                    } else if (state && state.activeLabel) {
                      onDateSelect?.(parseISO(state.activeLabel));
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="60%" stopColor="var(--primary)" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      if (!value) return "";
                      try {
                        const date = parseISO(value);
                        if (!isNaN(date.getTime())) {
                           return isMobile ? format(date, "d/M") : format(date, "dd/MM");
                        }
                      } catch (e) {
                        return value;
                      }
                      return value;
                    }}
                    tick={{
                      fontSize: isMobile ? 11 : 13,
                      fill: "var(--foreground)",
                      fontWeight: 900,
                    }}
                    tickLine={false}
                    axisLine={false}
                    dy={isMobile ? 8 : 12}
                    minTickGap={isMobile ? 15 : 20}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "var(--foreground)",
                      fontWeight: 900,
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[
                      0,
                      totalEmployees > 0
                        ? totalEmployees
                        : (dataMax: number) => Math.floor(Math.max(dataMax, 10) * 1.2),
                    ]}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    labelFormatter={(label) =>
                      format(parseISO(label), "dd/MM/yyyy")
                    }
                    formatter={(value: any, name: any) => [
                      value,
                      name === "present_count" ? "נוכחים" : name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="present_count"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    animationDuration={1500}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (!payload || !payload.date) return null as any;
                      const isSelected = isSameDay(parseISO(payload.date), selectedDate);
                      if (isSelected) {
                        return (
                          <circle
                            key={`dot-${payload.date}`}
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="var(--primary)"
                            stroke="white"
                            strokeWidth={3}
                            style={{ filter: "drop-shadow(0 0 4px rgba(var(--primary-rgb), 0.5))" }}
                          />
                        );
                      }
                      return null as any;
                    }}
                    activeDot={{
                      r: 6,
                      fill: "var(--primary)",
                      stroke: "white",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>
    );
},
);
