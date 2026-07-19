import * as React from "react";
import { CalendarRange } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

interface UpcomingEventsWidgetProps {
  loading: boolean;
  error: boolean;
}

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
  loading,
  error,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarRange className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת אירועים קרובים</span>
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

  const events = [
    { label: "רענון רישיון חובש - רס\"ר יוסי מזרחי", date: "עוד 14 יום", type: "CERTIFICATE", category: "warning" },
    { label: "יציאה לחופשה - סרן נועה כהן", date: "מחר", type: "VACATION", category: "info" },
  ];

  return (
    <Card className="h-full select-none">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">אירועים ורענונים קרובים</span>
          <CalendarRange className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 overflow-y-auto max-h-[300px]">
        {events.map((evt, idx) => (
          <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-enterprise-border rounded-enterprise-md text-right">
            <div>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-350 block leading-none">{evt.label}</span>
              <span className="text-[9px] text-slate-400 font-semibold block mt-1">{evt.date}</span>
            </div>
            <Badge variant={evt.category === "warning" ? "warning" : "info"} className="text-[8px] font-bold">
              {evt.type === "CERTIFICATE" ? "הסמכה" : "חופשה"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
UpcomingEventsWidget.displayName = "UpcomingEventsWidget";
