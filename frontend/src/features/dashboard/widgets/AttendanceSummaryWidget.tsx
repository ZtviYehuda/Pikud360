import * as React from "react";
import { ClipboardCheck } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { AttendanceSummaryDTO } from "../types";

interface AttendanceSummaryWidgetProps {
  data?: AttendanceSummaryDTO;
  loading: boolean;
  error: boolean;
  onSendReminder?: (subunit: string) => void;
}

export const AttendanceSummaryWidget: React.FC<AttendanceSummaryWidgetProps> = ({
  data,
  loading,
  error,
  onSendReminder,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardCheck className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת דיווח נוכחות</span>
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
    <Card className="h-full">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">דיווח נוכחות יומי</span>
          <ClipboardCheck className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 text-right flex flex-col justify-between h-[calc(100%-48px)]">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.percentComplete || 0}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {data?.submittedReports || 0} מתוך {data?.expectedReports || 0}
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
            <div
              className="bg-enterprise-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${data?.percentComplete || 0}%` }}
            />
          </div>
        </div>

        {/* List of subunits missing reports */}
        <div className="flex-1 mt-2">
          {data?.missingSubunits && data.missingSubunits.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                מחלקות שטרם הגישו דיווח:
              </span>
              {data.missingSubunits.map((unit, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-enterprise-sm border border-enterprise-border">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">{unit}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendReminder?.(unit)}
                    className="text-[10px] font-bold h-6 px-2 hover:bg-slate-100"
                  >
                    שלח תזכורת
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <span className="text-xs font-bold text-emerald-600">כל המחלקות דיווחו בהצלחה להיום.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
AttendanceSummaryWidget.displayName = "AttendanceSummaryWidget";
