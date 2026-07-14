import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { schedulingService } from '../services/schedulingService';
import { analyticsService } from '../services/analyticsService';
import CommanderDashboard from '../pages/CommanderDashboard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'analytics:title': 'Workforce Intelligence Dashboard'
      };
      return translations[key] || key;
    }
  })
}));

// 1. Mock Zustand Stores
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

vi.mock('../stores/uiStore', () => ({
  useUIStore: vi.fn()
}));

// 2. Mock Router Hooks
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

// 3. Mock Axios Client Services
vi.mock('../services/schedulingService', () => ({
  schedulingService: {
    getOrganizationTree: vi.fn()
  }
}));

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    getSummary: vi.fn(),
    getAlerts: vi.fn(),
    getDistribution: vi.fn(),
    getTrends: vi.fn()
  }
}));

describe('CommanderDashboard Component Tests', () => {
  const mockTree = [
    {
      id: 'unit-uuid-555',
      name: 'Brigade HQ',
      code: 'BRIG_HQ',
      children: [
        { id: 'unit-uuid-666', name: 'Company A', code: 'CO_A', children: [] }
      ]
    }
  ];

  const mockSummary = {
    total_personnel: 10,
    assigned: 8,
    unassigned: 2,
    available: 7,
    unavailable: 3,
    assigned_percentage: 80.0,
    availability_percentage: 70.0,
    absence_percentage: 30.0,
    unassigned_percentage: 20.0,
    active_shift_count: 2,
    status_distribution: [
      { status: 'AVAILABLE', count: 7, percentage: 70 },
      { status: 'SICK', count: 1, percentage: 10 },
      { status: 'TRAINING', count: 1, percentage: 10 },
      { status: 'MISSION', count: 1, percentage: 10 }
    ],
    organization_units: [],
    child_units: [],
    alerts_count: 1
  };

  const mockAlerts = [
    {
      rule_name: 'SICK_THRESHOLD_EXCEEDED',
      metric: 'sick_percentage',
      current_value: 10.0,
      threshold: 5.0,
      operator: '>',
      severity: 'WARNING',
      organization_unit: 'Company A',
      is_triggered: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock stores behavior
    (useUIStore as any).mockReturnValue({ direction: 'ltr' });
    (useAuthStore as any).mockReturnValue({
      hasPermission: (perm: string) => perm === 'dashboard.view'
    });

    // Mock API implementations
    (schedulingService.getOrganizationTree as any).mockResolvedValue(mockTree);
    (analyticsService.getSummary as any).mockResolvedValue(mockSummary);
    (analyticsService.getAlerts as any).mockResolvedValue(mockAlerts);
    (analyticsService.getTrends as any).mockResolvedValue([]);
    (analyticsService.getDistribution as any).mockResolvedValue([]);
  });

  it('renders dashboard layout and active widgets successfully', async () => {
    render(<CommanderDashboard />);

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText(/Workforce Intelligence Dashboard/i)).toBeDefined();
    });

    // Verify KPI Cards
    expect(screen.getByText('10')).toBeDefined(); // totalstrength
    expect(screen.getByText('8')).toBeDefined(); // assigned
    expect(screen.getByText('2')).toBeDefined(); // unassigned
    expect(screen.getAllByText('7')[0]).toBeDefined(); // available
    expect(screen.getAllByText('80%')[0]).toBeDefined(); // assigned_percentage

    // Verify alerts is rendered
    expect(screen.getByText('SICK THRESHOLD EXCEEDED')).toBeDefined();
    // Alert panel renders metric as: "sick percentage: 10 > 5" (snake_case replaced with spaces)
    expect(screen.getByText(/sick percentage/i)).toBeDefined();
  });

  it('blocks view and displays Access Denied screen if lacks permission', () => {
    // Override store mocks to reject permissions
    (useAuthStore as any).mockReturnValue({
      hasPermission: () => false
    });

    render(<CommanderDashboard />);
    expect(screen.getByText(/^common:access_denied$/)).toBeDefined();
  });

  it('displays empty state if no summary metrics return', async () => {
    (analyticsService.getSummary as any).mockResolvedValue(null);
    render(<CommanderDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/common:no_data/i)).toBeDefined();
    });
  });
});
