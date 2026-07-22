import {
  Clock,
  AlertCircle,
  Users,
  ArrowRightLeft,
  Bell,
  Shield,
  Info,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
  user: any;
  formData: any;
  setFormData: (data: any) => void;
  systemSettings: any;
  updateSystemSetting: (key: string, value: any) => void;
}

export function NotificationSettings({
  user,
  formData,
  setFormData,
  systemSettings,
  updateSystemSetting,
}: NotificationSettingsProps) {
  const [localDeadline, setLocalDeadline] = useState(
    systemSettings.morning_report_deadline || "09:00",
  );

  useEffect(() => {
    if (systemSettings.morning_report_deadline) {
      setLocalDeadline(systemSettings.morning_report_deadline);
    }
  }, [systemSettings.morning_report_deadline]);

  const hasChanges = localDeadline !== systemSettings.morning_report_deadline;

  // Calculate active notifications
  const activeCount = [
    formData.notif_sick_leave,
    formData.notif_transfers,
    formData.notif_morning_report,
  ].filter(Boolean).length;

  return (
    <div className="w-full pb-16 lg:pb-0">
      <div className="grid grid-cols-12 gap-5 lg:gap-6">
        {/* RIGHT SIDE - Main Notifications */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <SectionCard
            icon={Bell}
            title="התראות אישיות"
            badge={
              <div className="flex items-center gap-1.5 bg-primary/5 border border-border/40 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
                <div className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-emerald-500"></span>
                </div>
                <span className="text-primary">{activeCount} פעילות</span>
              </div>
            }
          >
            <div className="space-y-2.5">
              <SwitchItem
                label="התראות מחלה ממושכת"
                desc="קבל התראה כאשר שוטר נמצא בסטטוס מחלה מעל 4 ימים רצופים"
                checked={formData.notif_sick_leave}
                onChange={(v: boolean) =>
                  setFormData({ ...formData, notif_sick_leave: v })
                }
                icon={AlertCircle}
              />
              <SwitchItem
                label="בקשות העברה חדשות"
                desc="קבל עדכון כאשר מפקד מגיש בקשת העברה הממתינה לאישורך"
                checked={formData.notif_transfers}
                onChange={(v: boolean) =>
                  setFormData({ ...formData, notif_transfers: v })
                }
                icon={ArrowRightLeft}
              />
              <SwitchItem
                label="חוסר דיווח בוקר"
                desc="התראה על שוטרים כפופים שטרם הוזן להם סטטוס נוכחות"
                checked={formData.notif_morning_report}
                onChange={(v: boolean) =>
                  setFormData({ ...formData, notif_morning_report: v })
                }
                icon={Users}
              />
            </div>
          </SectionCard>

          {/* Admin Settings Section */}
          {user?.is_admin && (
            <SectionCard
              icon={Shield}
              title="הגדרות מערכת קריטיות"
              variant="danger"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-destructive/[0.02] rounded-xl border border-destructive/10">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-background rounded-xl shrink-0 border border-destructive/10">
                    <Clock className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="space-y-0.5 text-right">
                    <h4 className="text-xs sm:text-sm font-black text-destructive tracking-tight">
                      שעת יעד לדיווח בוקר
                    </h4>
                    <p className="text-muted-foreground text-[10px] sm:text-xs font-medium max-w-sm">
                      קביעת השעה הרשמית בה המערכת תתחיל להפיץ התראות על חוסר
                      דיווח בוקר.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative group flex-1 md:flex-none text-right">
                    <p className="text-[9px] font-black text-destructive/60 uppercase mb-1 mr-1">
                      שעת יעד
                    </p>
                    <Input
                      type="time"
                      value={localDeadline}
                      onChange={(e) => setLocalDeadline(e.target.value)}
                      className="w-full md:w-28 h-9 bg-background rounded-lg border-destructive/20 font-black text-sm text-center focus:ring-destructive/20 transition-all font-mono"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {hasChanges && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      >
                        <Button
                          onClick={() =>
                            updateSystemSetting(
                              "morning_report_deadline",
                              localDeadline,
                            )
                          }
                          className="h-9 px-4 rounded-lg bg-destructive text-white hover:bg-destructive/90 font-black text-xs"
                        >
                          <Save className="w-3.5 h-3.5 ml-1.5" />
                          עדכן
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* LEFT SIDE - Info & Tips */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <SectionCard icon={Info} title="מידע והנחיות">
            <div className="space-y-4 py-1">
              <InfoItemSimple
                title="תדירות עדכונים"
                desc="התראות המערכת נשלחות בזמן אמת ללוח הבקרה ולמייל האישי."
              />
              <InfoItemSimple
                title="מדרג פיקודי"
                desc="התראות נשלחות רק למפקדים הרלוונטיים בהתאם למדרג הארגוני."
              />
              <InfoItemSimple
                title="הודעות חירום"
                desc="עדכוני אבטחה וחירום יישלחו למנהל המערכת."
              />

              <div className="pt-4 border-t border-primary/5 text-center">
                <div className="inline-flex p-2 bg-primary/5 rounded-xl mb-2">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground leading-relaxed">
                  אנחנו עובדים על הוספת התראות SMS וואטסאפ בגרסה הבאה של המערכת.
                  הישארו מעודכנים!
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- Internal UI Components ---

function SectionCard({
  icon: Icon,
  title,
  children,
  badge,
  variant = "default",
}: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("w-4 h-4", variant === "danger" ? "text-red-500" : "text-primary")} />
          <h3 className={cn("text-xs font-black tracking-tight", variant === "danger" ? "text-red-500" : "text-foreground")}>
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className={cn(
        "bg-card/40 backdrop-blur-xl rounded-2xl border p-4 sm:p-5 overflow-hidden h-full",
        variant === "danger" ? "border-red-500/20 bg-red-500/5" : "border-border/40"
      )}>
        {children}
      </div>
    </div>
  );
}

function SwitchItem({ label, desc, checked, onChange, icon: Icon }: any) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all group",
        checked
          ? "bg-primary/[0.02] border-border/60"
          : "bg-background border-border/40 hover:border-border/50",
      )}
    >
      <div className="flex items-center gap-3 text-right min-w-0">
        <div
          className={cn(
            "p-2 rounded-xl transition-all shrink-0",
            checked
              ? "bg-primary/10 text-primary"
              : "bg-muted/40 text-muted-foreground group-hover:bg-muted/60",
          )}
        >
          {Icon && <Icon className="w-4 h-4" />}
        </div>
        <div className="space-y-0.5 min-w-0">
          <label className="font-black text-xs sm:text-sm tracking-tight cursor-pointer block truncate">
            {label}
          </label>
          <p className="text-muted-foreground text-[10px] sm:text-[11px] font-medium leading-relaxed truncate max-w-sm sm:max-w-md md:max-w-lg">
            {desc}
          </p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-primary shrink-0"
      />
    </div>
  );
}

function InfoItemSimple({ title, desc }: any) {
  return (
    <div className="flex gap-3 group text-right">
      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0 group-hover:bg-primary transition-colors" />
      <div className="space-y-0.5">
        <h4 className="font-black text-xs sm:text-sm tracking-tight">{title}</h4>
        <p className="text-muted-foreground text-[10px] sm:text-[11px] font-medium leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

