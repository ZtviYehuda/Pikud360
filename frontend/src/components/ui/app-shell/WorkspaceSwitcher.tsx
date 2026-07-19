import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../dropdown-menu";
import { WorkspaceSwitcherProps } from "./types";

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  currentWorkspace,
  workspaces = [],
  onChange,
  disabled = false,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-1.5 rounded-enterprise-md border border-enterprise-border bg-enterprise-surface hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary text-slate-850 dark:text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
        >
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <div className="text-right flex flex-col justify-center min-w-[100px]">
            <span className="leading-none">{currentWorkspace?.name || "בחר מרחב עבודה"}</span>
            {currentWorkspace?.details && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">
                {currentWorkspace.details}
              </span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 text-right" align="start">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => onChange?.(ws.id)}
            className="flex flex-col items-start gap-0.5 justify-center py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="font-semibold text-xs text-slate-900 dark:text-white">{ws.name}</span>
            {ws.details && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{ws.details}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
