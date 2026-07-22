import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  KeyRound,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/config/api.client";
import { motion, AnimatePresence } from "framer-motion";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

type Stage = "INIT" | "CODE" | "PASSWORD" | "SUCCESS";

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  user,
}: ForgotPasswordDialogProps) {
  const [stage, setStage] = useState<Stage>("INIT");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize flow - Send Email
  const handleSendEmail = async () => {
    if (!user?.email) {
      toast.error("לא מוגדרת כתובת מייל לחשבונך. אנא פנה למנהל המערכת.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", {
                email: user.email,
      });
      setStage("CODE");
      toast.success("קוד אימות נשלח למייל");
    } catch (error: any) {
      console.error("Failed to send code", error);
      toast.error(error.response?.data?.error || "שגיאה בשליחת המייל");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/auth/verify-code", {
        email: user.email,
        code: code,
      });
      setStage("PASSWORD");
      toast.success("הקוד אומת בהצלחה");
    } catch (error: any) {
      toast.error("קוד שגוי או פג תוקף");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password-with-code", {
        email: user.email,
        code: code,
        new_password: newPassword,
      });
      setStage("SUCCESS");
      setTimeout(() => {
        onOpenChange(false);
        setStage("INIT");
        setCode("");
        setNewPassword("");
      }, 3000);
    } catch (error: any) {
      toast.error("שגיאה בשינוי הסיסמה");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    if (!open) {
      setStage("INIT");
      setCode("");
      setNewPassword("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) setTimeout(resetDialog, 300);
      }}
    >
      <DialogContent
        className="sm:max-w-[420px] p-0 border-none sm:border sm:border-border/50 bg-card flex flex-col"
        dir="rtl"
      >
        <DialogDragHandle />
        {/* Header Decor */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

        <div className="p-6 md:p-8 pb-2">
          <DialogHeader className="text-right space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary  border border-primary/20 mb-2">
              {stage === "SUCCESS" ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : stage === "PASSWORD" ? (
                <Lock className="w-7 h-7" />
              ) : (
                <KeyRound className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-black -tracking-wide text-foreground text-right">
                {stage === "SUCCESS"
                  ? "הסיסמה שונתה!"
                  : stage === "PASSWORD"
                    ? "סיסמה חדשה"
                    : "שחזור סיסמה"}
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-muted-foreground leading-relaxed text-right">
                {stage === "INIT" &&
                  "אנו נשלח קוד אימות חד-פעמי לכתובת המייל המקושרת לחשבונך."}
                {stage === "CODE" && (
                  <span>
                    הזן את הקוד בן 6 הספרות שנשלח לכתובת{" "}
                    <span className="font-mono font-bold text-foreground dir-ltr inline-block">
                      {user.email}
                    </span>
                  </span>
                )}
                {stage === "PASSWORD" &&
                  "כמעט סיימנו. בחר סיסמה חזקה חדשה עבור חשבונך."}
                {stage === "SUCCESS" &&
                  "הסיסמה עודכנה בהצלחה. כעת תוכל להתחבר מחדש."}
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 md:px-8 pb-8 pt-2 min-h-[180px]">
          <AnimatePresence mode="wait">
            {stage === "INIT" && (
              <motion.div
                key="init"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="p-5 rounded-2xl bg-muted/40 border border-border/50 flex items-center gap-4 relative overflow-hidden group hover:bg-muted/60 transition-colors">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="bg-background p-3 rounded-xl border  relative z-10 text-primary">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="relative z-10 text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">
                      המייל המוגדר
                    </p>
                    <p className="font-mono text-sm font-bold text-foreground tracking-tight">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSendEmail}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-base font-bold   transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary to-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      שלח קוד אימות
                      <ArrowLeft className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </motion.div>
            )}

            {stage === "CODE" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="flex justify-center py-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-16 w-52 text-center text-3xl tracking-[0.5em] font-mono rounded-2xl bg-muted/30 border-2 focus:border-primary/50 focus:bg-background transition-all text-primary font-black "
                      maxLength={6}
                      placeholder="••••••"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl text-base font-bold  transition-all active:scale-[0.98]"
                      disabled={isLoading || code.length < 6}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "אמת קוד"
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      className="w-full text-xs font-medium text-muted-foreground hover:text-primary transition-colors text-center py-2 hover:bg-muted/30 rounded-lg"
                      disabled={isLoading}
                    >
                      לא קיבלת? לחץ לשליחה חוזרת
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {stage === "PASSWORD" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-right block text-xs font-black uppercase text-muted-foreground">
                      סיסמה חדשה
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="password"
                        className="h-12 pr-11 pl-4 font-mono font-bold text-lg rounded-xl transition-all"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-bold  "
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "עדכן סיסמה"
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {stage === "SUCCESS" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="text-center py-2 flex flex-col items-center justify-center min-h-[140px]"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20" />
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center relative border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-green-600">
                  הסיסמה עודכנה!
                </h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

