import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  ArrowRight,
  Mail,
  Fingerprint,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/auth.endpoints";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const HexagonPatrolGrid = ({ theme, accentColor }: { theme: string; accentColor: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = theme === "dark";
    
    // Hardcoded to always be cyber blue (59, 130, 246) and red
    const blueRgb = "59, 130, 246";

    const colors = isDark
      ? {
          bg: "#020617", // slate-950
          hexOutline: `rgba(${blueRgb}, 0.12)`, 
          hexActiveBlue: `rgba(${blueRgb}, 0.4)`, 
          hexActiveRed: "rgba(220, 38, 38, 0.4)", 
        }
      : {
          bg: "#f8fafc", // slate-50
          hexOutline: `rgba(${blueRgb}, 0.08)`, 
          hexActiveBlue: `rgba(${blueRgb}, 0.2)`, 
          hexActiveRed: "rgba(220, 38, 38, 0.2)", 
        };

    let animationFrameId: number;
    const hexSize = 30; // Radius of hexagon
    const hexWidth = Math.sqrt(3) * hexSize;
    const hexHeight = 2 * hexSize;
    const xStep = hexWidth;
    const yStep = hexHeight * 0.75;

    // Grid State
    let grid: {
      x: number;
      y: number;
      active: number; // 0 to 1 opacity
      targetActive: number;
      isRed: boolean;
      delay: number;
    }[] = [];

    const initGrid = () => {
      grid = [];
      const cols = Math.ceil(canvas.width / xStep) + 2;
      const rows = Math.ceil(canvas.height / yStep) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const xOffset = (r % 2) * (hexWidth / 2);
          const x = c * xStep + xOffset - hexWidth;
          const y = r * yStep - hexHeight;

          grid.push({
            x,
            y,
            active: 0,
            targetActive: 0,
            isRed: Math.random() > 0.9, // 10% chance to be red when active
            delay: Math.random() * 100,
          });
        }
      }
    };

    const drawHexagon = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6; // Start at 30 degrees for flat top
        ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.stroke();
    };

    const fillHexagon = (x: number, y: number, r: number, color: string) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGrid();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only, rely on canvas CSS for bg

      ctx.strokeStyle = colors.hexOutline;
      ctx.lineWidth = 1;

      grid.forEach((hex) => {
        // Update Logic

        // Random breathing (more subtle)
        if (Math.random() < 0.003) {
          hex.targetActive = Math.random() * 0.3 + 0.1;
          hex.isRed = Math.random() > 0.92; // Less frequent red
        }

        // Decay
        if (hex.active > 0.005) {
          hex.active -= 0.008;
        } else {
          hex.active = 0;
        }

        // Rise to target
        if (hex.targetActive > hex.active) {
          hex.active += 0.015;
        } else {
          hex.targetActive = 0;
        }

        // Mouse Interaction (flashlight effect)
        const dx = mousePos.x - hex.x;
        const dy = mousePos.y - hex.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Draw Outline
        drawHexagon(hex.x, hex.y, hexSize - 2);

        // Draw Active Fill
        let fillOpacity = hex.active;

        // Mouse hover boosts opacity
        if (dist < 200) {
          fillOpacity += (200 - dist) / 500;
        }

        if (fillOpacity > 0.03) {
          // Cap opacity
          fillOpacity = Math.min(fillOpacity, 0.5);

          const baseColor = hex.isRed
            ? colors.hexActiveRed
            : colors.hexActiveBlue;
          // Hacky RGBA replace to inject dynamic opacity
          const finalColor = baseColor.replace(/[\d.]+\)$/, `${fillOpacity})`);

          fillHexagon(hex.x, hex.y, hexSize - 3, finalColor);
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, [theme, accentColor, mousePos.x, mousePos.y]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{
        background: theme === "dark" ? "#020617" : "#f8fafc",
      }}
    />
  );
};

type Step = "request" | "verify" | "reset" | "success";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { theme, accentColor } = useTheme();
  const isDark = theme === "dark";

  const [step, setStep] = useState<Step>("request");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Data
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post(
        endpoints.AUTH_FORGOT_PASSWORD_ENDPOINT,
        {
                    email: email,
        },
      );

      if (data.success) {
        toast.success("קוד אימות נשלח לאימייל שלך");
        setStep("verify");
      } else {
        setError(data.error || "אירעה שגיאה בשליחת הקוד");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "שגיאת שרת. נסה שוב מאוחר יותר.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post(
        endpoints.AUTH_VERIFY_CODE_ENDPOINT,
        {
          email,
          code,
        },
      );

      if (data.success) {
        setStep("reset");
      } else {
        setError(data.error || "קוד שגוי או פג תוקף");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "אימות הקוד נכשל");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (newPassword.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post(
        endpoints.AUTH_RESET_PASSWORD_WITH_CODE_ENDPOINT,
        {
          email,
                    code,
          new_password: newPassword,
        },
      );

      if (data.success) {
        toast.success("הסיסמה עודכנה בהצלחה");
        setStep("success");
      } else {
        setError(data.error || "עדכון הסיסמה נכשל");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "שגיאה בעדכון הסיסמה");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      className={cn(
        "h-screen overflow-y-auto bg-background flex flex-col font-sans relative transition-colors custom-scrollbar",
        isDark ? "text-slate-100" : "text-slate-800"
      )}
      dir="rtl"
    >
      <HexagonPatrolGrid theme={theme} accentColor={accentColor} />

      {/* Cybernetic Theme Toggle Panel */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
        <ThemeToggle 
          variant="minimal" 
          className="w-10 h-10 bg-white/80 dark:bg-slate-900/65 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm hover:bg-white/95 dark:hover:bg-slate-800/80 text-foreground hover:text-foreground transition-all duration-300 backdrop-blur-md"
        />
      </div>

      {/* Decorative Overlays - Theme Adaptive */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-none z-0 transition-colors",
          isDark
            ? "bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950"
            : "bg-gradient-to-b from-transparent via-slate-50/50 to-slate-100"
        )}
      />
      <div
        className="fixed top-0 left-0 w-full h-1 z-50 opacity-50"
        style={{
          background: "linear-gradient(90deg, var(--primary) 0%, #22d3ee 50%, var(--primary) 100%)"
        }}
      />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center pt-10 pb-6 md:pt-12 md:pb-8 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[440px] px-4"
        >
          {/* Logo / Header Section */}
          <div className="text-center mb-4 md:mb-6 relative flex flex-col items-center">
            <div className="flex justify-center mb-2">
              <img 
                src="/toren_logo.png" 
                alt="Toren Logo" 
                className="w-28 h-auto md:w-32 object-contain toren-logo-img" 
              />
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-px w-6 md:w-8 bg-[var(--primary)]/50" />
              <span className="text-[10px] md:text-xs font-bold text-[var(--primary)] tracking-[0.2em] md:tracking-[0.3em] uppercase">
                Operational Control Center
              </span>
              <div className="h-px w-6 md:w-8 bg-[var(--primary)]/50" />
            </div>
          </div>

          {/* Card */}
          <div
            className={cn(
              "backdrop-blur-xl border rounded-[2rem] md:rounded-[2.5rem] overflow-hidden ring-1 transition-all",
              isDark
                ? "bg-slate-900/60 border-white/10 ring-white/5"
                : "bg-white/70 border-white/50 ring-black/5"
            )}
          >
            <div className="p-6 md:p-10">
              <AnimatePresence mode="wait">
                {/* STEP 1: REQUEST */}
                {step === "request" && (
                  <motion.div
                    key="request"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h1 className="text-2xl font-black mb-2">שכחתי סיסמה</h1>
                      <p className="text-sm text-muted-foreground font-medium">
                        הזן פרטים לאימות וקבלת קוד אימות למייל
                      </p>
                    </div>

                    <form onSubmit={handleRequestCode} className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="relative group">
                          <Label
                            htmlFor="email"
                            className={cn(
                              "absolute -top-2.5 right-3 px-2 text-[10px] font-bold uppercase tracking-widest z-10 rounded-full border transition-all",
                              isDark
                                ? "bg-slate-900/90 text-slate-400 border-slate-700 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                                : "bg-white text-slate-400 border-slate-200 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                            )}
                          >
                            אימייל
                          </Label>
                          <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[var(--primary)] z-10" />
                          <Input
                            required
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={cn(
                              "h-13 border rounded-2xl pr-12 transition-all font-mono",
                              isDark
                                ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-[var(--primary)] focus:ring-[var(--primary)]/50"
                                : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            )}
                            placeholder="example@unit.gov.il"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-13 bg-[var(--primary)] hover:opacity-95 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] border border-white/10 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "שלח קוד אימות"
                          )}
                        </span>
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: VERIFY */}
                {step === "verify" && (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h1 className="text-2xl font-black mb-2">אימות קוד</h1>
                      <p className="text-sm text-muted-foreground font-medium">
                        הזן את הקוד שנשלח לכתובת: <br />
                        <span className="font-bold text-foreground">{email}</span>
                      </p>
                    </div>

                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1 text-center block">
                          קוד אימות (6 ספרות)
                        </Label>
                        <Input
                          required
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                          className={cn(
                            "h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl bg-background/50 focus:bg-background",
                            isDark
                              ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 focus:border-[var(--primary)] focus:ring-[var(--primary)]/50"
                              : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          )}
                          placeholder="000000"
                        />
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-13 bg-[var(--primary)] hover:opacity-95 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] border border-white/10 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "המשך להחלפת סיסמה"
                          )}
                        </span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => setStep("request")}
                        className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        לא קיבלת קוד? שלח שוב
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 3: RESET */}
                {step === "reset" && (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h1 className="text-2xl font-black mb-2">החלפת סיסמה</h1>
                      <p className="text-sm text-muted-foreground font-medium">
                        בחר סיסמה חדשה ומאובטחת למשתמש שלך
                      </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="relative group">
                          <Label
                            htmlFor="newPassword"
                            className={cn(
                              "absolute -top-2.5 right-3 px-2 text-[10px] font-bold uppercase tracking-widest z-10 rounded-full border transition-all",
                              isDark
                                ? "bg-slate-900/90 text-slate-400 border-slate-700 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                                : "bg-white text-slate-400 border-slate-200 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                            )}
                          >
                            סיסמה חדשה
                          </Label>
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[var(--primary)] z-10" />
                          <Input
                            required
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={cn(
                              "h-13 border rounded-2xl pr-12 transition-all font-mono",
                              isDark
                                ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-[var(--primary)] focus:ring-[var(--primary)]/50"
                                : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            )}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="relative group">
                          <Label
                            htmlFor="confirmPassword"
                            className={cn(
                              "absolute -top-2.5 right-3 px-2 text-[10px] font-bold uppercase tracking-widest z-10 rounded-full border transition-all",
                              isDark
                                ? "bg-slate-900/90 text-slate-400 border-slate-700 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                                : "bg-white text-slate-400 border-slate-200 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                            )}
                          >
                            אימות סיסמה
                          </Label>
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-[var(--primary)] z-10" />
                          <Input
                            required
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(
                              "h-13 border rounded-2xl pr-12 transition-all font-mono",
                              isDark
                                ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-[var(--primary)] focus:ring-[var(--primary)]/50"
                                : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            )}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500">
                          <AlertCircle className="w-4 h-4" />
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] border border-white/10 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "עדכן סיסמה"
                          )}
                        </span>
                      </Button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 4: SUCCESS */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black mb-2">בוצע בהצלחה!</h1>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">
                        הסיסמה שלך עודכנה במערכת. כעת תוכל להיכנס עם הפרטים החדשים.
                      </p>
                    </div>

                    <Button
                      onClick={() => navigate("/login")}
                      className="w-full h-13 bg-[var(--primary)] hover:opacity-95 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] border border-white/10 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        כניסה למערכת
                      </span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {step !== "success" && (
            <button
              onClick={() => navigate("/login")}
              className="mt-8 flex items-center justify-center gap-2 w-full text-xs font-black text-muted-foreground hover:text-foreground transition-all group"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              חזרה למסך הכניסה
            </button>
          )}
        </motion.div>
      </main>
    </div>
  );
}

