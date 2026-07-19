import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface DashboardHeaderProps {
  pageTitle: string;
  loading: boolean;
  empty: boolean;
  error: boolean;
  onToggleLoading: () => void;
  onToggleEmpty: () => void;
  onToggleError: () => void;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  pageTitle,
  loading,
  empty,
  error,
  onToggleLoading,
  onToggleEmpty,
  onToggleError,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-enterprise-border mb-6">
      {/* Right side controls switcher to simulate dashboard template modes (For UX audit reviews) */}
      <div className="flex items-center gap-2 flex-wrap order-2 sm:order-1 justify-start">
        <Button
          variant={loading ? "primary" : "outline"}
          size="sm"
          onClick={onToggleLoading}
          className="text-xs h-8 font-bold"
        >
          {loading ? "מצב טעינה פעיל" : "סמלץ מצב טעינה"}
        </Button>
        <Button
          variant={empty ? "primary" : "outline"}
          size="sm"
          onClick={onToggleEmpty}
          className="text-xs h-8 font-bold"
        >
          {empty ? "מצב ריק פעיל" : "סמלץ מצב ריק"}
        </Button>
        <Button
          variant={error ? "danger" : "outline"}
          size="sm"
          onClick={onToggleError}
          className="text-xs h-8 font-bold"
        >
          {error ? "מצב שגיאה פעיל" : "סמלץ מצב שגיאה"}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="רענן נתונים"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Left side page title details */}
      <div className="text-right order-1 sm:order-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none">
          {pageTitle}
        </h2>
        <p className="text-[11px] text-slate-450 dark:text-slate-500 font-semibold mt-1">
          תמונת מצב היערכות וכוח אדם בזמן אמת
        </p>
      </div>
    </div>
  );
};
DashboardHeader.displayName = "DashboardHeader";
