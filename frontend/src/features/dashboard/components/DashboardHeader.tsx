import * as React from "react";
import {
  LayoutGrid,
  Filter,
  FileText,
  Calendar,
  ClipboardCheck,
  Bell,
  MessageSquare,
} from "lucide-react";
import { Button } from "../../../components/ui/button";

export interface DashboardHeaderProps {
  onFilterClick?: () => void;
  onReportsClick?: () => void;
  onEventsClick?: () => void;
  onAttendanceClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onFilterClick,
  onReportsClick,
  onEventsClick,
  onAttendanceClick,
}) => {
  return (
    <div className="w-full space-y-4 select-none">
      {/* Topmost System Bar */}
      <div className="flex items-center justify-between pb-2">
        {/* Left Side (RTL End): Notification & Date Pill */}
        <div className="flex items-center gap-3">
          {/* Notification Bell with Badge */}
          <button
            className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
            title="התראות"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-blue-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Chat Icon */}
          <button
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors cursor-pointer"
            title="הודעות"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Date & Day Badge Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>16/07/26</span>
            <span>·</span>
            <span>יום חמישי</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
              חופשה
            </span>
          </div>
        </div>

        {/* Right Side (RTL Start): Page Title & System Status Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>מערכת במצב תקין</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
              לוח בקרה
            </h1>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50 shadow-2xs">
              <LayoutGrid className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Action Toolbar (Filter, Reports, Events, Attendance) */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterClick}
          className="text-xs font-bold border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          rightIcon={<Filter className="h-4 w-4" />}
        >
          סינון
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReportsClick}
          className="text-xs font-bold border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          rightIcon={<FileText className="h-4 w-4" />}
        >
          דוחות
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEventsClick}
          className="text-xs font-bold border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          rightIcon={<Calendar className="h-4 w-4" />}
        >
          אירועים
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAttendanceClick}
          className="text-xs font-bold border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          rightIcon={<ClipboardCheck className="h-4 w-4" />}
        >
          דיווח נוכחות
        </Button>
      </div>
    </div>
  );
};
DashboardHeader.displayName = "DashboardHeader";
