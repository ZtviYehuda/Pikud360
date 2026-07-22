import * as React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useTheme } from "../../../providers/ThemeProvider";

const ageData = [
  { group: "18-21", count: 5 },
  { group: "22-25", count: 5 },
  { group: "26-30", count: 4 },
  { group: "31-35", count: 4 },
  { group: "36-40", count: 5 },
  { group: "41-50", count: 4 },
  { group: "+50", count: 4 },
];

export const AgeChart: React.FC = () => {
  const { isDark } = useTheme();

  const tickColor = isDark ? "#94A3B8" : "#64748B";
  const labelColor = isDark ? "#CBD5E1" : "#475569";
  const barColor = isDark ? "#60A5FA" : "#93C5FD";
  const cursorColor = isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.5)";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full select-none text-right transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border">
          <span className="text-xs font-extrabold text-foreground">
            34.0
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            גיל ממוצע
          </span>
        </div>
        <h3 className="text-sm font-bold text-foreground font-heading">
          חתך גילאים
        </h3>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-48 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ageData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="28%"
          >
            <XAxis
              dataKey="group"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
              dy={6}
            />
            <Tooltip
              cursor={{ fill: cursorColor }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover text-popover-foreground border border-border text-xs px-2.5 py-1.5 rounded-lg shadow-md font-bold">
                      {`${payload[0].payload.group}: ${payload[0].value} מועסקים`}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              fill={barColor}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            >
              <LabelList
                dataKey="count"
                position="top"
                style={{ fill: labelColor, fontSize: 11, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
AgeChart.displayName = "AgeChart";
