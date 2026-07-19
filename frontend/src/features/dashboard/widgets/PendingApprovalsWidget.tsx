import * as React from "react";
import { ClipboardList, Check } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { PendingApprovalsDTO } from "../types";

interface PendingApprovalsWidgetProps {
  data?: PendingApprovalsDTO;
  loading: boolean;
  error: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({
  data,
  loading,
  error,
  onApprove,
  onReject,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת אישורים ממתינים</span>
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
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">אישורים הממתינים לחתימתך ({data?.count || 0})</span>
          <ClipboardList className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 overflow-y-auto max-h-[300px]">
        {!data || data.requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-450">
            <Check className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold">אין בקשות הממתינות לאישור ידני.</span>
          </div>
        ) : (
          data.requests.map((req) => (
            <div
              key={req.requestId}
              className="flex items-start justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-enterprise-border rounded-enterprise-md text-right"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-enterprise-primary bg-enterprise-primary/10 px-1.5 py-0.5 rounded-full inline-block">
                  {req.type}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {req.employeeName}
                </h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 leading-relaxed">
                  {req.details}
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove?.(req.requestId)}
                  className="text-[10px] font-bold h-7 px-2 hover:bg-slate-100 hover:text-emerald-600"
                >
                  אשר
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReject?.(req.requestId)}
                  className="text-[10px] font-bold h-7 px-2 text-red-500 hover:bg-red-50"
                >
                  דחה
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
PendingApprovalsWidget.displayName = "PendingApprovalsWidget";
