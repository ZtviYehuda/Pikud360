import * as React from "react";
import { motion } from "framer-motion";
import { Info, MessageCircle, Download } from "lucide-react";

interface ProgressItem {
  department: string;
  percentage: number;
  current: number;
  total: number;
}

const progressItems: ProgressItem[] = [
  { department: "מחלקה התעצמות", percentage: 50, current: 5, total: 10 },
  { department: "מחלקה טכנולוגית", percentage: 38, current: 3, total: 8 },
  { department: "מחלקה מענה מבצעי", percentage: 38, current: 5, total: 13 },
];

export const ProgressCard: React.FC = () => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-slate-950/40 transition-all duration-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full select-none text-right"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        {/* Actions top left */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors cursor-pointer"
            title="שיתוף ב-WhatsApp"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
          </button>
          <button
            className="p-1.5 hover:text-slate-700 dark:hover:text-slate-300 rounded-md transition-colors cursor-pointer"
            title="הורדה"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 justify-end text-slate-900 dark:text-white">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <h3 className="text-sm font-bold font-heading">
              השוואת כוח אדם
            </h3>
          </div>
          <div className="flex items-center gap-1 justify-end text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
            <span>כל היחידה</span>
            <span>·</span>
            <span>16/07/2026 - נוכחי</span>
          </div>
        </div>
      </div>

      {/* Department Progress List */}
      <div className="space-y-6 my-auto pt-4">
        {progressItems.map((item, idx) => (
          <div key={idx} className="space-y-2">
            {/* Header: Label on right, Count + Percentage on left */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-amber-600 dark:text-amber-400 text-xs">
                  {item.percentage}%
                </span>
                <span className="text-slate-400 text-[10px]">
                  {item.current}/{item.total}
                </span>
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {item.department}
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="h-3 w-full bg-amber-50 dark:bg-slate-800 rounded-full overflow-hidden flex justify-end">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-l from-amber-500 to-orange-500 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
ProgressCard.displayName = "ProgressCard";
