export interface StatusType {
  id: number;
  name: string;
  color: string;
  is_presence: boolean;
}

export interface AttendanceLog {
  id: number;
  employee_id: number;
  status_type_id: number;
  status_name: string;
  color: string;
  start_datetime: string;
  end_datetime: string | null;
  note: string | null;
  reported_by: number | null;
}

export interface DashboardStat {
  status_name: string;
  count: number;
  color: string;
}

export interface BirthdayInfo {
  first_name: string;
  last_name: string;
  birth_date: string;
  day: number;
  month: number;
}

export interface DashboardData {
  stats: DashboardStat[];
  birthdays: BirthdayInfo[];
}

export interface CalendarDaySummary {
  date: string;
  status: string;
  color: string;
  count: number;
}