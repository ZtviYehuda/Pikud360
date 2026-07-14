import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function BaseLayout() {
  const { isAuthenticated } = useAuthStore();
  const { direction } = useUIStore();

  // Route Guard: Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-slate-50 transition-colors duration-200 dark:bg-slate-950"
      dir={direction}
    >
      {/* Sidebar - Positioned naturally based on LTR/RTL flex direction */}
      <Sidebar />

      {/* Main Content Area Container */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <Topbar />

        {/* Scrollable Workspace panel */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
