import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, ArrowLeft, BellOff } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { EmptyState } from '../ui/empty-state';

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
  const navigate = useNavigate();

  const getSeverityRank = (severity: string): number => {
    const sev = severity.toUpperCase();
    if (sev === 'CRITICAL' || sev === 'DANGER' || sev === 'ERROR') return 3;
    if (sev === 'WARNING' || sev === 'WARN') return 2;
    return 1; // INFO or low severity
  };

  const processedAlerts = React.useMemo(() => {
    if (!alerts) return [];
    
    return alerts
      .filter(a => a.is_triggered && getSeverityRank(a.severity) >= 2)
      .sort((a, b) => getSeverityRank(b.severity) - getSeverityRank(a.severity))
      .slice(0, 5); // Keep top 5 to keep mobile screen concise
  }, [alerts]);

  if (processedAlerts.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title={t('common:success')}
        description={t('common:no_data')}
        className="h-64 justify-center"
      />
    );
  }

  const getSeverityStyle = (severity: string) => {
    const sev = severity.toUpperCase();
    if (sev === 'CRITICAL' || sev === 'DANGER' || sev === 'ERROR') {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/15',
        border: 'border-rose-100/80 dark:border-rose-900/30',
        text: 'text-rose-800 dark:text-rose-455',
        iconText: 'text-rose-600 dark:text-rose-500',
        badgeVariant: 'destructive' as const,
        icon: AlertOctagon,
      };
    }
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/15',
      border: 'border-amber-100/80 dark:border-amber-900/30',
      text: 'text-amber-800 dark:text-amber-455',
      iconText: 'text-amber-600 dark:text-amber-500',
      badgeVariant: 'warning' as const,
      icon: AlertTriangle,
    };
  };

  const getActionPath = (alert: AlertData): string => {
    const name = alert.rule_name.toLowerCase();
    const metric = alert.metric.toLowerCase();
    
    if (name.includes('transfer') || metric.includes('transfer')) {
      return '/transfers';
    }
    return '/workforce/scheduling';
  };

  return (
    <Card className="p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between pb-1 select-none">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>{t('notifications:alerts')}</span>
          <Badge variant="destructive">
            {processedAlerts.length}
          </Badge>
        </h3>
      </div>

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {processedAlerts.map((alert, idx) => {
          const style = getSeverityStyle(alert.severity);
          const Icon = style.icon;
          const ruleDisplayName = alert.rule_name.replace(/_/g, ' ');
          const formattedMetric = alert.metric.replace(/_/g, ' ');
          const actionPath = getActionPath(alert);

          return (
            <div 
              key={idx} 
              className={`p-3.5 rounded-xl border ${style.bg} ${style.border} flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between transition-all`}
            >
              <div className="flex gap-3 items-start text-right min-w-0">
                <div className={`p-1 rounded-lg ${style.iconText} shrink-0 mt-0.5`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold truncate ${style.text}`}>
                      {ruleDisplayName}
                    </span>
                    <Badge variant={style.badgeVariant} className="text-[9px] px-1.5 py-0">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-slate-555 dark:text-slate-400 text-[10px] leading-relaxed">
                    {formattedMetric}: {alert.current_value} {alert.operator} {alert.threshold}
                  </p>
                  <div className="text-[9px] text-slate-400 font-semibold">
                    <span>{t('analytics:unit')}: </span>
                    <span className="text-slate-500 dark:text-slate-350">{alert.organization_unit}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Optimized for one-hand thumb touch on mobile */}
              <button
                type="button"
                onClick={() => navigate(actionPath)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.97] transition-all cursor-pointer min-h-[44px] shrink-0"
              >
                <span>{t('buttons:resolve_alert')}</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
