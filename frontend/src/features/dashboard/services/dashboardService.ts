import { apiClient } from "../../../api/client";
import { EmployeeTransfer, SystemNotification } from "../../../services/workforceService";

export interface BackendSummaryData {
  total_personnel: number;
  assigned: number;
  unassigned: number;
  availability_percentage: number;
  sick_percentage: number;
  training_percentage: number;
  mission_percentage: number;
  shortage_index: number;
  status_distribution: Record<string, number>;
  child_units: {
    unit_id: string;
    unit_name: string;
    total_personnel: number;
    assigned: number;
    unassigned: number;
    status_distribution: Record<string, number>;
  }[];
  alerts: {
    id: string;
    tenant_id: string;
    organization_unit_id: string;
    alert_type: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
    message: string;
    status: string;
    created_at: string;
    resolved_at?: string;
  }[];
  transfers_count: number;
}

export const dashboardService = {
  getSummary: async (unitId: string, date: string, range = "day"): Promise<BackendSummaryData> => {
    const res = await apiClient.get("/api/dashboard/summary", {
      params: { unit_id: unitId, date, range },
    });
    return (res as any).data || res;
  },

  getNotifications: async (): Promise<SystemNotification[]> => {
    const res = await apiClient.get("/api/notifications");
    return (res as any).data || res;
  },

  getTransfers: async (): Promise<EmployeeTransfer[]> => {
    const res = await apiClient.get("/api/transfers");
    return (res as any).data || res;
  },

  getOrganizationUnits: async (): Promise<any[]> => {
    const res = await apiClient.get("/api/organization/units");
    return (res as any).data || res;
  },
};
