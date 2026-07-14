/**
 * Admin Service — API client for all /api/admin/* endpoints.
 * Follows the same pattern as schedulingService.ts and workforceService.ts.
 */
import { apiClient } from '../api/client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

export interface BusinessRule {
  id: string;
  tenant_id: string;
  rule_type: string;
  name: string;
  description?: string;
  organization_unit_id?: string;
  condition_json: Record<string, unknown>;
  action_json: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  trigger_event: string;
  condition_json: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  schedule_cron?: string;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  notification_type: string;
  channel: string;
  subject?: string;
  body_template: string;
  variables_json: string[];
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  user_id?: string;
  event_type: string;
  action: string;
  table_name: string;
  record_id?: string;
  severity: string;
  ip_address: string;
  created_at: string;
  new_values?: Record<string, unknown>;
}

export interface AuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface SystemHealth {
  database: string;
  api: string;
  audit_volume_24h: number;
  active_sessions: number;
  recent_errors: number;
  checked_at: string;
}

export interface AuditFilters {
  page?: number;
  page_size?: number;
  event_type?: string;
  severity?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  // System Settings
  getSettings: async (): Promise<SystemSetting[]> => {
    const res = await apiClient.get('/api/admin/settings');
    return res.data?.data ?? [];
  },

  updateSettings: async (settings: { key: string; value: string }[]): Promise<SystemSetting[]> => {
    const res = await apiClient.put('/api/admin/settings', { settings });
    return res.data?.data ?? [];
  },

  // Business Rules
  getBusinessRules: async (activeOnly = false): Promise<BusinessRule[]> => {
    const res = await apiClient.get(`/api/admin/business-rules?active_only=${activeOnly}`);
    return res.data?.data ?? [];
  },

  createBusinessRule: async (data: Partial<BusinessRule>): Promise<BusinessRule> => {
    const res = await apiClient.post('/api/admin/business-rules', data);
    return res.data?.data;
  },

  updateBusinessRule: async (id: string, data: Partial<BusinessRule>): Promise<BusinessRule> => {
    const res = await apiClient.put(`/api/admin/business-rules/${id}`, data);
    return res.data?.data;
  },

  deleteBusinessRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/business-rules/${id}`);
  },

  // Automation Rules
  getAutomationRules: async (activeOnly = false): Promise<AutomationRule[]> => {
    const res = await apiClient.get(`/api/admin/automation?active_only=${activeOnly}`);
    return res.data?.data ?? [];
  },

  createAutomationRule: async (data: Partial<AutomationRule>): Promise<AutomationRule> => {
    const res = await apiClient.post('/api/admin/automation', data);
    return res.data?.data;
  },

  updateAutomationRule: async (id: string, data: Partial<AutomationRule>): Promise<AutomationRule> => {
    const res = await apiClient.put(`/api/admin/automation/${id}`, data);
    return res.data?.data;
  },

  deleteAutomationRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/automation/${id}`);
  },

  // Notification Templates
  getNotificationTemplates: async (activeOnly = false): Promise<NotificationTemplate[]> => {
    const res = await apiClient.get(`/api/admin/notification-templates?active_only=${activeOnly}`);
    return res.data?.data ?? [];
  },

  createNotificationTemplate: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const res = await apiClient.post('/api/admin/notification-templates', data);
    return res.data?.data;
  },

  updateNotificationTemplate: async (id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const res = await apiClient.put(`/api/admin/notification-templates/${id}`, data);
    return res.data?.data;
  },

  // Audit Center
  getAuditLogs: async (filters: AuditFilters = {}): Promise<AuditLogResult> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
    const res = await apiClient.get(`/api/admin/audit?${params.toString()}`);
    return {
      entries: res.data?.data ?? [],
      total: res.data?.meta?.total ?? 0,
      page: res.data?.meta?.page ?? 1,
      page_size: res.data?.meta?.page_size ?? 50
    };
  },

  exportAuditLogs: async (filters: Omit<AuditFilters, 'page' | 'page_size'> = {}): Promise<Blob> => {
    const res = await apiClient.post('/api/admin/audit/export', filters, { responseType: 'blob' });
    return res.data;
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    const res = await apiClient.get('/api/admin/system-health');
    return res.data?.data;
  }
};
