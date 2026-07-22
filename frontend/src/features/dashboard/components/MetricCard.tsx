import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconBgColor = "bg-purple-100 dark:bg-purple-950/40",
  iconColor = "text-purple-600 dark:text-purple-400",
  className,
}) => {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between select-none text-right transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md dark:hover:shadow-slate-950/40 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer group",
        className
      )}
    >
      {/* Icon Pill Circle */}
      <div
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
          iconBgColor,
          iconColor
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Value & Title Block */}
      <div className="flex flex-col items-end text-right">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {title}
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {value}
          </span>
        </div>
        {subtext && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
            {subtext}
          </span>
        )}
      </div>
    </motion.div>
  );
};
MetricCard.displayName = "MetricCard";
