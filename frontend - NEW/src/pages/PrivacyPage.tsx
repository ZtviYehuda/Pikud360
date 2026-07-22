import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Lock,
  ArrowRight,
  Eye,
  ShieldCheck,
  Database,
  Fingerprint,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function PrivacyPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl relative z-10"
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
            <header className="text-center mb-16">
              <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-6">
                <Lock className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-4">
                מדיניות פרטיות
              </h1>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                כיצד אנו שומרים על הנתונים שלך ועל פרטיות המידע המבצעי במערכת.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {[
                {
                  title: "איסוף נתונים",
                  content:
                    "המערכת אוספת נתוני כוח אדם, נוכחות ופעילויות מבצעיות לצורך ניהול היחידה בלבד.",
                  icon: Database,
                },
                {
                  title: "גישה למידע",
                  content:
                    "הגישה למידע מוגדרת לפי רמת הרשאה ותפקיד. כל כניסה למידע אישי מתועדת במלואה.",
                  icon: Eye,
                },
                {
                  title: "אבטחה והצפנה",
                  content:
                    "כל הנתונים במערכת מוצפנים בתקנים המחמירים ביותר (AES-256) ומוגנים על ידי חומות אש.",
                  icon: ShieldCheck,
                },
                {
                  title: "זיהוי משתמש",
                  content:
                    "זיהוי המשתמש מתבצע באמצעות שם משתמש וסיסמה חד-ערכיים המשוייכים לשוטר.",
                  icon: Fingerprint,
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-black text-sm mb-2">{item.title}</h3>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center border-t border-border/50 pt-10">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="h-14 px-10 rounded-2xl font-black gap-3 text-primary hover:bg-primary/5 group"
              >
                <ArrowRight className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                חזרה למרחב העבודה
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
            Data Protection Protocol • Section 12-B
          </p>
        </div>
      </motion.div>
    </div>
  );
}
