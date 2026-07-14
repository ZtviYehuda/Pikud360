import { apiClient } from '../api/client';

export interface ScheduleStatus {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  category: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
}

export interface ScheduleSettings {
  id: string;
  tenant_id: string;
  organization_unit_id: string;
  scheduling_mode: 'DIRECT_STATUS' | 'SHIFT_BASED';
  unassigned_threshold?: number;
  sick_threshold?: number;
  shortage_threshold?: number;
}

export interface ShiftType {
  id: string;
  tenant_id: string;
  organization_unit_id: string;
  name: string;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface EmployeeDailySchedule {
  id: string;
  tenant_id: string;
  employee_id: string;
  organization_unit_id: string;
  schedule_date: string;
  status_id: string;
  shift_type_id?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_by_commander_id?: string;
  updated_by_commander_id?: string;
}

export interface ChildUnitSummary {
  unit_id: string;
  unit_name: string;
  total_employees: number;
  assigned_employees: number;
  unassigned_employees: number;
}

export interface DailyDashboardSummary {
  date: string;
  total_employees: number;
  assigned_employees: number;
  unassigned_employees: number;
  statuses: Record<string, number>;
  shifts?: Record<string, number>;
  child_units?: ChildUnitSummary[];
}

export interface UnitEmployee {
  employee_id: string;
  display_name: string;
  rank: string;
  role: string;
  organization_unit: {
    id: string;
    name: string;
  };
  daily_assignment: {
    id: string;
    status_id: string;
    status_code: string;
    status_name: string;
    color: string;
    shift_type_id?: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
  } | null;
}

export const schedulingService = {
  // --- Statuses Management ---
  getStatuses: async (): Promise<ScheduleStatus[]> => {
    const res = await apiClient.get('/api/scheduling/statuses');
    return (res as any).data;
  },

  getOrganizationTree: async (): Promise<any[]> => {
    const res = await apiClient.get('/api/organization/units');
    return (res as any).data;
  },

  getUnitEmployees: async (unitId: string, dateStr: string): Promise<UnitEmployee[]> => {
    const res = await apiClient.get(`/api/scheduling/unit/${unitId}/employees`, {
      params: { date: dateStr }
    });
    return (res as any).data;
  },

  createStatus: async (payload: {
    code: string;
    name: string;
    category: string;
    color?: string;
    sort_order?: number;
  }): Promise<ScheduleStatus> => {
    const res = await apiClient.post('/api/scheduling/statuses', payload);
    return (res as any).data;
  },

  updateStatus: async (
    id: string,
    payload: {
      name?: string;
      category?: string;
      color?: string;
      sort_order?: number;
      is_active?: boolean;
    }
  ): Promise<ScheduleStatus> => {
    const res = await apiClient.put(`/api/scheduling/statuses/${id}`, payload);
    return (res as any).data;
  },

  deleteStatus: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await apiClient.delete(`/api/scheduling/statuses/${id}`);
    return (res as any).data;
  },

  // --- Assignments ---
  getDailyAssignments: async (dateStr: string, unitId: string): Promise<EmployeeDailySchedule[]> => {
    const res = await apiClient.get(`/api/scheduling/date/${dateStr}`, {
      params: { unit_id: unitId },
    });
    return (res as any).data;
  },

  assignStatus: async (payload: {
    employee_id: string;
    organization_unit_id: string;
    schedule_date: string;
    status_id: string;
    shift_type_id?: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
  }): Promise<EmployeeDailySchedule> => {
    const res = await apiClient.post('/api/scheduling/assign', payload);
    return (res as any).data;
  },

  updateAssignment: async (
    id: string,
    payload: {
      status_id?: string;
      shift_type_id?: string;
      start_time?: string;
      end_time?: string;
      notes?: string;
    }
  ): Promise<EmployeeDailySchedule> => {
    const res = await apiClient.put(`/api/scheduling/assign/${id}`, payload);
    return (res as any).data;
  },

  deleteAssignment: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await apiClient.delete(`/api/scheduling/assign/${id}`);
    return (res as any).data;
  },

  bulkAssign: async (payload: {
    organization_unit_id: string;
    date: string;
    status_id: string;
    employee_ids: string[];
  }): Promise<EmployeeDailySchedule[]> => {
    const res = await apiClient.post('/api/scheduling/bulk', payload);
    return (res as any).data;
  },

  // --- Dashboard Aggregates ---
  getDashboardSummary: async (unitId: string, dateStr: string): Promise<DailyDashboardSummary> => {
    const res = await apiClient.get(`/api/scheduling/dashboard/${unitId}/${dateStr}`);
    return (res as any).data;
  },

  // --- Configuration & Shifts ---
  getSettings: async (unitId: string): Promise<ScheduleSettings> => {
    const res = await apiClient.get(`/api/scheduling/settings/${unitId}`);
    return (res as any).data;
  },

  updateSettings: async (
    unitId: string,
    payload: {
      scheduling_mode: 'DIRECT_STATUS' | 'SHIFT_BASED';
      unassigned_threshold?: number;
      sick_threshold?: number;
      shortage_threshold?: number;
    }
  ): Promise<ScheduleSettings> => {
    const res = await apiClient.put(`/api/scheduling/settings/${unitId}`, payload);
    return (res as any).data;
  },

  // --- Commander Intelligence Dashboard ---
  getCommanderDashboardSummary: async (
    unitId: string,
    dateStr: string,
    rangeStr: 'day' | 'week' | 'month'
  ): Promise<{
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
      alert_type: string;
      severity: 'INFO' | 'WARNING' | 'CRITICAL';
      message: string;
      status: 'ACTIVE' | 'RESOLVED';
      created_at: string;
    }[];
    transfers_count: number;
  }> => {
    const res = await apiClient.get('/api/dashboard/summary', {
      params: { unit_id: unitId, date: dateStr, range: rangeStr }
    });
    return (res as any).data;
  },

  createShiftType: async (
    unitId: string,
    payload: {
      name: string;
      start_time: string;
      end_time: string;
    }
  ): Promise<ShiftType> => {
    const res = await apiClient.post(`/api/scheduling/shifts/${unitId}`, payload);
    return (res as any).data;
  },

  getShiftTypes: async (unitId: string): Promise<ShiftType[]> => {
    // Falls back to fetch settings sub-shifts logic if needed, but we can query them from settings endpoint data
    // Let's call our createShiftType endpoints directly, or mock them via getShiftTypes.
    // In our backend repositories, we implemented `get_shift_types` method. We can add a route to retrieve shift types:
    // Actually we can list them from settings response if needed, or query settings which initializes shifts.
    // Let's assume we can fetch them via a GET to /api/scheduling/shifts/<unit_id>. 
    // Wait! Let's check backend route GET/POST shift types in routes.py!
    // In backend/app/modules/workforce_schedule/routes.py, did we define a GET shift list endpoint?
    // Let's check routes.py around line 350 to see shifts routes.
    // Yes! `create_unit_shift` is POST `/shifts/<unit_id>`. But there is no explicit GET shifts route there!
    // But wait! We can fetch settings or query them. Since `get_daily_workforce_summary` fetches them, let's add a GET shifts endpoint to routes.py if missing, or we can query settings.
    // Actually, in our frontend we can fetch settings which includes shift types, or add the GET endpoint.
    // Wait, let's look at workforce_schedule/routes.py. Let's see if we want to add GET `/shifts/<unit_id>`!
    // Yes, that is very helpful to show a list of shifts on settings screen! Let's write the service wrapper for it.
    const res = await apiClient.get(`/api/scheduling/shifts/${unitId}`);
    return (res as any).data;
  }
};
