import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Sun, Moon, Languages, 
  ChevronDown, User, LogOut, Settings 
} from 'lucide-react';

export default function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme, language, setLanguage, direction } = useUIStore();
  const { user, logout } = useAuthStore();
  const isRTL = direction === 'rtl';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white px-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 glassmorphism z-30">
      
      {/* Search Input Box */}
      <div className="relative w-64 max-w-xs hidden sm:block">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={isRTL ? 'חיפוש מהיר...' : 'Quick search...'}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
      </div>
      <div className="sm:hidden"></div> {/* Spacer for mobile layout */}

      {/* Action triggers group */}
      <div className="flex items-center gap-3">
        
        {/* Toggle Language Option */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-55 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          title="Toggle Language"
        >
          <Languages className="h-4.5 w-4.5" />
        </button>

        {/* Toggle Light/Dark Mode Option */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-55 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-yellow-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
        </button>

        {/* Notification Bell */}
        <button
          className="p-2 rounded-lg text-slate-505 hover:bg-slate-55 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors relative cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* User Profile dropdown menu using Radix UI primitives */}
        {user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 outline-none transition-colors cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-650 dark:text-brand-405 font-bold flex items-center justify-center text-xs">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{user.name}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-44 rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-950 z-40"
                align={isRTL ? 'start' : 'end'}
                sideOffset={5}
              >
                <DropdownMenu.Item 
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg outline-none cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>{isRTL ? 'הפרופיל שלי' : 'My Profile'}</span>
                </DropdownMenu.Item>
                
                <DropdownMenu.Item 
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg outline-none cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>{isRTL ? 'הגדרות' : 'Settings'}</span>
                </DropdownMenu.Item>
                
                <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-850 my-1" />
                
                <DropdownMenu.Item 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-red-650 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-lg outline-none cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isRTL ? 'התנתקות' : 'Logout'}</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}

      </div>
    </header>
  );
}
