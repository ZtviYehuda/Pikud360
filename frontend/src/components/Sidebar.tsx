import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Clock, 
  BarChart3, Bell, Settings, LogOut, 
  Menu, Shield, ChevronDown, Network, GitFork, Activity, Calendar,
  Wrench, BookOpen, Zap, MessageSquare, HeartPulse
} from 'lucide-react';

interface SidebarItem {
  nameEn: string;
  nameHe: string;
  path: string;
  icon: any;
  permission?: string;
  children?: {
    nameEn: string;
    nameHe: string;
    path: string;
    icon: any;
  }[];
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, language } = useUIStore();
  const { user, logout, hasPermission } = useAuthStore();
  const [orgOpen, setOrgOpen] = useState(false);

  const menuItems: SidebarItem[] = [
    {
      nameEn: 'Dashboard',
      nameHe: 'לוח בקרה',
      path: '/dashboard',
      icon: LayoutDashboard,
      permission: 'view_dashboard'
    },
    {
      nameEn: 'Employees',
      nameHe: 'עובדים',
      path: '/employees',
      icon: Users,
      permission: 'manage_employees'
    },
    {
      nameEn: 'Organization',
      nameHe: 'מבנה ארגוני',
      path: '/organization',
      icon: Network,
      permission: 'manage_org',
      children: [
        { nameEn: 'Hierarchy Tree', nameHe: 'עץ היררכיה', path: '/organization', icon: GitFork },
      ]
    },
    {
      nameEn: 'Operational Intelligence',
      nameHe: 'מודיעין תכנון',
      path: '/workforce/dashboard',
      icon: Activity,
      permission: 'dashboard.view'
    },
    {
      nameEn: 'Workforce Planning',
      nameHe: 'שיבוץ כוח אדם',
      path: '/workforce/scheduling',
      icon: Clock,
      permission: 'schedule.view'
    },
    {
      nameEn: 'Planning Settings',
      nameHe: 'הגדרות שיבוץ',
      path: '/workforce/scheduling/settings',
      icon: Settings,
      permission: 'schedule.settings_manage'
    },
    {
      nameEn: 'Status Catalog',
      nameHe: 'קטלוג סטטוסים',
      path: '/workforce/scheduling/statuses',
      icon: Shield,
      permission: 'schedule.status_manage'
    },
    {
      nameEn: 'Reports',
      nameHe: 'דוחות',
      path: '/reports',
      icon: BarChart3,
      permission: 'view_reports'
    },
    {
      nameEn: 'Transfers',
      nameHe: 'העברות כוח אדם',
      path: '/transfers',
      icon: GitFork,
      permission: 'transfers.view'
    },
    {
      nameEn: 'Workforce Calendar',
      nameHe: 'יומן סד"כ',
      path: '/workforce/calendar',
      icon: Calendar,
      permission: 'schedule.view'
    },
    {
      nameEn: 'Notifications',
      nameHe: 'התראות',
      path: '/notifications',
      icon: Bell,
      permission: 'notifications.view'
    },
    {
      nameEn: 'Settings',
      nameHe: 'הגדרות',
      path: '/settings',
      icon: Settings,
      permission: 'view_settings'
    }
  ];

  const adminItems: SidebarItem[] = [
    {
      nameEn: 'System Settings',
      nameHe: 'הגדרות מערכת',
      path: '/admin/settings',
      icon: Wrench,
      permission: 'system.settings.view'
    },
    {
      nameEn: 'Audit Center',
      nameHe: 'מרכז ביקורת',
      path: '/admin/audit',
      icon: Shield,
      permission: 'audit.view'
    },
    {
      nameEn: 'Business Rules',
      nameHe: 'כללי עסקים',
      path: '/admin/business-rules',
      icon: BookOpen,
      permission: 'business_rules.view'
    },
    {
      nameEn: 'Automation',
      nameHe: 'אוטומציה',
      path: '/admin/automation',
      icon: Zap,
      permission: 'automation.view'
    },
    {
      nameEn: 'Notif. Templates',
      nameHe: 'תבניות הודעות',
      path: '/admin/notification-templates',
      icon: MessageSquare,
      permission: 'notification_templates.view'
    },
    {
      nameEn: 'System Health',
      nameHe: 'מצב מערכת',
      path: '/admin/system-health',
      icon: HeartPulse,
      permission: 'system_health.view'
    }
  ];

  const visibleAdminItems = adminItems.filter(item => !item.permission || hasPermission(item.permission));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Animation configurations
  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 72 }
  };

  return (
    <motion.aside
      initial={sidebarCollapsed ? 'collapsed' : 'expanded'}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 shadow-xl overflow-x-hidden relative"
    >
      {/* Brand logo container */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-650 text-white font-bold shadow-md shadow-brand-500/10">
            <Shield className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-heading text-lg font-bold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent"
            >
              Pikud360
            </motion.span>
          )}
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-450 hover:text-white transition-colors cursor-pointer"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Main Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          // Check permissions if specified
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          const label = language === 'he' ? item.nameHe : item.nameEn;
          const hasChildren = item.children && item.children.length > 0;

          if (hasChildren) {
            return (
              <div key={item.path} className="space-y-1">
                <button
                  onClick={() => setOrgOpen(!orgOpen)}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer text-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && <span>{label}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${orgOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
                
                {/* Collapsible children links */}
                {orgOpen && !sidebarCollapsed && (
                  <div className="pl-6 space-y-1">
                    {item.children?.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                            isActive 
                              ? 'bg-slate-805 text-white' 
                              : 'text-slate-450 hover:text-white hover:bg-slate-800/50'
                          }`
                        }
                      >
                        <sub.icon className="h-4 w-4" />
                        <span>{language === 'he' ? sub.nameHe : sub.nameEn}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Administration Section */}
      {visibleAdminItems.length > 0 && (
        <>
          <div className="px-3 pb-1">
            <div className="border-t border-slate-800" />
            {!sidebarCollapsed && (
              <p className="text-2xs text-slate-600 uppercase tracking-widest font-medium px-1 pt-3 pb-1">
                {language === 'he' ? 'ניהול' : 'Administration'}
              </p>
            )}
          </div>
          <nav className="px-3 pb-2 space-y-1">
            {visibleAdminItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-700 text-white shadow-md'
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                    {language === 'he' ? item.nameHe : item.nameEn}
                  </motion.span>
                )}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* User profile footer section */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-2 py-1 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-sm">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-2xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        
        {/* Logout action */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span>{language === 'he' ? 'התנתקות' : 'Logout'}</span>}
        </button>
      </div>

    </motion.aside>
  );
}
