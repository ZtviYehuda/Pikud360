import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smartphone, Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isHttpRemote, setIsHttpRemote] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if already shown once to the user to avoid bugging them
    const isShownAlready = localStorage.getItem("pwa_prompt_shown_v2") === "true";
    if (isShownAlready) {
      return;
    }

    // 3. Detect iOS agent
    const userAgent = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if we are on a remote HTTP connection (e.g. Tailscale HTTP IP)
    const isRemoteHttp =
      window.location.protocol === "http:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
    setIsHttpRemote(isRemoteHttp);

    if (ios || isRemoteHttp) {
      // Show manual install helper after a short delay on remote HTTP or iOS
      const timer = setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem("pwa_prompt_shown_v2", "true");
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Capture native beforeinstallprompt event for Android/Chrome/Windows (HTTPS/localhost)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      localStorage.setItem("pwa_prompt_shown_v2", "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger prompt
    deferredPrompt.prompt();

    // Wait for choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Clear deferred prompt and hide banner
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_prompt_shown_v2", "true");
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[420px] z-[9999] font-sans"
          dir="rtl"
        >
          <div className="bg-slate-900/90 dark:bg-slate-950/90 text-slate-100 p-5 rounded-[2rem] border border-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="סגור"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 flex-1 pr-1">
                <h3 className="font-black text-[15px] tracking-tight text-white">
                  התקנת אפליקציית Toren
                </h3>
                <p className="text-[13px] text-slate-300 leading-relaxed">
                  {isIOS ? (
                    <span>
                      רוצה להוסיף את המערכת למסך הבית? לחץ על כפתור השיתוף{" "}
                      <span className="inline-flex items-center align-middle mx-0.5 p-1 bg-white/10 rounded-lg text-primary">
                        <Share className="w-3.5 h-3.5" />
                      </span>{" "}
                      בדפדפן Safari, ולאחר מכן בחר ב-
                      <strong>'הוסף למסך הבית'</strong>.
                    </span>
                  ) : isHttpRemote ? (
                    <span>
                      רוצה להוסיף את המערכת למסך הבית? לחץ על לחצן האפשרויות בדפדפן (3 נקודות בפינת המסך) ולאחר מכן בחר ב-
                      <strong>'הוסף למסך הבית'</strong> או <strong>'התקן אפליקציה'</strong>.
                    </span>
                  ) : (
                    "התקן את המערכת בטלפון הנייד או במחשב לגישה מהירה ונוחה, קבלת התראות ושיפור הביצועים."
                  )}
                </p>
              </div>
            </div>

            {!isIOS && !isHttpRemote ? (
              <div className="flex gap-2.5 mt-4 justify-end">
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-10 text-[13px] font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl px-4 cursor-pointer"
                >
                  לא כעת
                </Button>
                <Button
                  onClick={handleInstallClick}
                  className="h-10 text-[13px] font-bold bg-primary hover:bg-primary/95 text-white rounded-xl px-5 gap-1.5 shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  התקן עכשיו
                </Button>
              </div>
            ) : (
              <div className="flex gap-2.5 mt-4 justify-end">
                <Button
                  onClick={handleDismiss}
                  className="h-10 text-[13px] font-bold bg-primary hover:bg-primary/95 text-white rounded-xl px-5 shadow-lg shadow-primary/20 cursor-pointer"
                >
                  הבנתי, תודה
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
