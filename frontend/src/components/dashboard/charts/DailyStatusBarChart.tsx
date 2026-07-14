import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UnitBreakdownItem } from '../../../services/analyticsService';
import ChartCard from './ChartCard';

interface DailyStatusBarChartProps {
  childUnits: UnitBreakdownItem[] | null;
  loading?: boolean;
  error?: string | null;
}

const STATUS_KEYS = ['AVAILABLE', 'SICK', 'MISSION', 'TRAINING', 'REINFORCEMENT', 'VACATION', 'OTHER'];

const COLORS: Record<string, string> = {
  AVAILABLE: '#10B981',
  SICK: '#F43F5E',
  MISSION: '#F59E0B',
  TRAINING: '#6366F1',
  REINFORCEMENT: '#3B82F6',
  VACATION: '#EC4899',
  OTHER: '#64748B'
};

export default function DailyStatusBarChart({
  childUnits,
  loading = false,
  error = null
}: DailyStatusBarChartProps) {
  const { t } = useTranslation();

  const chartData = React.useMemo(() => {
    if (!childUnits) return [];
    return childUnits.map((unit) => {
      const dataPoint: Record<string, any> = { name: unit.unit_name };
      STATUS_KEYS.forEach(k => { dataPoint[k] = 0; });
      unit.status_distribution.forEach((dist) => {
        const cleanStatus = dist.status.toUpperCase();
        dataPoint[cleanStatus] = dist.count;
      });
      return dataPoint;
    });
  }, [childUnits]);

  const empty = chartData.length === 0;

  return (
    <ChartCard
      title={t('analytics:unit_breakdown')}
      loading={loading}
      error={error}
      empty={empty}
    >
      <div className="w-full h-80 font-semibold text-xs pr-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
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
            {STATUS_KEYS.map((key) => (
              <Bar key={key} dataKey={key} name={key.replace(/_/g, ' ')} stackId="status" fill={COLORS[key]} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
