import { useEffect, lazy, Suspense } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import MainLayout from "@/components/layout/MainLayout";
import { EmployeeProvider } from "@/context/EmployeeContext";
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

// ── Lazy-load specific pages so they are still broken into chunks but main ones are static ──────────────────────────
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const SupportPage        = lazy(() => import("@/pages/SupportPage"));
const TermsPage          = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage        = lazy(() => import("@/pages/PrivacyPage"));
const EmployeesPage      = lazy(() => import("@/pages/EmployeesPage"));
const CreateEmployeePage = lazy(() => import("@/pages/CreateEmployeePage"));
const EmployeeViewPage   = lazy(() => import("@/pages/EmployeeViewPage"));
const TransfersPage      = lazy(() => import("@/pages/TransfersPage"));
const AttendancePage     = lazy(() => import("@/pages/AttendancePage"));
const RosterPage         = lazy(() => import("@/pages/RosterPage"));
const ChangePasswordPage = lazy(() => import("@/pages/ChangePasswordPage"));
const ActivityLogPage    = lazy(() => import("@/pages/ActivityLogPage"));
const FeedbackPage       = lazy(() => import("@/pages/FeedbackPage"));

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

  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  if (!user.must_change_password && location.pathname === "/change-password") {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/change-password") {
    return (
      <EmployeeProvider>
        <Outlet />
      </EmployeeProvider>
    );
  }

  const managementRoutes = ["/employees", "/transfers"];
  if (user.is_temp_commander && managementRoutes.some((r) => location.pathname.startsWith(r))) {
    return <Navigate to="/" replace />;
  }

  return (
    <EmployeeProvider>
      <MainLayout />
    </EmployeeProvider>
  );
};

// ── Router ────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
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
          { path: "/",                    element: <DashboardPage /> },
          { path: "/change-password",     element: <PageSuspense><ChangePasswordPage /></PageSuspense> },
          { path: "/employees",           element: <PageSuspense><EmployeesPage /></PageSuspense> },
          { path: "/employees/new",       element: <PageSuspense><CreateEmployeePage /></PageSuspense> },
          { path: "/employees/:id",       element: <PageSuspense><EmployeeViewPage /></PageSuspense> },
          { path: "/employees/edit/:id",  element: <PageSuspense><EmployeeViewPage /></PageSuspense> },
          { path: "/transfers",           element: <PageSuspense><TransfersPage /></PageSuspense> },
          { path: "/attendance",          element: <PageSuspense><AttendancePage /></PageSuspense> },
          { path: "/roster",              element: <PageSuspense><RosterPage /></PageSuspense> },
          { path: "/settings",            element: <SettingsPage /> },
          { path: "/feedback",            element: <PageSuspense><FeedbackPage /></PageSuspense> },
          { path: "/activity-log",        element: <PageSuspense><ActivityLogPage /></PageSuspense> },
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
      // ignore localStorage failures in old browsers or strict mode
      console.warn("Failed to clear read_notifications", err);
    }
  }, []);

  return <RouterProvider router={router} />;
}
