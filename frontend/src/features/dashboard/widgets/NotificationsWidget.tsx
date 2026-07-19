import * as React from "react";
import { BellRing, Mail } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { NotificationDTO } from "../types";

interface NotificationsWidgetProps {
  notifications?: NotificationDTO[];
  loading: boolean;
  error: boolean;
}

export const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  notifications = [],
  loading,
  error,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <BellRing className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת הודעות מערכת</span>
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

  return (
    <Card className="h-full select-none">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">הודעות מערכת כלליות</span>
          <BellRing className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 overflow-y-auto max-h-[300px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-450">
            <Mail className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold">אין הודעות חדשות בתיבה.</span>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-enterprise-border rounded-enterprise-md text-right relative"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-start">
                  {!item.isRead && (
                    <Badge variant="info" className="text-[8px] px-1 h-4 rounded-full font-bold">חדש</Badge>
                  )}
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.body}
                </p>
              </div>

              <span className="text-[9px] text-slate-400 font-semibold shrink-0 self-center">
                {new Date(item.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
NotificationsWidget.displayName = "NotificationsWidget";
