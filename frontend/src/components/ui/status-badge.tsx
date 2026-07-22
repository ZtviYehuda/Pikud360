import * as React from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  WifiOff, 
  Wifi, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  Activity, 
  Plane, 
  Heart, 
  Home, 
  Building2, 
  Shield, 
  BookOpen,
  HelpCircle
} from "lucide-react";
import { cn } from "../../lib/utils";

// ==========================================
// Status Preset Types
// ==========================================
export type StatusPreset =
  | "success"
  | "warning"
  | "error"
  | "offline"
  | "online"
  | "pending"
  | "approved"
  | "rejected"
  | "in-progress"
  | "vacation"
  | "sick"
  | "remote"
  | "office"
  | "reserve-duty"
  | "training"
  | "custom";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusPreset;
  customLabel?: string;
  customIcon?: React.ReactNode;
  customColorClass?: string;
  animate?: boolean;
  tooltipText?: string;
}

// Preset mapping data
interface PresetConfig {
  label: string;
  colorClass: string;
  icon: React.ReactNode;
  tooltip: string;
  hasPing?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  className,
  status,
  customLabel,
  customIcon,
  customColorClass,
  animate = false,
  tooltipText,
  ...props
}) => {

  const presets: Record<Exclude<StatusPreset, "custom">, PresetConfig> = {
    success: {
      label: "הצליח",
      colorClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      tooltip: "פעולה הושלמה בהצלחה",
    },
    warning: {
      label: "אזהרה",
      colorClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      tooltip: "נדרשת תשומת לב",
    },
    error: {
      label: "שגיאה",
      colorClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
      icon: <XCircle className="h-3.5 w-3.5" />,
      tooltip: "אירעה תקלה במערכת",
    },
    offline: {
      label: "לא מחובר",
      colorClass: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-800",
      icon: <WifiOff className="h-3.5 w-3.5" />,
      tooltip: "משתמש אינו מקוון",
    },
    online: {
      label: "מחובר",
      colorClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
      icon: <Wifi className="h-3.5 w-3.5" />,
      tooltip: "משתמש מחובר למערכת",
      hasPing: true,
    },
    pending: {
      label: "ממתין",
      colorClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
      icon: <Clock className="h-3.5 w-3.5" />,
      tooltip: "ממתין לאישור מפקד",
    },
    approved: {
      label: "מאושר",
      colorClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
      icon: <ThumbsUp className="h-3.5 w-3.5" />,
      tooltip: "הבקשה אושרה סופית",
    },
    rejected: {
      label: "נדחה",
      colorClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
      icon: <ThumbsDown className="h-3.5 w-3.5" />,
      tooltip: "הבקשה נדחתה",
    },
    "in-progress": {
      label: "בטיפול",
      colorClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20",
      icon: <Activity className="h-3.5 w-3.5" />,
      tooltip: "הבקשה בטיפול כרגע",
      hasPing: true,
    },
    vacation: {
      label: "חופשה",
      colorClass: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20",
      icon: <Plane className="h-3.5 w-3.5" />,
      tooltip: "החייל נמצא בחופשה מאושרת",
    },
    sick: {
      label: "מחלה",
      colorClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
      icon: <Heart className="h-3.5 w-3.5" />,
      tooltip: "החייל נמצא בחופשת מחלה (גימלים)",
    },
    remote: {
      label: "עבודה מרחוק",
      colorClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20",
      icon: <Home className="h-3.5 w-3.5" />,
      tooltip: "עבודה מרחוק / מהבית",
    },
    office: {
      label: "משרד",
      colorClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
      icon: <Building2 className="h-3.5 w-3.5" />,
      tooltip: "נוכח במשרד ביחידה",
    },
    "reserve-duty": {
      label: "מילואים",
      colorClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20",
      icon: <Shield className="h-3.5 w-3.5" />,
      tooltip: "מגויס לשירות מילואים פעיל",
    },
    training: {
      label: "הכשרה",
      colorClass: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20",
      icon: <BookOpen className="h-3.5 w-3.5" />,
      tooltip: "נמצא בקורס או הכשרה מקצועית",
    },
  };

  const getPreset = (): PresetConfig => {
    if (status === "custom") {
      return {
        label: customLabel || "סטטוס",
        colorClass: customColorClass || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350",
        icon: customIcon || <HelpCircle className="h-3.5 w-3.5" />,
        tooltip: tooltipText || "סטטוס מותאם אישית",
      };
    }
    return presets[status];
  };

  const config = getPreset();

  return (
    <span
      {...props}
      title={tooltipText || config.tooltip}
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-bold select-none text-right transition-all shrink-0 hover:brightness-95 cursor-help whitespace-nowrap",
        config.colorClass,
        className
      )}
    >
      {/* Visual Icon (or override) */}
      <span className="shrink-0">{customIcon || config.icon}</span>

      {/* Roster Label */}
      <span>{customLabel || config.label}</span>

      {/* Optional Pulse/Ping animation overlay */}
      {(animate || config.hasPing) && (
        <span className="relative flex h-1.5 w-1.5 shrink-0 mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
    </span>
  );
};
StatusBadge.displayName = "StatusBadge";
