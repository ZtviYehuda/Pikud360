import * as React from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";

interface TodayReadinessWidgetProps {
  score?: number;
  threshold?: number;
  loading: boolean;
  error: boolean;
}

export const TodayReadinessWidget: React.FC<TodayReadinessWidgetProps> = ({
  score = 0,
  threshold = 85,
  loading,
  error,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldAlert className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה הערכת מוכנות</span>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="h-44 bg-slate-100 dark:bg-slate-850 rounded-enterprise-md" />
      </Card>
    );
  }

  const isBelowThreshold = score < threshold;
  const strokeColor = isBelowThreshold ? "#ef4444" : "#10b981"; // Red vs Emerald

  // Arc math parameters for SVG semicircles
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference / 2;
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  return (
    <Card className="h-full select-none">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">מדד מוכנות גדודי</span>
          {isBelowThreshold ? (
            <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
          ) : (
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        {/* SVG gauge wrapper */}
        <div className="relative w-40 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform translate-y-2" viewBox="0 0 120 70">
            {/* Background Semicircle */}
            <path
              d="M 10,60 A 50,50 0 0,1 110,60"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="dark:stroke-slate-800"
            />
            {/* Progress Semicircle */}
            <path
              d="M 10,60 A 50,50 0 0,1 110,60"
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Centered Score text */}
          <div className="absolute bottom-1 flex flex-col items-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
              {score}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 mt-1">
              רף מוגדר: {threshold}%
            </span>
          </div>
        </div>

        {/* Action description info card */}
        <div className="mt-2 text-center">
          {isBelowThreshold ? (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-full border border-red-100 dark:border-red-900 inline-block">
              חריגה מרמת המוכנות המבצעית
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-900 inline-block">
              כוח הכוננות עומד בדרישות
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
TodayReadinessWidget.displayName = "TodayReadinessWidget";
