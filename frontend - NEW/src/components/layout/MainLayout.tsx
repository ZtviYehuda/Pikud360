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
  Megaphone,
  CalendarRange,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";
import { Send, Eye, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GlobalAiSupport } from "@/components/common/GlobalAiSupport";
import { ChatSidebar } from "./ChatSidebar";
import { useChat } from "@/context/ChatContext";
import { GroupMessageModal } from "@/components/chat/GroupMessageModal";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { PwaInstallPrompt } from "./PwaInstallPrompt";

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
  const [pendingRequestsCount, setPendingRequestsCount] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPendingCount = async () => {
    if (!user?.is_admin) return;
    try {
      const { data } = await apiClient.get("/support/tickets/pending-count");
      if (!data) return; // Endpoint may not exist — fail silently
      setPendingRequestsCount(data.count || 0);
    } catch (err) {
      // Silently ignore — endpoint may not be deployed
    }
  };

  React.useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

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
              navigate("/feedback?tab=messages");
              openChat({
                id: alert.data?.sender_id || 0,
                name:
                  alert.data?.sender || alert.title.replace("הודעה מאת ", ""),
                role: "מפקד",
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

  const navItems = [
    { name: "לוח בקרה", path: "/", icon: LayoutDashboard },
    { name: "מעקב נוכחות", path: "/attendance", icon: CalendarDays },
    { name: "סידור עבודה", path: "/roster", icon: CalendarRange },
    // Only show these if NOT a temp commander
    ...(!user?.is_temp_commander
      ? [
          { name: "ניהול שוטרים", path: "/employees", icon: Users },
          { name: "בקשות העברה", path: "/transfers", icon: ArrowLeftRight },
        ]
      : []),
    { name: "מרכז משוב", path: "/feedback", icon: MessageSquare },
    ...(user?.is_admin
      ? [{ name: "יומן פעילות", path: "/activity-log", icon: Activity }]
      : []),
    { name: "הגדרות", path: "/settings", icon: Settings },
  ];

  // Derive the current page title for the mobile header
  const currentPageName =
    navItems.find(
      (item) =>
        item.path === location.pathname ||
        (item.path !== "/" && location.pathname.startsWith(item.path)),
    )?.name ?? "לוח בקרה";

  return (
    <div
      className="h-dvh bg-background flex font-sans text-foreground overflow-hidden"
      dir="rtl"
    >
      {/* Sidebar - Official White Style */}
      <aside
        onDoubleClick={() => setIsSidebarOpen((prev) => !prev)}
        className={cn(
          // Base: fixed to RIGHT edge (RTL), full height
          "bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-2xl border-l border-border shadow-[4px_0_24px_-12px_rgba(0,0,0,0.15)] flex flex-col z-[100] fixed right-0 lg:sticky lg:right-auto top-0 h-[100dvh] overflow-hidden flex-shrink-0",
          // Mobile: keep w-72 always, only slide translateX (RIGHT = off-screen in RTL)
          // Desktop: width animates between w-24 ↔ w-72
          "w-72 transition-transform lg:transition-all ease-out",
          isSidebarOpen
            ? "translate-x-0 lg:w-72"
            : "translate-x-full lg:translate-x-0 lg:w-24",
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            "h-16 flex-none flex items-center border-b border-border/40 transition-none",
            isSidebarOpen ? "px-4 justify-between" : "justify-center",
          )}
        >
          {/* Menu Toggle Button — logo floats freely, no box */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center justify-center shrink-0 transition-all active:scale-90"
            aria-label="תפריט ניווט"
          >
            <img
              src="/toren_logo.png"
              alt="לוגו Toren"
              className={cn(
                "object-contain transition-all toren-logo-img",
                // Collapsed sidebar: larger floating logo; open: slightly smaller
                isSidebarOpen ? "w-12 h-12" : "w-14 h-14",
              )}
            />
          </button>

          {/* Left Side Actions (Theme Toggle & Mobile Close Button) */}
          {isSidebarOpen && (
            <div className="flex items-center gap-1.5">
              <ThemeToggle variant="minimal" />
              <button
                className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow p-2.5 space-y-1 overflow-y-auto no-scrollbar custom-scrollbar">
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
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden select-none",
                  isActive
                    ? "bg-primary/10 text-primary font-black  "
                    : "text-muted-foreground hover:bg-muted/50 hover:text-primary",
                )}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 shrink-0 transition-transform group-hover:scale-110",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary",
                    !isSidebarOpen && "mx-auto",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-black tracking-tight truncate flex-1 text-right transition-all",
                    isSidebarOpen
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-10 absolute right-12 w-0",
                  )}
                >
                  {item.name}
                </span>
                <div
                  className={cn(
                    "absolute left-1 w-1 bg-primary rounded-full transition-all duration-300 ease-out origin-center",
                    isActive
                      ? "h-5 opacity-100 scale-100"
                      : "h-0 opacity-0 scale-50",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={cn(
            "p-3 border-t border-border/40 flex flex-col gap-3",
            isSidebarOpen ? "" : "items-center",
          )}
        >
          {/* User Profile Area */}
          {isSidebarOpen ? (
            <div
              id="sidebar-profile-container"
              className="flex items-center justify-between gap-3 p-2 bg-muted/40 dark:bg-muted/20 border border-border/40 hover:border-border/80 rounded-xl transition-all duration-200 select-none group w-full"
            >
              <Link
                to="/settings"
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 min-w-0 flex-grow"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0 shadow-sm transition-all group-hover:scale-105">
                  {user?.is_admin
                    ? "💬"
                    : `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`}
                </div>
                <div className="flex flex-col min-w-0 text-right">
                  <span className="text-xs font-black text-foreground truncate leading-none mb-1 group-hover:text-primary transition-colors">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground truncate uppercase tracking-tighter">
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

              {/* Logout Button (Open State) */}
              <button
                onClick={() => logout()}
                title="התנתק"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all border border-transparent shrink-0 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Collapsed Profile Link */
            <Link
              id="sidebar-profile-link-collapsed"
              to="/settings"
              title="הגדרות פרופיל"
              onClick={() => {
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0 shadow-sm transition-all hover:scale-105 hover:bg-primary/20 active:scale-95"
            >
              {user?.is_admin
                ? "💬"
                : `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`}
            </Link>
          )}

          {/* Action Area below profile */}
          {!isSidebarOpen && (
            <div className="flex flex-col items-center gap-2.5 w-full">
              <ThemeToggle variant="minimal" />
              <button
                onClick={() => logout()}
                title="התנתק"
                className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all border border-border bg-background shadow-sm active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
        <header className="h-16 bg-card border-b border-border/40 px-4 lg:px-8 flex items-center justify-between gap-x-4 sticky top-0 z-40 transition-none flex-none">
          {/* Right side: Logo + Page Title + Status Dot */}
          <div className="flex items-center gap-1 sm:gap-4 flex-1 min-w-0 ml-2">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center shrink-0 active:scale-90 transition-all"
              aria-label="Open menu"
            >
              <img
                src="/toren_logo.png"
                alt="לוגו Toren"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain toren-logo-img"
              />
            </button>

            {/* Mobile page title & status dot — sits between logo and date/notifications */}
            <div className="lg:hidden flex-1 flex flex-col items-start pr-1.5 min-w-0">
              {/* Green status dot above the name */}
              <div className="mb-0.5 flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      id="mobile-system-status-dot"
                      title="סטטוס מערכת"
                      className="flex items-center shrink-0 focus:outline-none p-0.5"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
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
                <span className="text-[7.5px] font-black text-emerald-500/90 leading-none">
                  פעיל
                </span>
              </div>
              <h2 className="text-sm font-black text-foreground tracking-tight leading-none whitespace-nowrap">
                {currentPageName}
              </h2>
            </div>

            {/* Desktop Only Pulsing Status Dot */}
            <div className="hidden lg:flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    id="system-status-dot"
                    title="סטטוס מערכת"
                    className="flex items-center shrink-0 focus:outline-none p-1"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
              <h1 className="text-sm font-black text-foreground tracking-tight leading-none whitespace-nowrap">
                מערכת במצב פעיל
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            {/* Global DateHeader */}
            <div className="shrink-0">
              <DateHeader className="sm:scale-100 scale-100 origin-left" />
            </div>

            <div className="h-4 sm:h-5 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Chat Button with Unread Badge - Hidden on mobile, visible on desktop */}
              <button
                id="chat-toggle-btn"
                onClick={toggleChat}
                title="צ'אט והודעות"
                className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all relative"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                    <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground ring-2 ring-card">
                      {unreadMessagesCount}
                    </span>
                  </span>
                )}
              </button>

              {/* Combined Notifications/Messages Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    id="mobile-notifications-btn"
                    className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount + (user?.is_admin ? pendingRequestsCount : 0) + (isMobile ? unreadMessagesCount : 0) >
                      0 && (
                      <span
                        className={cn(
                          "absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-black text-primary-foreground ring-2 ring-card animate-in zoom-in-50",
                          pendingRequestsCount > 0 && user?.is_admin
                            ? "bg-amber-500 shadow-lg shadow-amber-500/20"
                            : "bg-primary",
                        )}
                      >
                        {unreadCount +
                          (user?.is_admin ? pendingRequestsCount : 0) +
                          (isMobile ? unreadMessagesCount : 0)}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[450px] max-w-[95vw] p-0 overflow-hidden rounded-2xl border-border shadow-2xl"
                  align="start"
                >
                  <div className="p-4 border-b border-border bg-card sticky top-0 z-10">
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
                      <div className="flex items-center gap-4">
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
                    <div className="flex gap-1 border-b border-border/40 -mb-px">
                      <button
                        onClick={() => setNotificationTab("active")}
                        className={cn(
                          "flex-1 px-2 py-2 text-[10px] sm:text-[11px] font-black rounded-t-lg transition-all flex items-center justify-center gap-1.5",
                          notificationTab === "active"
                            ? "bg-background text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                      >
                        <Activity className="w-3 h-3" />
                        פעילות ({alerts.length})
                      </button>
                      <button
                        onClick={() => setNotificationTab("messages")}
                        className={cn(
                          "flex-1 px-2 py-2 text-[10px] sm:text-[11px] font-black rounded-t-lg transition-all flex items-center justify-center gap-1.5",
                          notificationTab === "messages"
                            ? "bg-background text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                      >
                        <MessageSquare className="w-3 h-3" />
                        הודעות{" "}
                        {unreadMessagesCount > 0 && `(${unreadMessagesCount})`}
                      </button>
                      <button
                        onClick={() => {
                          setNotificationTab("history");
                          fetchHistory();
                        }}
                        className={cn(
                          "flex-1 px-2 py-2 text-[10px] sm:text-[11px] font-black rounded-t-lg transition-all flex items-center justify-center gap-1.5",
                          notificationTab === "history"
                            ? "bg-background text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                      >
                        <History className="w-3 h-3" />
                        היסטוריה ({history.length})
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-muted/50">
                    {notificationTab === "messages" ? (
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
                          onClick={() => {
                            toggleChat();
                          }}
                          className="rounded-xl font-black text-xs gap-2 px-6"
                        >
                          פתח את מרכז ההודעות
                          <ArrowLeft className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : notificationTab === "active" ? (
                      loadingNotifs ? (
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
                                        const phone = (
                                          alert as any
                                        ).data.commander_phone
                                          .replace(/-/g, "")
                                          .replace(/^0/, "972");
                                        const name = (alert as any).data
                                          .commander_name;
                                        const count = (alert as any).data
                                          .missing_count;
                                        const text = `שלום ${name}, טרם הושלם דיווח בוקר עבור ${count} שוטרים ביחידתך. נא להשלים את הדיווח בהקדם.`;
                                        window.open(
                                          `https://wa.me/${phone}?text=${encodeURIComponent(
                                            text,
                                          )}`,
                                          "_blank",
                                        );
                                      }}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-emerald-600 hover:bg-emerald-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0 mr-1"
                                      title="שלח תזכורת בווטסאפ"
                                    >
                                      <MessageCircle className="w-4 h-4" />
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
                                  onClick={() => markAsUnread(alert.id)}
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
            </div>
          </div>
        </header>

        {/* Content Page */}
        <main
          className={cn(
            "flex-grow bg-background custom-scrollbar px-2 lg:px-6",
            location.pathname === "/feedback" &&
              new URLSearchParams(location.search).get("tab") === "messages"
              ? "overflow-hidden flex flex-col"
              : "overflow-y-auto",
          )}
        >
          <div
            className={cn(
              "w-full max-w-full mx-auto",
              location.pathname === "/feedback" &&
                new URLSearchParams(location.search).get("tab") ===
                  "messages" &&
                "h-full flex flex-col",
            )}
          >
            <Outlet context={{ isSidebarOpen }} />
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
                      navigate(selectedAlert.link);
                      setSelectedAlert(null);
                      if (selectedAlert.link.includes("#")) {
                        const id = selectedAlert.link.split("#")[1];
                        setTimeout(() => {
                          document
                            .getElementById(id)
                            ?.scrollIntoView({ behavior: "smooth" });
                          // Add a highlight effect
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
      </div>
    </div>
  );
}
