import apiClient from "@/config/api.client";
import type {
  SupportDashboardStats,
  SystemHealthData,
  SupportUserListItem,
  SupportUserDossier,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  Announcement,
  AnnouncementPriority,
  SupportActivityItem,
  SystemUpdateItem,
} from "./types";

export const supportApi = {
  // Dashboard stats
  getDashboard: async (): Promise<SupportDashboardStats> => {
    const res = await apiClient.get<{ success: boolean; data: SupportDashboardStats }>("/support/dashboard");
    return res.data.data;
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealthData> => {
    const res = await apiClient.get<{ success: boolean; health: SystemHealthData }>("/support/system-health");
    return res.data.health;
  },

  // Users Directory
  getUsers: async (params?: {
    search?: string;
    role?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: SupportUserListItem[]; total: number }> => {
    const res = await apiClient.get<{ success: boolean; users: SupportUserListItem[]; total: number }>(
      "/support/users",
      { params }
    );
    return { users: res.data.users, total: res.data.total };
  },

  // User Dossier
  getUserDetails: async (userId: string | number): Promise<SupportUserDossier> => {
    const res = await apiClient.get<{ success: boolean; dossier: SupportUserDossier }>(
      `/support/users/${userId}`
    );
    return res.data.dossier;
  },

  // Execute Controlled Action on User
  executeUserAction: async (
    userId: string | number,
    action: "toggle_active" | "reset_password_flag" | "clear_sessions" | "impersonate",
    payload?: Record<string, any>
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const res = await apiClient.post(`/support/users/${userId}/actions`, {
      action,
      payload,
    });
    return res.data;
  },

  // Incidents
  getIncidents: async (params?: {
    status?: string;
    severity?: string;
    limit?: number;
  }): Promise<Incident[]> => {
    const res = await apiClient.get<{ success: boolean; incidents: Incident[] }>("/support/incidents", {
      params,
    });
    return res.data.incidents;
  },

  createIncident: async (data: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    affected_system?: string;
  }): Promise<Incident> => {
    const res = await apiClient.post<{ success: boolean; incident: Incident }>("/support/incidents", data);
    return res.data.incident;
  },

  updateIncident: async (
    id: string,
    data: {
      status?: IncidentStatus;
      severity?: IncidentSeverity;
      note?: string;
    }
  ): Promise<Incident> => {
    const res = await apiClient.put<{ success: boolean; incident: Incident }>(
      `/support/incidents/${id}`,
      data
    );
    return res.data.incident;
  },

  // Announcements
  getAnnouncements: async (params?: { active_only?: boolean }): Promise<Announcement[]> => {
    const res = await apiClient.get<{ success: boolean; announcements: Announcement[] }>(
      "/support/announcements",
      { params }
    );
    return res.data.announcements;
  },

  createAnnouncement: async (data: {
    title: string;
    content: string;
    priority?: AnnouncementPriority;
    target_roles?: string[];
    is_dismissible?: boolean;
    expires_at?: string | null;
  }): Promise<Announcement> => {
    const res = await apiClient.post<{ success: boolean; announcement: Announcement }>(
      "/support/announcements",
      data
    );
    return res.data.announcement;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await apiClient.delete(`/support/announcements/${id}`);
  },

  // Updates & Changelog
  getUpdates: async (): Promise<SystemUpdateItem[]> => {
    const res = await apiClient.get<{ success: boolean; updates: SystemUpdateItem[] }>("/support/updates");
    return res.data.updates;
  },

  // Activity Audit Log
  getActivity: async (params?: {
    event_type?: string;
    severity?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ activity: SupportActivityItem[]; total: number }> => {
    const res = await apiClient.get<{ success: boolean; activity: SupportActivityItem[]; total: number }>(
      "/support/activity",
      { params }
    );
    return { activity: res.data.activity, total: res.data.total };
  },
};
