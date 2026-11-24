import { useEffect, lazy, Suspense } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import MainLayout from "@/components/layout/MainLayout";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
  useRouteError,
} from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";
import AttendancePage from "@/pages/AttendancePage";
import EmployeesPage from "@/pages/EmployeesPage";
import TransfersPage from "@/pages/TransfersPage";
import RosterPage from "@/pages/RosterPage";

// Helper for safe lazy-loading with automatic retry/reload on stale HMR cache
const lazyWithRetry = (importFn: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await importFn();
    } catch (error: any) {
      if (
        typeof window !== "undefined" &&
        error?.message?.includes("Failed to fetch dynamically imported module")
      ) {
        window.location.reload();
      }
      throw error;
    }
  });

// ── Secondary pages lazy-loaded safely ──────────────────────────
const ForgotPasswordPage = lazyWithRetry(() => import("@/pages/ForgotPasswordPage"));
const SupportPage        = lazyWithRetry(() => import("@/pages/SupportPage"));
const TermsPage          = lazyWithRetry(() => import("@/pages/TermsPage"));
const PrivacyPage        = lazyWithRetry(() => import("@/pages/PrivacyPage"));
const CreateEmployeePage = lazyWithRetry(() => import("@/pages/CreateEmployeePage"));
const EmployeeViewPage   = lazyWithRetry(() => import("@/pages/EmployeeViewPage"));
const ChangePasswordPage = lazyWithRetry(() => import("@/pages/ChangePasswordPage"));
const FeedbackPage       = lazyWithRetry(() => import("@/pages/FeedbackPage"));

const MessagingPage       = lazyWithRetry(() => import("@/features/messaging/MessagingPage"));

// ── Support Workspace pages ──────────────────────────────────────────────────
const SupportWorkspaceLayout   = lazyWithRetry(() => import("@/features/support-workspace/SupportWorkspaceLayout"));
const SupportDashboardPage     = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportDashboardPage"));
const SupportSystemHealthPage  = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportSystemHealthPage"));
const SupportUserLookupPage    = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportUserLookupPage"));
const SupportIncidentsPage     = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportIncidentsPage"));
const SupportAnnouncementsPage = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportAnnouncementsPage"));
const SupportUpdatesPage       = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportUpdatesPage"));
const SupportTicketsPage       = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportTicketsPage"));
const SupportActivityPage      = lazyWithRetry(() => import("@/features/support-workspace/pages/SupportActivityPage"));

// ── Page-level suspense wrapper ───────────────────────────────────────────────
// Keeps UX smooth: shows LoadingScreen while the chunk downloads
function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

// ── Global Error Boundary Component ──────────────────────────────────────────
function DefaultErrorBoundary() {
  const error: any = useRouteError();
  console.error("Router Error:", error);

  const errorMessage = error?.message || error?.statusText || "שגיאה לא ידועה";
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-slate-50 dark:bg-slate-950 font-sans" dir="rtl">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border/40 text-center space-y-6 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-500 mx-auto animate-bounce">
          <AlertCircle className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">אופס! משהו השתבש</h1>
          <p className="text-muted-foreground font-medium text-[13px] md:text-sm leading-relaxed px-2">
            המערכת נתקלה בשגיאה טכנית. פרטי השגיאה מוצגים למטה:
          </p>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:rounded-2xl text-left overflow-x-auto max-h-40 border border-slate-200/50 dark:border-white/5">
          <pre className="text-[10px] font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap break-all">
            {errorMessage}
            {error?.stack && `\n\nStack:\n${error.stack}`}
          </pre>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={() => window.location.reload()}
            className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-md md:text-lg gap-2 shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
            רענן ונסה שוב
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/login"}
            className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-md md:text-lg border-slate-200 dark:border-slate-700"
          >
            חזרה להתחברות
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Protected route ───────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  // If loading AND there's a token, show the loading screen while validating
  // If no token at all, skip loading screen and go straight to login
  const hasToken = !!localStorage.getItem("token");
  if (loading && hasToken) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.must_change_password && !user.is_impersonated && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  if ((!user.must_change_password || user.is_impersonated) && location.pathname === "/change-password") {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/change-password") {
    return <Outlet />;
  }

  // Support Workspace RBAC boundary:
  // 1. Dedicated Admin (when NOT impersonating) must land directly in /support-workspace
  //    UNLESS they explicitly chose Commander mode via the login choice overlay.
  const isDedicatedAdmin = Boolean(user.is_admin && !user.is_impersonated);
  const adminMode = sessionStorage.getItem("admin_mode"); // 'support' | 'commander'
  if (isDedicatedAdmin && location.pathname === "/" && adminMode !== "commander") {
    return <Navigate to="/support-workspace" replace />;
  }

  // 2. Non-admin users are strictly prohibited from accessing /support-workspace/*
  if (!user.is_admin && location.pathname.startsWith("/support-workspace")) {
    return <Navigate to="/" replace />;
  }

  const managementRoutes = ["/employees", "/transfers"];
  if (user.is_temp_commander && managementRoutes.some((r) => location.pathname.startsWith(r))) {
    return <Navigate to="/" replace />;
  }

  return <MainLayout />;
};

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    errorElement: <DefaultErrorBoundary />,
    children: [
      { path: "/login",            element: <LoginPage /> },
      { path: "/forgot-password",  element: <PageSuspense><ForgotPasswordPage /></PageSuspense> },
      { path: "/support",          element: <PageSuspense><SupportPage /></PageSuspense> },
      { path: "/terms",            element: <PageSuspense><TermsPage /></PageSuspense> },
      { path: "/privacy",          element: <PageSuspense><PrivacyPage /></PageSuspense> },
      {
        element: <ProtectedRoute />,
        children: [
          // Support Workspace dedicated routes
          { path: "/support-workspace",               element: <PageSuspense><SupportDashboardPage /></PageSuspense> },
          { path: "/support-workspace/tickets",       element: <PageSuspense><SupportTicketsPage /></PageSuspense> },
          { path: "/support-workspace/health",        element: <PageSuspense><SupportSystemHealthPage /></PageSuspense> },
          { path: "/support-workspace/users",         element: <PageSuspense><SupportUserLookupPage /></PageSuspense> },
          { path: "/support-workspace/incidents",     element: <PageSuspense><SupportIncidentsPage /></PageSuspense> },
          { path: "/support-workspace/announcements", element: <PageSuspense><SupportAnnouncementsPage /></PageSuspense> },
          { path: "/support-workspace/updates",       element: <PageSuspense><SupportUpdatesPage /></PageSuspense> },
          { path: "/support-workspace/activity",      element: <PageSuspense><SupportActivityPage /></PageSuspense> },

          // Operational commander & workforce routes
          { path: "/",                    element: <DashboardPage /> },
          { path: "/change-password",     element: <PageSuspense><ChangePasswordPage /></PageSuspense> },
          { path: "/employees",           element: <EmployeesPage /> },
          { path: "/employees/new",       element: <PageSuspense><CreateEmployeePage /></PageSuspense> },
          { path: "/employees/:id",       element: <PageSuspense><EmployeeViewPage /></PageSuspense> },
          { path: "/employees/edit/:id",  element: <PageSuspense><EmployeeViewPage /></PageSuspense> },
          { path: "/transfers",           element: <TransfersPage /> },
          { path: "/attendance",          element: <AttendancePage /> },
          { path: "/roster",              element: <RosterPage /> },
          { path: "/settings",            element: <SettingsPage /> },
          { path: "/feedback",            element: <PageSuspense><FeedbackPage /></PageSuspense> },
          { path: "/messaging",           element: <PageSuspense><FeedbackPage /></PageSuspense> },
          { path: "/activity-log",        element: <Navigate to="/support-workspace/activity" replace /> },
          { path: "/manage",              element: <Navigate to="/employees" replace /> },
          { path: "*",                    element: <Navigate to="/" replace /> },
        ],
      },
    ]
  }
]);

export function AppRouter() {
  useEffect(() => {
    try {
      localStorage.removeItem("read_notifications");
    } catch (err) {
      console.warn("Failed to clear read_notifications", err);
    }

    const handleGlobalFocus = (e: FocusEvent) => {
      if (window.innerWidth >= 640) return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        setTimeout(() => {
          target.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 200);
      }
    };

    document.addEventListener("focusin", handleGlobalFocus);
    return () => {
      document.removeEventListener("focusin", handleGlobalFocus);
    };
  }, []);

  return <RouterProvider router={router} />;
}
