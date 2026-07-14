import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, AlertTriangle, Info, BellOff } from 'lucide-react';

export interface AlertData {
  rule_name: string;
  metric: string;
  current_value: number;
  threshold: number;
  operator: string;
  severity: string;
  organization_unit: string;
  is_triggered: boolean;
}

interface AlertPanelProps {
  alerts: AlertData[] | null;
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  const { t } = useTranslation();

  const activeAlerts = React.useMemo(() => {
    if (!alerts) return [];
    return alerts.filter(a => a.is_triggered);
  }, [alerts]);

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-64">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-full mb-3">
          <BellOff className="h-6 w-6" />
        </div>
        <h4 className="text-xs font-bold text-slate-850 dark:text-white mb-1">
          {t('common:success')}
        </h4>
        <p className="text-slate-450 dark:text-slate-400 text-2xs max-w-xs leading-normal">
          {t('common:no_data')}
        </p>
      </div>
    );
  }

  const getSeverityStyle = (severity: string) => {
    const sev = severity.toUpperCase();
    if (sev === 'CRITICAL' || sev === 'DANGER' || sev === 'ERROR') {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/15',
        border: 'border-rose-100 dark:border-rose-900/30',
        text: 'text-rose-800 dark:text-rose-400',
        iconText: 'text-rose-600 dark:text-rose-500',
        badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400',
        icon: AlertOctagon,
      };
    }
    if (sev === 'WARNING' || sev === 'WARN') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/15',
        border: 'border-amber-100 dark:border-amber-900/30',
        text: 'text-amber-800 dark:text-amber-400',
        iconText: 'text-amber-600 dark:text-amber-500',
        badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400',
        icon: AlertTriangle,
      };
    }
    return {
      bg: 'bg-blue-50 dark:bg-blue-950/15',
      border: 'border-blue-100 dark:border-blue-900/30',
      text: 'text-blue-800 dark:text-blue-400',
      iconText: 'text-blue-600 dark:text-blue-500',
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      icon: Info,
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>{t('notifications:alerts')}</span>
          <span className="bg-rose-100 dark:bg-rose-950/30 text-rose-800 dark:text-rose-455 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {activeAlerts.length}
          </span>
        </h3>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {activeAlerts.map((alert, idx) => {
          const style = getSeverityStyle(alert.severity);
          const Icon = style.icon;
          const ruleDisplayName = alert.rule_name.replace(/_/g, ' ');
          const formattedMetric = alert.metric.replace(/_/g, ' ');

          return (
            <div key={idx} className={`p-3 rounded-xl border ${style.bg} ${style.border} flex gap-3 items-start transition-all`}>
              <div className={`p-1 rounded-lg ${style.iconText}`}>
                <Icon className="h-5 w-5 shrink-0" />
              </div>
              <div className="space-y-1 w-full text-right">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${style.text}`}>{ruleDisplayName}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${style.badge}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed">
                  {formattedMetric}: {alert.current_value} {alert.operator} {alert.threshold}
                </p>
                <div className="text-[9px] text-slate-400 font-semibold mt-1">
                  <span>{t('analytics:unit')}: </span>
                  <span className="text-slate-500 dark:text-slate-350">{alert.organization_unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
