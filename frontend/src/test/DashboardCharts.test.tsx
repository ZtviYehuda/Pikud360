import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusDistributionPieChart from '../components/dashboard/charts/StatusDistributionPieChart';
import PersonnelTrendChart from '../components/dashboard/charts/PersonnelTrendChart';
import DailyStatusBarChart from '../components/dashboard/charts/DailyStatusBarChart';
import OrganizationHeatMap from '../components/dashboard/charts/OrganizationHeatMap';

// Mock i18n to return keys as-is for testing
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'he' }
  })
}));

// Robust mock for recharts components to avoid SVG measurement and layout constraints in jsdom
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data, children }: any) => (
      <div data-testid="pie-component">
        {data?.map((d: any, i: number) => (
          <span key={i}>{d.name}</span>
        ))}
        {children}
      </div>
    ),
    Cell: () => <div data-testid="cell-component" />,
    Tooltip: () => null,
    Legend: () => <div data-testid="legend-component" />,
    AreaChart: ({ data, children }: any) => (
      <div data-testid="area-chart">
        {data?.map((d: any, i: number) => (
          <span key={i}>{d.name}</span>
        ))}
        {children}
      </div>
    ),
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    BarChart: ({ data, children }: any) => (
      <div data-testid="bar-chart">
        {data?.map((d: any, i: number) => (
          <span key={i}>{d.name}</span>
        ))}
        {children}
      </div>
    ),
    Bar: () => null
  };
});

describe('Dashboard Interactive Charts Tests', () => {
  const mockDistribution = [
    { status: 'AVAILABLE', count: 10, percentage: 50 },
    { status: 'SICK', count: 4, percentage: 20 },
    { status: 'TRAINING', count: 6, percentage: 30 }
  ];

  const mockTrends = [
    { date: '2026-07-01', total_personnel: 20, assigned: 16, unassigned: 4, available: 15, unavailable: 5, readiness_percentage: 75.0 },
    { date: '2026-07-02', total_personnel: 20, assigned: 18, unassigned: 2, available: 17, unavailable: 3, readiness_percentage: 85.0 }
  ];

  const mockChildUnits = [
    {
      unit_id: 'unit-a',
      unit_name: 'Company A',
      total_personnel: 10,
      assigned: 8,
      unassigned: 2,
      status_distribution: [
        { status: 'AVAILABLE', count: 8, percentage: 80 },
        { status: 'SICK', count: 2, percentage: 20 }
      ]
    },
    {
      unit_id: 'unit-b',
      unit_name: 'Company B',
      total_personnel: 12,
      assigned: 6,
      unassigned: 6,
      status_distribution: [
        { status: 'AVAILABLE', count: 4, percentage: 33 },
        { status: 'TRAINING', count: 8, percentage: 67 }
      ]
    }
  ];

  it('renders StatusDistributionPieChart with data items', () => {
    render(<StatusDistributionPieChart data={mockDistribution} />);
    // Title uses t() which returns the key in our mock
    expect(screen.getByText('analytics:distribution')).toBeDefined();
    // Verify mapped data names render
    expect(screen.getByText('AVAILABLE')).toBeDefined();
    expect(screen.getByText('SICK')).toBeDefined();
    expect(screen.getByText('TRAINING')).toBeDefined();
  });

  it('renders PersonnelTrendChart with trend lines and period selectors', () => {
    const handlePeriodChange = vi.fn();
    render(
      <PersonnelTrendChart
        data={mockTrends}
        period="daily"
        onPeriodChange={handlePeriodChange}
      />
    );
    expect(screen.getByText('analytics:trends')).toBeDefined();
    // Period buttons use t() keys
    expect(screen.getByText('analytics:daily')).toBeDefined();
    expect(screen.getByText('analytics:weekly')).toBeDefined();
  });

  it('renders DailyStatusBarChart comparing child units', () => {
    render(<DailyStatusBarChart childUnits={mockChildUnits} />);
    expect(screen.getByText('analytics:unit_breakdown')).toBeDefined();
  });

  it('renders OrganizationHeatMap and color codes readiness metrics', () => {
    render(<OrganizationHeatMap childUnits={mockChildUnits} />);
    expect(screen.getByText('analytics:heatmap')).toBeDefined();
    expect(screen.getByText('Company A')).toBeDefined();
    expect(screen.getByText('Company B')).toBeDefined();
    expect(screen.getByText('80%')).toBeDefined();
    expect(screen.getByText('33%')).toBeDefined();
  });

  it('renders EmptyState if empty list returns', () => {
    render(<StatusDistributionPieChart data={[]} />);
    // ChartCard renders EmptyState title via t('common:no_data')
    expect(screen.getByText('common:no_data')).toBeDefined();
  });
});
