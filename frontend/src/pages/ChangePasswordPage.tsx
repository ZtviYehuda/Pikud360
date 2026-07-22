import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, changePassword } = useAuthContext();
  const { theme } = useTheme();

  const isLengthValid = newPassword.length >= 4;
  const isCombinedValid = /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword);

  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: "", color: "bg-slate-200 dark:bg-slate-800" };
    
    let score = 0;
    if (newPassword.length >= 4) score += 1;
    if (isCombinedValid) score += 1;
    if (newPassword.length >= 8) score += 1;

    if (score === 1) {
      return { score: 33, label: "חלשה", color: "bg-rose-500" };
    } else if (score === 2) {
      return { score: 66, label: "בינונית", color: "bg-amber-500" };
    } else if (score === 3) {
      return { score: 100, label: "חזקה מאוד", color: "bg-emerald-500" };
    }
    return { score: 10, label: "חלשה מאוד", color: "bg-rose-600" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("יש למלא את כל השדות");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    if (newPassword.length < 4) {
      setError("הסיסמה חייבת להכיל לפחות 4 תווים");
      return;
    }

    setIsLoading(true);

    try {
      const success = await changePassword(newPassword);
      if (success) {
        navigate("/", { replace: true });
      } else {
        setError("שגיאה בעדכון הסיסמה. נסה שוב מאוחר יותר.");
      }
    } catch (err) {
      setError("שגיאה בעדכון הסיסמה. נסה שוב מאוחר יותר.");
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden flex flex-col font-sans relative transition-colors select-none",
        isDark ? "bg-[#020617] text-slate-100" : "bg-[#f8fafc] text-slate-800"
      )}
      dir="rtl"
    >
      {/* Background Glow Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 -z-10 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -ml-48 -mb-48 -z-10 animate-pulse duration-[12000ms]" />

      {/* Floating Theme Toggle */}
      <div className="fixed top-6 left-6 z-50">
        <ThemeToggle 
          variant="minimal" 
          className="w-10 h-10 bg-white/80 dark:bg-slate-900/65 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm hover:bg-white/95 dark:hover:bg-slate-800/80 text-foreground hover:text-foreground transition-all duration-300 backdrop-blur-md"
        />
      </div>

      {/* Standalone Header/Branding */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 backdrop-blur-md shadow-sm">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <span className="text-lg font-black tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          Toren
        </span>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[450px] space-y-6"
        >
          {/* Change Password Card */}
          <div className="bg-card/40 dark:bg-slate-900/35 backdrop-blur-2xl rounded-[2.5rem] border border-border/40 overflow-hidden shadow-2xl p-8 sm:p-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
                <KeyRound className="w-7 h-7 text-amber-600 dark:text-amber-500" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                חובה להחליף סיסמה
              </h1>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-[320px] mx-auto font-medium">
                שלום,{" "}
                <span className="text-primary font-black">
                  {user?.first_name} {user?.last_name}
                </span>
                . זוהי התחברות ראשונית למערכת. למען אבטחת המידע, עליך לבחור סיסמה אישית חדשה.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5 flex flex-col relative">
                  <Label
                    htmlFor="new_password"
                    className="text-xs font-bold text-slate-400 pr-1 flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 opacity-60" />
                    סיסמה חדשה
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      autoFocus
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      className="h-12 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl bg-background/50 backdrop-blur-sm font-bold text-sm pl-10 text-right"
                      placeholder="הזן סיסמה חדשה (מינימום 4 תווים)"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength Bar */}
                  {newPassword.length > 0 && (
                    <div className="w-full mt-1.5 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-400 px-0.5">
                        <span>חוזק סיסמה:</span>
                        <span className={cn(
                          strength.score === 33 && "text-rose-500",
                          strength.score === 66 && "text-amber-500",
                          strength.score === 100 && "text-emerald-500",
                          strength.score === 10 && "text-rose-600"
                        )}>
                          {strength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 flex flex-col">
                  <Label
                    htmlFor="confirm_password"
                    className="text-xs font-bold text-slate-400 pr-1 flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 opacity-60" />
                    אימות סיסמה
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      className="h-12 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl bg-background/50 backdrop-blur-sm font-bold text-sm pl-10 text-right"
                      placeholder="הזן שוב את הסיסמה"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Rules Checklist */}
              <div className="bg-muted/40 border border-border/20 rounded-2xl p-4 text-[11px] text-muted-foreground space-y-2 font-bold">
                <p className="text-muted-foreground/80 uppercase tracking-tighter mb-1">
                  קריטריונים לסיסמה:
                </p>
                
                {/* Rule 1: Min 4 characters */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>מינימום 4 תווים</span>
                  </span>
                  {newPassword.length > 0 ? (
                    isLengthValid ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>תקין</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>קצר מדי</span>
                      </div>
                    )
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>

                {/* Rule 2: Letters and Numbers */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>שילוב של אותיות ומספרים</span>
                  </span>
                  {newPassword.length > 0 ? (
                    isCombinedValid ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>תקין</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>חסר אות/מספר</span>
                      </div>
                    )
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>

                {/* Rule 3: Case Sensitive Info */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>רגיש לאותיות גדולות וקטנות (A ≠ a)</span>
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>פעיל</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 p-3 rounded-2xl text-xs text-destructive"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-black text-right leading-tight">{error}</span>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded-xl transition-all shadow-[0_4px_12px_rgba(59,130,246,0.25)] active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    מעדכן סיסמה...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    שמור וסיים
                  </span>
                )}
              </Button>
            </form>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest leading-tight">
              Toren Security System
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
