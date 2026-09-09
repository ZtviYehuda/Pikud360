import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Lock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  theme?: "light" | "dark";
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92dvh] sm:max-h-[85vh] p-0 rounded-t-3xl sm:rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors dir-rtl",
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        )}
        dir="rtl"
      >
        {/* Header */}
        <div
          className={cn(
            "p-3.5 sm:p-5 pl-10 sm:pl-14 border-b flex items-start sm:items-center justify-between gap-3 shrink-0",
            isDark
              ? "bg-slate-950/70 border-slate-800/80"
              : "bg-slate-50 border-slate-200/80"
          )}
        >
          <div className="flex items-start sm:items-center gap-3 w-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-xl font-bold tracking-tight">
                  תקנון המערכת והנחיות אבטחת מידע
                </DialogTitle>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                  <Lock className="w-2.5 h-2.5" /> סיווג: שמור
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5 leading-relaxed">
                הנחיות שימוש מורשה, שמירת סודיות וכללי הפצת מידע בסיווג "שמור"
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content — Responsive 2-Column Grid on Desktop */}
        <div className="p-3.5 sm:p-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-start text-right">
            
            {/* Column 1 (RTL Right): Sections 1, 2 & Classification Alert */}
            <div className="space-y-3 sm:space-y-3.5">
              {/* Section 1: About the System */}
              <div className={cn(
                "p-3 sm:p-3.5 rounded-xl border space-y-1.5 shadow-2xs",
                isDark ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50/80 border-slate-200/70"
              )}>
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2 text-primary">
                  <Info className="w-4 h-4 text-primary shrink-0" /> 1. אודות המערכת והשימוש המורשה
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  מערכת <strong>THE OFFICE</strong> משמשת כמרכז שליטה, דיווח
                  וניהול כוח אדם יחידתי. המערכת מיועדת אך ורק לבעלי תפקידים מורשים
                  לצורך ביצוע משימותיהם המבצעיות והפיקודיות.
                </p>
              </div>

              {/* Section 2: User Responsibility & Security */}
              <div className={cn(
                "p-3 sm:p-3.5 rounded-xl border space-y-1.5 shadow-2xs",
                isDark ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50/80 border-slate-200/70"
              )}>
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2 text-primary">
                  <Lock className="w-4 h-4 text-primary shrink-0" /> 2. אחריות המשתמש ושמירת סודיות
                </h4>
                <ul className="text-xs text-muted-foreground leading-relaxed space-y-1 list-disc list-inside">
                  <li>
                    חל איסור מוחלט על מסירת שם משתמש, סיסמה או קוד אימות אישי לגורם אחר.
                  </li>
                  <li>
                    כל משתמש נושא באחריות אישית מלאה על כל פעולה, הזנה, עריכה או ייצוא נתונים.
                  </li>
                  <li>
                    יש להקפיד על ניתוק/נעילת המחשב או הנייד בעת עזיבת עמדת העבודה.
                  </li>
                </ul>
              </div>

              {/* Classification Banner */}
              <div
                className={cn(
                  "p-3 sm:p-3.5 rounded-xl border flex items-start gap-2.5 leading-relaxed shadow-2xs",
                  isDark
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                )}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                    הבהרת סיווג ואחריות מידע:
                  </p>
                  <p className="text-muted-foreground dark:text-amber-200/90 leading-relaxed">
                    המידע המוצג והמנוהל במערכת הינו בלעדי ומוגדר בסיווג{" "}
                    <span className="font-bold underline underline-offset-2">"שמור"</span>.
                    כל כניסה ושימוש במערכת מחייבים עמידה מלאה בפקודות היחידה ובהוראות אבטחת המידע.
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2 (RTL Left): Section 3 & Section 4 */}
            <div className="space-y-3 sm:space-y-3.5">
              {/* Section 3: WhatsApp Export Regulations */}
              <div
                className={cn(
                  "p-3 sm:p-3.5 rounded-xl border space-y-2 shadow-2xs",
                  isDark
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-100"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                )}
              >
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> 3. הנחיות קריטיות להעברת מידע ל-WhatsApp
                </h4>
                <p className="text-xs text-muted-foreground dark:text-emerald-100/90 leading-relaxed">
                  המערכת כוללת כלים מתקדמים לייצור והפצת הודעות, דיווחים וטפסים מרוכזים ישירות לוואטסאפ (קבוצות מותאמות ונמענים בודדים).
                </p>
                <div
                  className={cn(
                    "p-2.5 sm:p-3 rounded-lg border text-xs space-y-1.5",
                    isDark
                      ? "bg-slate-900/90 border-emerald-500/30 text-emerald-300"
                      : "bg-white border-emerald-300 text-emerald-900"
                  )}
                >
                  <p className="flex items-center gap-1.5 text-rose-500 font-bold text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> חובת שימת לב מלאה בעת שליחה:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground font-medium">
                    <li>
                      <strong className="text-foreground">בדיקת קבוצת היעד:</strong> יש לוודא שהקבוצה הינה קבוצה מבצעית מורשת בלבד.
                    </li>
                    <li>
                      <strong className="text-foreground">בדיקת נמענים אישיים:</strong> חל איסור להעביר דיווחים בסיווג "שמור" לאנשי קשר פרטיים.
                    </li>
                    <li>
                      <strong className="text-foreground">איסור זליגת מידע:</strong> העברת מידע מבצעי לקבוצות חיצוניות/אזרחיות מהווה עבירה חמורה.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 4: Auditing */}
              <div className={cn(
                "p-3 sm:p-3.5 rounded-xl border space-y-1.5 shadow-2xs",
                isDark ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50/80 border-slate-200/70"
              )}>
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2 text-primary">
                  <Eye className="w-4 h-4 text-primary shrink-0" /> 4. ניטור ובקרה (Audit Logging)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  לצורך הגנה על אמינות הנתונים ואבטחת המידע, כל הפעולות במערכת - לרבות כניסות, עריכות, הפצת הודעות וייצוא נתונים - מתועדות באופן מלא ביומן הביקורת של המערכת.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={cn(
            "p-3 sm:p-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0",
            isDark
              ? "bg-slate-950/80 border-slate-800/80"
              : "bg-slate-50 border-slate-200/80"
          )}
        >
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>הכניסה למערכת מהווה אישור והסכמה לתקנון זה</span>
          </div>

          <Button
            type="button"
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 h-10 font-bold text-xs sm:text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
          >
            קראתי ואישרתי את התקנון
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
