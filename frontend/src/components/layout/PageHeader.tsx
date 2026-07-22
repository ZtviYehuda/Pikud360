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
  subtitle,
  iconClassName,
  badge,
  className,
  hideMobile = false,
}: PageHeaderProps) {
  if (hideMobile) {
    return (
      <>
        {/* Desktop: full header with icon + title + badge */}
        <div className="hidden lg:block">
          <div className={cn("flex flex-col gap-0", className)}>
            <div className="items-center justify-between gap-4 w-full flex">
              <div className="flex items-center gap-8 sm:gap-10 min-w-0">
                <div
                  className={cn(
                    "w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0",
                    iconClassName,
                  )}
                >
                  <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                </div>

                <div className="text-right min-w-0">
                  <h1 className="text-xl lg:text-3xl font-black text-foreground tracking-tight leading-tight truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs lg:text-sm font-semibold text-muted-foreground/60 truncate mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {badge && <div className="shrink-0 overflow-visible">{badge}</div>}
            </div>
          </div>
        </div>
        {/* Mobile: only badge, no title/icon */}
        {badge && (
          <div className="lg:hidden">
            <div className={className}>
              {badge}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0", className)}>
      <div className="items-center justify-between gap-4 w-full flex">
        <div className="flex items-center gap-8 sm:gap-10 min-w-0">
          <div
            className={cn(
              "w-12 h-12 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0",
              iconClassName,
            )}
          >
            <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
          </div>

          <div className="text-right min-w-0">
            <h1 className="text-xl lg:text-3xl font-black text-foreground tracking-tight leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs lg:text-sm font-semibold text-muted-foreground/60 truncate mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {badge && <div className="shrink-0 overflow-visible">{badge}</div>}
      </div>
    </div>
  );
}
