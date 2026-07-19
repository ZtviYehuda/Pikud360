import * as React from "react";
import { UserCheck, UserMinus, ShieldAlert, Palmtree, GraduationCap, HardHat } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { WorkforceSummaryDTO } from "../types";

interface WorkforceSummaryWidgetProps {
  data?: WorkforceSummaryDTO;
  loading: boolean;
  error: boolean;
}

export const WorkforceSummaryWidget: React.FC<WorkforceSummaryWidgetProps> = ({
  data,
  loading,
  error,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldAlert className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת סיכום כוח אדם</span>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-20 bg-slate-100 dark:bg-slate-850 rounded-enterprise-md" />
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    { label: "נוכחים", count: data?.presentCount || 0, icon: <UserCheck className="h-4 w-4 text-emerald-500" />, border: "border-r-4 border-emerald-500" },
    { label: "חולים", count: data?.sickCount || 0, icon: <ShieldAlert className="h-4 w-4 text-red-500" />, border: "border-r-4 border-red-500" },
    { label: "נפקדים", count: data?.absentCount || 0, icon: <UserMinus className="h-4 w-4 text-amber-500" />, border: "border-r-4 border-amber-500" },
    { label: "חופשה", count: data?.vacationCount || 0, icon: <Palmtree className="h-4 w-4 text-blue-500" />, border: "border-r-4 border-blue-500" },
    { label: "קורס", count: data?.courseCount || 0, icon: <GraduationCap className="h-4 w-4 text-slate-500" />, border: "border-r-4 border-slate-500" },
    { label: "תגבורת", count: data?.reinforcementCount || 0, icon: <HardHat className="h-4 w-4 text-purple-500" />, border: "border-r-4 border-purple-500" },
  ];

  return (
    <div className="flex overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 w-full pb-3 md:pb-0 scrollbar-none snap-x snap-mandatory">
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          className={`min-w-[130px] md:min-w-0 flex-1 snap-start select-none hover:shadow-enterprise-xs transition-shadow ${stat.border}`}
        >
          <CardContent className="p-3 text-right flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">{stat.label}</span>
              <span className="shrink-0">{stat.icon}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                {stat.count}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-650 font-semibold">
                {data?.totalPersonnel ? `${Math.round((stat.count / data.totalPersonnel) * 100)}%` : "0%"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
WorkforceSummaryWidget.displayName = "WorkforceSummaryWidget";
