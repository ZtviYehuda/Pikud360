export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string | null;
  email?: string | null;
  must_change_password: boolean;
  is_admin: boolean;
  is_commander: boolean;
  department_id?: number;
  section_id?: number;
  team_id?: number;
  assigned_department_id?: number;
  assigned_section_id?: number;
  commands_department_id?: number;
  commands_section_id?: number;
  commands_team_id?: number;
  notif_sick_leave?: boolean;
  notif_transfers?: boolean;
  notif_morning_report?: boolean;
  city?: string | null;
  birth_date?: string | null;
  emergency_contact?: string | null;
  department_name?: string | null;
  section_name?: string | null;
  team_name?: string | null;
  role_name?: string | null;
  service_type_name?: string | null;
  is_impersonated?: boolean;
  enlistment_date?: string | null;
  discharge_date?: string | null;
  assignment_date?: string | null;
  police_license?: boolean;
  security_clearance?: boolean;
  last_password_change?: string | null;
  is_temp_commander?: boolean;
  active_delegate_id?: number;
  theme?: string;
  accent_color?: string;
  font_size?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}
