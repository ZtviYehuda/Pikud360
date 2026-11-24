import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RefreshCw,
  Loader2,
  AlertTriangle,
  History,
  HelpCircle,
  CheckCircle2,
  Shield,
  User,
  Copy,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import apiClient from "@/config/api.client";
import { cn, extractErrorMessage } from "@/lib/utils";

import React, { useState, useEffect } from "react";
import { TermsStatusModal } from "./TermsStatusModal";

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
  const [showTermsStatusModal, setShowTermsStatusModal] = useState(false);
  const isAdmin = user?.is_admin || user?.username === "admin";
  // Calculate days since last password change
  const daysSinceChange = user?.last_password_change
    ? Math.floor(
        (new Date().getTime() - new Date(user.last_password_change).getTime()) /
          (1000 * 3600 * 24),
      )
    : 0;

  const shouldShowAlert = daysSinceChange > 180;

  // Credentials Unlock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState("");
  const [revealedUsername, setRevealedUsername] = useState(user?.username || "");
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verifyInputPassword, setVerifyInputPassword] = useState("");
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [showRevealedPassword, setShowRevealedPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [copiedField, setCopiedField] = useState<"username" | "password" | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);

  // Keep username synced if user changes
  useEffect(() => {
    if (user?.username && !revealedUsername) {
      setRevealedUsername(user.username);
    }
  }, [user?.username]);

  // Auto-lock countdown timer
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsUnlocked(false);
          setRevealedPassword("");
          toast.info("פרטי הכניסה ננעלו מחדש מטעמי אבטחה");
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  const handleLock = () => {
    setIsUnlocked(false);
    setRevealedPassword("");
    setTimeLeft(120);
    toast.info("פרטי הכניסה ננעלו");
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInputPassword.trim()) {
      setVerifyError("אנא הזן סיסמה");
      return;
    }
    setIsVerifying(true);
    setVerifyError("");
    try {
      const { data } = await apiClient.post("/security/verify-credentials", {
        password: verifyInputPassword,
      });
      if (data.success) {
        setRevealedPassword(verifyInputPassword);
        if (data.username) setRevealedUsername(data.username);
        setIsUnlocked(true);
        setTimeLeft(120);
        setIsVerifyDialogOpen(false);
        setVerifyInputPassword("");
        toast.success("זהותך אומתה בהצלחה! פרטי הכניסה גלויים כעת");
      } else {
        setVerifyError(data.error || data.message || "סיסמה שגויה");
      }
    } catch (err: any) {
      setVerifyError(extractErrorMessage(err, "סיסמה שגויה. אנא נסה שנית."));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = async (text: string, field: "username" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(field === "username" ? "שם המשתמש הועתק ללוח" : "הסיסמה הועתקה ללוח");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("שגיאה בהעתקה ללוח");
    }
  };

  return (
    <div className=" w-full pb-24 lg:pb-0">
      {/* Alerts Area - Compact and subtle */}
      {(user?.is_impersonated || shouldShowAlert) && (
        <div className="flex flex-col gap-2 mb-4">
          {user?.is_impersonated && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive">
              <div className="flex items-center gap-2 font-medium">
                <Lock className="w-3.5 h-3.5 shrink-0 text-destructive" />
                <span className="font-bold">מצב התחזות פעיל:</span>
                <span className="text-destructive/80 hidden sm:inline">התחברת כשוטר אחר. ניתן לאפס את הסיסמה למשתמש המקורי.</span>
              </div>
              <Button
                onClick={handleResetImpersonatedPassword}
                disabled={isResetting}
                variant="destructive"
                size="sm"
                className="h-7 text-[11px] font-bold px-2.5 rounded-lg shrink-0"
              >
                {isResetting && <Loader2 className="w-3 h-3 ml-1 animate-spin" />}
                איפוס סיסמה
              </Button>
            </div>
          )}

          {shouldShowAlert && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span className="font-bold">נדרשת החלפת סיסמה:</span>
                <span className="text-amber-700/80 dark:text-amber-400/80 hidden sm:inline">חלפו {daysSinceChange} יום מהחלפה אחרונה.</span>
              </div>
              <Button
                onClick={() => handleConfirmCurrentPassword()}
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-bold px-2.5 rounded-lg border-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 hover:bg-amber-500/10"
              >
                דלג הפעם
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 lg:gap-8">
        {/* RIGHT SIDE - Password Change */}
        <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-8">
          {/* MY LOGIN CREDENTIALS */}
          <SectionCard
            icon={KeyRound}
            title="פרטי כניסה שלי"
            badge={
              isUnlocked ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[11px] font-bold gap-1 px-2.5 py-0.5 rounded-full"
                >
                  <Unlock className="w-3 h-3" />
                  מאומת וגלוי
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-border/60 text-muted-foreground bg-muted/30 text-[11px] font-bold gap-1 px-2.5 py-0.5 rounded-full"
                >
                  <Lock className="w-3 h-3" />
                  נעול מטעמי אבטחה
                </Badge>
              )
            }
          >
            {!isUnlocked ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-muted/20 border border-border/40">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyError("");
                      setVerifyInputPassword("");
                      setIsVerifyDialogOpen(true);
                    }}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all duration-200 group cursor-pointer shrink-0 shadow-sm"
                    title="לחץ לפתיחת הנעילה והקשת סיסמה"
                  >
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-foreground">
                      שם משתמש וסיסמת כניסה
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      הפרטים מוסתרים. לחץ על המנעול והקש את סיסמתך הנוכחית כדי להציגם.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setVerifyError("");
                    setVerifyInputPassword("");
                    setIsVerifyDialogOpen(true);
                  }}
                  variant="outline"
                  className="w-full sm:w-auto font-black h-10 px-4 rounded-xl gap-2 hover:bg-primary/5 hover:border-primary/30 border-border/60"
                >
                  <Lock className="w-4 h-4 text-primary" />
                  <span>חשיפת פרטי כניסה</span>
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      שם משתמש
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        readOnly
                        value={revealedUsername || user?.username || ""}
                        className="font-mono font-black text-sm sm:text-base h-11 bg-background/60 rounded-xl border-primary/10 pl-24 text-left shadow-none"
                        dir="ltr"
                      />
                      <div className="absolute left-1.5 flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(revealedUsername || user?.username || "", "username")}
                          className="h-8 px-2.5 text-xs font-black gap-1 rounded-lg hover:bg-muted"
                        >
                          {copiedField === "username" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">הועתק</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>העתק</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      סיסמה נוכחית
                    </Label>
                    <div className="relative flex items-center">
                      <Input
                        readOnly
                        type={showRevealedPassword ? "text" : "password"}
                        value={revealedPassword}
                        className="font-mono font-black text-sm sm:text-base h-11 bg-background/60 rounded-xl border-primary/10 pl-24 text-left shadow-none"
                        dir="ltr"
                      />
                      <div className="absolute left-1.5 flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRevealedPassword(!showRevealedPassword)}
                          className="h-8 px-2 text-xs font-black rounded-lg hover:bg-muted"
                          title={showRevealedPassword ? "הסתר סיסמה" : "הצג תווים"}
                        >
                          {showRevealedPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(revealedPassword, "password")}
                          className="h-8 px-2.5 text-xs font-black gap-1 rounded-lg hover:bg-muted"
                        >
                          {copiedField === "password" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">הועתק</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>העתק</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar with Auto-lock countdown & Manual Lock */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>
                      הפרטים גלויים כעת. נעילה אוטומטית בעוד{" "}
                      <span className="font-mono font-black text-foreground">{timeLeft}</span> שניות
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLock}
                    className="h-8 text-xs font-black text-muted-foreground hover:text-foreground gap-1.5 rounded-lg hover:bg-muted"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>נעל מחדש עכשיו</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </SectionCard>

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

              {isAdmin && (
                <div className="pt-4 sm:pt-6 border-t border-border/40">
                  <Button
                    type="button"
                    onClick={() => setShowTermsStatusModal(true)}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    מעקב אישור תקנון משתמשים (צוות תמיכה בלבד) 🛡️
                  </Button>
                </div>
              )}

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

      <TermsStatusModal
        open={showTermsStatusModal}
        onOpenChange={setShowTermsStatusModal}
      />

      {/* Verify Password Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-base font-black">
                  אימות סיסמה לצפייה בפרטים
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-medium">
                  הקש את סיסמתך הנוכחית כדי לאמת את זהותך ולחשוף את שם המשתמש והסיסמה.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="verify-pwd" className="text-xs font-black text-foreground">
                סיסמה נוכחית
              </Label>
              <div className="relative">
                <Input
                  id="verify-pwd"
                  type={showVerifyPassword ? "text" : "password"}
                  value={verifyInputPassword}
                  onChange={(e) => {
                    setVerifyInputPassword(e.target.value);
                    setVerifyError("");
                  }}
                  placeholder="הזן את סיסמתך..."
                  autoFocus
                  className="h-11 pl-10 pr-3 font-bold rounded-xl bg-background/50 border-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={showVerifyPassword ? "הסתר" : "הצג"}
                >
                  {showVerifyPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {verifyError && (
                <p className="text-xs text-destructive font-black flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {verifyError}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-2 sm:flex-row-reverse">
              <Button
                type="submit"
                disabled={!verifyInputPassword || isVerifying}
                className="h-10 font-black rounded-xl gap-2 flex-1 sm:flex-initial px-6"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                אימות וחשיפת פרטים
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVerifyDialogOpen(false)}
                className="h-10 font-black rounded-xl border-border/60"
              >
                ביטול
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

