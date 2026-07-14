import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { DistributionItem } from '../../../services/analyticsService';
import ChartCard from './ChartCard';

interface StatusDistributionPieChartProps {
  data: DistributionItem[] | null;
  loading?: boolean;
  error?: string | null;
}

const COLORS: Record<string, string> = {
  AVAILABLE: '#10B981',
  SICK: '#F43F5E',
  TRAINING: '#6366F1',
  MISSION: '#F59E0B',
  REINFORCEMENT: '#3B82F6',
  VACATION: '#EC4899',
  OTHER: '#64748B'
};

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

export default function StatusDistributionPieChart({
  data,
  loading = false,
  error = null
}: StatusDistributionPieChartProps) {
  const { t } = useTranslation();

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      name: item.status.replace(/_/g, ' ').toUpperCase(),
      value: item.count,
      percentage: item.percentage
    }));
  }, [data]);

  const empty = chartData.length === 0;

  return (
    <ChartCard
      title={t('analytics:distribution')}
      loading={loading}
      error={error}
      empty={empty}
    >
      <div className="w-full h-64 flex items-center justify-center font-semibold text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const cleanName = entry.name.toUpperCase();
                const color = COLORS[cleanName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                textAlign: 'right'
              }}
              formatter={(value: any, name: any, props: any) => {
                const pct = props.payload.percentage;
                return [`${value} (${pct}%)`, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
