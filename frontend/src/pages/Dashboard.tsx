import { useAuthStore } from '../stores/authStore';
import { useGetHealth } from '../services/healthService';
import { useTranslation } from 'react-i18next';
import { Users, Clock, CalendarDays, AlertCircle, Database, Server, BarChart3 } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/ui/spinner';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  // Live health query check to demonstrate React Query connection
  const { data: healthData, isLoading: isHealthLoading } = useGetHealth();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('dashboard:title')} - {user?.name || t('common:profile')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          {t('dashboard:desc')}
        </p>
      </div>

      {/* Grid: WFM Metrics Placeholder */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          title={t('dashboard:total_strength')}
          value="1,248"
          percentage="+12"
        />
        <KpiCard
          icon={Clock}
          title={t('scheduling:title')}
          value="94.2%"
        />
        <KpiCard
          icon={CalendarDays}
          title={t('dashboard:active_shifts')}
          value="98.5%"
        />
        <KpiCard
          icon={AlertCircle}
          title={t('dashboard:shortage_index')}
          value="3"
        />
      </div>

      {/* Grid: Charts & Backend Health Integration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mock Analytics Panel */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              {t('analytics:trends')}
            </h3>
          </div>
          
          {/* Mock chart layout structure */}
          <div className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-205 dark:border-slate-800 flex items-center justify-center">
            <p className="text-slate-450 text-xs font-semibold">
              {t('analytics:trends')}
            </p>
          </div>
        </Card>

        {/* Live System Integration Panel */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Server className="h-5 w-5 text-emerald-600" />
              {t('dashboard:utilization')}
            </h3>
            
            <div className="space-y-4">
              {/* Web Client */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-555 font-semibold">{t('dashboard:frontend_client')}</span>
                <Badge variant="success">
                  {t('dashboard:online')}
                </Badge>
              </div>
              
              {/* Backend API status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-555 font-semibold">{t('dashboard:backend_server')}</span>
                {isHealthLoading ? (
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Spinner size="sm" />
                    {t('dashboard:checking')}
                  </span>
                ) : healthData?.success ? (
                  <Badge variant="success">
                    {t('dashboard:online')}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    {t('dashboard:offline')}
                  </Badge>
                )}
              </div>

              {/* PostgreSQL status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-555 font-semibold flex items-center gap-1">
                  <Database className="h-3.5 w-3.5" />
                  {t('dashboard:database')}
                </span>
                {isHealthLoading ? (
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Spinner size="sm" />
                    {t('dashboard:checking')}
                  </span>
                ) : healthData?.data?.database === 'connected' ? (
                  <Badge variant="success">
                    {t('dashboard:online')}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    {t('dashboard:offline')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-105 dark:border-slate-800 pt-4 mt-6 text-2xs text-slate-400 font-medium">
            {t('dashboard:connection_info')}
          </div>
        </Card>
      </div>
    </div>
  );
}
