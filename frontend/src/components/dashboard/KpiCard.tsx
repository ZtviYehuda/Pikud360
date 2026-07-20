import { LucideIcon, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from "lucide-react";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";

// ==========================================
// KpiCardProps Interface
// ==========================================
export interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value?: string | number;
  trend?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
  };
  comparison?: string;
  description?: string;
  status?: "success" | "warning" | "danger" | "info" | "neutral";
  timestamp?: string;
  sparklineData?: number[];
  quickAction?: {
    label: string;
    onClick: () => void;
  };
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  empty?: boolean;
  selected?: boolean;
  onClick?: () => void;
  percentage?: string | number; // backwards compatibility
}

export default function KpiCard({
  icon: Icon,
  title,
  value,
  trend,
  comparison,
  description,
  status = "neutral",
  timestamp,
  sparklineData = [10, 15, 8, 12, 20, 16, 25],
  quickAction,
  loading = false,
  error,
  onRetry,
  empty = false,
  selected = false,
  onClick,
  percentage, // backwards compatibility
}: KpiCardProps) {
  
  // 1. Loading State
  if (loading) {
    return (
      <Card className="p-5 animate-pulse space-y-4 border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 select-none text-right">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-850">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </Card>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <Card className="p-5 border border-red-500/20 dark:border-red-500/10 bg-red-500/5 dark:bg-red-950/5 select-none text-right flex flex-col justify-between h-full min-h-[160px]">
        <div className="flex gap-2.5 items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-700 dark:text-red-400">{title}</h4>
            <p className="text-[10px] text-red-600/80 dark:text-red-400/80 leading-normal">{error}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex items-center gap-1.5 self-end text-[9px] font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer mt-3"
          >
            <RefreshCw className="h-3 w-3" />
            <span>נסה שוב</span>
          </button>
        )}
      </Card>
    );
  }

  // 3. Fallbacks for Backward Compatibility
  const displayValue = empty || value === undefined ? "—" : value;
  const displayTrend = trend || (percentage !== undefined ? { value: percentage, direction: "neutral" as const } : undefined);

  // 4. Status Dot Classes
  const statusColorMap = {
    success: "bg-emerald-500 ring-2 ring-emerald-500/20",
    warning: "bg-amber-500 ring-2 ring-amber-500/20",
    danger: "bg-red-500 ring-2 ring-red-500/20",
    info: "bg-cyan-500 ring-2 ring-cyan-500/20",
    neutral: "bg-slate-400 ring-2 ring-slate-400/10",
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group select-none text-right border cursor-pointer",
        selected
          ? "border-cyan-550/80 bg-cyan-550/5 ring-1 ring-cyan-550/40"
          : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
      
      {/* Header Row */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusColorMap[status])} />
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase leading-tight">
            {title}
          </h3>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850/60 text-slate-650 dark:text-slate-350 group-hover:scale-105 transition-transform shrink-0 border border-slate-100 dark:border-slate-800/80">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      {/* Main Metric & Trend */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
            {displayValue}
          </span>
          {displayTrend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold border",
                displayTrend.direction === "up"
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : displayTrend.direction === "down"
                  ? "bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400"
              )}
            >
              {displayTrend.direction === "up" && <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />}
              {displayTrend.direction === "down" && <ArrowDownRight className="h-2.5 w-2.5 shrink-0" />}
              <span>{displayTrend.value}%</span>
            </span>
          )}
        </div>

        {/* Dynamic Inline Sparkline Mini Chart */}
        {!empty && sparklineData && sparklineData.length > 0 && (
          <div className="w-16 h-8 opacity-75 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 30" className="w-full h-full">
              <path
                d={`M ${sparklineData
                  .map((val, idx) => {
                    const x = (idx / (sparklineData.length - 1)) * 100;
                    const max = Math.max(...sparklineData);
                    const min = Math.min(...sparklineData);
                    const range = max - min || 1;
                    const y = 28 - ((val - min) / range) * 26;
                    return `${x} ${y}`;
                  })
                  .join(" L ")}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cyan-600 dark:text-cyan-400"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Comparison Text */}
      {comparison && (
        <span className="text-[9px] text-slate-400 font-semibold tracking-wide block">
          {comparison}
        </span>
      )}

      {/* Description Text */}
      {description && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">
          {description}
        </p>
      )}

      {/* Footer Info & Actions */}
      {(timestamp || quickAction) && (
        <div className="flex justify-between items-center pt-2.5 mt-3 border-t border-slate-100 dark:border-slate-850/60">
          {timestamp ? (
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              {timestamp}
            </span>
          ) : (
            <div />
          )}
          {quickAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                quickAction.onClick();
              }}
              className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              {quickAction.label}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
