import * as React from "react";
import { CalendarRange, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { ShiftCoverageDTO } from "../types";

interface ShiftCoverageWidgetProps {
  data?: ShiftCoverageDTO;
  loading: boolean;
  error: boolean;
}

export const ShiftCoverageWidget: React.FC<ShiftCoverageWidgetProps> = ({
  data,
  loading,
  error,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarRange className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת סידור עבודה</span>
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
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">משמרות ואיוש להיום</span>
          <CalendarRange className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 text-right flex flex-col justify-between h-[calc(100%-48px)]">
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data?.filledShifts || 0} / {data?.totalShifts || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">איוש משמרות</span>
          </div>
        </div>

        {/* List of gaps warnings inside shifts */}
        <div className="flex-1 mt-1">
          {data?.gapsCount && data.gapsCount > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 justify-start text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1.5 rounded-enterprise-sm border border-amber-100 dark:border-amber-900">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">נמצאו {data.gapsCount} משמרות לא מאוישות להיום</span>
              </div>
              
              <div className="space-y-1.5 overflow-y-auto max-h-[140px]">
                {data.gapsList.map((gap) => (
                  <div key={gap.shiftId} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-enterprise-sm border border-enterprise-border">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-350 block leading-none">{gap.role}</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">{gap.timeSlot}</span>
                    </div>
                    <Badge variant="warning" className="text-[9px] font-bold">לא מאויש</Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-center text-emerald-600">
              <span className="text-xs font-bold">כל עמדות השמירה והתפקידים מאוישים כנדרש.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
ShiftCoverageWidget.displayName = "ShiftCoverageWidget";
