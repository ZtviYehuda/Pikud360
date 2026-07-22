import { useState, useEffect, useRef } from "react";
import apiClient from "@/config/api.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  Lock,
  LogOut,
  ScanEye,
  Eye,
  EyeOff,
  Crosshair,
  Fingerprint,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface LockedUser {
  username: string;
  first_name: string;
  last_name: string;
}

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

    window.addEventListener("mousemove", (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    });

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos, theme, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-colors",
        theme === "dark" ? "bg-slate-950" : "bg-slate-50/80",
      )}
    />
  );
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const translateErrorText = (errorText: string): string => {
    if (!errorText) return "";

    const translations: Record<string, string> = {
      "No biometric credentials registered":
        "לא הוגדר זיהוי ביומטרי עבור משתמש זה במכשיר הנוכחי. אנא הפעל כניסה מהירה בהגדרות הפרופיל תחילה.",
      "User not found": "שם משתמש אינו קיים במערכת.",
      "Invalid password": "הסיסמה שהוזנה שגויה.",
      "Biometric authentication failed": "אימות ביומטרי נכשל.",
      "Registration failed": "רישום ביומטרי נכשל.",
      "Device already registered": "מכשיר זה כבר רשום במערכת.",
      "Invalid challenge": "פג תוקף בקשת האימות.",
      "User is inactive": "המשתמש מושבת בארגון.",
      "Failed to parse public key credential": "כשל בפענוח מפתח האימות.",
      "Crypto key generation failed": "כשל ביצירת מפתח אבטחה.",
      "Unauthorized delegate access": "אין הרשאה לגישה מיופת כוח.",
    };

    return translations[errorText] || errorText;
  };

  const getErrorMessage = (err: any): string => {
    if (typeof err === "string") {
      return translateErrorText(err);
    }
    const errorStr = err?.response?.data?.error || err?.message || "";
    return translateErrorText(errorStr);
  };
  const [lockedUser, setLockedUser] = useState<LockedUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, refreshUser } = useAuthContext();
  const fromPath = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(fromPath, { replace: true });
    }
  }, [user, navigate, fromPath]);

  const { theme, setTheme, accentColor } = useTheme();
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinUsername, setPinUsername] = useState("");

  // WebAuthn Helpers (Matching ProfileSettings)
  const base64urlToBytes = (base64url: string): Uint8Array => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binary = window.atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const bufferToBase64url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window
      .btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  // Check if WebAuthn is supported
  const isWebAuthnSupported =
    typeof window !== "undefined" && !!window.PublicKeyCredential;
  const isCredentialManagerSupported =
    typeof window !== "undefined" && !!(window as any).PasswordCredential;

  useEffect(() => {
    // Check if quick login is available
    const lastUser = localStorage.getItem("biometric_last_user");
    const hasRegistration =
      lastUser && localStorage.getItem(`biometric_registered_${lastUser}`);

    if (isWebAuthnSupported) {
      setIsBiometricAvailable(true);
    } else {
      setIsBiometricAvailable(!!hasRegistration);
    }
  }, []);

  // Hash function matching ProfileSettings
  const hashPin = async (pin: string, username: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + username);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleBiometricLogin = async () => {
    setError("");
    let targetUsername =
      lockedUser?.username ||
      username.trim() ||
      localStorage.getItem("biometric_last_user");

    if (!targetUsername) {
      setError("יש להזין שם משתמש כדי להשתמש בכניסה ביומטרית");
      return;
    }

    if (isWebAuthnSupported) {
      try {
        setIsLoading(true);

        // Step 1: Get authentication options from server
        const optionsResp = await apiClient.post(
          "/auth/webauthn/login/options",
          {
            username: targetUsername,
          },
        );
        const options = optionsResp.data;

        // Transform options for the browser
        const assertionOptions: CredentialRequestOptions = {
          publicKey: {
            ...options,
            challenge: base64urlToBytes(options.challenge),
            allowCredentials: options.allowCredentials?.map((cred: any) => ({
              ...cred,
              id: base64urlToBytes(cred.id),
            })),
          },
        };

        // Step 2: Trigger the OS biometric prompt
        const assertion = (await navigator.credentials.get(
          assertionOptions,
        )) as any;

        if (!assertion) {
          throw new Error("לא התקבלו נתוני אימות מהמכשיר");
        }

        // Step 3: Prepare verify data for the server
        const verifyData = {
          id: assertion.id,
          rawId: bufferToBase64url(assertion.rawId),
          type: assertion.type,
          response: {
            authenticatorData: bufferToBase64url(
              assertion.response.authenticatorData,
            ),
            clientDataJSON: bufferToBase64url(
              assertion.response.clientDataJSON,
            ),
            signature: bufferToBase64url(assertion.response.signature),
            userHandle: assertion.response.userHandle
              ? bufferToBase64url(assertion.response.userHandle)
              : undefined,
          },
        };

        // Step 4: Finalize login with server
        const response = await apiClient.post(
          "/auth/webauthn/login/verify",
          verifyData,
        );

        if (response.data?.success) {
          const { token, user: loggedUser } = response.data;

          // Use the login function from AuthContext to set state
          // We might need to handle the state manually if context login expects username/pass
          // Actually, our verify endpoint returns the token and user, same as login.
          // Let's assume context.login can accept partials or we update localstorage.
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(loggedUser));
          localStorage.setItem("biometric_last_user", targetUsername);

          await refreshUser(); // Essential to update context state
          navigate(fromPath, { replace: true });
          return;
        }
      } catch (e: any) {
        console.error("WebAuthn login failed:", e);

        if (e.name === "NotAllowedError") {
          setIsLoading(false); // Silent fail on user cancel
          return;
        }

        // Fallback to PIN if Passkey fails and we have a PIN setup
        if (localStorage.getItem(`biometric_pin_${targetUsername}`)) {
          setPinUsername(targetUsername);
          setShowPinModal(true);
          setIsLoading(false);
          return;
        }

        setError(
          getErrorMessage(e) ||
            "זיהוי ביומטרי נכשל. התחבר ידנית או באמצעות PIN.",
        );
      }
      setIsLoading(false);
      return;
    }

    // Fallback: PIN-based quick login
    targetUsername =
      lockedUser?.username ||
      username.trim() ||
      null ||
      localStorage.getItem("biometric_last_user");

    if (!targetUsername) {
      setError("הזן שם משתמש כדי להשתמש בכניסה מהירה");
      return;
    }

    const hasRegistration = localStorage.getItem(
      `biometric_registered_${targetUsername}`,
    );
    if (!hasRegistration) {
      setError("יש להפעיל כניסה מהירה בהגדרות המשתמש תחילה");
      return;
    }

    // Open PIN verification modal
    setPinUsername(targetUsername);
    setShowPinModal(true);
  };

  const handleVerifyPin = async (enteredPin: string): Promise<boolean> => {
    try {
      // Hash the entered PIN
      const enteredPinHash = await hashPin(enteredPin, pinUsername);

      // Get stored PIN hash
      const storedPinHash = localStorage.getItem(
        `biometric_pin_${pinUsername}`,
      );

      if (!storedPinHash || enteredPinHash !== storedPinHash) {
        return false;
      }

      const refreshToken = localStorage.getItem(
        `biometric_refresh_${pinUsername}`,
      );
      if (!refreshToken) {
        throw new Error("לכדי כניסה מהירה יש להגדיר PIN מחדש בהגדרות הפרופיל");
      }

      setIsLoading(true);

      // Attempt refresh-token login
      const { data } = await apiClient.post("/auth/refresh-token", {
        refresh_token: refreshToken,
      });

      if (!data?.success || !data?.accessToken) {
        throw new Error(
          "כשל ניסיון רענון אימות. אנא התחבר באמצעות שם משתמש וסיסמה.",
        );
      }

      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(
          `biometric_refresh_${pinUsername}`,
          data.refreshToken,
        );
      }
      localStorage.setItem("biometric_last_user", pinUsername);

      await refreshUser();
      setShowPinModal(false);
      navigate(fromPath, { replace: true });
      return true;
    } catch (err: any) {
      console.error("PIN verification error:", err);
      setShowPinModal(false);
      if (err.response?.status === 401 || err.message?.includes("כשל")) {
        localStorage.removeItem(`biometric_refresh_${pinUsername}`);
        localStorage.removeItem(`biometric_pin_${pinUsername}`);
        localStorage.removeItem(`biometric_registered_${pinUsername}`);
      }
      setError(getErrorMessage(err) || "שגיאה באימות");
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    const savedLockedUser = localStorage.getItem("locked_user");
    if (savedLockedUser) {
      try {
        const user = JSON.parse(savedLockedUser);
        setLockedUser(user);
        setUsername(user.username || "");
      } catch (e) {
        console.error("Failed to parse locked user", e);
        localStorage.removeItem("locked_user");
      }
    }
  }, []);

  // Save credentials after successful login (triggers browser's native biometric save)
  const saveCredentials = async (uname: string, pass: string) => {
    if (!isCredentialManagerSupported) return;
    try {
      const cred = new (window as any).PasswordCredential({
        id: uname,
        password: pass,
        name: uname,
      });
      await navigator.credentials.store(cred);
      localStorage.setItem("biometric_last_user", uname);
    } catch (e) {
      console.log("Credential Manager save skipped:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("יש למלא שם משתמש וסיסמה");
      return;
    }

    setIsLoading(true);

    try {
      const trimmedUser = username.trim();
      const trimmedPass = password.trim();
      const success = await login(trimmedUser, trimmedPass);
      if (success) {
        // Save credentials for biometric login next time
        await saveCredentials(trimmedUser, trimmedPass);
        navigate(fromPath, { replace: true });
      } else {
        setError("שם משתמש או סיסמה שגויים.");
        setPassword("");
      }
    } catch (err) {
      setError(getErrorMessage(err) || "שגיאת מערכת. אנא נסה שוב מאוחר יותר.");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("locked_user");
    setLockedUser(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  // Dynamic class helpers for Theme
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "h-screen overflow-y-auto bg-background flex flex-col font-sans relative transition-colors custom-scrollbar",
        isDark ? "text-slate-100" : "text-slate-800",
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
            : "bg-gradient-to-b from-transparent via-slate-50/50 to-slate-100",
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
            {/* User's provided TOREN logo */}
            <div className="flex justify-center mb-2">
              <img 
                src="/toren_logo.png" 
                alt="Toren Logo" 
                className="w-28 h-auto md:w-32 object-contain toren-logo-img" 
              />
            </div>
            
            {/* Subtitle */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-px w-6 md:w-8 bg-[var(--primary)]/50" />
              <span className="text-[10px] md:text-xs font-bold text-[var(--primary)] tracking-[0.2em] md:tracking-[0.3em] uppercase">
                Operational Control Center
              </span>
              <div className="h-px w-6 md:w-8 bg-[var(--primary)]/50" />
            </div>
          </div>

          {/* Login Card */}
          <div
            className={cn(
              "backdrop-blur-xl border rounded-[2rem] md:rounded-[2.5rem] overflow-hidden ring-1 transition-all",
              isDark
                ? "bg-slate-900/60 border-white/10  ring-white/5"
                : "bg-white/70 border-white/50  ring-black/5",
            )}
          >
            <div className="p-6 md:p-10">
              {lockedUser ? (
                /* LOCKED USER VIEW */
                <div className="text-center">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-2  font-black text-2xl relative group",
                      isDark
                        ? "bg-slate-800 border-slate-600 text-[var(--primary)]"
                        : "bg-slate-100 border-slate-200 text-[var(--primary)]",
                    )}
                  >
                    {lockedUser.first_name[0]}
                    {lockedUser.last_name[0]}
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 " />
                  </div>
                  <div
                    className={cn(
                      "text-xl font-bold mb-4",
                      isDark ? "text-white" : "text-slate-900",
                    )}
                  >
                    <h1 className="text-xl font-black mb-1">ברוך שובך</h1>
                    <h2 className="text-xl font-black mb-1">
                      {"המפקד/ת"} {lockedUser.first_name}
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 text-right">
                      <div className="relative group">
                        <Lock
                          className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10",
                            isDark
                              ? "text-slate-500 group-focus-within:text-[var(--primary)]"
                              : "text-slate-400 group-focus-within:text-[var(--primary)]",
                          )}
                        />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          autoFocus
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                          }}
                          className={cn(
                            "h-13 border rounded-2xl pr-12 pl-12 transition-all text-lg tracking-widest font-mono",
                            isDark
                              ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-[var(--primary)] focus:ring-[var(--primary)]/50"
                              : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20",
                          )}
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10",
                            isDark
                              ? "text-slate-500 hover:text-slate-300"
                              : "text-slate-400 hover:text-slate-600",
                          )}
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            x: [0, -10, 10, -10, 10, 0],
                          }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{
                            duration: 0.4,
                            x: { duration: 0.35, ease: "easeInOut" },
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-xl border text-sm font-semibold shadow-sm backdrop-blur-md text-right w-full",
                            isDark
                              ? "bg-rose-950/20 border-rose-900/30 text-rose-300"
                              : "bg-rose-50/60 border-rose-100/80 text-rose-600",
                          )}
                        >
                          <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                          </div>
                          <span className="font-sans leading-snug">
                            {error}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-2">
                      {isBiometricAvailable && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBiometricLogin}
                          className="h-13 w-14 min-w-[56px] rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 shrink-0 flex md:hidden items-center justify-center transition-all"
                          title="כניסה מהירה עם PIN"
                        >
                          <Fingerprint className="w-6 h-6 text-[var(--primary)]" />
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 h-13 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-2xl transition-all active:scale-[0.98] relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform" />
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          "אימות וכניסה"
                        )}
                      </Button>
                    </div>
                  </form>

                  <button
                    onClick={handleSwitchUser}
                    className="mt-6 text-xs font-bold text-slate-500 hover:text-foreground transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wide group"
                  >
                    <LogOut className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                    החלף משתמש
                  </button>
                </div>
              ) : (
                /* REGULAR LOGIN VIEW */
                <>
                  <div className="mb-6 text-center">
                    <p className="text-muted-foreground text-sm font-medium">
                      הזדהות מאובטחת לרשת המבצעית
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Personal Number */}
                      <div className="space-y-1.5">
                        <div className="relative group">
                          <Label
                            htmlFor="username"
                            className={cn(
                              "absolute -top-2.5 right-3 px-2 text-[10px] font-bold uppercase tracking-widest z-10 rounded-full border transition-all",
                              isDark
                                ? "bg-slate-900/90 text-slate-400 border-slate-700 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                                : "bg-white text-slate-400 border-slate-200 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]",
                            )}
                          >
                            שם משתמש
                          </Label>
                          <ScanEye
                            className={cn(
                              "absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10",
                              isDark
                                ? "text-slate-500 group-focus-within:text-[var(--primary)]"
                                : "text-slate-400 group-focus-within:text-[var(--primary)]",
                            )}
                          />
                          <Input
                            id="username"
                            type="text"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value.trim());
                              setError("");
                            }}
                            className={cn(
                              "h-13 border rounded-2xl pr-12 transition-all font-mono",
                              isDark
                                ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-[var(--primary)] focus:ring-[var(--primary)]/50"
                                : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20",
                            )}
                            placeholder="הזן שם משתמש"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="relative group">
                          <Label
                            htmlFor="password"
                            className={cn(
                              "absolute -top-2.5 right-3 px-2 text-[10px] font-bold uppercase tracking-widest z-10 rounded-full border transition-all",
                              isDark
                                ? "bg-slate-900/90 text-slate-400 border-slate-700 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]"
                                : "bg-white text-slate-400 border-slate-200 group-focus-within:text-[var(--primary)] group-focus-within:border-[var(--primary)]",
                            )}
                          >
                            סיסמה
                          </Label>
                          <Lock
                            className={cn(
                              "absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors z-10",
                              isDark
                                ? "text-slate-500 group-focus-within:text-[var(--primary)]"
                                : "text-slate-400 group-focus-within:text-[var(--primary)]",
                            )}
                          />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setError("");
                            }}
                            className={cn(
                              "h-13 border rounded-2xl pr-12 pl-12 transition-all font-mono tracking-widest",
                              isDark
                                ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-[var(--primary)] focus:ring-[var(--primary)]/50"
                                : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20",
                            )}
                            placeholder="••••••••"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={cn(
                              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10",
                              isDark
                                ? "text-slate-500 hover:text-slate-300"
                                : "text-slate-400 hover:text-slate-600",
                            )}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-left -mt-2">
                      <Link
                        to="/forgot-password"
                        className="text-xs font-bold text-[var(--primary)] hover:opacity-80 transition-colors uppercase tracking-tight"
                      >
                        שכחת סיסמה?
                      </Link>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            x: [0, -10, 10, -10, 10, 0],
                          }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{
                            duration: 0.4,
                            x: { duration: 0.35, ease: "easeInOut" },
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-xl border text-sm font-semibold shadow-sm backdrop-blur-md text-right w-full",
                            isDark
                              ? "bg-rose-950/20 border-rose-900/30 text-rose-300"
                              : "bg-rose-50/60 border-rose-100/80 text-rose-600",
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5 text-rose-500" />
                          </div>
                          <span className="font-sans leading-snug">
                            {error}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button & Biometric */}
                    <div className="pt-2 flex gap-3">
                      {isBiometricAvailable && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBiometricLogin}
                          className="h-13 w-14 min-w-[56px] rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 shrink-0 flex md:hidden items-center justify-center transition-all"
                          title="כניסה מהירה עם PIN"
                        >
                          <Fingerprint className="w-7 h-7 text-[var(--primary)]" />
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 h-13 bg-[var(--primary)] hover:opacity-95 text-white font-black text-lg rounded-2xl transition-all active:scale-[0.98] border border-white/10 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                        <div className="relative flex items-center justify-center gap-2">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="text-base">
                                מבצע אימות נתונים...
                              </span>
                            </>
                          ) : (
                            <>
                              <Crosshair className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                              כניסה למערכת
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Form Footer - Removed */}
          </div>

          <div className="mt-4 text-center px-4 flex flex-col items-center gap-2.5">
            <img 
              src="/logo_unit.png" 
              alt="Cyber Unit Logo" 
              className="w-10 h-10 object-contain opacity-40 hover:opacity-80 transition-opacity duration-300 select-none pointer-events-none"
            />
            <p className="text-[10px] text-muted-foreground font-medium font-mono uppercase tracking-[0.2em] leading-relaxed">
              © 2026 • CYBER UNIT • v1.0.4
            </p>
          </div>
        </motion.div>
      </main>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={handleVerifyPin}
        username={pinUsername}
        theme={theme}
      />
    </div>
  );
}
