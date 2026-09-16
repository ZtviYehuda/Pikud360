import { useRef, useMemo, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, X } from "lucide-react";
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

    const handleBarClick = (entry: any) => {
      if (!onDateSelect || !entry) return;
      const rawDate = entry.rawDate || entry.date || entry.date_str;
      if (!rawDate) return;

      try {
        let targetDate: Date;
        if (typeof rawDate === "string" && rawDate.includes("-")) {
          const parts = rawDate.split("T")[0].split("-").map(Number);
          targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          targetDate = parseISO(rawDate);
        }

        const today = new Date();
        if (entry.isSelected && !isSameDay(targetDate, today)) {
          onDateSelect(today);
        } else {
          onDateSelect(targetDate);
        }
      } catch (err) {
        console.error("Error selecting date from trend chart:", err);
      }
    };

    const [containerWidth, setContainerWidth] = useState<number>(600);

    useEffect(() => {
      if (!cardRef.current) return;
      const updateWidth = () => {
        if (cardRef.current) {
          const w = cardRef.current.clientWidth;
          if (w > 0) setContainerWidth(w);
        }
      };
      updateWidth();

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            setContainerWidth(entry.contentRect.width);
          }
        }
      });

      observer.observe(cardRef.current);
      return () => observer.disconnect();
    }, []);

    // Responsive columns: on mobile, sample columns (every ~4 days) so all fit on ONE screen with generous gaps
    const displayedData = useMemo(() => {
      if (!chartData.length) return [];
      const total = chartData.length;

      // On desktop (width >= 600px) or if total <= 8 (weekly 7 days), show all columns
      if (containerWidth >= 600 || total <= 8) {
        return chartData;
      }

      // On mobile / narrow screens:
      // Show ~7-8 columns that fit comfortably with generous gaps (~35px per column slot)
      const effectiveWidth = Math.max(260, containerWidth - 45);
      const targetColumns = Math.max(6, Math.min(9, Math.floor(effectiveWidth / 35)));
      const step = Math.max(2, Math.round((total - 1) / (targetColumns - 1)));

      const indices = new Set<number>();
      // 1. Current date (today) is ALWAYS the primary anchor on the right
      indices.add(total - 1);

      // 2. Step backwards (e.g. every 4 days)
      let curr = total - 1 - step;
      while (curr >= 0) {
        indices.add(curr);
        curr -= step;
      }

      // 3. Include start date if not too close
      const earliest = Math.min(...Array.from(indices));
      if (earliest >= Math.floor(step * 0.75)) {
        indices.add(0);
      }

      // 4. Ensure currently selected date is always visible
      const selectedIndex = chartData.findIndex((d: any) => d.isSelected);
      if (selectedIndex !== -1) {
        indices.add(selectedIndex);
      }

      const sortedIndices = Array.from(indices).sort((a, b) => a - b);
      return sortedIndices.map((i) => chartData[i]).filter(Boolean);
    }, [chartData, containerWidth]);

    // Responsive ticks: for mobile sampled view (<= 8 columns), show date on each column
    const visibleTicks = useMemo(() => {
      if (!displayedData.length) return [];
      // On mobile / sampled view (8 or fewer columns), display date for all of them
      if (displayedData.length <= 8) {
        return displayedData.map((d: any) => d.formattedDate);
      }

      // On desktop with full columns:
      const effectiveWidth = Math.max(260, containerWidth - 60);
      const maxLabels = Math.max(4, Math.min(10, Math.floor(effectiveWidth / 65)));
      const idealStep = Math.max(2, Math.round((displayedData.length - 1) / (maxLabels - 1)));

      const tickIndices = new Set<number>();
      tickIndices.add(displayedData.length - 1); // Rightmost item always labeled (Today)

      let curr = displayedData.length - 1 - idealStep;
      while (curr >= 0) {
        tickIndices.add(curr);
        curr -= idealStep;
      }

      const firstTick = Math.min(...Array.from(tickIndices));
      if (firstTick >= Math.floor(idealStep * 0.75)) {
        tickIndices.add(0);
      }

      const sorted = Array.from(tickIndices).sort((a, b) => a - b);
      return sorted.map((idx) => displayedData[idx]?.formattedDate).filter(Boolean);
    }, [displayedData, containerWidth]);

    const hasCustomSelection = useMemo(() => {
      return chartData.some((d: any) => d.isSelected && !d.isToday);
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
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/40 space-y-1.5 sm:space-y-2">
            {/* Top Row: Title + Icon on right, Range Selector Pills on left */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                  מגמת נוכחות וזמינות
                </CardTitle>
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
            </div>

            {/* Bottom Row: Subtitle on right, Average Badge on left */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                {unitName} • {range === 7 ? "שבועי (7 ימים)" : "חודשי (30 ימים)"}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  variant="secondary"
                  className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0"
                >
                  ממוצע {averagePct}%
                </Badge>
                {selectedDate && !isSameDay(selectedDate, new Date()) && (
                  <Badge
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateSelect?.(new Date());
                    }}
                    className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30 flex items-center gap-1 cursor-pointer hover:bg-primary/20 transition-all shrink-0 no-export"
                    title="לחץ לאיפוס לתאריך היום"
                  >
                    <span>תאריך: {format(selectedDate, "dd/MM")}</span>
                    <X className="w-3 h-3" />
                  </Badge>
                )}
              </div>
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
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} initialDimension={{ width: 450, height: 270 }}>
                <BarChart
                  data={displayedData}
                  margin={{ top: 16, right: 16, left: -10, bottom: 6 }}
                  barCategoryGap={displayedData.length <= 8 ? "28%" : displayedData.length <= 16 ? "20%" : "12%"}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      handleBarClick(e.activePayload[0].payload);
                    }
                  }}
                >
                  <defs>
                    {/* Pattern for the current day: diagonal stripes in the same blue palette */}
                    <pattern
                      id="todayPattern"
                      patternUnits="userSpaceOnUse"
                      width="8"
                      height="8"
                      patternTransform="rotate(45)"
                    >
                      <rect width="8" height="8" fill="#60a5fa" />
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#2563eb" strokeWidth="2.5" />
                    </pattern>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.15)"
                  />

                  <XAxis
                    dataKey="formattedDate"
                    ticks={visibleTicks}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const entry = displayedData.find((d: any) => d.formattedDate === payload.value);
                      const isToday = entry?.isToday;
                      const isSelected = Boolean(entry?.isSelected);
                      const isCustomSelected = isSelected && hasCustomSelection;

                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={14}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={isToday || isCustomSelected ? 800 : 600}
                            fill={
                              isCustomSelected
                                ? "#2563eb"
                                : isToday
                                ? "#2563eb"
                                : "var(--color-muted-foreground, #94a3b8)"
                            }
                            fontFamily="Noto Sans Hebrew, sans-serif"
                          >
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />

                  <YAxis
                    width={60}
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground, #94a3b8)",
                      fontFamily: "Noto Sans Hebrew, sans-serif",
                      fontWeight: 600,
                      dx: -24,
                      textAnchor: "end",
                    }}
                    tickFormatter={(val) => `${val}%`}
                  />

                  <Tooltip
                    cursor={false}
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
                              <span className="text-[9px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">
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
                                "text-blue-500 dark:text-blue-400"
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
                    maxBarSize={30}
                    isAnimationActive={false}
                    onClick={(entry: any) => {
                      if (entry && (entry.rawDate || entry.formattedDate)) {
                        handleBarClick(entry);
                      }
                    }}
                  >
                    {displayedData.map((entry: any, index: number) => {
                      const isCustomSelected = entry.isSelected && hasCustomSelection;
                      const isToday = entry.isToday;

                      // Fill color:
                      // Selected: rich primary blue
                      // Today: subtle striped blue
                      // Default: clean soft blue
                      const fill = isCustomSelected
                        ? "#3b82f6"
                        : isToday
                        ? "url(#todayPattern)"
                        : "#60a5fa";

                      // Stroke:
                      // Selected: clean, refined single dashed border
                      // Today: solid accent border
                      // Others: none
                      const stroke = isCustomSelected
                        ? "#2563eb"
                        : isToday
                        ? "#2563eb"
                        : "transparent";

                      const strokeWidth = isCustomSelected ? 2 : isToday ? 1.5 : 0;
                      const strokeDasharray = isCustomSelected ? "4 3" : undefined;

                      const opacity = hasCustomSelection
                        ? (entry.isSelected ? 1 : 0.35)
                        : 1;

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          fillOpacity={opacity}
                          className="transition-all duration-200 hover:brightness-115 hover:opacity-100 cursor-pointer outline-none"
                          onClick={() => handleBarClick(entry)}
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
