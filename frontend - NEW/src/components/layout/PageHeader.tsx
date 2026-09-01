import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle?: React.ReactNode;
  iconClassName?: string;
  badge?: React.ReactNode;
  className?: string;
  hideMobile?: boolean;
  id?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  iconClassName,
  badge,
  className,
  hideMobile = false,
  id,
}: PageHeaderProps) {
  return (
    <div id={id} className={cn("flex flex-col gap-0 w-full", className)}>
      <div className="flex items-center justify-between gap-4 w-full min-h-[44px]">
        {/* Title & Icon: Hidden on mobile (< sm or < lg) since TopBar already shows the active title */}
        <div
          className={cn(
            "items-center gap-3 sm:gap-3.5 min-w-0 h-10",
            hideMobile ? "hidden lg:flex" : "hidden sm:flex"
          )}
        >
          <div className={cn("w-8 h-8 shrink-0 text-primary flex items-center justify-center", iconClassName)}>
            <Icon className="w-7 h-7 text-primary shrink-0" />
          </div>

          <div className="text-right min-w-0 flex items-center h-full">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Action badge / controls */}
        {badge && <div className="shrink-0 overflow-visible w-full sm:w-auto flex items-center">{badge}</div>}
      </div>
    </div>
  );
}
