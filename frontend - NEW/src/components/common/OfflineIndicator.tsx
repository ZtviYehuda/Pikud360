import React from "react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const OfflineIndicator: React.FC = () => {
  const { isOffline, wasOffline, dismissReconnected } = useOfflineStatus();

  if (!isOffline && !wasOffline) {
    return null;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div
      dir="rtl"
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md px-3.5 py-2.5 rounded-xl shadow-md transition-all duration-200 flex items-center justify-between text-xs border animate-in fade-in slide-in-from-top-2",
        isOffline
          ? "bg-card text-card-foreground border-border/80"
          : "bg-card text-card-foreground border-border/80"
      )}
    >
      {isOffline ? (
        <>
          <div className="flex items-center gap-2.5 font-bold min-w-0 pr-1">
            <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
            <span className="truncate text-xs font-semibold text-foreground">אין חיבור לרשת - מצב לא מקוון</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-7 text-xs font-bold px-3 rounded-lg border-border text-foreground hover:bg-muted shrink-0 gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>נסה שוב</span>
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5 font-bold min-w-0 pr-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate text-xs font-semibold text-foreground">החיבור לרשת חודש בהצלחה</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="h-7 text-xs font-bold px-3 rounded-lg border-border text-foreground hover:bg-muted gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>רענן</span>
            </Button>
            <button
              type="button"
              onClick={dismissReconnected}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-1.5 cursor-pointer"
            >
              סגור
            </button>
          </div>
        </>
      )}
    </div>
  );
};
