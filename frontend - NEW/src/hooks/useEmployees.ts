import { useState, useCallback } from "react";
import apiClient, { getCached, setCache } from "@/config/api.client";
import * as endpoints from "@/config/employees.endpoints";
import * as attEndpoints from "@/config/attendance.endpoints";
import {
  ATTENDANCE_ROSTER_MATRIX_ENDPOINT,
  ATTENDANCE_ROSTER_UPDATE_ENDPOINT,
  ATTENDANCE_ROSTER_VERIFY_ENDPOINT,
} from "@/config/attendance.endpoints";
import type { CreateEmployeePayload, Employee } from "@/types/employee.types";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [chatContacts, setChatContacts] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat contacts
  const fetchChatContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Employee[]>("/employees/chat-contacts");
      setChatContacts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch chat contacts");
    } finally {
      setLoading(false);
    }
  }, []);
  const [isUpdatingScope, setIsUpdatingScope] = useState<boolean>(false);

  // Log status for a scope (Team/Section/Department)
  const logScopeStatus = async (
    scope_type: "team" | "section" | "department",
    scope_id: number,
    status_type_id: number,
    start_date: string,
    end_date: string,
    note?: string,
  ) => {
    setIsUpdatingScope(true);
    try {
      await apiClient.post(attEndpoints.ATTENDANCE_BULK_SCOPE_ENDPOINT, {
        scope_type,
        scope_id,
        status_type_id,
        start_date,
        end_date,
        note,
      });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to log scope status");
      return false;
    } finally {
      setIsUpdatingScope(false);
    }
  };

  // Fetch all employees
  const fetchEmployees = useCallback(
    async (
      search?: string,
      dept_id?: number,
      include_inactive?: boolean,
      status_id?: number | string,
      section_id?: number,
      team_id?: number,
      date?: string,
      service_types?: string[],
      status_id_param?: number | string,
      min_age?: number,
      max_age?: number,
      status_name?: string,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (dept_id) params.append("dept_id", dept_id.toString());
        if (include_inactive) params.append("include_inactive", "true");
        if (status_id !== undefined && status_id !== null)
          params.append("status_id", status_id.toString());
        if (status_id_param !== undefined && status_id_param !== null)
          params.append("status_id", status_id_param.toString());
        if (status_name) params.append("status_name", status_name);
        if (section_id) params.append("section_id", section_id.toString());
        if (team_id) params.append("team_id", team_id.toString());
        if (date) params.append("date", date);
        if (service_types && service_types.length > 0) {
          params.append("serviceTypes", service_types.join(","));
        }
        if (min_age) params.append("min_age", min_age.toString());
        if (max_age) params.append("max_age", max_age.toString());

        const { data } = await apiClient.get<Employee[]>(
          `${endpoints.EMPLOYEES_BASE_ENDPOINT}?${params}`,
        );
        setEmployees(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch employees");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Create Employee
  const createEmployee = async (payload: CreateEmployeePayload) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.EMPLOYEES_BASE_ENDPOINT, payload);
      await fetchEmployees(); // Refresh list after create
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create employee");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update Employee
  const updateEmployee = async (id: number, payload: any) => {
    setLoading(true);
    try {
      await apiClient.put(endpoints.updateEmployeeEndpoint(id), payload);
      await fetchEmployees(); // Refresh list
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete Employee
  const deleteEmployee = async (id: number) => {
    if (!confirm("Are you sure?")) return;

    setLoading(true);
    try {
      await apiClient.delete(endpoints.deleteEmployeeEndpoint(id));
      await fetchEmployees(); // Refresh list
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get Organization Structure (cached 30s)
  const getStructure = useCallback(async (full = false) => {
    const cacheKey = full ? "structure_full" : "structure";
    const cached = getCached(cacheKey);
    if (cached) return cached;
    try {
      const url = full
        ? `${endpoints.EMPLOYEES_STRUCTURE_ENDPOINT}?full=true`
        : endpoints.EMPLOYEES_STRUCTURE_ENDPOINT;
      const { data } = await apiClient.get(url);
      setCache(cacheKey, data);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch structure", err);
      return [];
    }
  }, []);

  // Get Service Types (cached 30s)
  const getServiceTypes = useCallback(async () => {
    const cached = getCached("serviceTypes");
    if (cached) return cached;
    try {
      const { data } = await apiClient.get(endpoints.EMPLOYEES_SERVICE_TYPES_ENDPOINT);
      setCache("serviceTypes", data);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch service types", err);
      return [];
    }
  }, []);

  // Get Status Types (Attendance) — cached 30s
  const getStatusTypes = useCallback(async () => {
    const cached = getCached("statusTypes");
    if (cached) return cached;
    try {
      const { data } = await apiClient.get(attEndpoints.ATTENDANCE_STATUS_TYPES_ENDPOINT);
      setCache("statusTypes", data);
      return data;
    } catch (err: any) {
      console.error("Failed to fetch status types", err);
      return [];
    }
  }, []);

  // Get Dashboard Stats & Birthdays
  const getDashboardStats = useCallback(
    async (filters?: {
      department_id?: string;
      section_id?: string;
      team_id?: string;
      status_id?: string;
      date?: string;
      serviceTypes?: string;
      min_age?: number;
      max_age?: number;
    }) => {
      try {
        const params = new URLSearchParams();
        if (filters?.department_id)
          params.append("department_id", filters.department_id);
        if (filters?.section_id)
          params.append("section_id", filters.section_id);
        if (filters?.team_id) params.append("team_id", filters.team_id);
        if (filters?.status_id) params.append("status_id", filters.status_id);
        if (filters?.date) params.append("date", filters.date);
        if (filters?.serviceTypes)
          params.append("serviceTypes", filters.serviceTypes);
        if (filters?.min_age)
          params.append("min_age", filters.min_age.toString());
        if (filters?.max_age)
          params.append("max_age", filters.max_age.toString());

        const { data } = await apiClient.get(
          `${attEndpoints.ATTENDANCE_STATS_ENDPOINT}?${params}`,
        );
        return data;
      } catch (err: any) {
        console.error("Failed to fetch dashboard stats", err);
        return { stats: [], birthdays: [] };
      }
    },
    [],
  );

  // Log Attendance Status
  const logStatus = async (payload: {
    employee_id: number;
    status_type_id: number;
    note?: string;
    start_date?: string;
    end_date?: string;
    delegation?: { delegate_id: number };
  }) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        attEndpoints.ATTENDANCE_LOG_ENDPOINT,
        payload,
      );
      await fetchEmployees(); // Refresh list to see updated status
      return data;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to log status");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Bulk Log Attendance Status
  const logBulkStatus = async (
    updates: {
      employee_id: number;
      status_type_id: number;
      start_date?: string;
      end_date?: string;
      note?: string;
    }[],
  ) => {
    setLoading(true);
    try {
      await apiClient.post(attEndpoints.ATTENDANCE_BULK_LOG_ENDPOINT, {
        updates,
      });
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to bulk log status");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mark Birthday Sent
  const markBirthdaySent = async (empId: number) => {
    try {
      await apiClient.post(endpoints.markBirthdaySentEndpoint(empId));
      return true;
    } catch (err: any) {
      console.error("Failed to mark birthday sent", err);
      return false;
    }
  };

  // Update Preferences
  const updatePreferences = async (prefs: {
    theme?: string;
    accent_color?: string;
    font_size?: string;
  }) => {
    try {
      await apiClient.put(endpoints.EMPLOYEES_PREFERENCES_ENDPOINT, prefs);
      return true;
    } catch (err: any) {
      console.error("Failed to update preferences", err);
      return false;
    }
  };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getStructure,
    getServiceTypes,
    getStatusTypes,
    getRoles: useCallback(async () => {
      try {
        const { data } = await apiClient.get(
          endpoints.EMPLOYEES_ROLES_ENDPOINT,
        );
        return data;
      } catch (err: any) {
        console.error("Failed to fetch roles", err);
        return [];
      }
    }, []),
    getEmployeeById: useCallback(async (id: number) => {
      try {
        const { data } = await apiClient.get<Employee>(
          endpoints.getEmployeeByIdEndpoint(id),
        );
        return data;
      } catch (err: any) {
        console.error("Failed to fetch employee", err);
        return null;
      }
    }, []),
    logStatus,
    logBulkStatus,
    getDashboardStats,
    getComparisonStats: useCallback(
      async (
        date?: string,
        days: number = 1,
        filters?: {
          department_id?: string;
          section_id?: string;
          team_id?: string;
          status_id?: string;
          serviceTypes?: string;
          min_age?: number;
          max_age?: number;
        },
      ) => {
        try {
          const params = new URLSearchParams();
          if (date) params.append("date", date);
          if (days) params.append("days", days.toString());
          if (filters?.department_id)
            params.append("department_id", filters.department_id);
          if (filters?.section_id)
            params.append("section_id", filters.section_id);
          if (filters?.team_id) params.append("team_id", filters.team_id);
          if (filters?.status_id) params.append("status_id", filters.status_id);
          if (filters?.serviceTypes)
            params.append("serviceTypes", filters.serviceTypes);
          if (filters?.min_age)
            params.append("min_age", filters.min_age.toString());
          if (filters?.max_age)
            params.append("max_age", filters.max_age.toString());

          const { data } = await apiClient.get(
            `${attEndpoints.ATTENDANCE_STATS_ENDPOINT}/comparison?${params}`,
          );
          return data;
        } catch (err: any) {
          console.error("Failed to fetch comparison stats", err);
          return [];
        }
      },
      [],
    ),
    getTrendStats: useCallback(
      async (
        days = 7,
        date?: string,
        filters?: {
          department_id?: string;
          section_id?: string;
          team_id?: string;
          status_id?: string;
          serviceTypes?: string;
          min_age?: number;
          max_age?: number;
        },
      ) => {
        try {
          const params = new URLSearchParams();
          params.append("days", days.toString());
          if (date) params.append("date", date);
          if (filters?.department_id)
            params.append("department_id", filters.department_id);
          if (filters?.section_id)
            params.append("section_id", filters.section_id);
          if (filters?.team_id) params.append("team_id", filters.team_id);
          if (filters?.status_id) params.append("status_id", filters.status_id);
          if (filters?.serviceTypes)
            params.append("serviceTypes", filters.serviceTypes);
          if (filters?.min_age)
            params.append("min_age", filters.min_age.toString());
          if (filters?.max_age)
            params.append("max_age", filters.max_age.toString());

          const { data } = await apiClient.get(
            `${attEndpoints.ATTENDANCE_STATS_ENDPOINT}/trend?${params}`,
          );
          return data;
        } catch (err: any) {
          console.error("Failed to fetch trend stats", err);
          return [];
        }
      },
      [],
    ),
    getCalendarStats: useCallback(async (year: number, month: number) => {
      try {
        const { data } = await apiClient.get(
          `${attEndpoints.ATTENDANCE_CALENDAR_ENDPOINT}?year=${year}&month=${month}`,
        );
        return data;
      } catch (err: any) {
        console.error("Failed to fetch calendar stats", err);
        return {};
      }
    }, []),
    markBirthdaySent,
    getDelegationCandidates: useCallback(async () => {
      try {
        const { data } = await apiClient.get<Partial<Employee>[]>(
          `${endpoints.EMPLOYEES_BASE_ENDPOINT}/delegation-candidates`,
        );
        return data;
      } catch (err: any) {
        console.error("Failed to fetch delegation candidates", err);
        return [];
      }
    }, []),
    updatePreferences,
    cancelDelegation: async (delegationId?: number) => {
      setLoading(true);
      try {
        await apiClient.post(endpoints.EMPLOYEES_CANCEL_DELEGATION_ENDPOINT, {
          delegation_id: delegationId,
        });
        await fetchEmployees();
        return true;
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to cancel delegation");
        return false;
      } finally {
        setLoading(false);
      }
    },
    getRosterMatrix: useCallback(
      async (start_date: string, end_date: string, filters?: any) => {
        try {
          const params = new URLSearchParams();
          params.append("start_date", start_date);
          params.append("end_date", end_date);
          if (filters?.department_id)
            params.append("department_id", filters.department_id);
          if (filters?.section_id)
            params.append("section_id", filters.section_id);
          if (filters?.team_id) params.append("team_id", filters.team_id);

          const { data } = await apiClient.get(
            `${ATTENDANCE_ROSTER_MATRIX_ENDPOINT}?${params}`,
          );
          return data;
        } catch (err: any) {
          console.error("Failed to fetch roster matrix", err);
          return { employees: [], logs: [] };
        }
      },
      [],
    ),

    updateRoster: async (
      employee_id: number,
      status_id: number,
      start_date: string,
      end_date?: string,
    ) => {
      setLoading(true);
      try {
        await apiClient.post(ATTENDANCE_ROSTER_UPDATE_ENDPOINT, {
          employee_id,
          status_id,
          start_date,
          end_date,
        });
        await fetchEmployees(); // Ensure roster updates are reflected if we view today
        return true;
      } catch (err: any) {
        console.error("Failed to update roster", err);
        setError(err.response?.data?.error || "Failed to update roster");
        return false;
      } finally {
        setLoading(false);
      }
    },

    verifyRoster: async (date: string, employee_ids?: number[]) => {
      setLoading(true);
      try {
        await apiClient.post(ATTENDANCE_ROSTER_VERIFY_ENDPOINT, {
          date,
          employee_ids,
        });
        await fetchEmployees();
        return true;
      } catch (err: any) {
        console.error("Failed to verify roster", err);
        setError(err.response?.data?.error || "Failed to verify roster");
        return false;
      } finally {
        setLoading(false);
      }
    },

    createRestoreRequest: async (date: string, reason: string) => {
      try {
        await apiClient.post("/archive/restore-request", {
          start_date: date,
          end_date: date,
          reason,
        });
        return true;
      } catch (err: any) {
        console.error("Failed to create restore request", err);
        throw err;
      }
    },
    logScopeStatus,
    isUpdatingScope,
    chatContacts,
    fetchChatContacts,
  };
};
