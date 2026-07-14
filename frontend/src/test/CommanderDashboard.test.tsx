import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { schedulingService } from '../services/schedulingService';
import CommanderDashboard from '../pages/CommanderDashboard';

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
    getOrganizationTree: vi.fn(),
    getCommanderDashboardSummary: vi.fn()
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
    availability_percentage: 80.0,
    sick_percentage: 10.0,
    training_percentage: 10.0,
    mission_percentage: 0.0,
    shortage_index: 20.0,
    status_distribution: {
      AVAILABLE: 8,
      SICK: 1,
      TRAINING: 1
    },
    child_units: [
      {
        unit_id: 'unit-uuid-666',
        unit_name: 'Company A',
        total_personnel: 5,
        assigned: 4,
        unassigned: 1,
        status_distribution: { AVAILABLE: 4 }
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        alert_type: 'SICK_THRESHOLD_EXCEEDED',
        severity: 'WARNING',
        message: 'High sickness rate',
        status: 'ACTIVE',
        created_at: '2026-07-13T12:00:00Z'
      }
    ],
    transfers_count: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock stores behavior
    (useUIStore as any).mockReturnValue({ direction: 'ltr' });
    (useAuthStore as any).mockReturnValue({
      hasPermission: (perm: string) => perm === 'dashboard.view'
    });

    // Mock API implementations
    (schedulingService.getOrganizationTree as any).mockResolvedValue(mockTree);
    (schedulingService.getCommanderDashboardSummary as any).mockResolvedValue(mockSummary);
  });

  it('renders dashboard widgets successfully with mock data values', async () => {
    render(<CommanderDashboard />);

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText(/Workforce Intelligence Dashboard/i)).toBeDefined();
    });

    // Check KPIs
    expect(screen.getByText('10')).toBeDefined(); // total strength count
    expect(screen.getAllByText('80%')[0]).toBeDefined(); // availability rate
    expect(screen.getByText('20%')).toBeDefined(); // shortage index

    // Check alerts
    expect(screen.getByText('High sickness rate')).toBeDefined();

    // Check child units table
    expect(screen.getByText('Company A')).toBeDefined();
  });

  it('blocks view and displays Unauthorized screen if lack permission', () => {
    // Override store mocks to reject permissions
    (useAuthStore as any).mockReturnValue({
      hasPermission: () => false
    });

    render(<CommanderDashboard />);
    expect(screen.getByText(/Access Denied/i)).toBeDefined();
  });
});
