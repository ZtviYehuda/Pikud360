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
          "sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[92vw] sm:h-auto sm:max-h-[85vh] p-0 rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between transition-colors dir-rtl",
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        )}
        dir="rtl"
      >
        {/* Header */}
        <div
          className={cn(
            "p-5 sm:p-6 pl-12 sm:pl-16 border-b flex items-center justify-between gap-4 shrink-0",
            isDark
              ? "bg-slate-950/70 border-slate-800/80"
              : "bg-slate-50 border-slate-200/80"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="text-lg sm:text-2xl font-black tracking-tight">
                  תקנון המערכת והנחיות אבטחת מידע
                </DialogTitle>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                  <Lock className="w-3 h-3" /> סיווג: שמור
                </span>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                הנחיות שימוש מורשה, שמירת סודיות וכללי הפצת מידע בסיווג "שמור"
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content — 2-Column Responsive Grid on Desktop */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start text-right">
            
            {/* Right Column (First in RTL): Section 1, Section 2 & Classification Alert */}
            <div className="space-y-4 sm:space-y-5">
              {/* Section 1: About the System */}
              <div className={cn(
                "p-4.5 rounded-2xl border space-y-2 shadow-xs",
                isDark ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50 border-slate-200/60"
              )}>
                <h4 className="text-xs sm:text-base font-black flex items-center gap-2 text-primary">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5" /> 1. אודות המערכת והשימוש המורשה
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  מערכת <strong>THE OFFICE</strong> משמשת כמרכז שליטה, דיווח
                  וניהול כוח אדם יחידתי. המערכת מיועדת אך ורק לבעלי תפקידים מורשים
                  לצורך ביצוע משימותיהם המבצעיות והפיקודיות.
                </p>
              </div>

              {/* Section 2: User Responsibility & Security */}
              <div className={cn(
                "p-4.5 rounded-2xl border space-y-2 shadow-xs",
                isDark ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50 border-slate-200/60"
              )}>
                <h4 className="text-xs sm:text-base font-black flex items-center gap-2 text-primary">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> 2. אחריות המשתמש ושמירת סודיות
                </h4>
                <ul className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-1.5 list-disc list-inside">
                  <li>
                    חל איסור מוחלט על מסירת שם משתמש, סיסמה או קוד אימות אישי לגורם אחר.
                  </li>
                  <li>
                    כל משתמש נושא באחריות אישית מלאה על כל פעולה, הזנה, עריכה או ייצוא
                    נתונים המבוצעים תחת חשבונו.
                  </li>
                  <li>
                    יש להקפיד על ניתוק/נעילת המחשב או הנייד בעת עזיבת עמדת העבודה.
                  </li>
                </ul>
              </div>

              {/* Classification Banner */}
              <div
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 leading-relaxed shadow-xs",
                  isDark
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                )}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm font-semibold space-y-1">
                  <p className="font-bold text-amber-500 text-sm sm:text-base">
                    הבהרת סיווג ואחריות מידע:
                  </p>
                  <p>
                    המידע המוצג והמנוהל במערכת הינו בלעדי ומוגדר בסיווג{" "}
                    <span className="font-black underline underline-offset-2">"שמור"</span>.
                    כל כניסה ושימוש במערכת מחייבים עמידה מלאה בפקודות היחידה ובהוראות אבטחת המידע.
                  </p>
                </div>
              </div>
            </div>

            {/* Left Column (Second in RTL): Section 3 & Section 4 */}
            <div className="space-y-4 sm:space-y-5">
              {/* Section 3: WhatsApp Export Regulations - HIGH HIGHLIGHT */}
              <div
                className={cn(
                  "p-4.5 sm:p-5 rounded-2xl border space-y-3 shadow-xs",
                  isDark
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-100"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                )}
              >
                <h4 className="text-xs sm:text-base font-black flex items-center gap-2 text-emerald-500">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> 3. הנחיות קריטיות להעברת מידע ל-WhatsApp
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed">
                  המערכת כוללת כלים מתקדמים לייצור והפצת הודעות, דיווחים וטפסים מרוכזים ישירות לוואטסאפ (קבוצות מותאמות ונמענים בודדים).
                </p>
                <div
                  className={cn(
                    "p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm font-bold space-y-2",
                    isDark
                      ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300"
                      : "bg-white border-emerald-300 text-emerald-900"
                  )}
                >
                  <p className="flex items-center gap-1.5 text-rose-500 font-black text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> חובת שימת לב מלאה בעת שליחה:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-muted-foreground font-semibold">
                    <li>
                      <strong className="text-foreground">בדיקת קבוצת היעד:</strong> לפני לחיצה על שליחה/שיתוף, יש לוודא באופן מוחלט כי קבוצת הוואטסאפ הינה קבוצה מבצעית מורשת בלבד.
                    </li>
                    <li>
                      <strong className="text-foreground">בדיקת נמענים אישיים:</strong> חל איסור להעביר דיווחים בסיווג "שמור" לאנשי קשר פרטיים או גורמים שאינם מוסמכים.
                    </li>
                    <li>
                      <strong className="text-foreground">איסור זליגת מידע:</strong> העברת מידע מבצעי או פרטי עובדים לקבוצות חיצוניות/אזרחיות מהווה עבירת אבטחת מידע חמורה.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 4: Auditing */}
              <div className={cn(
                "p-4.5 rounded-2xl border space-y-2 shadow-xs",
                isDark ? "bg-slate-950/40 border-slate-800/60" : "bg-slate-50 border-slate-200/60"
              )}>
                <h4 className="text-xs sm:text-base font-black flex items-center gap-2 text-primary">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> 4. ניטור ובקרה (Audit Logging)
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  לצורך הגנה על אמינות הנתונים ואבטחת המידע, כל הפעולות במערכת - לרבות כניסות, עריכות, הפצת הודעות וייצוא נתונים - מתועדות באופן מלא ביומן הביקורת של המערכת.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={cn(
            "p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0",
            isDark
              ? "bg-slate-950/80 border-slate-800/80"
              : "bg-slate-50 border-slate-200/80"
          )}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-semibold">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <span>הכניסה למערכת מהווה אישור והסכמה לתקנון זה</span>
          </div>

          <Button
            type="button"
            onClick={handleAccept}
            className="w-full sm:w-auto px-8 h-11 font-black text-xs sm:text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md"
          >
            קראתי ואישרתי את התקנון
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
