import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { adminService, SystemHealth } from '../../services/adminService';
import Unauthorized from '../Unauthorized';
import { Activity, Database, Server, Users, FileText, AlertTriangle, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  healthy:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  degraded:    { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   icon: AlertCircle },
  unavailable: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',       icon: XCircle },
};

function HealthCard({ title, titleHe, value, sub, icon: Icon, status, isHe }: any) {
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
      <p className="text-sm font-medium text-slate-300 mt-0.5">{isHe ? titleHe : title}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function SystemHealth() {
  const { hasPermission } = useAuthStore();
  const { language } = useUIStore();
  const isHe = language === 'he';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
            <Activity className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isHe ? 'מצב מערכת' : 'System Health'}</h1>
            <p className="text-sm text-slate-400">
              {checkedAt
                ? `${isHe ? 'עודכן' : 'Updated'}: ${checkedAt.toLocaleTimeString(isHe ? 'he-IL' : 'en-US')}`
                : isHe ? 'טוען...' : 'Loading...'}
            </p>
          </div>
        </div>
        <button onClick={() => fetchHealth(true)} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {isHe ? 'רענן' : 'Refresh'}
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
                {isHe ? `זוהו ${health?.recent_errors} שגיאות בשעה האחרונה. אנא בדוק את יומן הביקורת.` : `${health?.recent_errors} error(s) detected in the last hour. Please review the audit log.`}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <HealthCard
                title="Database" titleHe="מסד נתונים"
                value={dbStatus.toUpperCase()} sub={isHe ? 'PostgreSQL - חיבור ראשי' : 'PostgreSQL — Primary connection'}
                icon={Database} status={dbStatus} isHe={isHe}
              />
              <HealthCard
                title="API Server" titleHe="שרת API"
                value={apiStatus.toUpperCase()} sub={isHe ? 'Flask REST API' : 'Flask REST API'}
                icon={Server} status={apiStatus} isHe={isHe}
              />
              <HealthCard
                title="Active Sessions" titleHe="סשנים פעילים"
                value={health?.active_sessions ?? 0} sub={isHe ? 'משתמשים מחוברים כרגע' : 'Currently logged in users'}
                icon={Users} status="healthy" isHe={isHe}
              />
              <HealthCard
                title="Audit Volume (24h)" titleHe="נפח ביקורת (24ש׳)"
                value={(health?.audit_volume_24h ?? 0).toLocaleString()} sub={isHe ? 'אירועים שנרשמו היום' : 'Events recorded today'}
                icon={FileText} status="healthy" isHe={isHe}
              />
              <HealthCard
                title="Recent Errors (1h)" titleHe="שגיאות אחרונות (1ש׳)"
                value={health?.recent_errors ?? 0} sub={isHe ? 'שגיאות ERROR/CRITICAL' : 'ERROR/CRITICAL severity events'}
                icon={AlertTriangle} status={hasErrors ? 'degraded' : 'healthy'} isHe={isHe}
              />
              <HealthCard
                title="Notification Engine" titleHe="מנוע הודעות"
                value="IN-APP" sub={isHe ? 'ערוץ פעיל: IN-APP' : 'Active channel: IN-APP'}
                icon={Activity} status="healthy" isHe={isHe}
              />
            </div>

            {/* Health Legend */}
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">{isHe ? 'מקרא:' : 'Legend:'}</span>
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const SIcon = cfg.icon;
                return (
                  <span key={status} className={`flex items-center gap-1.5 ${cfg.color}`}>
                    <SIcon className="h-3.5 w-3.5" /> {status}
                  </span>
                );
              })}
              <span className="ml-auto">{isHe ? 'מתרענן אוטומטית כל דקה' : 'Auto-refreshes every 60 seconds'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
