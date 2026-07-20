import { cn } from '../lib/utils';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Clock, 
  BarChart3, Bell, Settings, LogOut, 
  Shield, Network, GitFork, Activity,
  Sun, Moon, ChevronLeft, ChevronRight
} from 'lucide-react';

interface SidebarItem {
  labelKey: string;
  path: string;
  icon: any;
  permission?: string;
}

interface SidebarSection {
  titleKey: string;
  items: SidebarItem[];
}

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
}

export default function Sidebar({ className, isMobile = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, direction, sidebarCollapsed, toggleSidebar, setMobileSidebarOpen } = useUIStore();
  const { user, logout, hasPermission } = useAuthStore();
  const { t } = useTranslation();

  const isRtl = direction === 'rtl';

  const sections: SidebarSection[] = [
    {
      titleKey: 'MAIN',
      items: [
        {
          labelKey: 'common:dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          permission: 'view_dashboard'
        }
      ]
    },
    {
      titleKey: 'WORKFORCE',
      items: [
        {
          labelKey: 'common:employees',
          path: '/employees',
          icon: Users,
          permission: 'manage_employees'
        },
        {
          labelKey: 'scheduling:statuses_management',
          path: '/workforce/scheduling/statuses',
          icon: Shield,
          permission: 'schedule.status_manage'
        },
        {
          labelKey: 'common:scheduling',
          path: '/workforce/scheduling',
          icon: Clock,
          permission: 'schedule.view'
        },
        {
          labelKey: 'common:organization',
          path: '/organization',
          icon: Network,
          permission: 'manage_org'
        }
      ]
    },
    {
      titleKey: 'OPERATIONS',
      items: [
        {
          labelKey: 'common:reports',
          path: '/reports',
          icon: BarChart3,
          permission: 'view_reports'
        },
        {
          labelKey: 'dashboard:utilization',
          path: '/workforce/dashboard',
          icon: Activity,
          permission: 'dashboard.view'
        },
        {
          labelKey: 'common:notifications',
          path: '/notifications',
          icon: Bell,
          permission: 'notifications.view'
        }
      ]
    },
    {
      titleKey: 'ADMINISTRATION',
      items: [
        {
          labelKey: 'common:transfers',
          path: '/transfers',
          icon: GitFork,
          permission: 'transfers.view'
        },
        {
          labelKey: 'common:admin',
          path: '/admin/business-rules',
          icon: Shield,
          permission: 'business_rules.view'
        },
        {
          labelKey: 'common:settings',
          path: '/settings',
          icon: Settings,
          permission: 'view_settings'
        },
        {
          labelKey: 'common:audit',
          path: '/admin/audit',
          icon: Activity,
          permission: 'audit.view'
        }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 76 }
  };

  const currentOrg = "מפקדת גדוד 51";
  const environment = "STAGING";

  return (
    <motion.aside
      initial={sidebarCollapsed ? 'collapsed' : 'expanded'}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        "flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800/80 shadow-md select-none transition-colors duration-200 text-slate-700 dark:text-slate-350",
        isRtl ? "border-l" : "border-r",
        className
      )}
    >
      {/* BRANDING HEADER */}
      <div className="flex flex-col p-4 border-b border-slate-100 dark:border-slate-800 justify-center">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 dark:bg-cyan-500 text-white font-bold shadow-md shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="font-heading text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Pikud360
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {currentOrg}
                </span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-cyan-550/20 bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 shrink-0 uppercase tracking-wider">
              {environment}
            </span>
          )}
        </div>
      </div>

      {/* NAVIGATION SECTIONS */}
      <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin">
        {sections.map((sec) => {
          const visibleItems = sec.items.filter(
            (item) => !item.permission || hasPermission(item.permission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={sec.titleKey} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 px-3 uppercase select-none leading-none mb-2">
                  {sec.titleKey}
                </p>
              )}

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const label = t(item.labelKey);
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40 select-none",
                          isActive
                            ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        )
                      }
                    >
                      <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-450 dark:text-slate-500")} />
                      {!sidebarCollapsed && (
                        <span className="whitespace-nowrap transition-opacity duration-200">
                          {label}
                        </span>
                      )}
                      
                      {/* Accent highlight border */}
                      {isActive && (
                        <div className={cn("absolute top-2 bottom-2 w-1 bg-cyan-600 dark:bg-cyan-500 rounded-full", isRtl ? "right-0" : "left-0")} />
                      )}

                      {/* Tooltip on collapsed state */}
                      {sidebarCollapsed && (
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-950 text-white text-[10px] px-2 py-1.5 rounded-md pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-800 font-bold",
                            isRtl ? "right-full mr-3" : "left-full ml-3"
                          )}
                        >
                          {label}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER ACTIONS AREA */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
        {/* User Badge Details */}
        {user && !sidebarCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-3 bg-slate-100/40 dark:bg-slate-850/40 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
            <div className="h-8.5 w-8.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-650 dark:text-cyan-400 font-bold flex items-center justify-center text-xs border border-cyan-200/50 dark:border-cyan-800/30">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-850 dark:text-white truncate leading-none">
                {user.name}
              </p>
              <p className="text-[9px] text-slate-400 font-medium truncate mt-1">
                מפקד יחידה
              </p>
            </div>
          </div>
        )}

        {/* Action Controls List */}
        <div className="space-y-1">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer select-none"
            title={theme === 'dark' ? "מעבר למצב יום" : "מעבר למצב לילה"}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                {!sidebarCollapsed && <span>מצב יום</span>}
              </>
            ) : (
              <>
                <Moon className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                {!sidebarCollapsed && <span>מצב לילה</span>}
              </>
            )}
          </button>

          {/* Toggle sidebar button */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer select-none"
              title={sidebarCollapsed ? "הצג תפריט" : "סגור תפריט"}
            >
              {sidebarCollapsed ? (
                isRtl ? <ChevronLeft className="h-4.5 w-4.5 shrink-0" /> : <ChevronRight className="h-4.5 w-4.5 shrink-0" />
              ) : (
                <>
                  {isRtl ? <ChevronRight className="h-4.5 w-4.5 shrink-0" /> : <ChevronLeft className="h-4.5 w-4.5 shrink-0" />}
                  <span>צמצם תפריט</span>
                </>
              )}
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer select-none"
            title="התנתקות מהמערכת"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!sidebarCollapsed && <span>התנתקות</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
