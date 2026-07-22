import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LifeBuoy,
  ArrowRight,
  MessageCircle,
  BookOpen,
  ExternalLink,
  ShieldQuestion,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const supportLinks = [
    {
      title: "מרכז ידע מבצעי",
      description: "מדריכים למשתמש, סרטוני הדרכה ושאלות נפוצות",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "דיווח על תקלה",
      description: "פתיחת קריאת שירות למוקד התמיכה הטכני",
      icon: MessageCircle,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "בקשת הרשאות",
      description: "טפסים לקבלת גישה למודולים נוספים במערכת",
      icon: ShieldQuestion,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
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
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card
          className={cn(
            "border-none rounded-[3rem] overflow-hidden backdrop-blur-xl",
            isDark
              ? "bg-slate-900/80 ring-1 ring-white/10"
              : "bg-white/90 ring-1 ring-black/5",
          )}
        >
          <div className="p-8 md:p-12">
            <header className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <LifeBuoy className="w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
                מרכז תמיכה וסיוע
              </h1>
              <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                אנחנו כאן כדי לעזור לך להפיק את המירב ממערכת Toren. בחר את
                אפיק הסיוע המבוקש.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {supportLinks.map((link, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all hover:scale-[1.05] cursor-pointer group",
                    isDark
                      ? "bg-slate-800/40 border-white/5 hover:border-white/10"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12",
                      link.bg,
                      link.color,
                    )}
                  >
                    <link.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-sm mb-2">{link.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                    {link.description}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={cn(
                "p-6 rounded-[2rem] border mb-10 flex flex-col sm:flex-row items-center justify-between gap-4",
                isDark
                  ? "bg-blue-600/10 border-blue-500/20"
                  : "bg-blue-50 border-blue-100",
              )}
            >
              <div className="text-right">
                <h4 className="font-black text-blue-600 dark:text-blue-400 mb-1">
                  זקוק לעזרה דחופה?
                </h4>
                <p className="text-xs font-bold text-muted-foreground">
                  המוקד המבצעי זמין עבורך 24/7 לכל שאלה קריטית
                </p>
              </div>
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-6">
                חיוג למוקד
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex-1 w-full h-12 rounded-xl font-bold gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה למערכת
              </Button>
              <Button
                variant="outline"
                className="flex-1 w-full h-12 rounded-xl font-bold gap-2 border-border"
              >
                <ExternalLink className="w-4 h-4" />
                אתר היחידה
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
          {/* Placeholder for logos if needed */}
        </div>
      </motion.div>
    </div>
  );
}
