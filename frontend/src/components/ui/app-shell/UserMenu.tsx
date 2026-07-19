import * as React from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../dropdown-menu";
import { UserMenuProps } from "./types";

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onLogout,
  onPreferencesClick,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-enterprise-primary select-none cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-850 border border-enterprise-border flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.substring(0, 2) || "U"
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 text-right" align="end">
        <div className="flex flex-col p-3 border-b border-enterprise-border">
          <span className="font-bold text-xs text-slate-900 dark:text-white leading-none">{user?.name || "משתמש"}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-1">{user?.role || "תפקיד"}</span>
        </div>
        <DropdownMenuItem onClick={onPreferencesClick} className="flex items-center justify-end gap-2 text-xs py-2 px-3">
          <span>העדפות משתמש</span>
          <User className="h-4 w-4 text-slate-450" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="flex items-center justify-end gap-2 text-xs py-2 px-3 text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300">
          <span>התנתק</span>
          <LogOut className="h-4 w-4 text-red-450" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
