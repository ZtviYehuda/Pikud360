import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import GlobalSearch from '../components/GlobalSearch';
import { Sheet, SheetContent } from '../components/ui/sheet';

export default function BaseLayout() {
  const { isAuthenticated } = useAuthStore();
  const { direction, mobileSidebarOpen, setMobileSidebarOpen, setSidebarCollapsed } = useUIStore();

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    if (media.matches) {
      setSidebarCollapsed(true);
    }
    const listener = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [setSidebarCollapsed]);

  // Route Guard: Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-slate-50 transition-colors duration-200 dark:bg-slate-950"
      dir={direction}
    >
      {/* Permanent Sidebar (Tablet / Desktop) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar (triggered from Topbar) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent 
          side={direction === 'rtl' ? 'right' : 'left'} 
          className="p-0 bg-slate-900 border-none w-[260px]"
        >
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content Area Container */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <Topbar />

        {/* Scrollable Workspace panel */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Global Search dialog */}
      <GlobalSearch />
    </div>
  );
}
