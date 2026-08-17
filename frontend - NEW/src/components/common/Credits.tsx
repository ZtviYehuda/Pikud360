import React from 'react';

export const Credits: React.FC = () => {
  return (
    <div
      id="app-credits"
      className="fixed bottom-3 left-6 z-40 pointer-events-none select-none opacity-30 hover:opacity-60 transition-opacity duration-700"
      dir="rtl"
    >
      <span className="text-sm font-normal text-foreground whitespace-nowrap">
        פותח ע"י צבי יהודה בטיטו
      </span>
    </div>
  );
};
