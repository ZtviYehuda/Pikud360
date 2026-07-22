import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Loader2,
  AlertTriangle,
  History,
  HelpCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";


import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SecuritySettingsProps {
  user: any;
  passwordData: any;
  setPasswordData: (data: any) => void;
  showPasswords: boolean;
  setShowPasswords: (show: boolean) => void;
  isChangingPassword: boolean;
  handleChangePassword: () => void;
  isResetting: boolean;
  handleResetImpersonatedPassword: () => void;
  onForgotPassword: () => void;
  handleConfirmCurrentPassword: () => Promise<void>;
}

export function SecuritySettings({
  user,
  passwordData,
  setPasswordData,
  showPasswords,
  setShowPasswords,
  isChangingPassword,
  handleChangePassword,
  isResetting,
  handleResetImpersonatedPassword,
  onForgotPassword,
  handleConfirmCurrentPassword,
}: SecuritySettingsProps) {
  // Calculate days since last password change
  const daysSinceChange = user?.last_password_change
    ? Math.floor(
        (new Date().getTime() - new Date(user.last_password_change).getTime()) /
          (1000 * 3600 * 24),
      )
    : 0;

  const shouldShowAlert = daysSinceChange > 180;

  return (
    <div className=" w-full pb-24 lg:pb-0">
      {/* Alerts Area - Redesigned to be subtler but effective */}
      {(user?.is_impersonated || shouldShowAlert) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {user?.is_impersonated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-destructive/10 shrink-0">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                </div>
                <div className="space-y-1 sm:space-y-2 flex-1">
                  <h4 className="font-black text-destructive text-base sm:text-lg">
                    מצב התחזות פעיל
                  </h4>
                  <p className="text-xs sm:text-sm text-destructive/70 font-medium">
                    התחברת כשוטר אחר. ניתן לאפס את הסיסמה לשם המשתמש המקורי.
                  </p>
                  <Button
                    onClick={handleResetImpersonatedPassword}
                    disabled={isResetting}
                    variant="destructive"
                    size="sm"
                    className="mt-2 font-black rounded-lg sm:rounded-xl h-9 sm:h-10 px-4 sm:px-6"
                  >
                    {isResetting && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                    אפס סיסמה לשם משתמש
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {shouldShowAlert && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/10 shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div className="space-y-1 sm:space-y-2 flex-1">
                  <h4 className="font-black text-amber-700 text-base sm:text-lg">
                    נדרשת החלפת סיסמה
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-700/70 font-medium leading-relaxed">
                    חלפו {daysSinceChange} יום מהחלפה אחרונה. מומלץ להחליף סיסמה
                    כל מספר חודשים.
                  </p>
                  <Button
                    onClick={() => handleConfirmCurrentPassword()}
                    variant="outline"
                    size="sm"
                    className="mt-2 font-black border-amber-500/20 text-amber-700 rounded-lg sm:rounded-xl h-9 sm:h-10 px-4 sm:px-6 hover:bg-amber-500/10"
                  >
                    דלג הפעם
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 lg:gap-8">
        {/* RIGHT SIDE - Password Change */}
        <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-8">
          <SectionCard icon={KeyRound} title="שינוי סיסמה">
            <div className="space-y-4 sm:space-y-6">
              {/* Old Password */}
              <div className="max-w-md">
                <InputItem
                  label="סיסמה נוכחית"
                  required
                  icon={Lock}
                  extra={
                    <button
                      onClick={onForgotPassword}
                      className="text-[10px] font-black text-primary/60 hover:text-primary transition-colors pr-1"
                    >
                      שכחתי?
                    </button>
                  }
                >
                  <div className="relative group">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.old_password || ""}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          old_password: e.target.value,
                        })
                      }
                      className="h-11 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-14 font-bold text-base sm:text-lg focus:bg-background transition-all"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  </div>
                </InputItem>
              </div>

              <div className="h-px bg-primary/5 w-full" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <InputItem label="סיסמה חדשה" required icon={ShieldCheck}>
                  <div className="relative group">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className="h-11 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-14 font-bold text-base sm:text-lg"
                      placeholder="לפחות 6 תווים"
                    />
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/30" />
                  </div>
                  {/* Strength Bar */}
                  <div className="flex gap-1 h-1.5 px-1 mt-3">
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all",
                        passwordData.new_password.length > 0
                          ? passwordData.new_password.length < 6
                             ? "bg-red-500/60"
                            : "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all",
                        passwordData.new_password.length >= 6
                          ? "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all",
                        passwordData.new_password.length >= 10
                          ? "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                  </div>
                </InputItem>

                <InputItem label="אימות סיסמה" required icon={ShieldCheck}>
                  <div className="relative group">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      className={cn(
                        "h-11 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-14 font-bold text-base sm:text-lg",
                        passwordData.confirm_password &&
                          passwordData.new_password !==
                            passwordData.confirm_password &&
                          "border-red-500/50",
                      )}
                      placeholder="חזור על הסיסמה"
                    />
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/30" />
                  </div>
                  {passwordData.confirm_password &&
                    passwordData.new_password !==
                      passwordData.confirm_password && (
                      <p className="text-[10px] font-black text-red-500 mr-1 mt-2 uppercase tracking-tighter">
                        הסיסמאות אינן תואמות
                      </p>
                    )}
                </InputItem>
              </div>

              <div className="flex flex-row items-center justify-between pt-2 sm:pt-4 gap-3">
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-primary transition-all group shrink-0"
                >
                  <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10">
                    {showPasswords ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </div>
                  {showPasswords ? "הסתר" : "הצג תווים"}
                </button>

                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-auto flex-1 sm:flex-initial h-11 sm:h-14 px-4 sm:px-10 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-3" />
                  )}
                  שמור סיסמה
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* LEFT SIDE - Security Tips */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <SectionCard icon={HelpCircle} title="הנחיות אבטחה">
            <div className="space-y-4 sm:space-y-8 py-2 sm:py-4">
              <SecurityGuideItem
                icon={CheckCircle2}
                title="אורך הסיסמה המומלצת"
                desc="לפחות 6 תווים הכוללים ספרות ואותיות."
                color="text-emerald-600"
              />
              <SecurityGuideItem
                icon={History}
                title="תדירות החלפה"
                desc="מומלץ להחליף סיסמה אחת למספר חודשים."
                color="text-blue-600"
              />
              <SecurityGuideItem
                icon={Shield}
                title="סיווג והרשאות"
                desc="מנע גישות בלתי מורשות לחשבון שלך."
                color="text-amber-600"
              />

              <div className="pt-4 sm:pt-8 border-t border-primary/5">
                <div className="p-4 sm:p-6 bg-primary/5 rounded-2xl sm:rounded-[2.5rem] border border-border/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/20" />
                  <p className="text-xs sm:text-sm font-black text-primary leading-relaxed relative z-10 transition-colors group-hover:text-primary/100">
                    שים לב: המערכת מנטרת פעילות חריגה ומדווחת עליה למנהלי המערכת
                    באופן אוטומטי.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

    </div>
  );
}

// --- UI Components ---



function SectionCard({
  icon: Icon,
  title,
  children,
  badge,
  variant = "default",
}: any) {
  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", variant === "danger" ? "text-red-500" : "text-primary")} />
          <h3 className={cn("text-sm font-black tracking-tight", variant === "danger" ? "text-red-500" : "text-foreground")}>
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className={cn(
        "bg-card/40 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border p-3 sm:p-6 overflow-hidden h-full",
        variant === "danger" ? "border-red-500/20 bg-red-500/5" : "border-border/40"
      )}>
        {children}
      </div>
    </div>
  );
}

function InputItem({ label, icon: Icon, required, children, extra }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pl-1">
        <Label className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
          {Icon && <Icon className="w-3.5 h-3.5 text-primary/60" />}
          {label}
          {required && <span className="text-red-500/80 mr-0.5">*</span>}
        </Label>
        {extra}
      </div>
      {children}
    </div>
  );
}


function SecurityGuideItem({ icon: Icon, title, desc, color }: any) {
  return (
    <div className="flex gap-2.5 sm:gap-4 group">
      <div
        className={cn(
          "p-2 sm:p-3 bg-background rounded-xl sm:rounded-2xl border border-border/40 group-hover:scale-110 transition-transform h-fit shrink-0",
          color.replace("text", "border"),
        )}
      >
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", color)} />
      </div>
      <div className="space-y-0.5">
        <h4 className="font-black text-xs sm:text-sm tracking-tight">{title}</h4>
        <p className="text-muted-foreground text-[10px] sm:text-[11px] font-medium leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

