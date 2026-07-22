import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { AppShell } from '../components/ui/app-shell';
import GlobalSearch from '../components/GlobalSearch';
import {
  LayoutGrid, CalendarCheck, Calendar, Users,
  ArrowLeftRight, MessageSquare, Activity, Settings
} from 'lucide-react';
import { NavigationItem } from '../components/ui/app-shell/types';

export default function BaseLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { direction, sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    if (media.matches) {
      setSidebarCollapsed(true);
    }
    const listener = (e: MediaQueryListEvent) => {
      setSidebarCollapsed(e.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [setSidebarCollapsed]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "לוח בקרה",
      icon: <LayoutGrid className="h-5 w-5" />,
      href: "/dashboard",
      group: "ראשי"
    },
    {
      id: "attendance",
      label: "מעקב נוכחות",
      icon: <CalendarCheck className="h-5 w-5" />,
      href: "/workforce/dashboard",
      group: "ראשי"
    },
    {
      id: "scheduling",
      label: "סידור עבודה",
      icon: <Calendar className="h-5 w-5" />,
      href: "/workforce/scheduling",
      group: "ראשי"
    },
    {
      id: "employees",
      label: "ניהול שוטרים",
      icon: <Users className="h-5 w-5" />,
      href: "/employees",
      group: "ראשי"
    },
    {
      id: "transfers",
      label: "בקשות העברה",
      icon: <ArrowLeftRight className="h-5 w-5" />,
      href: "/transfers",
      group: "ראשי"
    },
    {
      id: "feedback",
      label: "מרכז משוב",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/notifications",
      group: "ראשי"
    },
    {
      id: "activity",
      label: "יומן פעילות",
      icon: <Activity className="h-5 w-5" />,
      href: "/admin/audit",
      group: "ראשי"
    },
    {
      id: "settings",
      label: "הגדרות",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
      group: "ראשי"
    }
  ];

  return (
    <div dir={direction} className="h-screen w-screen overflow-hidden">
      <AppShell
        navigationItems={navigationItems}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarCollapseChange={setSidebarCollapsed}
        user={user ? { name: user.name, role: (user as any).role || (user as any).roles?.[0] || "ניהול מערכת" } : { name: "צוות תמיכה", role: "ניהול מערכת" }}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
        currentWorkspace={{ id: "unit-51", name: "מפקדת גדוד 51", details: "גולני" }}
      >
        <Outlet />
      </AppShell>
      <GlobalSearch />
    </div>
  );
}
