import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/card';

interface DistributionItem {
  status: string;
  count: number;
  percentage?: number;
}

interface StatusSummaryGridProps {
  distribution: DistributionItem[] | Record<string, number> | null;
}

export default function StatusSummaryGrid({ distribution }: StatusSummaryGridProps) {
  const { t } = useTranslation();

  // Normalize distribution into a standard array
  const items: DistributionItem[] = React.useMemo(() => {
    if (!distribution) return [];
    if (Array.isArray(distribution)) {
      return distribution;
    }
    // Handle record dictionary { AVAILABLE: 10, SICK: 2 }
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [distribution]);

  if (items.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-450 dark:text-slate-400 text-xs">
        {t('common:no_data')}
      </Card>
    );
  }

  // Helper function to return nice colored tags based on status code
  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('AVAILABLE') || s.includes('OFFICE') || s.includes('ACTIVE')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-450',
        border: 'border-emerald-100 dark:border-emerald-900/30'
      };
    }
    if (s.includes('SICK') || s.includes('ABSENT') || s.includes('FAILED')) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/20',
        text: 'text-rose-700 dark:text-rose-455',
        border: 'border-rose-100 dark:border-rose-900/30'
      };
    }
    if (s.includes('TRAINING') || s.includes('COURSE') || s.includes('PENDING')) {
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/20',
        text: 'text-indigo-700 dark:text-indigo-450',
        border: 'border-indigo-100 dark:border-indigo-900/30'
      };
    }
    if (s.includes('MISSION') || s.includes('OPERATIONAL') || s.includes('GENERATING')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-450',
        border: 'border-amber-100 dark:border-amber-900/30'
      };
    }
    return {
      bg: 'bg-slate-50 dark:bg-slate-950/20',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-205 dark:border-slate-800/40'
    };
  };

  return (
    <Card className="p-6">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
        {t('analytics:distribution')}
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => {
          const style = getStatusStyle(item.status);
          const displayStatusName = item.status.replace(/_/g, ' ');
          return (
            <div
              key={item.status}
              className={`p-4 rounded-xl border ${style.bg} ${style.border} flex flex-col justify-between h-24 transition-transform hover:-translate-y-0.5 shadow-2xs`}
            >
              <span className={`text-[10px] font-bold tracking-wider uppercase truncate ${style.text}`}>
                {displayStatusName}
              </span>
              <div className="mt-2 flex flex-col">
                <span className={`text-2xl font-bold font-heading leading-none ${style.text}`}>
                  {item.count}
                </span>
                {item.percentage !== undefined && (
                  <span className="text-[10px] font-semibold text-slate-555 mt-1">
                    {item.percentage}% מכלל המצבה
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

