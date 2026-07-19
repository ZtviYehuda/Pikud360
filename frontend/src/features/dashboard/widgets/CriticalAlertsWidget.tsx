import * as React from "react";
import { AlertOctagon, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { AlertDTO } from "../types";

interface CriticalAlertsWidgetProps {
  alerts?: AlertDTO[];
  loading: boolean;
  error: boolean;
  onResolve?: (id: string) => void;
}

export const CriticalAlertsWidget: React.FC<CriticalAlertsWidgetProps> = ({
  alerts = [],
  loading,
  error,
  onResolve,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertOctagon className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת התראות קריטיות</span>
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

  const criticals = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "WARNING");

  return (
    <Card className="h-full select-none">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">התראות קריטיות פעילות</span>
          <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 overflow-y-auto max-h-[300px]">
        {criticals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-emerald-600">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
            <span className="text-xs font-bold">המערכת תקינה. אין התראות קריטיות פעילות להיום.</span>
          </div>
        ) : (
          criticals.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-enterprise-md border text-right select-none ${
                alert.severity === "CRITICAL"
                  ? "bg-red-50/30 border-red-200 dark:border-red-900"
                  : "bg-amber-50/30 border-amber-200 dark:border-amber-900"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 justify-start">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      alert.severity === "CRITICAL" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {alert.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-1 leading-relaxed">
                  {alert.description}
                </p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold block mt-1.5">
                  {new Date(alert.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              
              {onResolve && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolve(alert.id)}
                  className="text-[10px] font-bold h-6 px-2 hover:bg-slate-100 shrink-0 self-center"
                >
                  טפל
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
CriticalAlertsWidget.displayName = "CriticalAlertsWidget";
