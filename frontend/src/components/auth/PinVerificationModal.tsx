import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Fingerprint, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<boolean>;
  username: string;
  theme: string;
}

export function PinVerificationModal({
  isOpen,
  onClose,
  onVerify,
  username,
  theme,
}: PinVerificationModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isDark = theme === "dark";

  const MAX_PIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      // Load attempt state per user
      const storedAttempts = Number(sessionStorage.getItem(`pin_attempts_${username}`) || "0");
      setAttempts(storedAttempts);
      
      const storedLockout = Number(sessionStorage.getItem(`pin_lockout_until_${username}`) || "0");
      if (storedLockout && Date.now() < storedLockout) {
        setLockoutUntil(storedLockout);
        setLockoutRemaining(Math.max(0, storedLockout - Date.now()));
      } else {
        setLockoutUntil(null);
        setLockoutRemaining(0);
        sessionStorage.removeItem(`pin_lockout_until_${username}`);
      }

      // Focus first input when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen, username]);

  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = window.setInterval(() => {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutRemaining(0);
        setAttempts(0);
        sessionStorage.removeItem(`pin_attempts_${username}`);
        sessionStorage.removeItem(`pin_lockout_until_${username}`);
        clearInterval(interval);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil, username]);

  const handlePinChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = pin.split("");
    newPin[index] = value;
    const updatedPin = newPin.join("");
    setPin(updatedPin);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when 6 digits entered
    if (updatedPin.length === 6) {
      handleVerify(updatedPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (pinToVerify: string = pin) => {
    if (pinToVerify.length < 4) {
      setError("יש להזין לפחות 4 ספרות");
      return;
    }

    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError(
        `נעילה עקב ניסיונות שגויים. נסה שוב ב-${Math.ceil(
          lockoutRemaining / 1000,
        )} שניות`,
      );
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const success = await onVerify(pinToVerify);
      if (!success) {
        const nextAttempts = Math.min(attempts + 1, MAX_PIN_ATTEMPTS);
        setAttempts(nextAttempts);
        sessionStorage.setItem(`pin_attempts_${username}`, String(nextAttempts));

        if (nextAttempts >= MAX_PIN_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(lockoutTime);
          setLockoutRemaining(LOCKOUT_DURATION_MS);
          sessionStorage.setItem(`pin_lockout_until_${username}`, String(lockoutTime));
          setError("יותר מדי ניסיונות. המתן 5 דקות לפני ניסיון מחודש.");
        } else {
          setError(`קוד PIN שגוי (${nextAttempts}/${MAX_PIN_ATTEMPTS})`);
        }

        setPin("");
        inputRefs.current[0]?.focus();
      } else {
        // Successful verify: reset counters
        setAttempts(0);
        setLockoutUntil(null);
        setLockoutRemaining(0);
        sessionStorage.removeItem(`pin_attempts_${username}`);
        sessionStorage.removeItem(`pin_lockout_until_${username}`);
      }
    } catch (err: any) {
      setError(err.message || "שגיאה באימות");
      setPin("");
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setPin(pastedData);
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "w-full max-w-md rounded-3xl border overflow-hidden relative",
                isDark
                  ? "bg-slate-900/95 border-slate-700"
                  : "bg-white/95 border-slate-200"
              )}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className={cn(
                  "absolute top-4 left-4 p-2 rounded-xl transition-colors z-10",
                  isDark
                    ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                )}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="p-8 text-center border-b border-border/40">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                    isDark ? "bg-blue-500/10" : "bg-blue-500/10"
                  )}
                >
                  <Fingerprint className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black mb-2">אימות זהות</h2>
                <p className="text-sm text-muted-foreground font-medium">
                  הזן את קוד ה-PIN שלך עבור {username}
                </p>
              </div>

              {/* PIN Input */}
              <div className="p-8">
                <div className="flex gap-2 justify-center mb-6" dir="ltr" onPaste={handlePaste}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={pin[index] || ""}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={
                        isVerifying ||
                        (lockoutUntil !== null && Date.now() < lockoutUntil)
                      }
                      className={cn(
                        "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none",
                        isDark
                          ? "bg-slate-950/50 border-slate-700 text-slate-100 focus:border-blue-500 focus:bg-slate-900"
                          : "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-blue-50/50",
                        pin[index] && "border-blue-500",
                        isVerifying && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-sm font-bold mb-4"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
                {lockoutUntil && lockoutRemaining > 0 && (
                  <div className="text-center text-xs text-rose-500 font-semibold mb-4">
                    נעולה כתוצאה מ-5 ניסיונות כושלים. נסה שוב בעוד {Math.ceil(
                    lockoutRemaining / 1000,
                  )} שניות.
                  </div>
                )}

                {/* Loading State */}
                {isVerifying && (
                  <div className="text-center">
                    <div className="inline-block w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                      מאמת...
                    </p>
                  </div>
                )}

                {/* Instructions */}
                {!isVerifying && !error && (
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    הזן 4-6 ספרות • הקוד יאומת אוטומטית
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
