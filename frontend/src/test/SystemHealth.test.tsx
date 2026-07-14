import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { adminService } from '../services/adminService';

vi.mock('../stores/authStore', () => ({ useAuthStore: vi.fn() }));
vi.mock('../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('../pages/Unauthorized', () => ({ default: () => <div>Unauthorized</div> }));

const mockHealth = {
  database: 'healthy',
  api: 'healthy',
  audit_volume_24h: 150,
  active_sessions: 5,
  recent_errors: 0,
  checked_at: '2026-07-13T12:00:00Z'
};

describe('SystemHealth', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ hasPermission: () => true, user: { name: 'Admin' } });
    (useUIStore as any).mockReturnValue({ language: 'en' });
    vi.spyOn(adminService, 'getSystemHealth').mockResolvedValue(mockHealth);
  });

  it('renders system health heading', async () => {
    const SystemHealth = (await import('../pages/admin/SystemHealth')).default;
    render(<SystemHealth />);
    expect(screen.getByText('System Health')).toBeTruthy();
  });

  it('shows database health card title when loaded', async () => {
    const SystemHealth = (await import('../pages/admin/SystemHealth')).default;
    render(<SystemHealth />);
    expect(await screen.findByText('Database')).toBeTruthy();
  });

  it('shows unauthorized for users without system_health.view', async () => {
    (useAuthStore as any).mockReturnValue({ hasPermission: (p: string) => p !== 'system_health.view', user: { name: 'User' } });
    const SystemHealth = (await import('../pages/admin/SystemHealth')).default;
    render(<SystemHealth />);
    expect(screen.getByText('Unauthorized')).toBeTruthy();
  });
});
