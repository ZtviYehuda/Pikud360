import { useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, Bell, Sun, Moon, 
  ChevronDown, LogOut, Settings, Menu, CheckSquare, Globe, Sparkles
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from './ui/dropdown-menu';

interface TopbarNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  isRead: boolean;
}

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, toggleMobileSidebar, setSearchOpen, language, setLanguage, direction } = useUIStore();
  const { user, logout } = useAuthStore();

  const isRtl = direction === 'rtl';

  // State-driven Notifications
  const [notifications, setNotifications] = useState<TopbarNotification[]>([
    { id: '1', title: 'מצבת בוקר חסרה', message: 'לא הוזנה מצבת בוקר בפלוגה מסייעת', category: 'שלישות', isRead: false },
    { id: '2', title: 'בקשת מעבר מאושרת', message: 'סרן נועה כהן אושרה למעבר לפלוגת מפקדה', category: 'שיוכים', isRead: false },
    { id: '3', title: 'עדכון תפעולי', message: 'נוספו סלוטים דינמיים למעטפת הארגונית', category: 'מערכת', isRead: true },
  ]);

  // State-driven Checklist Tasks
  const [tasks, setTasks] = useState([
    { id: 't1', label: 'חתימה על דוח מצבת גדוד יומי', done: false },
    { id: 't2', label: 'אישור סידור עבודה שבועי - מפקדה', done: true },
    { id: 't3', label: 'רענון רשיונות חובשים פלוגתיים', done: false },
  ]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const nextLang = language === 'he' ? 'en' : 'he';
    setLanguage(nextLang);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Toggle notification item read state
  const toggleNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  // Toggle task done status
  const toggleTaskDone = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  // Helper to generate readable Breadcrumb segments
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'דף הבית', path: '/dashboard' }];

    const dictionary: Record<string, string> = {
      dashboard: 'לוח בקרה',
      employees: 'חיילים ועובדים',
      organization: 'מבנה ארגוני',
      reports: 'דוחות שלישות',
      notifications: 'התראות מערכת',
      transfers: 'סבבי מעבר',
      workforce: 'ניהול כוח אדם',
      scheduling: 'סידור עבודה',
      settings: 'הגדרות משתמש',
      statuses: 'סטטוסי הגשה',
      calendar: 'לוח שנה שבועי',
    };

    let currentPath = '';
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      if (dictionary[segment]) {
        breadcrumbs.push({
          label: dictionary[segment],
          path: currentPath
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbsList = getBreadcrumbs();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const pendingTasksCount = tasks.filter(t => !t.done).length;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white px-4 md:px-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 z-30 select-none transition-colors duration-200">
      
      {/* RIGHT SECTION: BREADCRUMBS & CONTEXT */}
      <div className="flex items-center gap-3">
        {/* Mobile sidebar menu trigger */}
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-850 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white transition-colors cursor-pointer md:hidden"
          title="תפריט ניווט"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Location Breadcrumbs */}
        <div className="hidden sm:flex flex-col text-right leading-none">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
            {breadcrumbsList.map((item, idx) => (
              <div key={item.path} className="flex items-center gap-1">
                {idx > 0 && <span>&gt;</span>}
                <Link to={item.path} className="hover:text-cyan-600 transition-colors">
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
          <span className="font-heading text-sm font-bold text-slate-900 dark:text-white mt-1">
            {breadcrumbsList[breadcrumbsList.length - 1]?.label || 'דף הבית'}
          </span>
        </div>
      </div>

      {/* CENTER SECTION: GLOBAL SEARCH BUTTON WITH SHORTCUT */}
      <div className="flex items-center justify-center flex-1 max-w-sm px-4">
        <button
          onClick={() => setSearchOpen(true)}
          className="relative w-full flex items-center text-slate-450 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-950/20 transition-all cursor-pointer justify-between focus:outline-none focus:ring-2 focus:ring-cyan-550/40"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="font-medium">חיש גלובלי...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200/50 bg-white px-1.5 font-mono text-[9px] font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* LEFT SECTION: CONTROLS & PROFILE BADGE */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Quick Actions command trigger menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 h-8.5 text-xs font-bold rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-550/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">פעולות מהירות</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-lg p-1.5">
            <DropdownMenuItem onClick={() => navigate('/employees')} className="text-xs font-bold p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-slate-700 dark:text-slate-350">
              הוסף חייל / עובד
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/workforce/scheduling')} className="text-xs font-bold p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-slate-700 dark:text-slate-350">
              צור סידור עבודה
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/reports')} className="text-xs font-bold p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-slate-700 dark:text-slate-350">
              הפק דוח חדש
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Global Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-lg text-slate-550 hover:bg-slate-50 hover:text-slate-850 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white transition-colors cursor-pointer relative"
          title={isRtl ? 'Switch to English' : 'מעבר לעברית'}
        >
          <Globe className="h-4.5 w-4.5" />
        </button>

        {/* Toggle Light/Dark Mode */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-555 hover:bg-slate-50 hover:text-slate-850 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white transition-colors cursor-pointer"
          title={theme === 'dark' ? "מצב יום" : "מצב לילה"}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
        </button>

        {/* Tasks Checklist Popover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg text-slate-550 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white transition-colors relative cursor-pointer" title="משימות ומטלות">
              <CheckSquare className="h-4.5 w-4.5" />
              {pendingTasksCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-600 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {pendingTasksCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-slate-850 dark:text-white">משימות ומטלות מפקד</span>
              <span className="text-[10px] text-slate-400 font-semibold">{pendingTasksCount} משימות לביצוע</span>
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2.5 p-1 text-right">
                  <input 
                    type="checkbox" 
                    checked={task.done} 
                    onChange={() => toggleTaskDone(task.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-800 text-cyan-600 focus:ring-cyan-500/40 cursor-pointer"
                  />
                  <span className={`text-xs font-semibold ${task.done ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-350'}`}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Dropdown Inbox */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg text-slate-550 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white transition-colors relative cursor-pointer animate-none" title="התראות והודעות">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              <span className="text-xs font-bold text-slate-850 dark:text-white">מרכז התראות שלישות</span>
              <div className="flex gap-2">
                <button onClick={markAllAsRead} className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer">
                  קרא הכל
                </button>
                <span className="text-slate-300">|</span>
                <button onClick={clearAllNotifications} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer">
                  נקה הכל
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-600 font-semibold">
                  אין התראות חדשות
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => toggleNotificationRead(notif.id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer text-right ${
                      notif.isRead 
                        ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850/20 opacity-60' 
                        : 'bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-500/10 dark:border-cyan-500/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-850 dark:text-white">{notif.title}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-500">{notif.category}</span>
                    </div>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium leading-normal">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile dropdown menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 outline-none transition-colors cursor-pointer select-none">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-650 dark:text-cyan-400 font-bold flex items-center justify-center text-xs border border-cyan-200/50 dark:border-cyan-800/30">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="text-right hidden md:block leading-tight">
                  <p className="text-xs font-bold text-slate-850 dark:text-white">{user.name}</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">מפקד גדוד 51</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl shadow-lg p-1.5">
              <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5 text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1.5 truncate">{user.email}</p>
              </div>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-xs font-bold p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-slate-700 dark:text-slate-350">
                <Settings className="h-4 w-4 ml-2 shrink-0 inline text-slate-450" />
                הגדרות משתמש
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
              <DropdownMenuItem onClick={handleLogout} className="text-xs font-bold p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg cursor-pointer">
                <LogOut className="h-4 w-4 ml-2 shrink-0 inline text-red-500" />
                התנתק מהמערכת
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
