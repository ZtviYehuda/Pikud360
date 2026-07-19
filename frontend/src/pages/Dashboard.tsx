import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useGetHealth } from '../services/healthService';
import { useTranslation } from 'react-i18next';
import { Users, Clock, CalendarDays, AlertCircle, Database, Server } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/ui/spinner';
import PersonnelTrendChart from '../components/dashboard/charts/PersonnelTrendChart';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Live health query check to demonstrate React Query connection
  const { data: healthData, isLoading: isHealthLoading } = useGetHealth();

  const mockTrendData = [
    { date: '01/07', total_personnel: 1200, assigned: 950, unassigned: 250, available: 850, unavailable: 350, readiness_percentage: 90 },
    { date: '02/07', total_personnel: 1210, assigned: 980, unassigned: 230, available: 900, unavailable: 310, readiness_percentage: 92 },
    { date: '03/07', total_personnel: 1220, assigned: 1010, unassigned: 210, available: 940, unavailable: 280, readiness_percentage: 94 },
    { date: '04/07', total_personnel: 1230, assigned: 1050, unassigned: 180, available: 980, unavailable: 250, readiness_percentage: 96 },
    { date: '05/07', total_personnel: 1248, assigned: 1100, unassigned: 148, available: 1040, unavailable: 208, readiness_percentage: 98 }
  ];

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
          description={t('dashboard:total_strength_desc') || "משקף את סך כוח האדם הפעיל ביחידה"}
        />
        <KpiCard
          icon={Clock}
          title={t('scheduling:title')}
          value="94.2%"
          description={t('scheduling:utilization_desc') || "עמידה ביעדי השיבוצים והמשמרות החודשיים"}
        />
        <KpiCard
          icon={CalendarDays}
          title={t('dashboard:active_shifts')}
          value="98.5%"
          description={t('dashboard:active_shifts_desc') || "אחוז המשרתים המשובצים בפועל היום"}
        />
        <KpiCard
          icon={AlertCircle}
          title={t('dashboard:shortage_index')}
          value="3"
          description={t('dashboard:shortage_index_desc') || "מדד חוסר יחסי (רמת סיכון נמוכה)"}
        />
      </div>

      {/* Grid: Charts & Backend Health Integration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Mock Analytics Panel - rendered as live PersonnelTrendChart */}
        <div className="lg:col-span-2">
          <PersonnelTrendChart
            data={mockTrendData}
            loading={false}
            error={null}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

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
                <span className="text-slate-500 font-semibold">{t('dashboard:frontend_client')}</span>
                <Badge variant="success">
                  {t('dashboard:online')}
                </Badge>
              </div>
              
              {/* Backend API status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{t('dashboard:backend_server')}</span>
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
                <span className="text-slate-500 font-semibold flex items-center gap-1">
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

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6 text-2xs text-slate-400 font-medium">
            {t('dashboard:connection_info')}
          </div>
        </Card>
      </div>
    </div>
  );
}
