import React from 'react';
import { useTranslation } from 'react-i18next';
import { UnitBreakdownItem } from '../../../services/analyticsService';
import ChartCard from './ChartCard';

interface OrganizationHeatMapProps {
  childUnits: UnitBreakdownItem[] | null;
  loading?: boolean;
  error?: string | null;
}

export default function OrganizationHeatMap({
  childUnits,
  loading = false,
  error = null
}: OrganizationHeatMapProps) {
  const { t } = useTranslation();

  const heatMapData = React.useMemo(() => {
    if (!childUnits) return [];
    return childUnits.map((unit) => {
      const availableDist = unit.status_distribution.find(
        (d) => d.status.toUpperCase() === 'AVAILABLE'
      );
      const availableCount = availableDist ? availableDist.count : 0;
      const rate = unit.total_personnel > 0
        ? Math.round((availableCount / unit.total_personnel) * 100)
        : 0;

      let colorClass = '';
      let bgClass = '';
      let textClass = '';

      if (rate >= 85) {
        colorClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
        bgClass = 'bg-emerald-500';
        textClass = 'text-emerald-700 dark:text-emerald-450';
      } else if (rate >= 70) {
        colorClass = 'border-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-400';
        bgClass = 'bg-amber-400';
        textClass = 'text-amber-700 dark:text-amber-450';
      } else if (rate >= 50) {
        colorClass = 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400';
        bgClass = 'bg-orange-500';
        textClass = 'text-orange-700 dark:text-orange-450';
      } else {
        colorClass = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-450';
        bgClass = 'bg-rose-500';
        textClass = 'text-rose-700 dark:text-rose-450';
      }

      return { ...unit, rate, colorClass, bgClass, textClass };
    });
  }, [childUnits]);

  const empty = heatMapData.length === 0;

  return (
    <ChartCard
      title={t('analytics:heatmap')}
      loading={loading}
      error={error}
      empty={empty}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full p-1">
        {heatMapData.map((unit) => (
          <div
            key={unit.unit_id}
            className={`border rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow duration-200 ${unit.colorClass}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs truncate max-w-32 text-slate-800 dark:text-white">
                {unit.unit_name}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${unit.bgClass}`}></span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex flex-col">
                <span className="text-2xs text-slate-450 uppercase font-bold tracking-wider">
                  {t('analytics:available')}
                </span>
                <span className={`text-2xl font-extrabold font-heading ${unit.textClass}`}>
                  {unit.rate}%
                </span>
              </div>
              <div className="text-left flex flex-col">
                <span className="text-[10px] text-slate-450 font-semibold">
                  {t('dashboard:total_strength')}: {unit.total_personnel}
                </span>
                <span className="text-[10px] text-slate-450 font-semibold mt-0.5">
                  {t('dashboard:assigned')}: {unit.assigned}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
