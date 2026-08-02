import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Detect dark or light mode from HTML document element
    const isDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark";
    setTheme(isDark ? "dark" : "light");
  }, []);

  const isDark = theme === "dark";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-[9999] select-none transition-colors duration-300"
      style={{
        background: isDark
          ? "radial-gradient(circle at center, #0f172a 0%, #020617 100%)"
          : "radial-gradient(circle at center, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%)",
      }}
      dir="rtl"
    >
      {/* Subtle ambient mesh overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`
            : `linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px),
               linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Soft center ambient glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(99, 102, 241, 0.05) 60%, transparent 80%)"
            : "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.04) 60%, transparent 80%)",
          filter: "blur(50px)",
        }}
      />

      {/* Main content box */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-sm">
        {/* Clean Matzevet Shield Emblem (No spinning lights or artifacts) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.5 },
            scale: { duration: 0.5 },
            y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          }}
          className="relative flex items-center justify-center p-3"
        >
          {/* Subtle outer shield border glow */}
          <div className="absolute inset-0 rounded-3xl bg-blue-500/10 dark:bg-blue-400/10 blur-xl -z-10" />

          <img
            src="/matzevet_icon.png"
            alt="סמל מצבת"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter drop-shadow-[0_10px_25px_rgba(59,130,246,0.35)] transition-all duration-300"
          />
        </motion.div>

        {/* System Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center gap-1.5"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
            מצבת
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
            מערכת שליטה ובקרה מבצעית
          </p>
          <span className="text-[10px] font-mono font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mt-0.5">
            MATZEVET · COMMAND CONTROL
          </span>
        </motion.div>

        {/* Sleek Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-3.5 w-full mt-2"
        >
          {/* Thin Glowing Progress Bar */}
          <div className="w-48 h-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              className="absolute top-0 bottom-0 w-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 dark:from-blue-500 dark:via-cyan-400 dark:to-blue-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide">
            טוען נתונים מבצעיים...
          </span>
        </motion.div>
      </div>

      {/* Footer Security Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase"
      >
        <span>SECURE ENCRYPTED</span>
        <span>·</span>
        <span>v2.0.4</span>
      </motion.div>
    </div>
  );
};
