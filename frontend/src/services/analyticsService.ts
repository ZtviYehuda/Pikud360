import { apiClient } from '../api/client';

export interface DistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface UnitBreakdownItem {
  unit_id: string;
  unit_name: string;
  total_personnel: number;
  assigned: number;
  unassigned: number;
  status_distribution: DistributionItem[];
}

export interface SummaryData {
  total_personnel: number;
  assigned: number;
  unassigned: number;
  available: number;
  unavailable: number;
  assigned_percentage: number;
  availability_percentage: number;
  absence_percentage: number;
  unassigned_percentage: number;
  active_shift_count: number;
  organization_units: UnitBreakdownItem[];
  child_units: UnitBreakdownItem[];
  status_distribution: DistributionItem[];
  alerts_count: number;
}

export interface AlertData {
  rule_name: string;
  metric: string;
  current_value: number;
  threshold: number;
  operator: string;
  severity: string;
  organization_unit: string;
  is_triggered: boolean;
}

export const analyticsService = {
  getSummary: async (unitId: string, startDate?: string, endDate?: string): Promise<SummaryData> => {
    const params = {
      unit_id: unitId,
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate })
    };
    const res = await apiClient.get('/api/v1/analytics/summary', { params });
    // In our client, successful responses are unwrapped to the envelope.
    // If the interceptor yields response.data on success, we check for .data field.
    return (res as any).data || res;
  },

  getAlerts: async (unitId: string, date?: string): Promise<AlertData[]> => {
    const params = {
      unit_id: unitId,
      ...(date && { date })
    };
    const res = await apiClient.get('/api/v1/analytics/alerts', { params });
    return (res as any).data || res;
  }
};
export default analyticsService;
