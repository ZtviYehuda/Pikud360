import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { schedulingService } from '../services/schedulingService';
import WorkforceScheduling from '../pages/WorkforceScheduling';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'scheduling:title': 'Daily Workforce Scheduling',
        'scheduling:desc': 'Commander planning control panel for daily status allocation.',
        'analytics:unit': 'Unit',
        'scheduling:hours': 'Hours',
        'employees:employee': 'Employee',
        'scheduling:not_assigned': 'Not assigned',
        'scheduling:brigade_hq': 'Brigade HQ',
        'scheduling:company_a': 'Company A',
        'scheduling:company_b': 'Company B',
        'scheduling:all_statuses': 'All Statuses',
        'scheduling:daily_status': 'Daily Status',
        'scheduling:notes': 'Notes',
        'employees:rank_role': 'Rank / Role',
        'employees:search_placeholder': 'Search...',
        'employees:no_employees': 'No employees',
        'common:actions': 'Actions',
        'common:access_denied': 'Access Denied',
        'common:no_permission': 'No permission',
        'common:no_data': 'No data'
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
    getStatuses: vi.fn(),
    getSettings: vi.fn(),
    getOrganizationTree: vi.fn(),
    getUnitEmployees: vi.fn(),
    getDashboardSummary: vi.fn(),
    getShiftTypes: vi.fn(),
    assignStatus: vi.fn(),
    updateAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
    bulkAssign: vi.fn()
  }
}));

describe('WorkforceScheduling Commander Dashboard Component', () => {
  const mockStatuses = [
    { id: 's-avail', tenant_id: 't-1', code: 'AVAILABLE', name: 'Available', category: 'AVAILABLE', color: '#4CAF50', is_active: true, sort_order: 1 },
    { id: 's-sick', tenant_id: 't-1', code: 'SICK', name: 'Sick', category: 'SICK', color: '#F44336', is_active: true, sort_order: 2 }
  ];

  const mockSettingsDirect = {
    id: 'settings-1',
    tenant_id: 't-1',
    organization_unit_id: 'unit-uuid-555',
    scheduling_mode: 'DIRECT_STATUS'
  };

  const mockSettingsShift = {
    id: 'settings-1',
    tenant_id: 't-1',
    organization_unit_id: 'unit-uuid-555',
    scheduling_mode: 'SHIFT_BASED'
  };

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

  const mockEmployees = [
    {
      employee_id: 'employee-uuid-111',
      display_name: 'David Cohen',
      rank: 'Captain',
      role: 'Team Leader',
      organization_unit: { id: 'unit-uuid-555', name: 'Brigade HQ' },
      daily_assignment: {
        id: 'sched-1',
        status_id: 's-avail',
        status_code: 'AVAILABLE',
        status_name: 'Available',
        color: '#4CAF50',
        notes: 'Fit'
      }
    },
    {
      employee_id: 'employee-uuid-222',
      display_name: 'Moshe Levi',
      rank: 'Lieutenant',
      role: 'Operations Officer',
      organization_unit: { id: 'unit-uuid-555', name: 'Brigade HQ' },
      daily_assignment: null
    }
  ];

  const mockDashboard = {
    date: '2026-08-01',
    total_employees: 2,
    assigned_employees: 1,
    unassigned_employees: 1,
    statuses: { AVAILABLE: 1 },
    child_units: []
  };

  const mockShifts = [
    { id: 'shift-1', tenant_id: 't-1', organization_unit_id: 'unit-uuid-555', name: 'Morning', start_time: '06:00', end_time: '14:00', active: true }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default UI context direction values
    (useUIStore as any).mockReturnValue({
      direction: 'ltr'
    });

    // Default mock service resolvers
    (schedulingService.getStatuses as any).mockResolvedValue(mockStatuses);
    (schedulingService.getOrganizationTree as any).mockResolvedValue(mockTree);
    (schedulingService.getUnitEmployees as any).mockResolvedValue(mockEmployees);
    (schedulingService.getDashboardSummary as any).mockResolvedValue(mockDashboard);
    (schedulingService.getShiftTypes as any).mockResolvedValue(mockShifts);
  });

  it('renders Daily Workforce Scheduling and enforces permission check', async () => {
    // Mock user lacking view permission
    (useAuthStore as any).mockReturnValue({
      hasPermission: () => false
    });

    render(<WorkforceScheduling />);
    
    // Should show the Unauthorized page content
    expect(screen.getByText('Access Denied')).toBeDefined();
  });

  it('loads and displays daily assignments for authorized commanders', async () => {
    // Mock authorized commander
    (useAuthStore as any).mockReturnValue({
      hasPermission: (_perm: string) => true
    });

    (schedulingService.getSettings as any).mockResolvedValue(mockSettingsDirect);

    render(<WorkforceScheduling />);

    // Loader resolves to layout title
    await waitFor(() => {
      expect(screen.getByText('Daily Workforce Scheduling')).toBeDefined();
    });

    // Verify employee listings are populated
    expect(screen.getByText('David Cohen')).toBeDefined();
    expect(screen.getByText('Moshe Levi')).toBeDefined();
  });

  it('interacts with organization tree dropdown selector and triggers reload', async () => {
    (useAuthStore as any).mockReturnValue({
      hasPermission: (_perm: string) => true
    });

    (schedulingService.getSettings as any).mockResolvedValue(mockSettingsDirect);

    render(<WorkforceScheduling />);

    await waitFor(() => {
      expect(screen.getByText('Daily Workforce Scheduling')).toBeDefined();
    });

    // Wait for org tree to load and unit button to show the correct name
    let selectBtn: HTMLElement;
    await waitFor(() => {
      selectBtn = screen.getByRole('button', { name: /Brigade HQ/i });
    });
    fireEvent.click(selectBtn!);

    // Tree dropdown should open and display the child unit "Company A"
    const childUnitOption = screen.getByText('Company A');
    expect(childUnitOption).toBeDefined();

    // Clicking child unit options triggers selection and state updates
    fireEvent.click(childUnitOption);

    await waitFor(() => {
      // Verifies that loading for child unit is triggered
      expect(schedulingService.getUnitEmployees).toHaveBeenCalledWith('unit-uuid-666', expect.any(String));
    });
  });

  it('filters employees list by status select dropdown', async () => {
    (useAuthStore as any).mockReturnValue({
      hasPermission: (_perm: string) => true
    });

    (schedulingService.getSettings as any).mockResolvedValue(mockSettingsDirect);

    render(<WorkforceScheduling />);

    await waitFor(() => {
      expect(screen.getByText('David Cohen')).toBeDefined();
    });

    // Find the status filter dropdown select element
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'UNASSIGNED' } });

    // "David Cohen" is assigned (Available) and should be filtered out
    expect(screen.queryByText('David Cohen')).toBeNull();
    // "Moshe Levi" is unassigned and should remain visible
    expect(screen.getByText('Moshe Levi')).toBeDefined();
  });

  it('hides shift columns and inputs under DIRECT_STATUS mode', async () => {
    (useAuthStore as any).mockReturnValue({
      hasPermission: (_perm: string) => true
    });

    (schedulingService.getSettings as any).mockResolvedValue(mockSettingsDirect);

    render(<WorkforceScheduling />);

    await waitFor(() => {
      expect(screen.getByText('DIRECT_STATUS')).toBeDefined();
    });

    // Table header should NOT contain "Hours" or shift indicators
    expect(screen.queryByText('Hours')).toBeNull();
  });

  it('renders shift columns and displays custom slots under SHIFT_BASED mode', async () => {
    (useAuthStore as any).mockReturnValue({
      hasPermission: (_perm: string) => true
    });

    (schedulingService.getSettings as any).mockResolvedValue(mockSettingsShift);

    render(<WorkforceScheduling />);

    await waitFor(() => {
      expect(screen.getByText('SHIFT_BASED')).toBeDefined();
    });

    // Table header should contain "Shift" and "Hours" columns
    expect(screen.getByText('Hours')).toBeDefined();
  });
});
