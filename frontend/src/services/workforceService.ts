import { apiClient } from '../api/client';

export interface EmployeeTransfer {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  from_unit_id: string;
  from_unit_name: string;
  to_unit_id: string;
  to_unit_name: string;
  requested_by: string;
  approved_by?: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
}

export interface SystemNotification {
  id: string;
  tenant_id: string;
  organization_unit_id?: string;
  user_id?: string;
  notification_type: string;
  severity: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
  message: string;
  status: 'UNREAD' | 'READ';
  created_at: string;
  read_at?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'HISTORY_CHANGE' | 'TRANSFER';
  change_type?: string;
  org_unit_id?: string;
  org_unit_name?: string;
  rank?: string;
  position?: string;
  status?: string;
  snapshot?: any;
  timestamp: string;
  operator: string;
  from_unit_name?: string;
  to_unit_name?: string;
  reason?: string;
  requested_by?: string;
  approved_by?: string;
  completed_at?: string;
}

export interface CalendarDayStats {
  date: string;
  total_employees: number;
  assigned: number;
  unassigned: number;
  status_distribution: Record<string, number>;
}

export interface SnapshotAssignment {
  employee_id: string;
  display_name: string;
  rank: string;
  role: string;
  organization_unit: string;
  status: string;
  shift?: string;
}

export interface SnapshotData {
  date: string;
  total_personnel: number;
  statuses: Record<string, number>;
  organization_breakdown: Record<string, number>;
  assignments: SnapshotAssignment[];
}

export const workforceService = {
  // --- Transfers ---
  getTransfers: async (): Promise<EmployeeTransfer[]> => {
    const res = await apiClient.get('/api/transfers');
    return (res as any).data;
  },

  requestTransfer: async (employeeId: string, toUnitId: string, reason?: string): Promise<EmployeeTransfer> => {
    const res = await apiClient.post('/api/transfers', {
      employee_id: employeeId,
      to_unit_id: toUnitId,
      reason
    });
    return (res as any).data;
  },

  approveTransfer: async (transferId: string): Promise<EmployeeTransfer> => {
    const res = await apiClient.put(`/api/transfers/${transferId}/approve`);
    return (res as any).data;
  },

  rejectTransfer: async (transferId: string): Promise<EmployeeTransfer> => {
    const res = await apiClient.put(`/api/transfers/${transferId}/reject`);
    return (res as any).data;
  },

  cancelTransfer: async (transferId: string): Promise<EmployeeTransfer> => {
    const res = await apiClient.put(`/api/transfers/${transferId}/cancel`);
    return (res as any).data;
  },

  // --- Notifications ---
  getNotifications: async (status?: 'UNREAD' | 'READ'): Promise<SystemNotification[]> => {
    const params = status ? { status } : {};
    const res = await apiClient.get('/api/notifications', { params });
    return (res as any).data;
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    await apiClient.put(`/api/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.put('/api/notifications/read-all');
  },

  // --- Employee History Timeline ---
  getEmployeeHistory: async (employeeId: string): Promise<TimelineEvent[]> => {
    const res = await apiClient.get(`/api/employees/${employeeId}/history`);
    return (res as any).data;
  },

  // --- Calendar ---
  getSchedulingCalendar: async (unitId: string, startDate: string, endDate: string): Promise<CalendarDayStats[]> => {
    const res = await apiClient.get('/api/scheduling/calendar', {
      params: { unit_id: unitId, start_date: startDate, end_date: endDate }
    });
    return (res as any).data;
  },

  // --- Snapshot ---
  getSchedulingSnapshot: async (unitId: string, date: string): Promise<SnapshotData> => {
    const res = await apiClient.get('/api/scheduling/snapshot', {
      params: { unit_id: unitId, date }
    });
    return (res as any).data;
  }
};
