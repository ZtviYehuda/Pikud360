import * as React from "react";
import { cn } from "@/lib/utils";

export interface FilterGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({ children, className }) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5 min-w-0", className)}>
      {children}
    </div>
  );
};
FilterGroup.displayName = "FilterGroup";
