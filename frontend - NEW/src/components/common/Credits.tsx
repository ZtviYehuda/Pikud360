import React from 'react';

export const Credits: React.FC = () => {
  return (
    <div
      id="app-credits"
      className="hidden md:block fixed bottom-2.5 left-4 z-20 pointer-events-none select-none opacity-30 hover:opacity-70 transition-opacity duration-300"
      dir="rtl"
    >
      <span className="text-[11px] font-normal text-muted-foreground whitespace-nowrap">
        פותח ע"י צבי בטיטו
      </span>
    </div>
  );
};
