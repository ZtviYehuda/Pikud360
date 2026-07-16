import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useTranslation } from 'react-i18next';
import { schedulingService } from '../services/schedulingService';
import { analyticsService, SummaryData, AlertData, DistributionItem } from '../services/analyticsService';
import { 
  Users, CheckCircle, Clock, Activity, AlertTriangle, 
  ShieldAlert, Calendar 
} from 'lucide-react';
import Unauthorized from './Unauthorized';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KpiCard from '../components/dashboard/KpiCard';
import AlertPanel from '../components/dashboard/AlertPanel';
import LoadingSkeleton from '../components/dashboard/LoadingSkeleton';
import EmptyState from '../components/dashboard/EmptyState';
import PersonnelTrendChart from '../components/dashboard/charts/PersonnelTrendChart';
import StatusDistributionPieChart from '../components/dashboard/charts/StatusDistributionPieChart';
import OrganizationHeatMap from '../components/dashboard/charts/OrganizationHeatMap';
import DailyStatusBarChart from '../components/dashboard/charts/DailyStatusBarChart';
import WorkforceOverview from '../components/dashboard/WorkforceOverview';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { OrganizationUnit } from '../types';
import { CommanderWorkspaceProvider, useCommanderWorkspace } from '../features/commander/context/CommanderWorkspaceContext';

export default function CommanderDashboard() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('dashboard.view')) {
    return <Unauthorized />;
  }

  const [orgTree, setOrgTree] = useState<OrganizationUnit[]>([]);

  useEffect(() => {
    let active = true;
    schedulingService.getOrganizationTree()
      .then(data => { if (active) setOrgTree(data); })
      .catch(() => {
        if (active) setOrgTree([{
          id: 'unit-uuid-555', name: t('common:app_name'), code: 'BRIG_HQ',
          children: [
            { id: 'unit-uuid-666', name: t('common:organization'), code: 'CO_A', children: [] },
            { id: 'unit-uuid-777', name: t('common:organization'), code: 'CO_B', children: [] }
          ]
        }]);
      });
    return () => { active = false; };
  }, [t]);

  return (
    <CommanderWorkspaceProvider orgTree={orgTree}>
      <CommanderDashboardContent />
    </CommanderWorkspaceProvider>
  );
}

function CommanderDashboardContent() {
  const { selectedUnitId } = useCommanderWorkspace();
  const { direction } = useUIStore();
  const { t } = useTranslation();

  const [selectedDate, setSelectedDate] = useState(() =>
    localStorage.getItem('pikud360_dashboard_date') || new Date().toISOString().split('T')[0]
  );
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(() =>
    (localStorage.getItem('pikud360_dashboard_period') as any) || 'daily'
  );

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[] | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('pikud360_dashboard_date', selectedDate); }, [selectedDate]);
  useEffect(() => { localStorage.setItem('pikud360_dashboard_period', period); }, [period]);

  const loadDashboardData = async () => {
    if (!selectedUnitId) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryData, alertsData, trendsData, distData] = await Promise.all([
        analyticsService.getSummary(selectedUnitId, selectedDate, selectedDate),
        analyticsService.getAlerts(selectedUnitId, selectedDate),
        analyticsService.getTrends(selectedUnitId, undefined, undefined, period),
        analyticsService.getDistribution(selectedUnitId, selectedDate, selectedDate)
      ]);
      setSummary(summaryData);
      setAlerts(alertsData);
      setTrends(trendsData);
      setDistribution(distData);
    } catch {
      setError(t('validation:network_error'));
      setSummary(null); setAlerts(null); setTrends(null); setDistribution(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, [selectedUnitId, selectedDate, period]);

  const getStatusCount = (statusKey: string): number => {
    if (!summary?.status_distribution) return 0;
    if (Array.isArray(summary.status_distribution)) {
      const item = summary.status_distribution.find((d: any) => d.status.toUpperCase() === statusKey.toUpperCase());
      return item ? item.count : 0;
    }
    return (summary.status_distribution as Record<string, number>)[statusKey.toUpperCase()] || 0;
  };

  const alertsCount = alerts?.length || (summary ? summary.alerts_count : 0);

  return (
    <div className="space-y-6">
      <DashboardHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onRefresh={loadDashboardData}
        loading={loading}
        alertsCount={alertsCount}
        summary={summary}
      />

      {loading && !summary && <LoadingSkeleton />}

      {!loading && error && (
        <EmptyState icon={ShieldAlert} title={t('common:error')} description={error}
          actionLabel={t('buttons:refresh')} onAction={loadDashboardData} />
      )}

      {!loading && !error && !summary && (
        <EmptyState title={t('common:no_data')} description={t('reports:no_reports')}
          actionLabel={t('buttons:refresh')} onAction={loadDashboardData} />
      )}

      {!loading && summary && (
        <div className="space-y-6">
          {/* KPI Section - 6 cards: 2 cols on mobile, 3 on md, 6 on xl */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
            <KpiCard 
              icon={Users} 
              title={t('dashboard:active_employees')} 
              value={summary.total_personnel} 
            />
            <KpiCard 
              icon={CheckCircle} 
              title={t('dashboard:available_employees')} 
              value={summary.available} 
              percentage={summary.availability_percentage} 
            />
            <KpiCard 
              icon={Calendar} 
              title={t('dashboard:on_leave_employees')} 
              value={getStatusCount('VACATION') || getStatusCount('LEAVE') || 0} 
            />
            <KpiCard 
              icon={Activity} 
              title={t('dashboard:sick_leave_employees')} 
              value={getStatusCount('SICK')} 
            />
            <KpiCard 
              icon={Clock} 
              title={t('dashboard:unassigned_employees_kpi')} 
              value={summary.unassigned > 0 ? `${t('dashboard:state_unassigned_warning')} (${summary.unassigned})` : t('dashboard:state_assigned_success')} 
            />
            <KpiCard 
              icon={AlertTriangle} 
              title={t('dashboard:active_alerts_kpi')} 
              value={alertsCount > 0 ? `${t('dashboard:state_require_treatment')} (${alertsCount})` : t('dashboard:state_ok')} 
            />
          </div>

          {/* Main Grid: on mobile stacked (alerts first), on lg side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (2/3): second on mobile, first on lg */}
            <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
              
              <WorkforceOverview
                summary={summary}
                distribution={distribution}
                loading={loading}
                direction={direction}
              />

              {/* Workforce Analytics & Trends */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <span>{t('dashboard:analytics_trends')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard:analytics_trends_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <PersonnelTrendChart data={trends} loading={loading} period={period} onPeriodChange={setPeriod} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatusDistributionPieChart data={distribution} loading={loading} />
                    <OrganizationHeatMap childUnits={summary.child_units} loading={loading} />
                  </div>

                  <DailyStatusBarChart childUnits={summary.child_units} loading={loading} />
                </CardContent>
              </Card>

            </div>

            {/* Right Column (1/3): first on mobile (critical alerts visible), second on lg */}
            <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
              
              {/* Alerts Section (Title + AlertPanel) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <span>{t('dashboard:unit_alerts')}</span>
                </h3>
                <AlertPanel alerts={alerts} />
              </div>

              {/* Quick Actions Widget */}
              <QuickActions />

              {/* Recent Activity Widget */}
              <RecentActivity direction={direction} />

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
