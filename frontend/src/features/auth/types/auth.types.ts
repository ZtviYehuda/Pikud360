export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  phone_number?: string | null;
  email?: string | null;
  must_change_password?: boolean;
  is_admin?: boolean;
  is_commander?: boolean;
  is_temp_commander?: boolean;
  department_id?: number;
  section_id?: number;
  team_id?: number;
  department_name?: string | null;
  section_name?: string | null;
  team_name?: string | null;
  role_name?: string | null;
  service_type_name?: string | null;
  police_license?: boolean;
  security_clearance?: boolean;
  theme?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  username: string;
  password?: string;
  rememberMe?: boolean;
}
