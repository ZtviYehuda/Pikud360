import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  percentage?: string | number;
  loading?: boolean;
}

export default function KpiCard({ icon: Icon, title, value, percentage, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-slate-205 dark:bg-slate-800 rounded"></div>
          <div className="h-8 w-8 bg-slate-205 dark:bg-slate-800 rounded-full"></div>
        </div>
        <div className="h-8 w-16 bg-slate-205 dark:bg-slate-800 rounded"></div>
        {percentage !== undefined && (
          <div className="h-3 w-12 bg-slate-205 dark:bg-slate-800 rounded"></div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-brand-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
          {title}
        </h3>
        <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/20 text-brand-550 dark:text-brand-400 group-hover:scale-105 transition-transform">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {percentage !== undefined && (
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/10 px-2 py-0.5 rounded-full">
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}
