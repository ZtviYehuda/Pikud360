import * as React from "react";
import { cn } from "../../../lib/utils";

interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-6 w-full text-right select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
DashboardLayout.displayName = "DashboardLayout";
