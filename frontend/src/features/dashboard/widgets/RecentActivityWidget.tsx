import * as React from "react";
import { History, Check, User, CalendarDays, KeyRound } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { ActivityDTO } from "../types";

interface RecentActivityWidgetProps {
  activities?: ActivityDTO[];
  loading: boolean;
  error: boolean;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  activities = [],
  loading,
  error,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת יומן פעילויות</span>
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

  const categoryIcons = {
    WORKFORCE: <User className="h-3 w-3 text-emerald-500" />,
    SCHEDULING: <CalendarDays className="h-3 w-3 text-blue-500" />,
    SYSTEM: <KeyRound className="h-3 w-3 text-slate-500" />,
  };

  return (
    <Card className="h-full select-none">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">פעילויות אחרונות במרחב</span>
          <History className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 overflow-y-auto max-h-[300px]">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-450">
            <Check className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold">אין פעילויות רשומות ביממה האחרונה.</span>
          </div>
        ) : (
          <div className="relative border-r border-slate-200 dark:border-slate-800 pr-4 mr-2 space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="relative text-right">
                {/* Timeline node icon indicator */}
                <span className="absolute -right-[23px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-enterprise-border">
                  {categoryIcons[act.category]}
                </span>
                
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block leading-none">{act.actorName}</span>
                  <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-1">{act.actionDescription}</p>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-1">
                    {new Date(act.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
RecentActivityWidget.displayName = "RecentActivityWidget";
