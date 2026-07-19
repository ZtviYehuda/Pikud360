
export interface WorkforceSummaryDTO {
  totalPersonnel: number;
  presentCount: number;
  absentCount: number;
  sickCount: number;
  vacationCount: number;
  courseCount: number;
  reinforcementCount: number;
}

export interface AttendanceSummaryDTO {
  reportingDate: string;
  expectedReports: number;
  submittedReports: number;
  percentComplete: number;
  missingSubunits: string[];
}

export interface AlertDTO {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  createdAt: string;
  subunitId?: string;
  actionPath?: string;
}

export interface KPIWidgetDTO {
  kpiId: string;
  name: string;
  score: number;
  threshold: number;
  trendDirection: "UP" | "DOWN" | "STABLE";
}

export interface QuickActionDTO {
  id: string;
  label: string;
  actionType: "NAVIGATE" | "DIALOG";
  target: string;
  requiredPermission?: string;
  iconName?: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityDTO {
  id: string;
  actorName: string;
  actionDescription: string;
  timestamp: string;
  category: "WORKFORCE" | "SCHEDULING" | "SYSTEM";
}

export interface DashboardSummaryDTO {
  workspaceId: string;
  readinessScore: number;
  workforce: WorkforceSummaryDTO;
  attendance: AttendanceSummaryDTO;
  alertsCount: number;
}

export interface ShiftCoverageDTO {
  date: string;
  totalShifts: number;
  filledShifts: number;
  gapsCount: number;
  gapsList: {
    shiftId: string;
    role: string;
    timeSlot: string;
  }[];
}

export interface OrganizationTreeNodeDTO {
  id: string;
  name: string;
  status: "OPTIMAL" | "WARNING" | "CRITICAL";
  readinessScore: number;
  children?: OrganizationTreeNodeDTO[];
}

export interface OrganizationTreeDTO {
  workspaceId: string;
  rootNode: OrganizationTreeNodeDTO;
}

export interface PendingApprovalsDTO {
  count: number;
  requests: {
    requestId: string;
    employeeName: string;
    type: string;
    details: string;
    createdAt: string;
  }[];
}
