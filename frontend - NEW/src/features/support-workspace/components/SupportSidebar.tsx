import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LifeBuoy,
  Users,
  Megaphone,
  GitBranch,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "תמונת מצב",
    to: "/support-workspace",
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: "פניות ובקשות שחזור",
    to: "/support-workspace/tickets",
    icon: LifeBuoy,
  },
  {
    name: "משתמשים והרשאות",
    to: "/support-workspace/users",
    icon: Users,
  },
  {
    name: "הודעות מערכת",
    to: "/support-workspace/announcements",
    icon: Megaphone,
  },
  {
    name: "עדכוני גרסה",
    to: "/support-workspace/updates",
    icon: GitBranch,
  },
];

export const SupportSidebar: React.FC = () => {
  const navigate = useNavigate();

  const switchToCommander = () => {
    sessionStorage.setItem("admin_mode", "commander");
    navigate("/", { replace: true });
  };

  return (
    <aside
      className="w-64 border-l border-border/40 bg-background/80 flex flex-col justify-between shrink-0 select-none py-4 px-3"
      dir="rtl"
    >
      <div className="space-y-4">
        {/* Navigation Group */}
        <div className="px-2">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
            מודולים תפעוליים
          </p>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Switcher & Footer */}
      <div className="px-2 pt-4 border-t border-border/40 space-y-3">
        {/* Switch to Commander View */}
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>תצוגת מפקד (מבט על)</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            מעבר לצפייה בכלל העובדים, מצבת כוח אדם ושיבוצים.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={switchToCommander}
            className="w-full h-7 text-xs font-semibold gap-1 bg-background hover:bg-muted border-primary/30 text-primary"
          >
            <span>מעבר לתצוגת מפקד</span>
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 px-2 py-1 bg-muted/20 rounded-md">
          <span>סביבה</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            PROD / LOCAL
          </span>
        </div>
      </div>
    </aside>
  );
};
