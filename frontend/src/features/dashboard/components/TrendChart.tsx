import * as React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../../providers/ThemeProvider";

const trendData = [
  { date: "18/06", value: 8 },
  { date: "20/06", value: 8 },
  { date: "22/06", value: 8 },
  { date: "24/06", value: 8 },
  { date: "26/06", value: 8 },
  { date: "28/06", value: 8 },
  { date: "30/06", value: 8 },
  { date: "02/07", value: 8 },
  { date: "04/07", value: 8 },
  { date: "06/07", value: 8 },
  { date: "08/07", value: 14 },
  { date: "10/07", value: 13 },
  { date: "12/07", value: 13 },
  { date: "14/07", value: 13 },
  { date: "16/07", value: 13 },
];

export const TrendChart: React.FC = () => {
  const [period, setPeriod] = React.useState<"monthly" | "weekly">("monthly");
  const { isDark } = useTheme();

  const tickColor = isDark ? "#94A3B8" : "#64748B";
  const strokeColor = isDark ? "#60A5FA" : "#3B82F6";
  const activeDotFill = isDark ? "#3B82F6" : "#2563EB";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99, y: 0 }}
      className="bg-card text-card-foreground border border-border/70 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-slate-950/40 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full select-none text-right transition-all duration-200"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        {/* Toggle Pills */}
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              period === "monthly"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            חודשי
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              period === "weekly"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            שבועי
          </button>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-foreground font-heading">
          מגמת זמינות — חודשי
        </h3>
      </div>

      {/* Area Chart */}
      <div className="h-48 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trendData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="availabilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              ticks={[0, 8, 14, 24, 31]}
              tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover text-popover-foreground border border-border text-xs px-2.5 py-1.5 rounded-lg shadow-md font-bold">
                      {`${payload[0].payload.date}: ${payload[0].value} זמינים`}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#availabilityGradient)"
              activeDot={{ r: 5, fill: activeDotFill, stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
TrendChart.displayName = "TrendChart";
