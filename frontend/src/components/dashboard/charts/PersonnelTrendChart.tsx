import React from 'react';
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
  isRTL?: boolean;
}

export default function PersonnelTrendChart({
  data,
  loading = false,
  error = null,
  period,
  onPeriodChange,
  isRTL = false
}: PersonnelTrendChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return [];
    return data.map((pt) => ({
      name: pt.date,
      [isRTL ? 'כוח אדם פעיל' : 'Total Personnel']: pt.total_personnel,
      [isRTL ? 'משובצים' : 'Assigned']: pt.assigned,
      [isRTL ? 'זמינים' : 'Available']: pt.available
    }));
  }, [data, isRTL]);

  const empty = chartData.length === 0;

  const actions = (
    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/50 dark:border-slate-800/80 shadow-2xs">
      {(['daily', 'weekly', 'monthly'] as const).map((p) => {
        const active = period === p;
        const labels: Record<string, string> = {
          daily: isRTL ? 'יומי' : 'Daily',
          weekly: isRTL ? 'שבועי' : 'Weekly',
          monthly: isRTL ? 'חודשי' : 'Monthly'
        };
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
            {labels[p]}
          </button>
        );
      })}
    </div>
  );

  return (
    <ChartCard
      title={isRTL ? 'מגמות כשירות ומצבת כוח אדם' : 'Workforce Readiness Trends'}
      loading={loading}
      error={error}
      empty={empty}
      actions={actions}
      isRTL={isRTL}
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
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                textAlign: isRTL ? 'right' : 'left'
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey={isRTL ? 'כוח אדם פעיל' : 'Total Personnel'}
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorTotal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey={isRTL ? 'משובצים' : 'Assigned'}
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorAssigned)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey={isRTL ? 'זמינים' : 'Available'}
              stroke="#8B5CF6"
              fillOpacity={1}
              fill="url(#colorAvailable)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
