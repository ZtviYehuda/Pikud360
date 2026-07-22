import * as React from "react";
import { motion } from "framer-motion";
import { RefreshCw, RotateCcw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const statusData = [
  { name: "דיווח בדיקה ידני", value: 19, color: "#3B82F6", percent: "19%" },
  { name: "תפקוד", value: 16, color: "#F97316", percent: "16%" },
  { name: "חופשה", value: 16, color: "#EF4444", percent: "16%" },
  { name: "מחלה", value: 16, color: "#A855F7", percent: "16%" },
  { name: "קורס", value: 13, color: "#EAB308", percent: "13%" },
  { name: "משרד", value: 13, color: "#10B981", percent: "13%" },
  { name: "חו\"ל", value: 12, color: "#06B6D4", percent: "12%" },
  { name: "לא ידוע", value: 10, color: "#64748B", percent: "10%" },
];

export const StatusChart: React.FC = () => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full select-none text-right transition-colors"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <button className="p-1.5 hover:text-foreground rounded-md transition-colors cursor-pointer" title="אפס">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 hover:text-foreground rounded-md transition-colors cursor-pointer" title="רענן">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <h3 className="text-sm font-bold text-foreground font-heading">
          חלוקת סטטוסים
        </h3>
      </div>

      {/* Donut Chart with Center Total & Surrounding Labels */}
      <div className="relative h-56 w-full mt-2 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover text-popover-foreground border border-border text-xs px-2.5 py-1.5 rounded-lg shadow-md font-bold">
                      {`${payload[0].name}: ${payload[0].value}%`}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Central Total Overlay Hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-foreground leading-none">
            31
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
            סה"כ
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border text-[10px] font-bold">
        {statusData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-end gap-1.5">
            <span className="text-muted-foreground truncate">
              {item.name} ({item.percent})
            </span>
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};
StatusChart.displayName = "StatusChart";
