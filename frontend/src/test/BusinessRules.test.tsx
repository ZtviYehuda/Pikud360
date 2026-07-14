import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { adminService } from '../services/adminService';

vi.mock('../stores/authStore', () => ({ useAuthStore: vi.fn() }));
vi.mock('../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../pages/Unauthorized', () => ({ default: () => <div>Unauthorized</div> }));

const mockRules = [
  { id: 'br1', tenant_id: 't1', name: 'Manpower Minimum', description: 'Min manpower rule', rule_type: 'MANPOWER_MIN', condition_json: {}, action_json: {}, is_active: true, priority: 100 }
];

describe('BusinessRules', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ hasPermission: () => true, user: { name: 'Admin' } });
    (useUIStore as any).mockReturnValue({ language: 'en' });
    vi.spyOn(adminService, 'getBusinessRules').mockResolvedValue(mockRules);
  });

  it('renders business rules heading', async () => {
    const BusinessRules = (await import('../pages/admin/BusinessRules')).default;
    render(<BusinessRules />);
    expect(screen.getByText('Business Rules')).toBeTruthy();
  });

  it('renders new rule button for managers', async () => {
    const BusinessRules = (await import('../pages/admin/BusinessRules')).default;
    render(<BusinessRules />);
    expect(screen.getByText('New Rule')).toBeTruthy();
  });

  it('shows unauthorized for users without business_rules.view', async () => {
    (useAuthStore as any).mockReturnValue({ hasPermission: (p: string) => p !== 'business_rules.view', user: { name: 'User' } });
    const BusinessRules = (await import('../pages/admin/BusinessRules')).default;
    render(<BusinessRules />);
    expect(screen.getByText('Unauthorized')).toBeTruthy();
  });
});
