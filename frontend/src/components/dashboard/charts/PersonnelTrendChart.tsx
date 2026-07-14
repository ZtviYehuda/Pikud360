import React from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';

interface TrendDataPoint {
  date: string;
  total_personnel: number;
  assigned: number;
  unassigned: number;
  available: number;
  unavailable: number;
  readiness_percentage: number;
  status_distribution?: Record<string, number>;
}

interface PersonnelTrendChartProps {
  data: TrendDataPoint[] | null;
  loading?: boolean;
  error?: string | null;
  period: 'daily' | 'weekly' | 'monthly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void;
}

const KEYS = {
  total: 'total_personnel',
  assigned: 'assigned',
  available: 'available'
};

export default function PersonnelTrendChart({
  data,
  loading = false,
  error = null,
  period,
  onPeriodChange
}: PersonnelTrendChartProps) {
  const { t } = useTranslation();

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return data.map((pt) => ({
      name: pt.date,
      [KEYS.total]: pt.total_personnel,
      [KEYS.assigned]: pt.assigned,
      [KEYS.available]: pt.available
    }));
  }, [data]);

  const empty = chartData.length === 0;

  const periodLabels: Record<string, string> = {
    daily: t('analytics:daily'),
    weekly: t('analytics:weekly'),
    monthly: t('analytics:monthly')
  };

  const actions = (
    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/50 dark:border-slate-800/80 shadow-2xs">
      {(['daily', 'weekly', 'monthly'] as const).map((p) => {
        const active = period === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodChange(p)}
            className={`py-1 px-3.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
              active
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs font-extrabold'
                : 'text-slate-500 dark:text-slate-450 hover:text-slate-800'
            }`}
          >
            {periodLabels[p]}
          </button>
        );
      })}
    </div>
  );

  return (
    <ChartCard
      title={t('analytics:trends')}
      loading={loading}
      error={error}
      empty={empty}
      actions={actions}
    >
      <div className="w-full h-72 font-semibold text-xs pr-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-850" />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                textAlign: 'right'
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
            <Area type="monotone" dataKey={KEYS.total} name={t('dashboard:total_strength')} stroke="#3B82F6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
            <Area type="monotone" dataKey={KEYS.assigned} name={t('dashboard:assigned')} stroke="#10B981" fillOpacity={1} fill="url(#colorAssigned)" strokeWidth={2} />
            <Area type="monotone" dataKey={KEYS.available} name={t('analytics:available')} stroke="#8B5CF6" fillOpacity={1} fill="url(#colorAvailable)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
