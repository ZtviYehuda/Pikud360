import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageToolbarProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

export const PageToolbar: React.FC<PageToolbarProps> = ({
  children,
  className,
  id,
}) => {
  return (
    <div
      id={id}
      dir="rtl"
      className={cn(
        "w-full bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col gap-3 transition-all duration-200 select-none",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 w-full min-w-0">
        {children}
      </div>
    </div>
  );
};
PageToolbar.displayName = "PageToolbar";
