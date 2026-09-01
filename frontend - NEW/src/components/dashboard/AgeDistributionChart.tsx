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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
  averageAge: number;
  totalEmployees: number;
  onRangeSelect?: (range: string) => void;
  selectedRange?: string;
  filterTags?: string[];
}

export const AgeDistributionChart = ({
  data,
  averageAge,
  totalEmployees,
  onRangeSelect,
  selectedRange = "all",
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
      data.forEach((item) => {
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

    data.forEach((item) => {
      const cleanRange = item.range.replace(/\s+/g, "");
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

  const isSelectedRange = useMemo(() => {
    if (selectedRange === "all") return () => true;

    let selMin = 0;
    let selMax = 999;
    if (selectedRange.includes("+")) {
      selMin = parseInt(selectedRange) || 0;
    } else if (selectedRange.includes("-")) {
      const parts = selectedRange.split("-");
      selMin = parseInt(parts[0]) || 0;
      selMax = parseInt(parts[1]) || 999;
    } else {
      selMin = parseInt(selectedRange) || 0;
      selMax = selMin;
    }

    return (entryRange: string) => {
      if (entryRange === selectedRange) return true;

      let entMin = 0;
      let entMax = 999;
      if (entryRange.includes("+")) {
        entMin = parseInt(entryRange) || 0;
      } else if (entryRange.includes("-")) {
        const parts = entryRange.split("-");
        entMin = parseInt(parts[0]) || 0;
        entMax = parseInt(parts[1]) || 999;
      } else {
        entMin = parseInt(entryRange) || 0;
        entMax = entMin;
      }

      if (isMobile) {
        // If the selected range is inside the grouped range, highlight it
        return selMin >= entMin && selMax <= entMax;
      }
      return false;
    };
  }, [selectedRange, isMobile]);

  const hasData = useMemo(() => {
    return chartData.some((d) => d.count > 0);
  }, [chartData]);

  const maxCount = useMemo(() => {
    const counts = chartData.map((d) => d.count);
    const maxVal = Math.max(...counts, 0);
    return maxVal === 0 ? 5 : maxVal;
  }, [chartData]);

  return (
    <Card id="age-distribution-card" className="bg-card/70 dark:bg-card/50 backdrop-blur-md text-card-foreground rounded-2xl border border-border/60 shadow-xs flex flex-col overflow-hidden h-full relative transition-all">
      {/* Header matching Attendance Trend */}
      <div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between space-y-0 border-b border-border/40 gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
              חתך גילאים
            </h3>
            {filterTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {filterTags.map((tag, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-[9px] h-5 px-2 font-bold bg-background/25 text-primary border-primary/20 backdrop-blur-sm whitespace-nowrap rounded-md hover:bg-primary/5 transition-all"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            התפלגות שוטרים לפי קבוצות גיל
          </p>
        </div>
        
        {/* Average Age Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 py-1 px-2.5 rounded-lg">
            גיל ממוצע: {averageAge}
          </Badge>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex flex-col flex-1 w-full min-h-[170px] sm:min-h-[220px] md:min-h-[280px] relative mt-0 overflow-visible select-none px-2">
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center py-12 text-center text-muted-foreground font-bold tracking-tight text-xs sm:text-sm">
            אין נתונים להצגה
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={170} initialDimension={{ width: 300, height: 220 }}>
          <BarChart
            data={chartData}
            margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="4 4" 
              vertical={false} 
              stroke="var(--border)" 
              opacity={0.15}
            />

            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={isMobile ? 15 : 20}
              tick={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, fontFamily: "Noto Sans Hebrew, sans-serif", fill: "var(--foreground)" }}
              tickFormatter={(tick) => tick === "36-99" ? "36+" : tick}
            />
            <YAxis hide domain={[0, maxCount + 1]} />
            
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const displayRange = payload[0].payload.range === "36-99" ? "36+" : payload[0].payload.range;
                  const count = payload[0].value;
                  return (
                    <div className="bg-card border border-border rounded-xl p-3 shadow-md text-right min-w-[120px] space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                        טווח גילאים
                      </p>
                      <h4 className="text-xs sm:text-sm font-black text-foreground leading-none">
                        {displayRange}
                      </h4>
                      <div className="h-px bg-border/50 my-1.5" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground">כמות:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-primary tabular-nums">
                            {count}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground">שוטרים</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              barSize={isMobile ? 18 : 26}
              isAnimationActive={false}
            >
               {chartData.map((entry, index) => {
                const isSelected = isSelectedRange(entry.range);
                const isAnyFilterActive = selectedRange !== "all";

                let fill = "var(--primary)";
                let fillOpacity = 0.38;
                let stroke = "none";
                let strokeWidth = 0;

                if (isAnyFilterActive) {
                  if (isSelected) {
                    fill = "var(--primary)";
                    fillOpacity = 0.95;
                  } else {
                    fill = "var(--primary)";
                    fillOpacity = 0.12;
                  }
                } else {
                  fill = "var(--primary)";
                  fillOpacity = 0.38;
                }

                return (
                  <Cell 
                    key={`cell-${index}`} 
                    className={cn(
                      "transition-all outline-none hover:brightness-110",
                      (entry.count > 0 || isSelected) ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => {
                      if (entry.count > 0 || isSelected) {
                        onRangeSelect?.(entry.range);
                      }
                    }}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                );
              })}
              <LabelList
                dataKey="count"
                content={(props: any) => {
                  const { x, y, width, value } = props;
                  if (value === undefined || value === null || value === 0) return null;
                  return (
                    <text
                      x={x + width / 2}
                      y={y - 8}
                      textAnchor="middle"
                      className="text-[10px] sm:text-xs font-bold fill-slate-700 dark:fill-slate-300"
                      style={{ fontFamily: "Noto Sans Hebrew, sans-serif", fontWeight: 700 }}
                    >
                      {value}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
