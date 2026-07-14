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
  { id: 'r1', tenant_id: 't1', name: 'Sick Alert', description: 'Alert on sick', trigger_event: 'SICK_EXCEEDED', condition_json: {}, action_type: 'NOTIFY_COMMANDER', action_config: {}, is_active: true, trigger_count: 3 }
];

describe('Automation', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ hasPermission: () => true, user: { name: 'Admin' } });
    (useUIStore as any).mockReturnValue({ language: 'en' });
    vi.spyOn(adminService, 'getAutomationRules').mockResolvedValue(mockRules);
  });

  it('renders automation heading', async () => {
    const Automation = (await import('../pages/admin/Automation')).default;
    render(<Automation />);
    expect(screen.getByText('Automation Engine')).toBeTruthy();
  });

  it('renders new rule button for managers', async () => {
    const Automation = (await import('../pages/admin/Automation')).default;
    render(<Automation />);
    expect(screen.getByText('New Rule')).toBeTruthy();
  });

  it('shows unauthorized for users without automation.view', async () => {
    (useAuthStore as any).mockReturnValue({ hasPermission: (p: string) => p !== 'automation.view', user: { name: 'User' } });
    const Automation = (await import('../pages/admin/Automation')).default;
    render(<Automation />);
    expect(screen.getByText('Unauthorized')).toBeTruthy();
  });
});
