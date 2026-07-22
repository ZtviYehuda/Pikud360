import { useState, useMemo, useEffect } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogDragHandle,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import {
  Info,
  FilterX,
  Send,
  RefreshCw,
  LayoutDashboard,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStats: any[]; // The grouped stats from the dashboard
  unitName: string;
  isFiltered: boolean;
}

export const WhatsAppReportDialog = ({
  open,
  onOpenChange,
  currentStats,
  unitName,
  isFiltered,
}: WhatsAppReportDialogProps) => {
  const { getDashboardStats } = useEmployees();
  const { user } = useAuthContext();

  const [isFullMode, setIsFullMode] = useState(false);
  const [fullStats, setFullStats] = useState<any[] | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  // Reset mode when dialog opens
  useEffect(() => {
    if (open) {
      setIsFullMode(false);
    }
  }, [open]);

  // Fetch full stats if requested
  useEffect(() => {
    if (open && isFullMode && !fullStats) {
      const fetchFull = async () => {
        setLoadingFull(true);
        const data = await getDashboardStats({});
        if (data && data.stats) {
          setFullStats(data.stats);
        } else if (Array.isArray(data)) {
          setFullStats(data);
        }
        setLoadingFull(false);
      };
      fetchFull();
    }
  }, [open, isFullMode, fullStats, getDashboardStats]);

  const unitTypeLabel = useMemo(() => {
    if (user?.commands_team_id) return "חוליה";
    if (user?.commands_section_id) return "מדור";
    if (user?.commands_department_id) return "מחלקה";
    return "יחידה";
  }, [user]);

  const activeStats = isFullMode ? fullStats || [] : currentStats;
  const activeUnit = isFullMode ? `כלל ה${unitTypeLabel}` : unitName;

  const reportData = useMemo(() => {
    let total = 0;
    const sorted = [...activeStats].sort((a, b) => b.count - a.count);
    sorted.forEach((s) => (total += s.count));
    return { total, byStatus: sorted };
  }, [activeStats]);

  const generateWhatsAppMessage = () => {
    const commander = user ? `${user.first_name} ${user.last_name}` : "מפקד";
    let message = `*דוח מצבת כוח אדם*\n`;
    message += `\n*מפקד/ת:* ${commander}\n`;
    message += `*תאריך:* ${new Date().toLocaleDateString("he-IL")}\n`;
    message += `*${unitTypeLabel}:* ${activeUnit}\n`;

    if (isFiltered && !isFullMode) {
      message += `_(תצוגה מסוננת)_\n`;
    }

    message += `\n*סך הכל שוטרים:* ${reportData.total}\n\n`;

    message += `*פילוח לפי סטטוס:*\n`;
    reportData.byStatus.forEach(({ status_name, count }) => {
      const percentage =
        reportData.total > 0 ? Math.round((count / reportData.total) * 100) : 0;
      const displayName = (status_name === "חופשה חול" || status_name === "חופשה חו\"ל") ? "חו' חול" : status_name;
      message += `- ${displayName}: ${count} (${percentage}%)\n`;
    });

    return message;
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(generateWhatsAppMessage());
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl p-0 border-none bg-card flex flex-col overflow-hidden"
        dir="rtl"
      >
        <DialogDragHandle />

        {/* ── Slim inline header ── */}
        <div className="px-5 pt-3 pb-4 sm:px-8 sm:pt-6 sm:pb-5 border-b border-border/30 text-right shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Send className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[15px] sm:text-lg font-black text-foreground tracking-tight leading-none mb-0.5">
                שיתוף דוח נוכחות
              </DialogTitle>
              <DialogDescription className="text-[11px] font-medium text-muted-foreground leading-none">
                ייצוא מצבה ושליחה בווטסאפ
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 px-5 py-4 sm:px-8 sm:py-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Segmented control for mode switching */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest pr-0.5">
              היקף הדוח
            </span>
            <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
              <button
                onClick={() => setIsFullMode(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-black transition-all",
                  !isFullMode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>מסונן</span>
                {!isFullMode && <Check className="w-3 h-3 text-primary" />}
              </button>
              <button
                onClick={() => setIsFullMode(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-black transition-all",
                  isFullMode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>כללי</span>
                {isFullMode && <Check className="w-3 h-3 text-primary" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 font-bold pr-0.5 leading-tight">
              {isFullMode ? `כלל שוטרי ה${unitTypeLabel}` : `${unitTypeLabel}: ${unitName}`}
            </p>
          </div>

          {/* Message Preview */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest pr-0.5">
              תצוגה מקדימה
            </span>
            <div className="bg-muted/30 p-4 rounded-xl border border-border/40 text-[12px] font-medium text-foreground whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto custom-scrollbar">
              {loadingFull ? (
                <div className="flex items-center justify-center py-8 gap-2.5 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary/40" />
                  <span className="text-[10px] font-bold">טוען...</span>
                </div>
              ) : (
                generateWhatsAppMessage()
              )}
            </div>
          </div>

          {/* Compact info notice */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-snug font-medium">
              הדוח כולל פילוח מספרי בלבד — ללא פרטים אישיים.
            </p>
          </div>
        </div>

        {/* ── Pinned footer — safe area ── */}
        <div className="px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-6 border-t border-border/30 shrink-0 flex flex-col gap-2">
          <WhatsAppButton
            onClick={handleSendWhatsApp}
            skipDirectLink={true}
            label="שלח דוח בווטסאפ"
            className="w-full h-12 rounded-xl font-black text-sm shadow-none"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[11px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1 text-center"
          >
            ביטול
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
