import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, type SystemHealth } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Activity, Database, Server, Users, FileText, AlertTriangle, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const STATUS_CONFIG = {
  healthy:     { color: 'text-emerald-500 dark:text-emerald-400', badgeVariant: 'success' as const, icon: CheckCircle },
  degraded:    { color: 'text-amber-500 dark:text-amber-400',   badgeVariant: 'warning' as const, icon: AlertCircle },
  unavailable: { color: 'text-red-500 dark:text-red-400',     badgeVariant: 'destructive' as const, icon: XCircle },
};

function HealthCard({ title, value, sub, icon: Icon, status }: any) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.healthy;
  const StatusIcon = cfg.icon;
  return (
    <Card className="p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
          <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </div>
        <Badge variant={cfg.badgeVariant} className="gap-1 px-2.5 py-0.5">
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{status}</span>
        </Badge>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

export default function SystemHealth() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation('admin');

  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  if (!hasPermission('system_health.view')) return <Unauthorized />;

  const fetchHealth = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await adminService.getSystemHealth();
      setHealth(data);
      setCheckedAt(new Date());
    } catch (err) {
      console.error('Failed to load system health', err);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 60_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const dbStatus = health?.database ?? 'unavailable';
  const apiStatus = health?.api ?? 'unavailable';
  const hasErrors = (health?.recent_errors ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-105 dark:border-slate-800">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-cyan-500" />
            {t('health_title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            {checkedAt
              ? `${t('updated')}: ${checkedAt.toLocaleTimeString('he-IL')}`
              : t('loading')}
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => fetchHealth(true)} 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* Health Cards */}
      <div>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Status Banner */}
            {hasErrors && (
              <div className="mb-6 flex items-center gap-3 px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-650 dark:text-red-400 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {t('recent_errors_banner', { count: health?.recent_errors })}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <HealthCard
                title={t('database')}
                value={dbStatus.toUpperCase()} sub={t('db_sub')}
                icon={Database} status={dbStatus}
              />
              <HealthCard
                title={t('api_server')}
                value={apiStatus.toUpperCase()} sub={t('api_sub')}
                icon={Server} status={apiStatus}
              />
              <HealthCard
                title={t('active_sessions')}
                value={health?.active_sessions ?? 0} sub={t('sessions_sub')}
                icon={Users} status="healthy"
              />
              <HealthCard
                title={t('audit_volume')}
                value={(health?.audit_volume_24h ?? 0).toLocaleString()} sub={t('audit_sub')}
                icon={FileText} status="healthy"
              />
              <HealthCard
                title={t('recent_errors')}
                value={health?.recent_errors ?? 0} sub={t('errors_sub')}
                icon={AlertTriangle} status={hasErrors ? 'degraded' : 'healthy'}
              />
              <HealthCard
                title={t('notification_engine')}
                value="IN-APP" sub={t('engine_sub')}
                icon={Activity} status="healthy"
              />
            </div>

            {/* Health Legend */}
            <Card className="mt-8 p-4 flex flex-wrap items-center gap-6 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">{t('legend')}</span>
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const SIcon = cfg.icon;
                return (
                  <span key={status} className={`flex items-center gap-1.5 ${cfg.color} font-semibold`}>
                    <SIcon className="h-3.5 w-3.5" /> {status}
                  </span>
                );
              })}
              <span className="mr-auto text-slate-400 font-medium">{t('auto_refresh')}</span>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
