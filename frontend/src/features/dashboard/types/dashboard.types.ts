export interface KpiMetric {
  title: string;
  value: string | number;
  subtext?: string;
  type: "total" | "available" | "unavailable" | "unknown";
}

export interface DepartmentProgress {
  department: string;
  percentage: number;
  current: number;
  total: number;
}

export interface AvailabilityTrendPoint {
  date: string;
  value: number;
}

export interface AgeDistributionPoint {
  group: string;
  count: number;
}

export interface BirthdayItem {
  id: number;
  name: string;
  initials: string;
  dateStr: string;
  phone?: string;
}

export interface StatusDistributionItem {
  name: string;
  value: number;
  color: string;
  percent: string;
}

export interface DashboardData {
  totalEmployees: number;
  availableEmployees: number;
  unavailableEmployees: number;
  unknownEmployees: number;
  departmentProgress: DepartmentProgress[];
  availabilityTrend: AvailabilityTrendPoint[];
  ageDistribution: AgeDistributionPoint[];
  averageAge: number;
  birthdays: BirthdayItem[];
  statusDistribution: StatusDistributionItem[];
}
