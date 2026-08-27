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
        "fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md p-3 rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-md flex items-center justify-between text-xs border",
        isOffline
          ? "bg-amber-500/90 text-amber-950 border-amber-600/30 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700/50"
          : "bg-emerald-500/90 text-emerald-950 border-emerald-600/30 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700/50"
      )}
    >
      {isOffline ? (
        <>
          <div className="flex items-center gap-2 font-bold min-w-0 pr-1">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-950 dark:text-amber-300 animate-pulse" />
            <span className="truncate">אין חיבור לרשת - מצב לא מקוון</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-7 text-[11px] font-bold px-2.5 rounded-xl border-amber-700/40 bg-amber-600/20 hover:bg-amber-600/40 text-amber-950 dark:text-amber-100 shrink-0 gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>נסה שוב</span>
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 font-bold min-w-0 pr-1">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-950 dark:text-emerald-300" />
            <span className="truncate">החיבור לרשת חודש בהצלחה</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="h-7 text-[11px] font-bold px-2.5 rounded-xl border-emerald-700/40 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-950 dark:text-emerald-100 gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>רענן</span>
            </Button>
            <button
              type="button"
              onClick={dismissReconnected}
              className="text-[10px] underline opacity-80 hover:opacity-100 px-1 cursor-pointer"
            >
              סגור
            </button>
          </div>
        </>
      )}
    </div>
  );
};
