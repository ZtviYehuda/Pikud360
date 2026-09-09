import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
  averageAge: number;
  totalEmployees: number;
  onRangeSelect?: (range: string) => void;
  selectedRange?: string;
  selectedRanges?: string[];
  filterTags?: string[];
}

export const AgeDistributionChart = ({
  data,
  averageAge,
  totalEmployees,
  onRangeSelect,
  selectedRange = "all",
  selectedRanges = [],
  filterTags = [],
}: AgeDistributionChartProps) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const chartData = useMemo(() => {
    // Normalize data safely if passed as an object or array
    const rawList: { range: string; count: number }[] = Array.isArray(data)
      ? data
      : data && typeof data === "object"
      ? Object.entries(data).map(([range, count]) => ({
          range: String(range),
          count: typeof count === "number" ? count : Number(count) || 0,
        }))
      : [];

    if (!isMobile) {
      // Default desktop ranges to keep graph structured and consistent
      const defaultDesktop = [
        { range: "18-21", count: 0 },
        { range: "22-25", count: 0 },
        { range: "26-30", count: 0 },
        { range: "31-35", count: 0 },
        { range: "36-40", count: 0 },
        { range: "41-50", count: 0 },
        { range: "50+", count: 0 },
      ];

      // Merge backend data
      rawList.forEach((item) => {
        const match = defaultDesktop.find((d) => d.range === item.range);
        if (match) {
          match.count = item.count;
        } else {
          defaultDesktop.push({ range: item.range, count: item.count });
        }
      });

      return defaultDesktop;
    }

    // Group ranges for mobile: 18-25, 26-35, 36-99 (displayed as 36+)
    const grouped = [
      { range: "18-25", count: 0 },
      { range: "26-35", count: 0 },
      { range: "36-99", count: 0 },
    ];

    rawList.forEach((item) => {
      const cleanRange = (item.range || "").replace(/\s+/g, "");
      let min = 0;
      let max = 0;
      if (cleanRange.includes("+")) {
        min = parseInt(cleanRange) || 0;
        max = 999;
      } else if (cleanRange.includes("-")) {
        const parts = cleanRange.split("-");
        min = parseInt(parts[0]) || 0;
        max = parseInt(parts[1]) || 999;
      } else {
        min = parseInt(cleanRange) || 0;
        max = min;
      }

      if (min >= 18 && max <= 25) {
        grouped[0].count += item.count;
      } else if (min >= 26 && max <= 35) {
        grouped[1].count += item.count;
      } else if (min >= 36) {
        grouped[2].count += item.count;
      }
    });

    return grouped;
  }, [data, isMobile]);

  const isAnyFilterActive = useMemo(() => {
    if (selectedRanges && selectedRanges.length > 0) return true;
    return selectedRange !== "all" && !!selectedRange;
  }, [selectedRange, selectedRanges]);

  const activeRangesList = useMemo(() => {
    if (selectedRanges && selectedRanges.length > 0) return selectedRanges;
    if (selectedRange && selectedRange !== "all") return [selectedRange];
    return [];
  }, [selectedRange, selectedRanges]);

  const isSelectedRange = useMemo(() => {
    if (!isAnyFilterActive || activeRangesList.length === 0) return () => false;

    const parseRange = (r: string) => {
      if (r.includes("+")) return { min: parseInt(r) || 0, max: 999 };
      if (r.includes("-")) {
        const parts = r.split("-");
        return { min: parseInt(parts[0]) || 0, max: parseInt(parts[1]) || 999 };
      }
      const val = parseInt(r) || 0;
      return { min: val, max: val };
    };

    const parsedActives = activeRangesList.map(parseRange);

    return (entryRange: string) => {
      if (activeRangesList.includes(entryRange)) return true;
      if (isMobile) {
        const ent = parseRange(entryRange);
        return parsedActives.some(
          (sel) => sel.min >= ent.min && sel.max <= ent.max
        );
      }
      return false;
    };
  }, [isAnyFilterActive, activeRangesList, isMobile]);

  const hasData = useMemo(() => {
    return chartData.some((d) => d.count > 0);
  }, [chartData]);

  return (
    <Card
      id="age-distribution-card"
      className="bg-card/70 dark:bg-card/50 backdrop-blur-md text-card-foreground rounded-2xl border border-border/60 shadow-xs flex flex-col overflow-hidden h-full relative transition-all"
    >
      {/* Header matching Attendance Trend exactly */}
      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 flex flex-row items-center justify-between space-y-0 border-b border-border/40 gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight whitespace-nowrap shrink-0">
              חתך גילאים
            </CardTitle>
            <Badge
              variant="secondary"
              className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0"
            >
              גיל ממוצע: {averageAge}
            </Badge>
            {filterTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {filterTags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-[9px] h-5 px-2 font-bold bg-background/25 text-primary border-primary/20 backdrop-blur-sm whitespace-nowrap rounded-md"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <CardDescription className="text-xs text-muted-foreground truncate">
            התפלגות שוטרים לפי קבוצות גיל
          </CardDescription>
        </div>
      </CardHeader>

      {/* Card Content & Chart matching Attendance Trend */}
      <CardContent className="flex-1 p-3 sm:p-5 flex flex-col justify-between min-h-0">
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground font-bold tracking-tight text-xs sm:text-sm">
            אין נתונים להצגה
          </div>
        ) : (
          <div className="w-full flex-1 min-h-[260px] sm:min-h-[290px] min-w-0 flex flex-col">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={240}
              initialDimension={{ width: 300, height: 270 }}
            >
              <BarChart
                data={chartData}
                margin={{ top: 16, right: 8, left: 8, bottom: 4 }}
                barCategoryGap="18%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(148, 163, 184, 0.15)"
                />

                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-muted-foreground, #94a3b8)",
                    fontFamily: "Noto Sans Hebrew, sans-serif",
                    fontWeight: 600,
                  }}
                  dy={6}
                  tickFormatter={(tick) =>
                    tick === "36-99" ? "36+" : tick === "50+" ? "+50" : tick
                  }
                />

                <YAxis
                  hide
                  domain={[
                    0,
                    (dataMax: number) =>
                      Math.max(Math.ceil(dataMax * 1.25), 5),
                  ]}
                />

                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.12)", radius: [6, 6, 0, 0] }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const displayRange =
                        payload[0].payload.range === "36-99"
                          ? "36+"
                          : payload[0].payload.range;
                      const count = payload[0].value;
                      return (
                        <div
                          className="bg-popover/95 backdrop-blur-md border border-border/70 shadow-xl rounded-xl p-3 text-right text-xs space-y-1.5 min-w-[130px]"
                          dir="rtl"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-1">
                            <span className="font-extrabold text-foreground">
                              טווח גילאים
                            </span>
                            <span className="text-[10px] font-black bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">
                              {displayRange}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <span className="text-muted-foreground font-medium">
                              כמות שוטרים:
                            </span>
                            <span className="font-black text-sm text-blue-500 dark:text-blue-400">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Bar
                  dataKey="count"
                  radius={[6, 6, 2, 2]}
                  maxBarSize={36}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => {
                    const isSelected = isSelectedRange(entry.range);
                    const fill = isSelected ? "#f43f5e" : "#60a5fa";

                    return (
                      <Cell
                        key={`cell-${index}`}
                        className={cn(
                          "transition-all duration-300 hover:opacity-85 outline-none",
                          entry.count > 0 || isSelected
                            ? "cursor-pointer"
                            : "cursor-default"
                        )}
                        onClick={() => {
                          if (entry.count > 0 || isSelected) {
                            onRangeSelect?.(entry.range);
                          }
                        }}
                        fill={fill}
                      />
                    );
                  })}
                  <LabelList
                    dataKey="count"
                    position="top"
                    content={(props: any) => {
                      const { x, y, width, value } = props;
                      if (value === undefined || value === null || value === 0)
                        return null;
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          textAnchor="middle"
                          className="text-[11px] font-bold fill-foreground"
                          style={{ fontFamily: "Noto Sans Hebrew, sans-serif" }}
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

