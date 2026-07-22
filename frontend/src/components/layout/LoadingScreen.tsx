import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState<string>("rgb(59, 130, 246)");
  const [primaryRgb, setPrimaryRgb] = useState<string>("59, 130, 246");

  useEffect(() => {
    // Detect dark or light mode from HTML document element
    const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setTheme(isDark ? "dark" : "light");

    // Read the current computed CSS primary values if defined, otherwise fallback
    const computedStyle = getComputedStyle(document.documentElement);
    const primary = computedStyle.getPropertyValue("--primary").trim();
    const rgb = computedStyle.getPropertyValue("--primary-rgb").trim();
    if (primary) setPrimaryColor(primary);
    if (rgb) setPrimaryRgb(rgb);
  }, []);

  const isDark = theme === "dark";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-[9999]"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #090d16 0%, #0f172a 40%, #020617 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #eff6ff 40%, #e2e8f0 100%)",
      }}
      dir="rtl"
    >
      {/* Animated subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`
            : `linear-gradient(rgba(15, 23, 42, 0.15) 1px, transparent 1px),
               linear-gradient(90deg, rgba(15, 23, 42, 0.15) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow top center */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, rgba(${primaryRgb}, ${isDark ? 0.25 : 0.12}) 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Bottom glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, rgba(99, 102, 241, ${isDark ? 0.2 : 0.08}) 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-8">
        {/* Logo with glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.6 },
            scale: { duration: 0.6 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
          }}
          className="relative flex items-center justify-center"
        >
          {/* Glow ring behind logo */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(${primaryRgb}, ${isDark ? 0.3 : 0.15}) 0%, rgba(99, 102, 241, ${isDark ? 0.1 : 0.05}) 50%, transparent 80%)`,
              filter: "blur(12px)",
            }}
          />

          {/* Rotating border ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 rounded-full border"
            style={{
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)",
              borderTopColor: primaryColor,
              borderRightColor: `rgba(${primaryRgb}, 0.4)`,
            }}
          />

          {/* Logo */}
          <div className="toren-spin-container">
            <img
              src="/toren_logo_base.png"
              alt="Toren"
              className="w-20 h-20 object-contain relative z-10 toren-spin-logo"
            />
            <div className="toren-spin-beam-original" />
            <div className="toren-lantern-flare" />
          </div>
        </motion.div>

        {/* Text block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              background: isDark
                ? `linear-gradient(135deg, #ffffff 0%, rgba(${primaryRgb}, 0.9) 60%, #c4b5fd 100%)`
                : `linear-gradient(135deg, #0f172a 0%, ${primaryColor} 60%, #4f46e5 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            מוקד שליטה ובקרה
          </h1>
          <p 
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{
              color: isDark ? `rgba(${primaryRgb}, 0.7)` : "rgba(71, 85, 105, 0.8)",
            }}
          >
            TOREN · COMMAND CONTROL
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: primaryColor,
                }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.8, 1.4, 0.8],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span 
            className="text-[10px] font-medium uppercase tracking-[0.2em]"
            style={{
              color: isDark ? `rgba(${primaryRgb}, 0.5)` : "rgba(71, 85, 105, 0.6)",
            }}
          >
            טוען מערכת מאובטחת...
          </span>
        </motion.div>
      </div>

      {/* Bottom version bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-[260px]"
      >
        {/* Thin glowing progress bar */}
        <div 
          className="w-full h-px overflow-hidden rounded-full"
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${primaryColor}, #a78bfa, transparent)`,
            }}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="flex items-center justify-between w-full px-1">
          <span 
            className="text-[9px] font-mono uppercase tracking-wider"
            style={{
              color: isDark ? `rgba(${primaryRgb}, 0.3)` : "rgba(71, 85, 105, 0.4)",
            }}
          >
            SECURE · ENCRYPTED
          </span>
          <span 
            className="text-[9px] font-mono font-bold"
            style={{
              color: isDark ? `rgba(${primaryRgb}, 0.4)` : "rgba(71, 85, 105, 0.5)",
            }}
          >
            v2.0.4
          </span>
        </div>
      </motion.div>
    </div>
  );
};
