import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { adminService } from '../services/adminService';

vi.mock('../stores/authStore', () => ({ useAuthStore: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn(), Link: ({ children }: any) => children }));
vi.mock('../pages/Unauthorized', () => ({ default: () => <div>Unauthorized</div> }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'title': 'System Settings',
        'general': 'General',
        'security': 'Security',
        'save_settings': 'Save Settings'
      };
      return translations[key] || key;
    }
  })
}));

const mockSettings = [
  { key: 'scheduling_mode_default', value: 'DIRECT_STATUS', description: 'Default mode', updated_at: '2026-01-01' },
  { key: 'session_timeout_minutes', value: '480', description: 'Timeout', updated_at: '2026-01-01' }
];

describe('AdminSettings', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ hasPermission: () => true, user: { name: 'Admin' } });
    vi.spyOn(adminService, 'getSettings').mockResolvedValue(mockSettings);
    vi.spyOn(adminService, 'updateSettings').mockResolvedValue(mockSettings);
  });

  it('renders system settings heading', async () => {
    const AdminSettings = (await import('../pages/admin/AdminSettings')).default;
    render(<AdminSettings />);
    expect(screen.getByText('System Settings')).toBeTruthy();
  });

  it('shows settings tabs', async () => {
    const AdminSettings = (await import('../pages/admin/AdminSettings')).default;
    render(<AdminSettings />);
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Security')).toBeTruthy();
  });

  it('shows unauthorized when permission denied', async () => {
    (useAuthStore as any).mockReturnValue({ hasPermission: () => false, user: { name: 'User' } });
    const AdminSettings = (await import('../pages/admin/AdminSettings')).default;
    render(<AdminSettings />);
    expect(screen.getByText('Unauthorized')).toBeTruthy();
  });

  it('renders save settings button for managers', async () => {
    const AdminSettings = (await import('../pages/admin/AdminSettings')).default;
    render(<AdminSettings />);
    expect(screen.getByText('Save Settings')).toBeTruthy();
  });
});
