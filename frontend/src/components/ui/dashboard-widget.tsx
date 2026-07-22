import * as React from "react";
import { RefreshCw, Maximize2, Minimize2, Download, Settings, HelpCircle, Lock, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Spinner } from "./spinner";

export interface DashboardWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  statusText?: string;
  statusType?: "success" | "warning" | "danger" | "info" | "neutral";
  timestamp?: string;
  
  // Permissions Check
  hasPermission?: boolean;
  
  // Custom State Handlers
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyLabel?: string;
  
  // Action triggers
  onRefresh?: () => void;
  onExport?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  className,
  title,
  icon,
  statusText,
  statusType = "neutral",
  timestamp,
  hasPermission = true,
  loading = false,
  error = null,
  isEmpty = false,
  emptyLabel = "אין נתונים להצגה",
  onRefresh,
  onExport,
  onSettingsClick,
  onHelpClick,
  children,
  ...props
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Base status pill colors
  const statusStyles = {
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
    info: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  const widgetBody = () => {
    // 1. Permission visibility check
    if (!hasPermission) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-rose-500 gap-3 border border-rose-500/10 rounded-lg bg-rose-500/5 my-auto" role="alert">
          <Lock className="h-8 w-8 text-rose-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-heading">גישה חסומה</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 max-w-xs mx-auto">אין לך הרשאות מתאימות לצפייה במידע זה.</p>
          </div>
        </div>
      );
    }

    // 2. Loading state fallback
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 gap-3 my-auto" aria-busy="true">
          <Spinner size="default" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">טוען נתונים...</span>
        </div>
      );
    }

    // 3. Error state fallback
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-rose-500 gap-3 border border-rose-500/10 rounded-lg bg-rose-500/5 my-auto" role="alert">
          <AlertTriangle className="h-8 w-8 text-rose-500 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-heading">שגיאה בטעינה</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 max-w-xs mx-auto">{error}</p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 text-[10px] font-bold text-cyan-600 hover:text-cyan-550 transition-colors uppercase tracking-wider cursor-pointer"
            >
              נסה שנית
            </button>
          )}
        </div>
      );
    }

    // 4. Empty state fallback
    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3 border border-slate-100 dark:border-slate-800 rounded-lg my-auto">
          <AlertCircle className="h-8 w-8 text-slate-350 dark:text-slate-650 shrink-0" />
          <p className="text-[11px] font-bold text-slate-450 dark:text-slate-400 leading-snug">{emptyLabel}</p>
        </div>
      );
    }

    // 5. Standard content
    return <div className="flex-1 flex flex-col">{children}</div>;
  };

  return (
    <div
      {...props}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-4 text-right select-none transition-all duration-300 shadow-2xs items-stretch min-h-[220px]",
        isFullscreen && "fixed inset-4 z-100 shadow-2xl scale-100",
        className
      )}
    >
      {/* 1. Header Toolbar Title panel */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-3 shrink-0">
        
        {/* Title & metadata */}
        <div className="flex items-center gap-2.5 text-right min-w-0">
          {icon && <div className="text-slate-400 dark:text-slate-500 shrink-0">{icon}</div>}
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white truncate">
              {title}
            </h3>
            {timestamp && (
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                עדכון אחרון: {timestamp}
              </p>
            )}
          </div>
          {statusText && (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", statusStyles[statusType])}>
              {statusText}
            </span>
          )}
        </div>

        {/* Buttons actions */}
        <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-500">
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-md transition-all cursor-pointer"
              title="רענן"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-md transition-all cursor-pointer"
              title="יצוא"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}

          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-md transition-all cursor-pointer"
              title="הגדרות"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}

          {onHelpClick && (
            <button
              onClick={onHelpClick}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-md transition-all cursor-pointer"
              title="עזרה"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-md transition-all cursor-pointer"
            title={isFullscreen ? "מזער" : "מסך מלא"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

        </div>

      </div>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-0">
        {widgetBody()}
      </div>

    </div>
  );
};
DashboardWidget.displayName = "DashboardWidget";
