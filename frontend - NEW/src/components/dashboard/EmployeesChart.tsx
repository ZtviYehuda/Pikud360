import {
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart2, PieChart as PieChartIcon, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmployeesChartProps {
  stats: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
  total: number;
  loading?: boolean;
  onStatusClick?: (statusId: number, statusName: string, color: string) => void;
  title?: string;
  unitName?: string;
  totalInUnit?: number;
  totalEmployeesInScope?: number;
  selectedUnitId?: number | null;
  selectedDate?: Date;
  selectedStatusId?: number | null;
  filterTags?: string[];
  hasArchiveAccess?: boolean;
  onRequestRestore?: () => void;
  hideHeader?: boolean;
  compact?: boolean;
}

const OFFICE_GROUP_NAME = "משרד";
const OFFICE_SUB_STATUSES = ["משרד", "מתקן חיצוני", "מהבית", "שטח"];

const EmployeesChartComponent = (
  {
    stats,
    total,
    onStatusClick,
    title = "מצבת כוח אדם",
    selectedDate = new Date(),
    unitName = "כלל היחידה",
    totalInUnit = 0,
    totalEmployeesInScope = 0,
    selectedStatusId = null,
    filterTags = [],
    compact = false,
    hideHeader = false,
  }: EmployeesChartProps,
  ref: any,
) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [isOfficeSelected, setIsOfficeSelected] = useState(false);
  const [hoveredEntry, setHoveredEntry] = useState<any | null>(null);

  useImperativeHandle(ref, () => ({
    download: handleDownload,
    share: handleWhatsAppShare,
  }));

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "white",
      } as any);
      const link = document.createElement("a");
      link.download = `attendance-snapshot-${format(selectedDate, "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast.error("שגיאה בהורדת הגרף");
    }
  };

  const handleWhatsAppShare = async () => {
    if (cardRef.current === null) return;
    try {
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      } as any);
      if (!blob) return;
      const message = `*${title} - ${unitName}*\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}\n\nסיכום: ${total} שוטרים ביחידה.`;
      const file = new File([blob], `attendance-snapshot.png`, {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: message });
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

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync isOfficeSelected with global selection
  useEffect(() => {
    if (selectedStatusId === null) {
      // Keep drill-down state on filter clear so it does not close suddenly
      return;
    }
    const selectedStatus = stats.find((s) => s.status_id === selectedStatusId);
    if (
      selectedStatus &&
      OFFICE_SUB_STATUSES.includes(selectedStatus.status_name)
    ) {
      setIsOfficeSelected(true);
    } else if (selectedStatusId !== -999) {
      setIsOfficeSelected(false);
    }
  }, [selectedStatusId, stats]);

  const { chartData, officeSubItems, displayTotal } = useMemo(() => {
    let activeStats = stats || [];

    if (activeStats.length === 0) return { chartData: [], officeSubItems: [], displayTotal: 0 };

    const priorityMap: Record<string, number> = {
      משרד: 1,
      נוכח: 1,
      תגבור: 2,
      קורס: 3,
      חופשה: 4,
      חולה: 6,
      "לא דווח": 7,
    };

    const officeItems = activeStats.filter((s) =>
      OFFICE_SUB_STATUSES.includes(s.status_name),
    );
    const nonOfficeItems = activeStats.filter(
      (s) => !OFFICE_SUB_STATUSES.includes(s.status_name),
    );

    const totalOfficeCount = officeItems.reduce(
      (acc, curr) => acc + curr.count,
      0,
    );
    const mainOfficeColor =
      officeItems.find((s) => s.status_name === "משרד")?.color || "#22c55e";

    if (isOfficeSelected) {
      const data = officeItems.map((item) => {
        const rawName = item.status_name?.trim() || "";
        const name = rawName || "לא דווח";
        return {
          id: item.status_id === null ? -1 : item.status_id,
          name,
          value: item.count,
          fill: item.color || "#94a3b8",
          percentage:
            totalOfficeCount > 0 ? Math.round((item.count / totalOfficeCount) * 100) : 0,
          isGroup: false,
        };
      });
      const sortedData = data.sort(
        (a, b) =>
          (priorityMap[a.name] || 99) - (priorityMap[b.name] || 99),
      );
      return { chartData: sortedData, officeSubItems: officeItems, displayTotal: totalOfficeCount };
    }

    const processedStats = [
      ...nonOfficeItems,
      ...(totalOfficeCount > 0
        ? [
            {
              status_id: -999,
              status_name: OFFICE_GROUP_NAME,
              count: totalOfficeCount,
              color: mainOfficeColor,
              isGroup: true,
            },
          ]
        : []),
    ];

    const sortedStats = processedStats.sort(
      (a, b) =>
        (priorityMap[a.status_name] || 99) - (priorityMap[b.status_name] || 99),
    );
    const baseTotal = sortedStats.reduce((a, b) => a + b.count, 0);

    const data = sortedStats.map((item) => {
      const rawName = item.status_name?.trim() || "";
      const name =
        rawName === "חופשה חול" || rawName === 'חופשה חו"ל'
          ? "חו' חול"
          : rawName || "לא דווח";
      return {
        id: item.status_id === null ? -1 : item.status_id,
        name,
        value: item.count,
        fill: item.color || "#94a3b8",
        percentage:
          baseTotal > 0 ? Math.round((item.count / baseTotal) * 100) : 0,
        isGroup: (item as any).isGroup,
      };
    });

    return { chartData: data, officeSubItems: officeItems, displayTotal: total };
  }, [stats, isOfficeSelected, total]);

  const handleStatusInteraction = (entry: any) => {
    if (entry.isGroup) {
      setIsOfficeSelected(true);
      onStatusClick?.(entry.id, entry.name, entry.fill);
    } else {
      onStatusClick?.(entry.id, entry.name, entry.fill);
    }
  };

  // Fixed floating info card — shown below the chart when a segment is hovered

  return (
    <Card
      ref={cardRef}
      id="attendance-snapshot-card"
      className={cn(
        "bg-card/60 dark:bg-slate-900/60 backdrop-blur-2xl text-card-foreground rounded-[1.5rem] border-0 shadow-sm flex flex-col overflow-visible h-full relative transition-all",
        compact && "bg-transparent border-0 shadow-none",
      )}
    >
      <div
        className={cn(
          "pt-1.5 pb-0 px-0 sm:pt-2 sm:pb-3 sm:px-0 md:pt-2.5 md:pb-3 md:px-0 flex-1 flex flex-col relative overflow-visible",
          compact && "pt-1 pb-1.5 sm:pt-1.5 sm:pb-2 px-0 sm:px-0",
        )}
      >
        {/* Header */}
        {!hideHeader ? (
          <div className="flex flex-row justify-between items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2.5 relative z-10 px-3 sm:px-4 md:px-6">
            <div className="flex gap-2 sm:gap-3 items-center min-w-0">
              {isOfficeSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onStatusClick?.(null as any, "", "");
                    setIsOfficeSelected(false);
                  }}
                  className="h-7 px-2.5 rounded-xl text-[10px] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all gap-1.5 border border-border/40 shrink-0 ml-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>חזרה</span>
                </Button>
              )}
              <div className="text-right flex flex-col min-w-0">
                <h3 className="text-[11.5px] sm:text-base font-black text-foreground tracking-tight flex items-center flex-wrap gap-1 sm:gap-2 truncate">
                  {isOfficeSelected ? (
                    <span className="text-primary font-black">פירוט משרד</span>
                  ) : (
                    <span>{title}</span>
                  )}
                  {filterTags.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {filterTags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[9px] h-5 px-2 font-black bg-primary/10 text-primary border-primary/30 rounded-md shadow-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </h3>
              </div>
            </div>

            <div className="bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg flex border border-border/50 backdrop-blur-md shrink-0 hidden sm:flex">
              <button
                onClick={() => setChartType("pie")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  chartType === "pie"
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-400",
                )}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  chartType === "bar"
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-400",
                )}
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute left-2 sm:left-4 top-2 sm:top-3 z-20 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg flex border border-border/40 backdrop-blur-md shrink-0 no-export">
            {isOfficeSelected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onStatusClick?.(null as any, "", "");
                  setIsOfficeSelected(false);
                }}
                className="h-7 px-2.5 rounded-xl text-[10px] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all gap-1.5 border border-border/40 shrink-0 ml-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>חזרה</span>
              </Button>
            )}
            <button
              onClick={() => setChartType("pie")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                chartType === "pie"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-400",
              )}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                chartType === "bar"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-400",
              )}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col relative p-0 mt-0 overflow-visible min-h-0">
          {chartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground font-bold tracking-tight">
              אין נתונים להצגה
            </div>
          ) : (
            <div
              className="flex flex-col flex-1 w-full min-h-[220px] sm:min-h-[240px] md:min-h-[320px] relative mt-0 overflow-visible cursor-pointer select-none"
              style={{ direction: "ltr" }}
              onDoubleClick={() => {
                if (isMobile) {
                  setChartType((prev) => (prev === "pie" ? "bar" : "pie"));
                }
              }}
              onClick={(e) => {
                if (isMobile) {
                  const isSvgBackground = 
                    e.target instanceof SVGElement && 
                    (e.target.classList.contains("recharts-surface") || e.target.tagName === "svg");
                  const isDivBackground = 
                    e.target instanceof HTMLDivElement && 
                    (e.target.classList.contains("recharts-wrapper") || e.target.classList.contains("flex-col"));

                  if (isSvgBackground || isDivBackground) {
                    setChartType((prev) => (prev === "pie" ? "bar" : "pie"));
                  }
                }
              }}
            >
              <ResponsiveContainer
                className="overflow-visible"
                width="100%"
                height="100%"
                minHeight={220}
              >
                {chartType === "pie" ? (
                  <PieChart
                    className="overflow-visible"
                    margin={{
                      left: isMobile ? 42 : 60,
                      right: isMobile ? 42 : 60,
                      top: isMobile ? 12 : 15,
                      bottom: isMobile ? 12 : 15,
                    }}
                  >
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? "38%" : "36%"}
                      outerRadius={isMobile ? "54%" : "53%"}
                      paddingAngle={4}
                      minAngle={15}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={false}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        outerRadius: outerR,
                        name,
                        percentage,
                      }: any) => {
                        const isSingle = chartData.length === 1;
                        const RADIAN = Math.PI / 180;
                        const angle = isSingle ? 270 : midAngle;
                        const cos = Math.cos(-angle * RADIAN);
                        const sin = Math.sin(-angle * RADIAN);

                        // Shorten long names slightly on mobile (more space now)
                        const displayName = isMobile && name.length > 7
                          ? name.slice(0, 6) + "…"
                          : name;

                        const offset = isMobile ? 10 : 24;
                        const sx = cx + outerR * cos;
                        const sy = cy + outerR * sin;
                        const mx = cx + (outerR + offset) * cos;
                        const my = cy + (outerR + offset) * sin;
                        const tx = isSingle
                          ? mx
                          : mx + (cos >= 0 ? 1 : -1) * (isMobile ? 8 : 16);

                        const textAnchor = isSingle
                          ? "middle"
                          : cos >= 0
                            ? "start"
                            : "end";

                        const textX = isSingle ? tx : tx + (cos >= 0 ? 4 : -4);
                        const textY = isSingle ? my + 14 : my;

                        return (
                          <g>
                            <path
                              d={isSingle ? `M${sx},${sy}L${mx},${my}` : `M${sx},${sy}L${mx},${my}L${tx},${my}`}
                              stroke="rgba(148, 163, 184, 0.45)"
                              strokeWidth={1}
                              fill="none"
                            />
                            <circle
                              cx={sx}
                              cy={sy}
                              r={2}
                              fill="rgba(148, 163, 184, 0.8)"
                            />

                            <text
                              x={textX}
                              y={textY}
                              fill="currentColor"
                              textAnchor={textAnchor}
                              dominantBaseline="central"
                              className={cn(
                                "font-black fill-slate-700 dark:fill-slate-300",
                                isMobile ? "text-[9.5px]" : "text-[12px]",
                              )}
                            >
                              {`${displayName} (${percentage}%)`}
                            </text>
                          </g>
                        );
                      }}
                      labelLine={false} // Disable default label line since we draw our own segmented path
                    >
                      {chartData.map((entry, index) => {
                        const isSelected =
                          selectedStatusId === entry.id ||
                          (entry.isGroup &&
                            officeSubItems.some(
                              (s) => s.status_id === selectedStatusId,
                            ));
                        const hasSelection = selectedStatusId !== null && selectedStatusId !== -999;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            fillOpacity={!hasSelection || isSelected ? 1 : 0.25}
                            stroke={isSelected ? entry.fill : "none"}
                            strokeWidth={isSelected ? 3 : 0}
                            strokeOpacity={0.8}
                            className="cursor-pointer transition-all duration-500 outline-none hover:brightness-110"
                            onClick={() => handleStatusInteraction(entry)}
                            onMouseEnter={() => setHoveredEntry(entry)}
                            onMouseLeave={() => setHoveredEntry(null)}
                          />
                        );
                      })}
                    </Pie>
                    <text
                      x="50%"
                      y="50%"
                      dy={-3}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-black fill-slate-900 dark:fill-white"
                      style={{
                        fontSize: isMobile ? "20px" : "28px",
                        fontWeight: 900,
                      }}
                    >
                      {displayTotal}
                    </text>
                    <text
                      x="50%"
                      y="50%"
                      dy={14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-black fill-slate-400 dark:fill-slate-500"
                      style={{
                        fontSize: "9px",
                        fontWeight: 900,
                      }}
                    >
                      סה"כ
                    </text>
                  </PieChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 25, right: 10, left: 10, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={isMobile ? 15 : 20}
                      tick={{
                        fontSize: isMobile ? 11 : 13,
                        fontWeight: 900,
                        fill: "var(--foreground)",
                      }}
                    />
                    <YAxis
                      hide={true}
                      domain={[0, totalEmployeesInScope || 10]}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      wrapperStyle={{ zIndex: 100, transition: "none" }}
                      isAnimationActive={false}
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div
                            dir="rtl"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm pointer-events-none min-w-[160px]"
                          >
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">{d.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">{isOfficeSelected ? "מפירוט משרד" : "מכלל היחידה"}</span>
                            </div>
                            <div className="mr-auto flex items-baseline gap-1">
                              <span className="font-extrabold text-primary dark:text-blue-400 text-base tabular-nums">{d.value}</span>
                              <span className="text-[10px] text-slate-400 font-bold">שוטרים</span>
                              <span className="text-[10px] font-black text-slate-500 mr-1">{d.percentage}%</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      barSize={isMobile ? 16 : 24}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="value"
                        content={(props: any) => {
                          const { x, y, width, value } = props;
                          if (value === undefined || value === null || value === 0) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 8}
                              fill="var(--foreground)"
                              textAnchor="middle"
                              className="text-[10px] sm:text-xs font-black fill-slate-700 dark:fill-slate-300"
                            >
                              {value}
                            </text>
                          );
                        }}
                      />
                      {chartData.map((entry, index) => {
                        const isSelected =
                          selectedStatusId === entry.id ||
                          (entry.isGroup &&
                            officeSubItems.some(
                              (s) => s.status_id === selectedStatusId,
                            ));
                        const hasSelection = selectedStatusId !== null && selectedStatusId !== -999;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            fillOpacity={!hasSelection || isSelected ? 1 : 0.25}
                            className="cursor-pointer transition-all duration-500"
                            onClick={() => handleStatusInteraction(entry)}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>

            </div>
          )}

          {/* Fixed Hover Info Card — stays in place, only content updates */}
          {chartType === "pie" && (
            <div
              className="mx-3 sm:mx-4 md:mx-6 mb-3"
              style={{
                opacity: hoveredEntry ? 1 : 0,
                transform: hoveredEntry ? 'scale(1)' : 'scale(0.98)',
                transition: 'opacity 120ms ease, transform 120ms ease',
                pointerEvents: 'none',
                minHeight: '56px',
              }}
            >
              {hoveredEntry && (
                <div
                  dir="rtl"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: hoveredEntry.fill }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">
                      {hoveredEntry.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {isOfficeSelected ? 'מפירוט משרד' : 'מכלל היחידה'}
                    </span>
                  </div>
                  <div className="mr-auto flex items-baseline gap-1">
                    <span className="font-extrabold text-primary dark:text-blue-400 text-base tabular-nums leading-none">
                      {hoveredEntry.value}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">שוטרים</span>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 mr-1">
                      {hoveredEntry.percentage}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const EmployeesChart = forwardRef(EmployeesChartComponent);
