import * as React from "react";
import { Sparkles, UserPlus, ClipboardCheck, CalendarDays, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { QuickActionDTO } from "../types";

interface QuickActionsWidgetProps {
  actions?: QuickActionDTO[];
  onActionClick?: (actionId: string, type: "NAVIGATE" | "DIALOG", target: string) => void;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  actions = [],
  onActionClick,
}) => {
  const iconMap: Record<string, React.ReactNode> = {
    UserPlus: <UserPlus className="h-4 w-4" />,
    ClipboardCheck: <ClipboardCheck className="h-4 w-4" />,
    CalendarDays: <CalendarDays className="h-4 w-4" />,
    FileSpreadsheet: <FileSpreadsheet className="h-4 w-4" />,
  };

  return (
    <Card className="h-full select-none">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">פעולות מהירות</span>
          <Sparkles className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 gap-2">
        {actions.map((act) => (
          <Button
            key={act.id}
            variant="outline"
            size="sm"
            onClick={() => onActionClick?.(act.id, act.actionType, act.target)}
            className="flex items-center gap-2 py-3.5 h-auto justify-center hover:bg-slate-100 font-bold text-xs cursor-pointer select-none"
          >
            <span className="shrink-0 text-slate-500">
              {act.iconName ? iconMap[act.iconName] : <Sparkles className="h-4 w-4" />}
            </span>
            <span className="truncate">{act.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
QuickActionsWidget.displayName = "QuickActionsWidget";
