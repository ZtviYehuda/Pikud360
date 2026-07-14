import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { schedulingService } from '../services/schedulingService';
import { analyticsService, SummaryData, AlertData, DistributionItem } from '../services/analyticsService';
import { 
  Users, CheckCircle, Clock, Activity, AlertTriangle, TrendingUp, GitFork, ShieldAlert, PlusCircle
} from 'lucide-react';
import Unauthorized from './Unauthorized';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KpiCard from '../components/dashboard/KpiCard';
import AlertPanel from '../components/dashboard/AlertPanel';
import LoadingSkeleton from '../components/dashboard/LoadingSkeleton';
import EmptyState from '../components/dashboard/EmptyState';

// Charts
import PersonnelTrendChart from '../components/dashboard/charts/PersonnelTrendChart';
import StatusDistributionPieChart from '../components/dashboard/charts/StatusDistributionPieChart';
import OrganizationHeatMap from '../components/dashboard/charts/OrganizationHeatMap';
import DailyStatusBarChart from '../components/dashboard/charts/DailyStatusBarChart';

export default function CommanderDashboard() {
  const { direction } = useUIStore();
  const { hasPermission } = useAuthStore();
  const isRTL = direction === 'rtl';

  if (!hasPermission('dashboard.view')) {
    return <Unauthorized />;
  }

  // Persist selected organization unit
  const [selectedUnitId, setSelectedUnitId] = useState(() => {
    return localStorage.getItem('pikud360_dashboard_unit_id') || 'unit-uuid-555';
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem('pikud360_dashboard_date') || new Date().toISOString().split('T')[0];
  });

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(() => {
    return (localStorage.getItem('pikud360_dashboard_period') as any) || 'daily';
  });

  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[] | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Persist values in localStorage
  useEffect(() => {
    localStorage.setItem('pikud360_dashboard_unit_id', selectedUnitId);
  }, [selectedUnitId]);

  useEffect(() => {
    localStorage.setItem('pikud360_dashboard_date', selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem('pikud360_dashboard_period', period);
  }, [period]);

  // Load hierarchy tree once
  useEffect(() => {
    let active = true;
    const fetchTree = async () => {
      try {
        const treeData = await schedulingService.getOrganizationTree();
        if (active) setOrgTree(treeData);
      } catch (err) {
        if (active) {
          setOrgTree([
            {
              id: 'unit-uuid-555',
              name: isRTL ? 'מפקדת חטיבה' : 'Brigade HQ',
              code: 'BRIG_HQ',
              children: [
                { id: 'unit-uuid-666', name: isRTL ? 'פלוגה א' : 'Company A', code: 'CO_A', children: [] },
                { id: 'unit-uuid-777', name: isRTL ? 'פלוגה ב' : 'Company B', code: 'CO_B', children: [] }
              ]
            }
          ]);
        }
      }
    };
    fetchTree();
    return () => { active = false; };
  }, [isRTL]);

  // Load summary, alerts, trends, and distribution metrics
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
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(isRTL ? 'שגיאה בטעינת נתוני המערכת' : 'Error loading dashboard metrics');
      setSummary(null);
      setAlerts(null);
      setTrends(null);
      setDistribution(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedUnitId, selectedDate, period]);

  // Helper to extract status count from distribution robustly
  const getStatusCount = (statusKey: string): number => {
    if (!summary || !summary.status_distribution) return 0;
    if (Array.isArray(summary.status_distribution)) {
      const item = summary.status_distribution.find(
        (d: any) => d.status.toUpperCase() === statusKey.toUpperCase()
      );
      return item ? item.count : 0;
    }
    const distRecord = summary.status_distribution as Record<string, number>;
    return distRecord[statusKey.toUpperCase()] || 0;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Header component */}
      <DashboardHeader
        orgTree={orgTree}
        selectedUnitId={selectedUnitId}
        selectedDate={selectedDate}
        onUnitChange={setSelectedUnitId}
        onDateChange={setSelectedDate}
        onRefresh={loadDashboardData}
        loading={loading}
        lastUpdated={lastUpdated}
        isRTL={isRTL}
      />

      {/* 2. Loading state */}
      {loading && !summary && <LoadingSkeleton />}

      {/* 3. Error state */}
      {!loading && error && (
        <EmptyState
          icon={ShieldAlert}
          title={isRTL ? 'שגיאה בטעינת המידע' : 'Failed to load Dashboard'}
          description={error}
          actionLabel={isRTL ? 'נסה שוב' : 'Try Again'}
          onAction={loadDashboardData}
        />
      )}

      {/* 4. Empty/Null summary state */}
      {!loading && !error && !summary && (
        <EmptyState
          title={isRTL ? 'אין מידע זמין' : 'No summary data available'}
          description={isRTL ? 'לא נמצא מידע עבור היחידה והתאריך שנבחרו.' : 'Please select another unit or date scope.'}
          actionLabel={isRTL ? 'טען מחדש' : 'Reload'}
          onAction={loadDashboardData}
        />
      )}

      {/* 5. Main Dashboard Content */}
      {!loading && summary && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Users}
              title={isRTL ? 'סך הכל כוח אדם' : 'Total Personnel'}
              value={summary.total_personnel}
            />
            <KpiCard
              icon={CheckCircle}
              title={isRTL ? 'משובצים' : 'Assigned'}
              value={summary.assigned}
              percentage={summary.assigned_percentage}
            />
            <KpiCard
              icon={Clock}
              title={isRTL ? 'לא משובצים' : 'Unassigned'}
              value={summary.unassigned}
              percentage={summary.unassigned_percentage}
            />
            <KpiCard
              icon={Activity}
              title={isRTL ? 'זמינים' : 'Available'}
              value={summary.available}
              percentage={summary.availability_percentage}
            />
            <KpiCard
              icon={AlertTriangle}
              title={isRTL ? 'חולים' : 'Sick'}
              value={getStatusCount('SICK')}
            />
            <KpiCard
              icon={TrendingUp}
              title={isRTL ? 'באימון / קורס' : 'Training'}
              value={getStatusCount('TRAINING')}
            />
            <KpiCard
              icon={GitFork}
              title={isRTL ? 'במשימה' : 'Mission'}
              value={getStatusCount('MISSION')}
            />
            <KpiCard
              icon={PlusCircle}
              title={isRTL ? 'תגבורת' : 'Reinforcement'}
              value={getStatusCount('REINFORCEMENT')}
            />
          </div>

          {/* Trend Chart Area */}
          <PersonnelTrendChart
            data={trends}
            loading={loading}
            period={period}
            onPeriodChange={setPeriod}
            isRTL={isRTL}
          />

          {/* Pie + Heat Map Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusDistributionPieChart
              data={distribution}
              loading={loading}
              isRTL={isRTL}
            />
            <OrganizationHeatMap
              childUnits={summary.child_units}
              loading={loading}
              isRTL={isRTL}
            />
          </div>

          {/* Stacked Status Bar Chart */}
          <DailyStatusBarChart
            childUnits={summary.child_units}
            loading={loading}
            isRTL={isRTL}
          />

          {/* Alerts panel */}
          <div>
            <AlertPanel
              alerts={alerts}
              isRTL={isRTL}
            />
          </div>
        </div>
      )}
    </div>
  );
}
