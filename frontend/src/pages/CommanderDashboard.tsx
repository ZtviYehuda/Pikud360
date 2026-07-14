import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import { schedulingService } from '../services/schedulingService';
import { analyticsService, SummaryData, AlertData, DistributionItem } from '../services/analyticsService';
import { Users, CheckCircle, Clock, Activity, AlertTriangle, TrendingUp, GitFork, ShieldAlert, PlusCircle } from 'lucide-react';
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

export default function CommanderDashboard() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission('dashboard.view')) {
    return <Unauthorized />;
  }

  const [selectedUnitId, setSelectedUnitId] = useState(() =>
    localStorage.getItem('pikud360_dashboard_unit_id') || 'unit-uuid-555'
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    localStorage.getItem('pikud360_dashboard_date') || new Date().toISOString().split('T')[0]
  );
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(() =>
    (localStorage.getItem('pikud360_dashboard_period') as any) || 'daily'
  );

  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[] | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('pikud360_dashboard_unit_id', selectedUnitId); }, [selectedUnitId]);
  useEffect(() => { localStorage.setItem('pikud360_dashboard_date', selectedDate); }, [selectedDate]);
  useEffect(() => { localStorage.setItem('pikud360_dashboard_period', period); }, [period]);

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
      setLastUpdated(new Date().toLocaleTimeString('he-IL'));
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

  return (
    <div className="space-y-6">
      <DashboardHeader
        orgTree={orgTree}
        selectedUnitId={selectedUnitId}
        selectedDate={selectedDate}
        onUnitChange={setSelectedUnitId}
        onDateChange={setSelectedDate}
        onRefresh={loadDashboardData}
        loading={loading}
        lastUpdated={lastUpdated}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard icon={Users} title={t('dashboard:total_strength')} value={summary.total_personnel} />
            <KpiCard icon={CheckCircle} title={t('dashboard:assigned')} value={summary.assigned} percentage={summary.assigned_percentage} />
            <KpiCard icon={Clock} title={t('dashboard:unassigned')} value={summary.unassigned} percentage={summary.unassigned_percentage} />
            <KpiCard icon={Activity} title={t('dashboard:available')} value={summary.available} percentage={summary.availability_percentage} />
            <KpiCard icon={AlertTriangle} title={t('dashboard:sick')} value={getStatusCount('SICK')} />
            <KpiCard icon={TrendingUp} title={t('dashboard:training')} value={getStatusCount('TRAINING')} />
            <KpiCard icon={GitFork} title={t('dashboard:mission')} value={getStatusCount('MISSION')} />
            <KpiCard icon={PlusCircle} title={t('dashboard:reinforcement')} value={getStatusCount('REINFORCEMENT')} />
          </div>

          <PersonnelTrendChart data={trends} loading={loading} period={period} onPeriodChange={setPeriod} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusDistributionPieChart data={distribution} loading={loading} />
            <OrganizationHeatMap childUnits={summary.child_units} loading={loading} />
          </div>

          <DailyStatusBarChart childUnits={summary.child_units} loading={loading} />

          <AlertPanel alerts={alerts} />
        </div>
      )}
    </div>
  );
}
