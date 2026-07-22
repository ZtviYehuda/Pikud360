import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Scale,
  ArrowRight,
  ShieldCheck,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function TermsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sections = [
    {
      title: "אחריות המשתמש",
      content:
        "כל פעולה במערכת מתועדת ומזוהה אישית. המשתמש אחראי לדיוק הנתונים המוזנים על ידו ולשמירה על סודיות פרטי הגישה שלו.",
    },
    {
      title: "אבטחת מידע",
      content:
        "המערכת מיועדת לשימוש מבצעי בלבד. אין להוציא נתונים מהמערכת ללא אישור מפורש מקצין ביטחון המידע היחידתי.",
    },
    {
      title: "זמינות השירות",
      content:
        "אנו שואפים לזמינות של 99.9% מהזמן. תחזוקה מתוכננת תבוצע בשעות הלילה המאוחרות ותלווה בהודעה מראש.",
    },
  ];

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden",
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
      )}
      dir="rtl"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.05)_0%,transparent_50%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl relative z-10 my-10"
      >
        <Card
          className={cn(
     "border-none rounded-[2.5rem] overflow-hidden backdrop-blur-xl",
            isDark
              ? "bg-slate-900/80 ring-1 ring-white/10"
              : "bg-white/90 ring-1 ring-black/5",
          )}
        >
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Scale className="w-8 h-8" />
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-black tracking-tight mb-2">
                  תנאי שימוש
                </h1>
                <p className="text-sm font-bold text-muted-foreground">
                  עודכן לאחרונה: פברואר 2026
                </p>
              </div>
            </div>

            <div className="space-y-10">
              <div
                className={cn(
                  "p-6 rounded-[2rem] border",
                  isDark
                    ? "bg-blue-600/5 border-blue-500/10"
                    : "bg-blue-50/50 border-blue-100",
                )}
              >
                <div className="flex items-start gap-4">
                  <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                  <p className="text-sm font-bold leading-relaxed text-muted-foreground">
                    השימוש במערכת כפוף לנהלי אבטחת המידע של היחידה ולפקודות
                    הקבע. כניסה למערכת מהווה הסכמה לכל התנאים המפורטים להלן.
                  </p>
                </div>
              </div>

              {sections.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-black">{section.title}</h3>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed pr-11">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-emerald-500 font-black text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>הנחיות מאושרות ע"י קב"ט</span>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="h-12 px-8 rounded-xl font-black gap-2 hover:bg-muted"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה למסך הבית
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
