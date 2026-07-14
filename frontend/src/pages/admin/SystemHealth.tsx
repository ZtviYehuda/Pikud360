import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import { adminService, type SystemHealth } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Activity, Database, Server, Users, FileText, AlertTriangle, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  healthy:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  degraded:    { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   icon: AlertCircle },
  unavailable: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',       icon: XCircle },
};

function HealthCard({ title, value, sub, icon: Icon, status }: any) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.healthy;
  const StatusIcon = cfg.icon;
  return (
    <div className={`bg-slate-900/60 border rounded-2xl p-6 ${cfg.bg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${cfg.bg} border`}>
          <Icon className={`h-5 w-5 ${cfg.color}`} />
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} border`}>
          <StatusIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
          <span className={cfg.color}>{status}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-slate-300 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
            <Activity className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('health_title')}</h1>
            <p className="text-sm text-slate-400">
              {checkedAt
                ? `${t('updated')}: ${checkedAt.toLocaleTimeString('he-IL')}`
                : t('loading')}
            </p>
          </div>
        </div>
        <button onClick={() => fetchHealth(true)} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* Health Cards */}
      <div className="p-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-500 border-t-transparent" /></div>
        ) : (
          <>
            {/* Status Banner */}
            {hasErrors && (
              <div className="mb-6 flex items-center gap-3 px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {t('recent_errors_banner', { count: health?.recent_errors })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">{t('legend')}</span>
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const SIcon = cfg.icon;
                return (
                  <span key={status} className={`flex items-center gap-1.5 ${cfg.color}`}>
                    <SIcon className="h-3.5 w-3.5" /> {status}
                  </span>
                );
              })}
              <span className="ml-auto">{t('auto_refresh')}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
