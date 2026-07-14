import React from 'react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../EmptyState';

interface ChartCardProps {
  title: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  loading = false,
  error = null,
  empty = false,
  emptyMessage,
  actions,
  children
}: ChartCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col min-h-80">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <h3 className="text-sm font-bold text-slate-850 dark:text-white">
          {title}
        </h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-h-60 justify-center">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xs rounded-xl z-10 animate-pulse">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {t('common:loading')}
              </span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="p-4">
            <EmptyState
              title={t('validation:error_title')}
              description={error}
            />
          </div>
        ) : empty ? (
          <div className="p-4">
            <EmptyState
              title={t('common:no_data')}
              description={emptyMessage || t('common:no_results')}
            />
          </div>
        ) : (
          <div className="w-full h-full flex-1 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
