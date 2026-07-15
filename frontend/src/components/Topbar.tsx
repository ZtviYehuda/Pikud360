import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, Bell, Sun, Moon, 
  ChevronDown, User, LogOut, Settings, Menu
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from './ui/dropdown-menu';


export default function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme, toggleMobileSidebar, setSearchOpen } = useUIStore();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/60 bg-white px-4 md:px-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 z-30">
      
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer md:hidden"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search trigger button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="relative w-64 max-w-xs hidden sm:flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900/35 transition-colors cursor-pointer justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>{t('employees:search_placeholder')}</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-bold text-slate-450 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Action triggers group */}
      <div className="flex items-center gap-3">
        
        {/* Mobile Search Button Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer sm:hidden"
          title="Search"
        >
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Toggle Light/Dark Mode Option */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-yellow-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
        </button>

        {/* Notification Bell */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors relative cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* User Profile dropdown menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 outline-none transition-colors cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-xs">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{user.name}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              sideOffset={5}
              className="min-w-44"
            >
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="h-4 w-4 mr-2" />
                <span>{t('common:profile')}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                <span>{t('common:settings')}</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-rose-600 hover:bg-rose-50 dark:text-rose-450 dark:hover:bg-rose-950/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>{t('common:logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

      </div>
    </header>
  );
}
