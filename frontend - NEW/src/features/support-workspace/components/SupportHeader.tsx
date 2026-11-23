import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun,
  LogOut,
  Bell,
  LifeBuoy,
  Eye,
} from "lucide-react";

interface SupportHeaderProps {
  systemStatus?: "healthy" | "degraded" | "outage";
  openIncidentsCount?: number;
  onOpenSearch?: () => void;
}

export const SupportHeader: React.FC<SupportHeaderProps> = ({
  systemStatus = "healthy",
  openIncidentsCount = 0,
  onOpenSearch,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme } = useTheme();

  const isHealthy = systemStatus === "healthy" && openIncidentsCount === 0;

  const switchToCommander = () => {
    sessionStorage.setItem("admin_mode", "commander");
    navigate("/", { replace: true });
  };

  return (
    <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between" dir="rtl">
      {/* Right side: Brand & Health Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shadow-xs">
            <LifeBuoy className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">
                מרכז התמיכה
              </span>
              <span className="text-xs text-muted-foreground font-normal">|</span>
              <span className="text-xs text-muted-foreground font-medium">
                UNIT Operations
              </span>
            </div>
          </div>
        </div>

        {/* Real-time System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-xs">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isHealthy ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {isHealthy ? "כל המערכות תקינות" : `${openIncidentsCount} תקלות פעילות`}
          </span>
        </div>
      </div>

      {/* Left side: Quick Search, Actions, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={switchToCommander}
          className="h-8 gap-1.5 px-2.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">תצוגת מפקד (מבט על)</span>
          <span className="sm:hidden">מפקד</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="החלף ערכת נושא"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>

        <div className="h-4 w-px bg-border/40 mx-1" />

        {/* User Identity Chip */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs ring-1 ring-border/50">
            ת
          </div>
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold leading-tight text-foreground">
              {user?.display_name || "צוות התמיכה"}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              מנהל מערכת (ADMIN)
            </span>
          </div>
          <Badge variant="outline" className="hidden xl:inline-flex text-[10px] py-0 px-1.5 h-4 bg-primary/5 text-primary border-primary/20">
            ADMIN
          </Badge>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logout(true)}
          className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
          title="התנתק מהמערכת"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
};
