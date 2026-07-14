import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { adminService } from '../services/adminService';

vi.mock('../stores/authStore', () => ({ useAuthStore: vi.fn() }));
vi.mock('../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../pages/Unauthorized', () => ({ default: () => <div>Unauthorized</div> }));

const mockAuditResult = {
  entries: [
    { id: '1', tenant_id: 't1', event_type: 'LOGIN', action: 'INSERT', table_name: 'users', record_id: 'u1', severity: 'INFO', ip_address: '127.0.0.1', created_at: '2026-01-01T00:00:00Z' }
  ],
  total: 1, page: 1, page_size: 25
};

describe('AuditCenter', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ hasPermission: () => true, user: { name: 'Admin' } });
    (useUIStore as any).mockReturnValue({ language: 'en' });
    vi.spyOn(adminService, 'getAuditLogs').mockResolvedValue(mockAuditResult);
    vi.spyOn(adminService, 'exportAuditLogs').mockResolvedValue(new Blob());
  });

  it('renders audit center heading', async () => {
    const AuditCenter = (await import('../pages/admin/AuditCenter')).default;
    render(<AuditCenter />);
    expect(screen.getByText('Audit Center')).toBeTruthy();
  });

  it('renders export button when user has export permission', async () => {
    const AuditCenter = (await import('../pages/admin/AuditCenter')).default;
    render(<AuditCenter />);
    expect(screen.getByText('Export CSV')).toBeTruthy();
  });

  it('shows unauthorized for users without audit.view', async () => {
    (useAuthStore as any).mockReturnValue({ hasPermission: (p: string) => p !== 'audit.view', user: { name: 'User' } });
    const AuditCenter = (await import('../pages/admin/AuditCenter')).default;
    render(<AuditCenter />);
    expect(screen.getByText('Unauthorized')).toBeTruthy();
  });

  it('renders filter button', async () => {
    const AuditCenter = (await import('../pages/admin/AuditCenter')).default;
    render(<AuditCenter />);
    expect(screen.getByText('Filter')).toBeTruthy();
  });
});
