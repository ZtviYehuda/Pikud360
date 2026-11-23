import { useFeedback } from "@/context/FeedbackContext";
import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  CalendarDays,
  Settings,
  LogOut,
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  Circle,
  Clock,
  History,
  Undo2,
  Thermometer,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Megaphone,
  CalendarRange,
  Activity,
  ArrowLeft,
  ShieldAlert,
  Archive,
} from "lucide-react";
import { cn, getWhatsAppUrl } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { ThemeToggle } from "./ThemeToggle";
import { DateHeader } from "@/components/common/DateHeader";
import { InternalMessageDialog } from "@/components/dashboard/InternalMessageDialog";
import { SickLeaveDetailsDialog } from "@/components/dashboard/SickLeaveDetailsDialog";
import { BirthdayGreetingsModal } from "@/components/dashboard/BirthdayGreetingsModal";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { toast } from "sonner";
import {
  Send,
  Eye,
  Mail,
  LifeBuoy,
  Terminal,
  GitBranch,
  Search,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlobalAiSupport } from "@/components/common/GlobalAiSupport";
import { ChatSidebar } from "./ChatSidebar";
import { useChat } from "@/context/ChatContext";
import { GroupMessageModal } from "@/components/chat/GroupMessageModal";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { SupportUserDrawer } from "@/features/support-workspace/components/SupportUserDrawer";
import { supportApi } from "@/features/support-workspace/api";
import type { SupportDashboardStats, SupportUserListItem } from "@/features/support-workspace/types";

function getAlertConfig(alert: {
  id: string;
  title: string;
  description: string;
  type: string;
}) {
  const text = (alert.title + alert.description).toLowerCase();
  const isTransfer = alert.id.includes("transfer") || text.includes("העברה");
  const isSick = alert.id.includes("sick") || text.includes("מחלה");
  const isMessage = alert.id.startsWith("msg-");
  const isMorningReport =
    alert.id.includes("missing-reports") || text.includes("דיווח בוקר");
  const isArchive =
    alert.id.includes("restore") || alert.id.includes("archive") || text.includes("ארכיון");

  if (isArchive) {
    return {
      icon: Archive,
      bg: "rgba(245, 158, 11, 0.12)",
      color: "rgb(217, 119, 6)", // Amber-600
    };
  }

  if (isMorningReport) {
    return {
      icon: CalendarRange,
      bg: "rgba(245, 158, 11, 0.1)",
      color: "rgb(245, 158, 11)",
    };
  }

  if (isTransfer) {
    return {
      icon: ArrowLeftRight,
      bg: "color-mix(in srgb, var(--primary), transparent 90%)",
      color: "var(--primary)",
    };
  }
  if (isSick) {
    return {
      icon: Thermometer,
      bg: "rgba(239, 68, 68, 0.1)",
      color: "rgb(239, 68, 68)",
    }; // Red
  }
  if (isMessage) {
    return {
      icon: Megaphone,
      bg: "color-mix(in srgb, var(--primary), transparent 90%)",
      color: "var(--primary)",
    };
  }

  // Default fallback based on type
  if (alert.type === "danger")
    return {
      icon: AlertTriangle,
      bg: "rgba(239, 68, 68, 0.1)",
      color: "rgb(239, 68, 68)",
    };
  if (alert.type === "warning")
    return {
      icon: AlertTriangle,
      bg: "rgba(245, 158, 11, 0.1)",
      color: "rgb(245, 158, 11)",
    };

  return {
    icon: Info,
    bg: "color-mix(in srgb, var(--primary), transparent 90%)",
    color: "var(--primary)",
  };
}

export default function MainLayout() {
  const { user, logout } = useAuthContext();
  const { openFeedback } = useFeedback();
  const { showAiSupport } = useTheme();

  const {
    alerts,
    history,
    loading: loadingNotifs,
    loadingHistory,
    unreadCount,
    readIds,
    refreshAlerts,
    fetchHistory,
    markAllAsRead,
    toggleRead,
    markAsRead,
    markAsUnread,
  } = useNotifications();
  const { openChat, toggleChat, isGroupModalOpen, closeGroupModal } = useChat();
  const unreadMessagesCount = React.useMemo(
    () => alerts.filter((a) => a.id.startsWith("msg-")).length,
    [alerts],
  );
  const location = useLocation();
  const navigate = useNavigate();
  // Sidebar closed by default on mobile and desktop
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [notificationTab, setNotificationTab] = React.useState<
    "active" | "history" | "messages"
  >("active");
  const [msgDialogOpen, setMsgDialogOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState<any>(null);
  const [msgRecipient, setMsgRecipient] = React.useState<{
    id: number;
    name: string;
  } | null>(null);

  const [sickModalOpen, setSickModalOpen] = React.useState(false);
  const [sickEmployees, setSickEmployees] = React.useState<any[]>([]);
  const [bdayModalOpen, setBdayModalOpen] = React.useState(false);
  const [bdayEmployees, setBdayEmployees] = React.useState<any[]>([]);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check for critical morning alerts
  React.useEffect(() => {
    if (!user) return;
    // logic removed for specific critical alert state as it was unused
  }, [alerts, user]);

  const [msgDefaults, setMsgDefaults] = React.useState({
    title: "",
    description: "",
  });

  // Effect to track shown alerts to prevent duplicate toasts
  const shownAlertsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    alerts.forEach((alert) => {
      if (
        alert.id.startsWith("msg-") &&
        !shownAlertsRef.current.has(alert.id)
      ) {
        shownAlertsRef.current.add(alert.id);
        toast(alert.title, {
          description: alert.description,
          duration: 5000,
          action: {
            label: "פתח צ'אט",
            onClick: () => {
              markAsRead(alert.id);
              const targetContactId = alert.data?.sender_id || (alert.data?.is_support ? "691b0694-1c0f-49de-9213-1f4ed4ea2936" : 0);
              navigate(`/messaging?tab=messages&contact_id=${targetContactId}`);
              openChat({
                id: targetContactId,
                name: alert.data?.is_support ? "צוות תמיכה" : (alert.data?.sender || alert.title.replace("הודעה מאת ", "")),
                role: alert.data?.is_support ? "ניהול מערכת" : "מפקד",
                is_admin: Boolean(alert.data?.is_support),
              });
            },
          },
        });
      }
    });
  }, [alerts, user, navigate, openChat, markAsRead]);

  // Handle window resize - keep closed by default unless user interacts
  React.useEffect(() => {
    const handleResize = () => {
      // Logic removed to enforce "default closed" behavior requested by user
      // Sidebar will stay in whatever state the user left it, or default to false on load
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSupportWorkspace = location.pathname.startsWith("/support-workspace");

  // Support Workspace State & Diagnostics
  const [supportStats, setSupportStats] = React.useState<SupportDashboardStats | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState<number | string | null>(null);

  // Poll health stats for Support Workspace
  React.useEffect(() => {
    if (!user?.is_admin) return;
    let isMounted = true;
    const loadHealth = async () => {
      try {
        const data = await supportApi.getDashboard();
        if (isMounted) setSupportStats(data);
      } catch (e) {
        // Silent background fail
      }
    };

    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const commanderNavItems = [
    { name: "לוח בקרה", path: "/", icon: LayoutDashboard, exact: true },
    { name: "מעקב נוכחות", path: "/attendance", icon: CalendarDays },
    { name: "סידור עבודה", path: "/roster", icon: CalendarRange },
    // Only show these if NOT a temp commander
    ...(!user?.is_temp_commander
      ? [
          { name: "ניהול שוטרים", path: "/employees", icon: Users },
          { name: "בקשות העברה", path: "/transfers", icon: ArrowLeftRight },
        ]
      : []),
    { name: "מרכז הודעות ותקשורת", path: "/messaging", icon: MessageSquare },
    { name: "הגדרות", path: "/settings", icon: Settings },
  ];

  const supportNavItems = [
    { name: "תמונת מצב", path: "/support-workspace", icon: LayoutDashboard, exact: true },
    { name: "פניות ובקשות שחזור", path: "/support-workspace/tickets", icon: LifeBuoy },
    { name: "משתמשים והרשאות", path: "/support-workspace/users", icon: Users },
    { name: "הודעות מערכת", path: "/support-workspace/announcements", icon: Megaphone },
    { name: "עדכוני גרסה", path: "/support-workspace/updates", icon: GitBranch },
    { name: "יומן פעילות", path: "/support-workspace/activity", icon: Activity },
  ];

  const navItems = isSupportWorkspace ? supportNavItems : commanderNavItems;

  const switchToCommanderMode = () => {
    sessionStorage.setItem("admin_mode", "commander");
    navigate("/");
  };

  const switchToSupportMode = () => {
    sessionStorage.setItem("admin_mode", "support");
    navigate("/support-workspace");
  };

  // Derive the current page title for the header
  const getPageTitle = () => {
    const path = location.pathname;
    if (isSupportWorkspace) {
      if (path === "/support-workspace") return "תמונת מצב תפעולית";
      if (path === "/support-workspace/tickets") return "פניות ובקשות שחזור";
      if (path === "/support-workspace/users") return "משתמשים והרשאות";
      if (path === "/support-workspace/announcements") return "הודעות מערכת ותפעול";
      if (path === "/support-workspace/updates") return "עדכוני גרסה ושחזורים";
      if (path === "/support-workspace/activity") return "יומן פעילות אדמין";
      if (path === "/support-workspace/health") return "בריאות ובקרת מערכת";
      return "מרכז התמיכה";
    }

    if (path === "/employees/new") return "הוספת שוטר";
    if (path.startsWith("/employees/edit/")) return "עריכת שוטר";
    if (path.startsWith("/employees/") && path !== "/employees") return "כרטיס שוטר";
    if (path === "/employees") return "ניהול שוטרים";
    if (path === "/feedback") return "משוב ורעיונות";
    if (path === "/privacy") return "מדיניות פרטיות";
    if (path === "/terms") return "תנאי שימוש";
    if (path === "/support") return "מרכז תמיכה";
    if (path === "/change-password") return "שינוי סיסמה";

    return (
      navItems.find((item) =>
        item.exact
          ? path === item.path
          : item.path === path || (item.path !== "/" && path.startsWith(item.path))
      )?.name ?? "לוח בקרה"
    );
  };

  const currentPageName = getPageTitle();

  // Impersonation detection and exit action (Only active when viewing as non-admin user)
  const isImpersonating = Boolean(
    user &&
    !user.is_admin &&
    user.username !== "admin" &&
    ((user as any)?.is_impersonated || localStorage.getItem("admin_token"))
  );

  const handleReturnToAdmin = async () => {
    const adminToken = localStorage.getItem("admin_token");
    try {
      await apiClient.post("/security/exit-impersonation");
    } catch (e) {
      // Continue even if logging fails
    }
    if (adminToken) {
      localStorage.setItem("token", adminToken);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("dashboard_filters");
      window.location.href = "/";
    } else {
      logout();
    }
  };

  return (
    <div
      className="h-dvh bg-background flex font-sans text-foreground overflow-hidden"
      dir="rtl"
    >
      {/* Sidebar - Modern Sleek Enterprise Style */}
      <aside
        onDoubleClick={() => setIsSidebarOpen((prev) => !prev)}
        className={cn(
          // Base: fixed to RIGHT edge (RTL), full height
          "bg-card/95 backdrop-blur-xl border-l border-border/60 shadow-xs flex flex-col z-[100] fixed right-0 lg:sticky lg:right-auto top-0 h-[100dvh] overflow-hidden flex-shrink-0 select-none",
          // Mobile: w-72 slide translateX (RIGHT = off-screen in RTL)
          // Desktop: width animates between w-20 ↔ w-68
          "w-72 transition-all duration-200 ease-out",
          isSidebarOpen
            ? "translate-x-0 lg:w-68"
            : "translate-x-full lg:translate-x-0 lg:w-20",
        )}
      >
        {/* Sidebar Header - Exactly h-20 to align seamlessly with top header border */}
        <div
          className={cn(
            "h-20 flex-none flex items-center border-b border-border/40 transition-all duration-200",
            isSidebarOpen ? "px-4 justify-between" : "px-0 justify-center"
          )}
        >
          {/* Brand Logo & Title Group */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-3 shrink-0 transition-all active:scale-95 group focus:outline-none cursor-pointer"
            aria-label="תפריט ניווט"
            title={isSidebarOpen ? "כווץ תפריט" : "הרחב תפריט"}
          >
            <img
              src="/logo_unit.png"
              alt="סמל היחידה"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
            />

            {/* System Title */}
            {isSidebarOpen && (
              <div className="flex items-center text-right transition-all">
                <span className="font-black text-lg tracking-tight text-foreground font-sans">
                  The Office
                </span>
              </div>
            )}
          </button>

          {/* Mobile Close Button */}
          {isSidebarOpen && (
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow p-2.5 space-y-1.5 overflow-y-auto no-scrollbar custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarOpen((prev) => !prev);
                }}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center rounded-2xl transition-all duration-150 group relative select-none",
                  isSidebarOpen
                    ? "h-11 px-3.5 gap-3.5"
                    : "h-11 w-11 mx-auto justify-center",
                  isActive
                    ? "bg-primary/10 text-primary font-black shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-bold",
                )}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-105",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {isSidebarOpen && (
                  <span className="text-[13.5px] tracking-tight truncate flex-1 text-right">
                    {item.name}
                  </span>
                )}
                {isSidebarOpen && isActive && (
                  <div className="absolute left-1.5 w-1 h-5 bg-primary rounded-full shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={cn(
            "p-3 pb-5 sm:pb-6 border-t border-border/40 flex flex-col gap-3",
            isSidebarOpen ? "" : "items-center",
          )}
        >
          {/* Admin Workspace Mode Switcher Button in Sidebar */}
          {user?.is_admin && (
            <div className="w-full pb-1">
              {isSupportWorkspace ? (
                <button
                  type="button"
                  onClick={switchToCommanderMode}
                  className={cn(
                    "w-full rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs flex items-center justify-between gap-2 p-2.5 transition-all active:scale-95 cursor-pointer shadow-2xs",
                    isSidebarOpen ? "h-9 px-3 justify-between" : "h-9 px-0 justify-center"
                  )}
                  title="מעבר לתצוגת מפקד (מבט על)"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Eye className="w-4 h-4 shrink-0 text-primary" />
                    {isSidebarOpen && <span className="truncate">תצוגת מפקד (מבט על)</span>}
                  </div>
                  {isSidebarOpen && <ArrowLeft className="w-3.5 h-3.5 shrink-0 opacity-75" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={switchToSupportMode}
                  className={cn(
                    "w-full rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-between gap-2 p-2.5 transition-all active:scale-95 cursor-pointer shadow-2xs",
                    isSidebarOpen ? "h-9 px-3 justify-between" : "h-9 px-0 justify-center"
                  )}
                  title="מעבר למרכז תמיכה וניהול"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <LifeBuoy className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    {isSidebarOpen && <span className="truncate">מרכז תמיכה וניהול</span>}
                  </div>
                  {isSidebarOpen && <ArrowLeft className="w-3.5 h-3.5 shrink-0 opacity-75" />}
                </button>
              )}
            </div>
          )}


          {/* Impersonation Return Button in Sidebar */}
          {isImpersonating && (
            <div className="w-full pb-1">
              <button
                onClick={handleReturnToAdmin}
                className={cn(
                  "w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95",
                  isSidebarOpen ? "h-9 px-3" : "h-9 px-0"
                )}
                title="חזור לחשבון מנהל (אדמין)"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {isSidebarOpen && <span>חזור לחשבון אדמין</span>}
              </button>
            </div>
          )}

          {/* Feedback & Suggestions Button in Sidebar (Hidden in Support Workspace) */}
          {!isSupportWorkspace && (
            isSidebarOpen ? (
              <button
                type="button"
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  openFeedback(currentPageName);
                }}
                className="w-full h-9 px-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98]"
              >
                <MessageSquarePlus className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1 text-right">משוב ודיווח באג</span>
                <span className="text-[10px] font-black bg-primary/15 px-1.5 py-0.5 rounded-md">v1.1.3</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openFeedback(currentPageName)}
                title="משוב ודיווח באג (v1.1.3)"
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-primary hover:bg-primary/10 transition-all border border-primary/20 bg-primary/5 active:scale-95 cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
            )
          )}

          {/* User Profile Area */}
          {isSidebarOpen ? (
            <div
              id="sidebar-profile-container"
              className="flex items-center justify-between gap-3 p-2 bg-muted/30 border border-border/40 hover:border-border/70 rounded-2xl transition-all duration-150 select-none group w-full"
            >
              <Link
                to="/settings?tab=profile"
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 min-w-0 flex-grow"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-2xs transition-transform group-hover:scale-105">
                  {user?.is_admin
                    ? "💬"
                    : `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`}
                </div>
                <div className="flex flex-col min-w-0 text-right">
                  <span className="text-xs font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground truncate leading-none mt-0.5">
                    {user?.is_admin
                      ? "ניהול מערכת"
                      : user?.commands_department_id
                        ? "מפקד מחלקה"
                        : user?.commands_section_id
                          ? "מפקד מדור"
                          : user?.commands_team_id
                            ? "מפקד חוליה"
                            : "מפקד"}
                  </span>
                </div>
              </Link>
            </div>
          ) : (
            /* Collapsed Profile Link */
            <Link
              id="sidebar-profile-link-collapsed"
              to="/settings?tab=profile"
              title="הגדרות פרופיל"
              onClick={() => {
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 transition-transform hover:scale-105 active:scale-95"
            >
              {user?.is_admin
                ? "💬"
                : `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`}
            </Link>
          )}

          {/* Watermark in Sidebar */}
          {isSidebarOpen && (
            <div className="w-full text-center pt-1.5 pb-0.5 text-xs font-bold text-foreground/80 dark:text-muted-foreground select-none transition-colors">
              פותח ע"י צבי בטיטו
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="relative h-14 sm:h-16 md:h-20 bg-card/95 backdrop-blur-md border-b border-border/40 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-x-2 sm:gap-x-4 sticky top-0 z-40 flex-none transition-none">
          {/* Right side: Clickable Title to open sidebar + Status Dot */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-0 z-10">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="group flex items-center gap-2 text-right focus:outline-none cursor-pointer active:scale-95 transition-transform"
              title="פתח תפריט"
              aria-label="פתח תפריט"
            >
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none truncate group-hover:text-primary transition-colors">
                {currentPageName}
              </h1>
            </button>

            {/* Status Indicator Dot */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  id="system-status-dot"
                  title="סטטוס מערכת: פעיל ומאובטח"
                  className="flex items-center shrink-0 focus:outline-none p-1 cursor-pointer group"
                >
                  <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 shadow-xs group-hover:scale-110 transition-transform"></span>
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-60 p-4 rounded-2xl border-border shadow-xl backdrop-blur-xl bg-card/95"
                align="start"
                dir="rtl"
              >
                <div className="space-y-3 text-right">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-foreground">
                        המערכת פעילה
                      </h4>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        חיבור מאובטח
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        משתמש מחובר:
                      </span>
                      <span className="text-[10px] font-black text-foreground">
                        {user?.first_name} {user?.last_name}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/20">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        כניסה קודמת:
                      </p>
                      <p className="text-[11px] font-black text-primary">
                        {(user as any)?.previous_login
                          ? new Date(
                              (user as any).previous_login,
                            ).toLocaleString("he-IL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "כניסה ראשונה"}
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Centered Date in Header (Desktop / Tablet) */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10">
            <DateHeader />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 shrink-0 z-10">
            {/* Support Workspace Real-time System Status Pill (Desktop only) */}
            {isSupportWorkspace && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    (supportStats?.system_status || "healthy") === "healthy" && (supportStats?.open_incidents_count || 0) === 0
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    (supportStats?.system_status || "healthy") === "healthy" && (supportStats?.open_incidents_count || 0) === 0
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`} />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {(supportStats?.system_status || "healthy") === "healthy" && (supportStats?.open_incidents_count || 0) === 0
                    ? "כל המערכות תקינות"
                    : `${supportStats?.open_incidents_count || 0} תקלות פעילות`}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2">

                {/* Mode Switcher Pill Button for Admin (Desktop only) */}
                {user?.is_admin && (
                  isSupportWorkspace ? (
                    <button
                      type="button"
                      onClick={switchToCommanderMode}
                      className="hidden md:flex items-center gap-1.5 px-3.5 h-9 sm:h-9.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="חזור לתצוגת מפקד"
                    >
                      <Eye className="w-4 h-4" />
                      <span>תצוגת מפקד (מבט על)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={switchToSupportMode}
                      className="hidden md:flex items-center gap-1.5 px-3.5 h-9 sm:h-9.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="מעבר למרכז תמיכה וניהול"
                    >
                      <LifeBuoy className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>מרכז תמיכה וניהול</span>
                    </button>
                  )
                )}
              {/* Unified Messages & Notifications Popover */}
              {!isSupportWorkspace && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      id="notifications-messages-btn"
                      title="הודעות והתראות"
                      className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                      {unreadCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-bold text-primary-foreground ring-2 ring-card animate-in zoom-in-50 bg-primary"
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                <PopoverContent
                  className="w-[450px] max-w-[95vw] p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700/90 shadow-[0_20px_60px_-10px_rgba(15,23,42,0.25),0_0_0_1px_rgba(15,23,42,0.1)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12)] z-50 animate-in fade-in-0 zoom-in-95"
                  align="end"
                >
                  <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground text-right">
                          {notificationTab === "messages"
                            ? "מרכז הודעות"
                            : "מרכז התראות"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black">
                          {notificationTab === "active"
                            ? alerts.length
                            : notificationTab === "history"
                              ? history.length
                              : "צ'אט"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          to="/messaging"
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>מרכז הודעות מלא</span>
                          <ArrowLeft className="w-2.5 h-2.5" />
                        </Link>
                        {notificationTab === "active" && alerts.length > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            סמן הכל כנקרא
                          </button>
                        )}
                        <button
                          onClick={
                            notificationTab === "active"
                              ? refreshAlerts
                              : notificationTab === "history"
                                ? fetchHistory
                                : () => {}
                          }
                          className="text-[10px] font-black text-muted-foreground hover:text-primary hover:underline"
                        >
                          {notificationTab === "messages" ? "" : "רענן רשימה"}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1 border-b border-slate-200/80 dark:border-slate-800 -mb-px">
                      <button
                        onClick={() => setNotificationTab("active")}
                        className={cn(
                          "flex-1 px-2 py-2 text-[10px] sm:text-[11px] font-black rounded-t-xl transition-all flex items-center justify-center gap-1.5",
                          notificationTab === "active"
                            ? "bg-white dark:bg-slate-800 text-primary border-b-2 border-primary shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                        )}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        פעילות ({alerts.length})
                      </button>
                      <button
                        onClick={() => setNotificationTab("messages")}
                        className={cn(
                          "flex-1 px-2 py-2 text-[10px] sm:text-[11px] font-black rounded-t-xl transition-all flex items-center justify-center gap-1.5",
                          notificationTab === "messages"
                            ? "bg-white dark:bg-slate-800 text-primary border-b-2 border-primary shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        הודעות{" "}
                        {unreadMessagesCount > 0 && `(${unreadMessagesCount})`}
                      </button>
                      <button
                        onClick={() => {
                          setNotificationTab("history");
                          fetchHistory();
                        }}
                        className={cn(
                          "flex-1 px-2 py-2 text-[10px] sm:text-[11px] font-black rounded-t-xl transition-all flex items-center justify-center gap-1.5",
                          notificationTab === "history"
                            ? "bg-white dark:bg-slate-800 text-primary border-b-2 border-primary shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
                        )}
                      >
                        <History className="w-3.5 h-3.5" />
                        היסטוריה ({history.length})
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-muted/50">
                    {notificationTab === "messages" ? (
                      (() => {
                        const msgAlerts = alerts.filter((a) => a.id.startsWith("msg-"));
                        if (msgAlerts.length === 0) {
                          return (
                            <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <MessageSquare className="w-8 h-8" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-foreground mb-1">
                                  צ'אט והודעות מערכת
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground max-w-[200px]">
                                  נהל שיחות עם מפקדים וקבל הודעות עדכון בזמן אמת
                                </p>
                              </div>
                              <Button
                                onClick={() => { toggleChat(); }}
                                className="rounded-xl font-black text-xs gap-2 px-6"
                              >
                                פתח את מרכז ההודעות
                                <ArrowLeft className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col">
                            {msgAlerts.map((alert) => {
                              const isRead = readIds.includes(alert.id);
                              const config = getAlertConfig(alert);
                              const Icon = config.icon;
                              return (
                                <div
                                  key={alert.id}
                                  className={cn(
                                    "p-3 sm:p-4 flex flex-row-reverse gap-3 sm:gap-4 hover:bg-card transition-all border-b border-border last:border-0 group relative cursor-pointer",
                                    isRead && "opacity-60 grayscale-[0.3]",
                                  )}
                                  dir="rtl"
                                  onClick={() => {
                                    if (!isRead) toggleRead(alert.id);
                                    if (alert.link) navigate(alert.link);
                                  }}
                                >
                                  <div
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                    style={{ backgroundColor: config.bg, color: config.color }}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0 text-right">
                                    <div className="flex items-center justify-start gap-2">
                                      {!isRead && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                      )}
                                      <p className={cn(
                                        "text-xs font-black transition-colors",
                                        isRead ? "text-muted-foreground" : "text-foreground group-hover:text-primary",
                                      )}>
                                        {alert.title}
                                      </p>
                                    </div>
                                    <p className={cn(
                                      "text-[11px] font-bold leading-tight mt-1",
                                      isRead ? "text-muted-foreground/60" : "text-muted-foreground",
                                    )}>
                                      {alert.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleRead(alert.id);
                                    }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 shrink-0"
                                    title={isRead ? "סמן כלא נקרא" : "סמן כנקרא"}
                                  >
                                    <CheckCheck className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    ) : notificationTab === "active" ? (
                      (loadingNotifs && alerts.length === 0) ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3 opacity-50">
                          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <span className="text-xs font-bold">
                            בודק עדכונים...
                          </span>
                        </div>
                      ) : alerts.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-4 opacity-50">
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black text-foreground">
                              שיגרה מלאה
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground">
                              אין התראות חדשות המצריכות טיפול
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {alerts.map((alert) => {
                            const isRead = readIds.includes(alert.id);
                            const config = getAlertConfig(alert);
                            const Icon = config.icon;
                            const isMorningReport =
                              alert.title?.includes("דיווח בוקר") ||
                              alert.description?.includes("דיווח בוקר");

                            return (
                              <div
                                key={alert.id}
                                className={cn(
                                  "p-3 sm:p-4 flex flex-row-reverse gap-3 sm:gap-4 hover:bg-card transition-all border-b border-border last:border-0 group relative cursor-pointer",
                                  isRead && "opacity-60 grayscale-[0.3]",
                                )}
                                dir="rtl"
                                onClick={(e) => {
                                  // Default click handler for the whole row
                                  if (
                                    (e.target as HTMLElement).closest("button")
                                  )
                                    return; // Ignore button clicks

                                  if (isMorningReport) {
                                    navigate("/attendance", {
                                      state: {
                                        openBulkModal: true,
                                        alertData: (alert as any).data,
                                      },
                                    });
                                  } else if (
                                    (alert as any).data?.sick_employees
                                  ) {
                                    setSickEmployees(
                                      (alert as any).data.sick_employees,
                                    );
                                    setSickModalOpen(true);
                                    // Do not mark as read - keep active until resolved
                                  } else if (alert.id?.startsWith("missed-birthdays")) {
                                    setBdayEmployees((alert as any).data?.missed_birthdays || []);
                                    setBdayModalOpen(true);
                                    if (!isRead) toggleRead(alert.id);
                                  } else {
                                    navigate(alert.link);
                                    // Auto-mark as read for navigation alerts
                                    if (!isRead) toggleRead(alert.id);
                                  }
                                }}
                              >
                                <div
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0  transition-transform group-hover:scale-105"
                                  style={{
                                    backgroundColor: config.bg,
                                    color: config.color,
                                  }}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                  <div className="flex items-center justify-start gap-2">
                                    {!isRead && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    )}
                                    <p
                                      className={cn(
                                        "text-xs font-black transition-colors",
                                        isRead
                                          ? "text-muted-foreground"
                                          : "text-foreground group-hover:text-primary",
                                      )}
                                    >
                                      {alert.title}
                                    </p>
                                  </div>
                                  <p
                                    className={cn(
                                      "text-[11px] font-bold leading-tight mt-1",
                                      isRead
                                        ? "text-muted-foreground/60"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {alert.description}
                                  </p>
                                </div>
                                {/* Internal Message Button */}
                                {isMorningReport &&
                                  (alert as any).data?.commander_id &&
                                  user?.id !==
                                    (alert as any).data.commander_id && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setMsgRecipient({
                                          id: (alert as any).data.commander_id,
                                          name: (alert as any).data
                                            .commander_name,
                                        });
                                        setMsgDefaults({
                                          title: "דיווח בוקר טרם הושלם",
                                          description: `שלום ${(alert as any).data.commander_name}, טרם הושלם דיווח בוקר עבור ${(alert as any).data.missing_count} שוטרים ביחידתך. נא להשלים את הדיווח בהקדם.`,
                                        });
                                        setMsgDialogOpen(true);
                                      }}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-blue-600 hover:bg-blue-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0 mr-1"
                                      title="שלח התראה פנימית"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  )}
                                {/* WhatsApp Reminder Button */}
                                {isMorningReport &&
                                  (alert as any).data?.commander_phone &&
                                  user?.id !==
                                    (alert as any).data.commander_id && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const rawPhone = (alert as any).data?.commander_phone;
                                        const name = (alert as any).data?.commander_name;
                                        const count = (alert as any).data?.missing_count;
                                        const text = `שלום ${name}, טרם הושלם דיווח בוקר עבור ${count} שוטרים ביחידתך. נא להשלים את הדיווח בהקדם.`;
                                        window.open(getWhatsAppUrl(rawPhone, text), "_blank");
                                      }}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-emerald-600 hover:bg-emerald-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0 mr-1"
                                      title="שלח תזכורת בווטסאפ"
                                    >
                                      <WhatsAppIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if ((alert as any).data?.sick_employees) {
                                      setSickEmployees(
                                        (alert as any).data.sick_employees,
                                      );
                                      setSickModalOpen(true);
                                      // Do not mark as read
                                    } else {
                                      setSelectedAlert(alert);
                                      if (!isRead) toggleRead(alert.id);
                                    }
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-blue-600 hover:bg-blue-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0 mr-1"
                                  title="פתח הודעה"
                                >
                                  {alert.title.includes("הודעה") ? (
                                    <Mail className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleRead(alert.id);
                                  }}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0",
                                    isRead
                                      ? "text-primary bg-primary/10"
                                      : "text-muted-foreground hover:text-primary hover:bg-muted",
                                  )}
                                  title={isRead ? "סמן כלא נקרא" : "סמן כנקרא"}
                                >
                                  {isRead ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <Circle className="w-4 h-4 opacity-30" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : loadingHistory ? (
                      <div className="p-12 flex flex-col items-center justify-center gap-3 opacity-50">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="text-xs font-bold">
                          טוען היסטוריה...
                        </span>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="p-12 flex flex-col items-center justify-center gap-4 opacity-50">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <History className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-foreground">
                            אין היסטוריה
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground">
                            לא נמצאו התראות שנקראו
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {history.map((alert) => {
                          const config = getAlertConfig(alert);
                          const Icon = config.icon;

                          return (
                            <div
                              key={alert.id}
                              className="p-4 flex flex-row-reverse gap-4 bg-muted/30 border-b border-border last:border-0 opacity-70 hover:opacity-100 transition-opacity group"
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 grayscale opacity-70"
                                style={{
                                  backgroundColor: config.bg,
                                  color: config.color,
                                }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 text-right">
                                <h4 className="text-xs font-black text-foreground mb-1 leading-tight">
                                  {alert.title}
                                </h4>
                                <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                                  {alert.description}
                                </p>
                                {alert.read_at && (
                                  <p className="text-[9px] font-bold text-muted-foreground mt-2 flex items-center gap-1 justify-end">
                                    <Clock className="w-3 h-3" />
                                    נקרא:{" "}
                                    {new Date(
                                      alert.read_at.endsWith("Z")
                                        ? alert.read_at
                                        : alert.read_at + "Z",
                                    ).toLocaleString("he-IL", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    await markAsUnread(alert.id);
                                    toast.success("ההתראה הוחזרה לרשימת הפעילות שלא נקראו");
                                  }}
                                  title="סמן כלא נקרא"
                                  className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {alerts.length > 0 && notificationTab === "active" && (
                    <div className="p-3 bg-card border-t border-border text-center">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        נא לטפל בבקשות הממתינות בהקדם
                      </span>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              )}

              {/* Theme Toggle Button */}
              <ThemeToggle
                variant="minimal"
                className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl text-muted-foreground hover:bg-muted/70 hover:text-foreground cursor-pointer flex items-center justify-center transition-all"
              />

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                title="התנתק"
                className="w-8.5 h-8.5 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Page */}
        <main
          className={cn(
            "flex-grow bg-background custom-scrollbar px-3 lg:px-6 pt-5 lg:pt-6 pb-6",
            (location.pathname === "/messaging" || location.pathname === "/feedback") &&
              (new URLSearchParams(location.search).get("tab") === "messages" ||
               !new URLSearchParams(location.search).get("tab"))
              ? "overflow-hidden flex flex-col"
              : "overflow-y-auto",
          )}
        >
          <div
            className={cn(
              "w-full max-w-full mx-auto",
              (location.pathname === "/messaging" || location.pathname === "/feedback") &&
                (new URLSearchParams(location.search).get("tab") === "messages" ||
                 !new URLSearchParams(location.search).get("tab")) &&
                "h-full flex flex-col",
            )}
          >
            <Outlet context={{ isSidebarOpen, stats: supportStats, onSelectUser: (id: number | string) => setSelectedUserId(id) }} />
          </div>
        </main>
        {/* Impersonation Banner */}
        <ImpersonationBanner />

        <InternalMessageDialog
          open={msgDialogOpen}
          onOpenChange={setMsgDialogOpen}
          recipient={msgRecipient}
          defaultTitle={msgDefaults.title}
          defaultDescription={msgDefaults.description}
        />

        <SickLeaveDetailsDialog
          open={sickModalOpen}
          onOpenChange={setSickModalOpen}
          employees={sickEmployees}
        />

        <Dialog
          open={!!selectedAlert}
          onOpenChange={(open) => !open && setSelectedAlert(null)}
        >
          <DialogContent className="w-full sm:max-w-md p-5 sm:p-6 rounded-t-3xl sm:rounded-2xl">
            <DialogHeader className="flex flex-col items-center text-center gap-3 sm:gap-4 pb-1">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-sm"
                style={
                  selectedAlert
                    ? {
                        backgroundColor: getAlertConfig(selectedAlert).bg,
                        color: getAlertConfig(selectedAlert).color,
                      }
                    : {}
                }
              >
                {selectedAlert &&
                  React.createElement(getAlertConfig(selectedAlert).icon, {
                    className: "w-8 h-8",
                  })}
              </div>
              <div className="space-y-1 w-full px-2">
                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground">
                  {selectedAlert?.title}
                </DialogTitle>
                <p className="text-xs font-bold text-muted-foreground/80">
                  {selectedAlert?.created_at &&
                    new Date(selectedAlert.created_at).toLocaleString("he-IL")}
                </p>
              </div>
            </DialogHeader>

            <div className="bg-muted/40 p-4 sm:p-5 rounded-3xl border border-border/50 my-2">
              <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap text-foreground text-center">
                {selectedAlert?.description}
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-2 w-full">
              <Button
                variant="outline"
                onClick={() => setSelectedAlert(null)}
                className="w-full sm:flex-1 h-12 sm:h-11 rounded-2xl font-black"
              >
                סגור
              </Button>
              {selectedAlert?.data?.is_message &&
                selectedAlert?.data?.sender_id && (
                  <Button
                    className="w-full sm:flex-1 h-12 sm:h-11 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      const alertCopy = selectedAlert;
                      setSelectedAlert(null);
                      setMsgRecipient({
                        id: alertCopy.data.sender_id,
                        name: alertCopy.data.sender,
                      });
                      setMsgDefaults({
                        title: `תגובה: ${alertCopy.title.replace("הודעה מאת ", "")}`,
                        description: "",
                      });
                      setMsgDialogOpen(true);
                      if (!readIds.includes(alertCopy.id)) {
                        toggleRead(alertCopy.id);
                      }
                    }}
                  >
                    <Send className="w-4 h-4 ml-2" />
                    השב לשולח
                  </Button>
                )}
              {selectedAlert?.link && (
                selectedAlert.id?.startsWith("missed-birthdays") ? (
                  <Button
                    className="w-full sm:flex-1 h-12 sm:h-11 rounded-2xl font-black shadow-lg shadow-primary/20 bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                    onClick={() => {
                      setBdayEmployees(selectedAlert.data?.missed_birthdays || []);
                      setBdayModalOpen(true);
                      setSelectedAlert(null);
                      if (!readIds.includes(selectedAlert.id)) {
                        toggleRead(selectedAlert.id);
                      }
                    }}
                  >
                    שליחת ברכת יום הולדת
                  </Button>
                ) : (
                  <Button
                    className="w-full sm:flex-1 h-12 sm:h-11 rounded-2xl font-black shadow-lg shadow-primary/20"
                    onClick={() => {
                      let targetLink = selectedAlert.link;
                      if (selectedAlert.data?.ticket_id && !targetLink.includes("ticket_id=")) {
                        targetLink += (targetLink.includes("?") ? "&" : "?") + `ticket_id=${selectedAlert.data.ticket_id}`;
                      }
                      navigate(targetLink);
                      setSelectedAlert(null);
                      if (!readIds.includes(selectedAlert.id)) {
                        toggleRead(selectedAlert.id);
                      }
                      if (selectedAlert.link.includes("#")) {
                        const id = selectedAlert.link.split("#")[1];
                        setTimeout(() => {
                          document
                            .getElementById(id)
                            ?.scrollIntoView({ behavior: "smooth" });
                          const el = document.getElementById(id);
                          if (el) {
                            el.classList.add(
                              "ring-4",
                              "ring-primary",
                              "ring-offset-4",
                              "transition-all",
                              "duration-1000",
                            );
                            setTimeout(
                              () =>
                                el.classList.remove(
                                  "ring-4",
                                  "ring-primary",
                                  "ring-offset-4",
                                ),
                              2000,
                            );
                          }
                        }, 300);
                      }
                    }}
                  >
                    למעבר לעמוד
                  </Button>
                )
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <GlobalAiSupport />
        <ChatSidebar />
        <PwaInstallPrompt />
        <GroupMessageModal open={isGroupModalOpen} onClose={closeGroupModal} />
        <BirthdayGreetingsModal
          open={bdayModalOpen}
          onOpenChange={setBdayModalOpen}
          weeklyBirthdays={bdayEmployees}
        />



        {/* Diagnostic Dossier Drawer */}
        <SupportUserDrawer
          userId={selectedUserId}
          open={Boolean(selectedUserId)}
          onClose={() => setSelectedUserId(null)}
        />
      </div>
    </div>
  );
}
