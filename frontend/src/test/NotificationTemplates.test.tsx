import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { adminService } from '../services/adminService';

vi.mock('../stores/authStore', () => ({ useAuthStore: vi.fn() }));
vi.mock('../stores/uiStore', () => ({ useUIStore: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../pages/Unauthorized', () => ({ default: () => <div>Unauthorized</div> }));

const mockTemplates = [
  { id: 't1', tenant_id: 'ten1', name: 'Transfer Requested', notification_type: 'TRANSFER_REQUESTED', channel: 'EMAIL', subject: 'Transfer request', body_template: 'Request for {{name}}', variables_json: ['name'], is_active: true, is_default: true }
];

describe('NotificationTemplates', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ hasPermission: () => true, user: { name: 'Admin' } });
    (useUIStore as any).mockReturnValue({ language: 'en' });
    vi.spyOn(adminService, 'getNotificationTemplates').mockResolvedValue(mockTemplates);
  });

  it('renders notification templates heading', async () => {
    const NotificationTemplates = (await import('../pages/admin/NotificationTemplates')).default;
    render(<NotificationTemplates />);
    expect(screen.getByText('Notification Templates')).toBeTruthy();
  });

  it('shows templates list', async () => {
    const NotificationTemplates = (await import('../pages/admin/NotificationTemplates')).default;
    render(<NotificationTemplates />);
    expect(await screen.findByText('Transfer Requested')).toBeTruthy();
  });

  it('shows unauthorized when permission denied', async () => {
    (useAuthStore as any).mockReturnValue({ hasPermission: (p: string) => p !== 'notification_templates.view', user: { name: 'User' } });
    const NotificationTemplates = (await import('../pages/admin/NotificationTemplates')).default;
    render(<NotificationTemplates />);
    expect(screen.getByText('Unauthorized')).toBeTruthy();
  });
});
