import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  percentage?: string | number;
  loading?: boolean;
  description?: string;
}

export default function KpiCard({ icon: Icon, title, value, percentage, loading, description }: KpiCardProps) {
  if (loading) {
    return (
      <Card className="p-5 animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-16" />
        {percentage !== undefined && (
          <Skeleton className="h-3 w-12" />
        )}
        {description && <Skeleton className="h-3.5 w-20" />}
      </Card>
    );
  }

  const isLongString = typeof value === 'string' && value.length > 4;

  return (
    <Card className="p-4 md:p-5 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-brand-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>
      <div className="flex justify-between items-center mb-2 md:mb-2.5">
        <h3 className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase leading-tight">
          {title}
        </h3>
        <div className="p-1.5 md:p-2 rounded-xl bg-brand-50/80 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform shrink-0">
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={isLongString ? "text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide" : "text-2xl md:text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight"}>
          {value}
        </span>
        {percentage !== undefined && (
          <Badge variant="info">
            {percentage}%
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
          {description}
        </p>
      )}
    </Card>
  );
}

