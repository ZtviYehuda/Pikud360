import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format, parseISO, isSameDay } from "date-fns";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";

interface TrendData {
  date?: string;
  date_str?: string;
  total_count?: number;
  total_employees?: number;
  present_count: number;
  absent_count?: number;
  percentage?: number;
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

export const AttendanceTrendCard = forwardRef(
  function AttendanceTrendCard(
    {
      data = [],
      loading,
      range = 30,
      className,
      unitName = "כלל היחידה",
      selectedDate = new Date(),
      onDateSelect,
      onRangeChange,
      hideHeader = false,
      totalEmployees = 0,
    }: AttendanceTrendCardProps,
    ref: any
  ) {
    const cardRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    const handleDownload = async () => {
      if (!cardRef.current) return;
      try {
        const dataUrl = await toPng(cardRef.current, {
          backgroundColor: "#ffffff",
          cacheBust: true,
          quality: 0.95,
          filter: (node) => {
            if (node.classList && node.classList.contains("no-export")) {
              return false;
            }
            return true;
          },
        });
        const link = document.createElement("a");
        link.download = `מגמת_נוכחות_${format(selectedDate, "yyyy-MM-dd")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("הגרף הורד בהצלחה");
      } catch (err) {
        toast.error("שגיאה בהורדת הגרף");
      }
    };

    const handleWhatsAppShare = async () => {
      if (!cardRef.current) return;
      try {
        const blob = await toBlob(cardRef.current, {
          backgroundColor: "#ffffff",
          cacheBust: true,
          quality: 0.95,
          filter: (node) => {
            if (node.classList && node.classList.contains("no-export")) {
              return false;
            }
            return true;
          },
        });
        if (!blob) return;
        const message = `*מגמת נוכחות וזמינות - ${unitName}*\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}\nטווח: ${range} ימים אחרונים`;
        const file = new File([blob], `attendance-trend.png`, {
          type: "image/png",
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "מגמת נוכחות וזמינות", text: message });
          return;
        }
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank",
        );
      } catch (err) {
        toast.error("שגיאה בשיתוף");
      }
    };

    const chartData = useMemo(() => {
      const rawList = Array.isArray(data) 
        ? data 
        : ((data as any)?.trend || (data as any)?.data || []);

      const todayDate = new Date();

      return rawList.map((item: any) => {
        const rawDate = item.date || item.date_str || "";
        let formattedDate = rawDate;
        let itemDate: Date | null = null;
        try {
          if (rawDate.includes("-")) {
            itemDate = parseISO(rawDate);
            formattedDate = format(itemDate, "dd/MM");
          }
        } catch {
          formattedDate = rawDate;
        }

        const total = item.total_count ?? item.total_employees ?? totalEmployees ?? 0;
        const present = item.present_count ?? 0;
        const pct = item.percentage ?? (total > 0 ? Math.round((present / total) * 100) : 0);
        const isToday = itemDate ? isSameDay(itemDate, todayDate) : false;
        const isSelected = itemDate && selectedDate ? isSameDay(itemDate, selectedDate) : false;

        return {
          rawDate,
          formattedDate,
          present,
          total,
          percentage: pct,
          isToday,
          isSelected,
        };
      });
    }, [data, totalEmployees, selectedDate]);

    const averagePct = useMemo(() => {
      if (!chartData.length) return 0;
      const sum = chartData.reduce((acc, curr) => acc + curr.percentage, 0);
      return Math.round(sum / chartData.length);
    }, [chartData]);

    const ranges = [
      { label: "7 ימים", value: 7 },
      { label: "30 ימים", value: 30 },
    ];

    return (
      <Card
        ref={cardRef}
        id="attendance-trend-card"
        className={cn(
          "bg-card/70 dark:bg-card/50 backdrop-blur-md text-card-foreground rounded-2xl border border-border/60 shadow-xs flex flex-col overflow-hidden h-full relative transition-all",
          className
        )}
      >
        {!hideHeader && (
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 flex flex-row items-center justify-between space-y-0 border-b border-border/40 gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight whitespace-nowrap shrink-0">
                  מגמת נוכחות וזמינות
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  ממוצע {averagePct}%
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground truncate flex items-center gap-3">
                <span>{unitName} • {range === 7 ? "שבועי (7 ימים)" : "חודשי (30 ימים)"}</span>
              </CardDescription>
            </div>

            {/* Range Selector Pills (7 / 30 Days) */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 sm:p-1 rounded-xl border border-border/40 shrink-0 no-export">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => onRangeChange?.(r.value)}
                  className={cn(
                    "px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                    range === r.value
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </CardHeader>
        )}

        <CardContent className="flex-1 p-3 sm:p-5 flex flex-col justify-between min-h-0">
          {loading && chartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center py-12">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-muted-foreground">טוען מגמת נוכחות...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-center text-muted-foreground py-12">
              <p className="text-xs font-semibold">אין נתוני מגמה לתקופה זו</p>
            </div>
          ) : (
            <div className="w-full flex-1 min-h-[260px] sm:min-h-[290px] min-w-0 flex flex-col">
              <div className="flex items-center justify-end gap-3 mb-2 px-2 text-[10px] sm:text-[11px] text-muted-foreground font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#60a5fa]" />
                  <span>שגרה</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f43f5e]" />
                  <span>היום / נבחר</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} initialDimension={{ width: 450, height: 270 }}>
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 12, left: -20, bottom: 4 }}
                  barCategoryGap={range === 7 ? "24%" : range === 30 ? "14%" : "6%"}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length && onDateSelect) {
                      const item = e.activePayload[0].payload;
                      if (item.rawDate) {
                        try {
                          onDateSelect(parseISO(item.rawDate));
                        } catch {}
                      }
                    }
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.15)"
                  />

                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    interval={range === 7 ? 0 : range === 30 ? 3 : 9}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground, #94a3b8)",
                      fontFamily: "Noto Sans Hebrew, sans-serif",
                      fontWeight: 600,
                    }}
                    dy={6}
                  />

                  <YAxis
                    width={36}
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground, #94a3b8)",
                      fontFamily: "Noto Sans Hebrew, sans-serif",
                      fontWeight: 600,
                      dx: -2,
                      textAnchor: "end",
                    }}
                    tickFormatter={(val) => `${val}%`}
                  />

                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.12)", radius: [6, 6, 0, 0] }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      const isHighlight = d.isToday || d.isSelected;
                      return (
                        <div
                          className="bg-popover/95 backdrop-blur-md border border-border/70 shadow-xl rounded-xl p-3 text-right text-xs space-y-1.5 min-w-[140px]"
                          dir="rtl"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-1">
                            <span className="font-extrabold text-foreground">{d.formattedDate}</span>
                            {d.isToday ? (
                              <span className="text-[9px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md">
                                היום
                              </span>
                            ) : d.isSelected ? (
                              <span className="text-[9px] font-black bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">
                                נבחר
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground font-medium">אחוז נוכחות:</span>
                            <span
                              className={cn(
                                "font-black text-sm",
                                isHighlight ? "text-rose-500" : "text-blue-500 dark:text-blue-400"
                              )}
                            >
                              {d.percentage}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground font-medium">נוכחים בפועל:</span>
                            <span className="font-bold text-foreground">
                              {d.present} / {d.total}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />

                  <Bar
                    dataKey="percentage"
                    radius={[6, 6, 2, 2]}
                    maxBarSize={36}
                    animationDuration={800}
                  >
                    {chartData.map((entry: any, index: number) => {
                      const isHighlight = entry.isToday || entry.isSelected;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isHighlight ? "#f43f5e" : "#60a5fa"}
                          className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
