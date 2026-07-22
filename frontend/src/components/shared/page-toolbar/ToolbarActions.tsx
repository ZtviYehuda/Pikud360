import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToolbarActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolbarActions: React.FC<ToolbarActionsProps> = ({ children, className }) => {
  return (
    <div className={cn("flex items-center gap-2 shrink-0 min-w-0 mr-auto", className)}>
      {children}
    </div>
  );
};
ToolbarActions.displayName = "ToolbarActions";
