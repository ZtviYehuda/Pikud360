import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useGetHealth } from '../services/healthService';
import { useTranslation } from 'react-i18next';
import { Users, Clock, CalendarDays, BarChart3, AlertCircle, Database, Server } from 'lucide-react';

export default function Dashboard() {
  const { direction } = useUIStore();
  const user = useAuthStore((state) => state.user);
  const isRTL = direction === 'rtl';
  const { t } = useTranslation();

  // Live health query check to demonstrate React Query connection
  const { data: healthData, isLoading: isHealthLoading } = useGetHealth();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
          {t('dashboard:title')} - {user?.name || t('common:profile')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('dashboard:desc')}
        </p>
      </div>

      {/* Grid: WFM Metrics Placeholder */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Metric 1 */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 card-hover glassmorphism flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {t('dashboard:total_strength')}
            </p>
            <h4 className="font-heading text-2xl font-bold text-slate-800 dark:text-white mt-1">1,248</h4>
            <span className="text-xs text-green-500 font-semibold mt-2 inline-block">↑ +12% {isRTL ? 'החודש' : 'this month'}</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-brand-50 text-brand-650 flex items-center justify-center dark:bg-brand-950/30 dark:text-brand-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 card-hover glassmorphism flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {t('scheduling:title')}
            </p>
            <h4 className="font-heading text-2xl font-bold text-slate-800 dark:text-white mt-1">94.2%</h4>
            <span className="text-xs text-slate-555 font-semibold mt-2 inline-block">1,176 {t('dashboard:assigned')}</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-green-50 text-green-650 flex items-center justify-center dark:bg-green-950/30 dark:text-green-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 card-hover glassmorphism flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {t('dashboard:active_shifts')}
            </p>
            <h4 className="font-heading text-2xl font-bold text-slate-800 dark:text-white mt-1">98.5%</h4>
            <span className="text-xs text-green-500 font-semibold mt-2 inline-block">✓ {isRTL ? 'תקין' : 'Optimized'}</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center dark:bg-indigo-950/30 dark:text-indigo-400">
            <CalendarDays className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 card-hover glassmorphism flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {t('dashboard:shortage_index')}
            </p>
            <h4 className="font-heading text-2xl font-bold text-slate-800 dark:text-white mt-1">3</h4>
            <span className="text-xs text-red-500 font-semibold mt-2 inline-block">⚠ {isRTL ? 'דורש טיפול' : 'Requires review'}</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-red-50 text-red-650 flex items-center justify-center dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Grid: Charts & Backend Health Integration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Mock Analytics Panel */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 shadow-sm glassmorphism">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              {isRTL ? 'מגמות שיבוץ שבועיות' : 'Weekly Assignment Trends'}
            </h3>
          </div>
          
          {/* Mock chart layout structure */}
          <div className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <p className="text-slate-400 text-sm">
              {isRTL ? 'תרשים מגמות שיבוץ - placeholder' : 'Manpower Planning Chart - Placeholder'}
            </p>
          </div>
        </div>

        {/* Live System Integration Panel */}
        <div className="rounded-xl bg-white p-6 border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 shadow-sm glassmorphism flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Server className="h-5 w-5 text-emerald-600" />
              {isRTL ? 'חיבור לשרתים בזמן אמת' : 'Real-time System Status'}
            </h3>
            
            <div className="space-y-4">
              {/* Web Client */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-555 font-medium">{isRTL ? 'לקוח פרונטנד' : 'Frontend Client'}</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                  Online
                </span>
              </div>
              
              {/* Backend API status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-555 font-medium">{isRTL ? 'שרת בקאנד' : 'Backend Server'}</span>
                {isHealthLoading ? (
                  <span className="text-xs text-slate-400 animate-pulse">Checking...</span>
                ) : healthData?.success ? (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                    Healthy (v1)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-750 dark:bg-red-950/20 dark:text-red-400">
                    Offline
                  </span>
                )}
              </div>

              {/* PostgreSQL status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-555 font-medium flex items-center gap-1">
                  <Database className="h-3.5 w-3.5" />
                  {isRTL ? 'בסיס נתונים' : 'Database'}
                </span>
                {isHealthLoading ? (
                  <span className="text-xs text-slate-400 animate-pulse">Checking...</span>
                ) : healthData?.data?.database === 'connected' ? (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-750 dark:bg-red-950/20 dark:text-red-400">
                    Disconnected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 text-xs text-slate-400">
            {isRTL 
              ? 'לוח הבקרה מאמת את החיבורים לבקאנד באמצעות TanStack Query.'
              : 'Dashboard validates backend hooks automatically using TanStack Query.'}
          </div>
        </div>

      </div>
    </div>
  );
}
