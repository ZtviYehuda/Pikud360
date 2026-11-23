export type IncidentSeverity = "MINOR" | "MAJOR" | "CRITICAL";
export type IncidentStatus = "OPEN" | "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED" | "CLOSED";

export interface IncidentTimelineItem {
  timestamp: string;
  status: IncidentStatus;
  note: string;
  updated_by?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_system: string;
  timeline: IncidentTimelineItem[];
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  target_roles: string[];
  is_dismissible: boolean;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface SupportDashboardStats {
  system_status: "healthy" | "degraded" | "outage";
  database_status: string;
  db_pool_status: {
    min_connections: number;
    max_connections: number;
  };
  open_incidents_count: number;
  open_tickets_count: number;
  failed_logins_24h: number;
  active_sessions_count: number;
  active_announcements_count: number;
  uptime: string;
  uptime_seconds: number;
  app_version: string;
  environment: string;
  server_time: string;
  recent_incidents: Incident[];
}

export interface SystemHealthData {
  status: "healthy" | "degraded" | "outage";
  timestamp: string;
  server: {
    app_version: string;
    environment: string;
    uptime_seconds: number;
    uptime_human: string;
    server_time: string;
  };
  database: {
    status: string;
    latency_ms: number;
    pool: {
      min_connections: number;
      max_connections: number;
    };
  };
  unexposed_metrics: {
    cpu_usage: string;
    memory_usage: string;
    disk_io: string;
    network_traffic: string;
  };
}

export interface SupportUserListItem {
  id: number;
  uuid: string;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string | null;
  phone_number: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  last_login_at: string | null;
  department_name: string | null;
  section_name: string | null;
  role_name: string | null;
}

export interface SupportUserDossier {
  user: SupportUserListItem & {
    department_id?: number | null;
    section_id?: number | null;
    roles?: string[];
  };
  permissions: string[];
  recent_logins: {
    id: string;
    created_at: string;
    ip_address: string;
    action: string;
    status: string;
  }[];
  tickets: {
    id: string;
    subject: string;
    type: string;
    status: string;
    created_at: string;
  }[];
  active_sessions_count: number;
}

export interface SupportActivityItem {
  id: string;
  event_type: string;
  action: string;
  table_name: string;
  record_id: string | null;
  user_name: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  ip_address: string;
  created_at: string;
  details: Record<string, any>;
}

export interface SystemUpdateItem {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  changes: {
    type: "feature" | "fix" | "improvement" | "security";
    text: string;
  }[];
}
