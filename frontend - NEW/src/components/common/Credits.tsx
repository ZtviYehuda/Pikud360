import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const Credits: React.FC = () => {
  const [isShifted, setIsShifted] = useState(false);

  // Auto-detect if there's an open modal, dialog, bottom sheet, or active toast to dynamically adjust position
  useEffect(() => {
    const checkObstructions = () => {
      const hasModal = !!document.querySelector('[data-slot="dialog-content"], [role="dialog"], [data-state="open"]');
      setIsShifted(hasModal);
    };

    checkObstructions();
    const observer = new MutationObserver(checkObstructions);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      id="app-credits"
      dir="rtl"
      onMouseEnter={() => setIsShifted((prev) => !prev)}
      className={cn(
        "hidden md:flex items-center gap-1.5 fixed z-30 select-none transition-all duration-300 ease-out",
        "px-2.5 py-1 rounded-full bg-background/85 dark:bg-card/85 backdrop-blur-md border border-border/50 shadow-2xs",
        "text-foreground/85 dark:text-foreground/80 hover:text-primary hover:border-primary/40 hover:bg-background cursor-pointer",
        isShifted
          ? "bottom-14 left-4 opacity-90 scale-95"
          : "bottom-3 left-4 opacity-85 hover:opacity-100",
      )}
      title="פותח ע״י צבי בטיטו (העבר עכבר כדי להזיז)"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse shrink-0" />
      <span className="text-xs font-bold tracking-tight whitespace-nowrap">
        פותח ע"י צבי בטיטו
      </span>
    </div>
  );
};
