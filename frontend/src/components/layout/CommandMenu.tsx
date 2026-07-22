import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  MessageSquarePlus,
  ArrowLeftRight,
  Activity,
  History,
  UserPlus,
  FileText,
  Bell,
  Palette,
  CalendarRange,
  LogOut,
  UserCircle,
  ChevronLeft,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Category = "הכל" | "דפים" | "פעולות" | "צוות";

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Category>("הכל");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const commands = useMemo(() => {
    const items = [
      {
        name: "לוח בקרה",
        description: "מבט על, סטטיסטיקות ומדדי ביצוע יחידתיים",
        path: "/",
        icon: LayoutDashboard,
        category: "דפים",
      },
      {
        name: "מעקב נוכחות",
        description: "ניהול יומן נוכחות יומי וחודשי של היחידה",
        path: "/attendance",
        icon: CalendarDays,
        category: "דפים",
      },
      {
        name: "סידור עבודה",
        description: "צפייה בשיבוצים השבועיים וחלוקת משמרות",
        path: "/roster",
        icon: CalendarRange,
        category: "דפים",
      },
      {
        name: "מרכז משוב",
        description: "שליחת פידבק, הצעות לשיפור ופניות תמיכה",
        path: "/feedback",
        icon: MessageSquarePlus,
        category: "דפים",
      },

      ...(!user?.is_temp_commander
        ? [
            {
              name: "ניהול שוטרים",
              description: "צפייה בפרטי שוטרים, עריכת תיקי אישי והרשאות",
              path: "/employees",
              icon: Users,
              category: "דפים",
            },
            {
              name: "בקשות העברה",
              description: "ניהול ומעקב אחר תהליכי מעבר בין יחידות",
              path: "/transfers",
              icon: ArrowLeftRight,
              category: "דפים",
            },
          ]
        : []),

      ...(user?.is_admin
        ? [
            {
              name: "יומן פעילות",
              description: "צפייה בלוגים של שינויי מערכת ופעולות משתמשים",
              path: "/activity-log",
              icon: Activity,
              category: "דפים",
            },
          ]
        : []),

      {
        name: "הגדרות",
        description: "ניהול הגדרות אישיות, התראות ונראות המערכת",
        path: "/settings",
        icon: Settings,
        category: "דפים",
      },

      {
        name: "התנתקות",
        description: "יציאה מאובטחת מהמערכת וניקוי נתונים",
        action: () => {
          logout();
          navigate("/login");
        },
        icon: LogOut,
        category: "פעולות",
        danger: true,
      },

      ...(user?.is_admin || !user?.is_temp_commander
        ? [
            {
              name: "הוספת שוטר",
              description: "יצירת פרופיל שוטר חדש במערכת",
              path: "/employees?action=create",
              icon: UserPlus,
              category: "פעולות",
            },
            {
              name: "הפקת דוח נוכחות",
              description: "ייצוא נתוני נוכחות לקובץ Excel מפורט",
              path: "/attendance?export=true",
              icon: FileText,
              category: "פעולות",
            },
          ]
        : []),

      {
        name: "פרופיל אישי",
        description: "עדכון פרטים אישיים ותמונת פרופיל",
        path: "/settings?tab=profile",
        icon: UserCircle,
        category: "צוות",
      },
      {
        name: "הגדרות התראות",
        description: "שינוי העדפות לקבלת הודעות ודחיפה",
        path: "/settings?tab=notifications",
        icon: Bell,
        category: "צוות",
      },
      {
        name: "עיצוב המערכת",
        description: "שינוי צבעי נושא ומצב תצוגה",
        path: "/settings?tab=appearance",
        icon: Palette,
        category: "צוות",
      },
    ];
    return items;
  }, [user, logout, navigate]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, activeTab, open]);
  useEffect(() => {
    if (!open) {
      setSearch("");
      setActiveTab("הכל");
    }
  }, [open]);

  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const matchesSearch =
        cmd.name.includes(search) || cmd.description.includes(search);
      const matchesTab = activeTab === "הכל" || cmd.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [search, activeTab, commands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Tab") {
      e.preventDefault();
      const tabs: Category[] = ["הכל", "דפים", "פעולות", "צוות"];
      const currentIdx = tabs.indexOf(activeTab);
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + tabs.length) % tabs.length
        : (currentIdx + 1) % tabs.length;
      setActiveTab(tabs[nextIdx]);
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      const cmd = filteredCommands[selectedIndex];
      if ("action" in cmd && cmd.action) cmd.action();
      else if ("path" in cmd && cmd.path) navigate(cmd.path);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px] p-0 overflow-hidden rounded-[2.5rem] border-border/40 bg-card/80 backdrop-blur-2xl shadow-2xl"
        dir="rtl"
      >
        {/* Search Bar */}
        <div className="flex items-center px-6 py-6 border-b border-border/40 gap-4">
          <Search className="w-6 h-6 text-primary shrink-0" strokeWidth={3} />
          <input
            autoFocus
            placeholder="חפש דפים, פעולות או שוטרים..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-base font-black outline-none placeholder:text-muted-foreground/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/40 bg-muted/50 text-[10px] font-black text-muted-foreground">
            <span className="opacity-50">ESC</span>
          </div>
        </div>

        {/* Tab Bar - Soft Styling */}
        <div className="flex items-center gap-1.5 px-6 py-3 bg-muted/20 border-b border-border/20">
          {(["הכל", "דפים", "פעולות", "צוות"] as Category[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-2xl text-[11px] font-black transition-all active:scale-95",
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-3 space-y-4">
          {filteredCommands.length > 0 ? (
            <>
              {Array.from(new Set(filteredCommands.map((c) => c.category))).map(
                (cat) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                      {cat}
                    </div>
                    {filteredCommands
                      .filter((c) => c.category === cat)
                      .map((cmd) => {
                        const globalIdx = filteredCommands.indexOf(cmd);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <button
                            key={"path" in cmd ? cmd.path : cmd.name}
                            onClick={() => {
                              if ("action" in cmd && cmd.action) cmd.action();
                              else if ("path" in cmd && cmd.path)
                                navigate(cmd.path);
                              onOpenChange(false);
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={cn(
                              "w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all text-right group relative",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 translate-x-[-4px]"
                                : "hover:bg-muted/50",
                              "danger" in cmd &&
                                cmd.danger &&
                                !isSelected &&
                                "text-rose-500 bg-rose-500/5",
                            )}
                          >
                            <div
                              className={cn(
                                "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0",
                                isSelected
                                  ? "bg-white/20 shadow-inner"
                                  : cn(
                                      "bg-muted group-hover:bg-muted-foreground/10",
                                      "danger" in cmd &&
                                        cmd.danger &&
                                        "bg-rose-500/10",
                                    ),
                              )}
                            >
                              <cmd.icon
                                className={cn(
                                  "w-5 h-5 transition-colors",
                                  isSelected
                                    ? "text-white"
                                    : "danger" in cmd && cmd.danger
                                      ? "text-rose-600"
                                      : "text-primary",
                                )}
                                strokeWidth={2.5}
                              />
                            </div>
                            <div className="flex-1 flex flex-col items-start text-right overflow-hidden">
                              <span className="text-[13px] font-black leading-none">
                                {cmd.name}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-bold leading-tight mt-1.5 truncate w-full text-right",
                                  isSelected
                                    ? "text-white/70"
                                    : "text-muted-foreground",
                                )}
                              >
                                {cmd.description}
                              </span>
                            </div>
                            <ChevronLeft
                              className={cn(
                                "w-4 h-4 transition-all",
                                isSelected
                                  ? "opacity-100 translate-x-0"
                                  : "opacity-0 translate-x-2",
                              )}
                            />
                          </button>
                        );
                      })}
                  </div>
                ),
              )}
            </>
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
              <History className="w-16 h-16" />
              <div className="space-y-1">
                <p className="text-lg font-black tracking-tight">
                  לא נמצאו תוצאות
                </p>
                <p className="text-xs font-bold">נסה לחפש במילים אחרות</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Integrated Style */}
        <div className="p-5 border-t border-border/40 bg-muted/30 flex items-center justify-between text-[9px] font-black text-muted-foreground/60 px-8 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground shadow-sm">
                ⌘ K
              </span>
              <span>חיפוש</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground shadow-sm">
                TAB
              </span>
              <span>סינון</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground shadow-sm font-sans">
                ↑↓
              </span>
              <span>ניווט</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-background border border-border/60 rounded-lg px-2 py-1 text-foreground shadow-sm">
                ENTER
              </span>
              <span>בחירה</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
