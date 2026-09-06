import React from 'react';
import { cn } from '@/lib/utils';

export const Credits: React.FC = () => {
  return (
    <div
      id="app-credits"
      dir="rtl"
      className={cn(
        "hidden md:flex items-center gap-1.5 fixed bottom-3 left-4 z-30 select-none",
        "px-2.5 py-1 rounded-full bg-background/85 dark:bg-card/85 backdrop-blur-md border border-border/50 shadow-2xs",
        "text-muted-foreground hover:text-foreground text-xs font-medium transition-colors",
      )}
      title="פותח ע״י צבי יהודה בטיטו"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
      <span className="tracking-tight whitespace-nowrap">
        פותח ע"י צבי יהודה בטיטו
      </span>
    </div>
  );
};
