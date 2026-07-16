// Global typescript definitions for Pikud360

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: Record<string, any>;
}

export interface ApiErrorEnvelope {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  avatarUrl?: string;
  languagePreference?: 'en' | 'he';
}

export interface SystemHealthStatus {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  timestamp: number;
}

export interface OrganizationUnit {
  id: string;
  name: string;
  code: string;
  children?: OrganizationUnit[];
}
