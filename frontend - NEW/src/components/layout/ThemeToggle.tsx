import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeToggleProps {
  collapsed?: boolean;
  className?: string;
  theme?: string;
  setTheme?: (theme: any) => void;
  variant?: "default" | "minimal";
}

export function ThemeToggle({
  className,
  theme: propTheme,
  setTheme: propSetTheme,
  variant = "default",
}: ThemeToggleProps) {
  const context = useTheme();
  const theme = propTheme || context.theme;
  const setTheme = propSetTheme || context.setTheme;

  const isDark = theme === "dark";

  if (variant === "minimal") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all active:scale-90 shrink-0 outline-none",
          className
        )}
        title={isDark ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <Sun className="w-5 h-5 text-amber-500 fill-amber-500/10" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              <Moon className="w-4.5 h-4.5 text-slate-700 fill-slate-700/5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <div
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative w-14 h-8 rounded-full p-1 cursor-pointer select-none transition-colors duration-500 overflow-hidden shadow-inner flex items-center active:scale-95 active:duration-100",
        isDark 
          ? "bg-slate-950 border border-blue-500/25 shadow-blue-950/50" 
          : "bg-gradient-to-b from-sky-300 to-sky-200 border border-sky-400/20 shadow-sky-100",
        className
      )}
      dir="ltr"
    >
      {/* Decorative background elements (stars for dark, clouds/rays for light) */}
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="stars"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Tiny stars */}
            <div className="absolute top-2 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
            <div className="absolute top-5 left-5 w-0.5 h-0.5 bg-white rounded-full opacity-60" />
            <div className="absolute top-2.5 left-7 w-0.5 h-0.5 bg-white rounded-full animate-ping" />
          </motion.div>
        ) : (
          <motion.div
            key="clouds"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Subtle solar flare/glow */}
            <div className="absolute -right-1 -bottom-1 w-7 h-7 bg-amber-400/30 rounded-full blur-md" />
            <div className="absolute left-2.5 top-3.5 w-4 h-1.5 bg-white/70 rounded-full blur-[0.5px]" />
            <div className="absolute left-4 top-2.5 w-3 h-1.5 bg-white/80 rounded-full blur-[0.5px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glowing active light halo in the background */}
      <div 
        className={cn(
          "absolute w-6 h-6 rounded-full transition-all duration-500 blur-sm pointer-events-none",
          isDark 
            ? "left-[26px] bg-blue-500/35" 
            : "left-1 bg-amber-400/40"
        )}
      />

      {/* Toggle Knob (slides smoothly) */}
      <motion.div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shadow-md relative z-10 transition-colors duration-500",
          isDark 
            ? "bg-slate-900 border border-blue-400/30" 
            : "bg-white border border-amber-200"
        )}
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 450,
          damping: 28,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center"
            >
              <Moon className="w-3.5 h-3.5 text-blue-400 fill-blue-400/10" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
