import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoginForm } from "../components/LoginForm";
import { QuickLoginSelector } from "../components/QuickLoginSelector";
import { ShieldCheck, Moon, Sun } from "lucide-react";
import { useTheme } from "../../../providers/ThemeProvider";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col items-center justify-center relative overflow-hidden select-none" dir="rtl">
      {/* Background Radial Dots Grid Pattern */}
      <div className="absolute inset-0 grid-background opacity-60 pointer-events-none" />

      {/* Top Left Theme Toggle Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-card border border-border text-foreground hover:bg-secondary transition-all shadow-2xs cursor-pointer"
          title={isDark ? "מעבר למצב יום" : "מעבר למצב לילה"}
        >
          {isDark ? (
            <Sun className="h-4.5 w-4.5 text-amber-400" />
          ) : (
            <Moon className="h-4.5 w-4.5 text-blue-500" />
          )}
        </button>
      </div>

      {/* Center Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md px-4 z-10"
      >
        <div className="bg-card text-card-foreground border border-border/80 rounded-3xl p-8 shadow-xl backdrop-blur-xl space-y-6">
          {/* Header Brand Logo */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-2xs">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1 pt-1">
              <h1 className="text-2xl font-extrabold font-heading text-foreground tracking-tight">
                TOREN · Pikud360
              </h1>
              <p className="text-xs text-muted-foreground font-semibold">
                מערכת שליטה, מעקב וניהול כוח אדם מבצעי
              </p>
            </div>
          </div>

          {/* Login Form */}
          <LoginForm onSuccess={handleSuccess} />

          {/* Quick Login Selector */}
          <QuickLoginSelector onSuccess={handleSuccess} />
        </div>
      </motion.div>
    </div>
  );
};
LoginPage.displayName = "LoginPage";
