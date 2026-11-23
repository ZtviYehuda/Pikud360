import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon?: React.ElementType;
  title?: string;
  subtitle?: React.ReactNode;
  iconClassName?: string;
  badge?: React.ReactNode;
  className?: string;
  hideMobile?: boolean;
  id?: string;
}

export function PageHeader({
  badge,
  className,
  id,
}: PageHeaderProps) {
  // Page titles and system status dot are now seamlessly unified in the TopBar header
  if (!badge) return null;

  return (
    <div
      id={id}
      className={cn(
        "flex items-center justify-between w-full mb-1 sm:mb-2",
        className
      )}
    >
      <div className="overflow-visible w-full flex items-center justify-between">
        {badge}
      </div>
    </div>
  );
}
