import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService, BackendSummaryData } from "../services/dashboardService";
import {
  mockDashboardSummary,
  mockAlerts,
  mockPendingApprovals,
  mockShiftCoverage,
  mockOrganizationTree,
  mockActivities,
  mockNotifications,
  mockQuickActions,
} from "../mock";
import {
  DashboardSummaryDTO,
  AlertDTO,
  PendingApprovalsDTO,
  ShiftCoverageDTO,
  OrganizationTreeDTO,
  ActivityDTO,
  NotificationDTO,
} from "../types";

export interface DashboardStatesConfig {
  loading?: boolean;
  empty?: boolean;
  error?: boolean;
}

export function useDashboardData(
  unitId: string,
  date: string,
  simulatorConfig: DashboardStatesConfig = {}
) {

  const isSimulating =
    simulatorConfig.loading || simulatorConfig.empty || simulatorConfig.error;

  // ==========================================
  // TanStack Queries (Live Data Calls)
  // ==========================================

  // 1. Dashboard Summary Query
  const summaryQuery = useQuery<BackendSummaryData, Error>({
    queryKey: ["dashboard", "summary", unitId, date],
    queryFn: () => dashboardService.getSummary(unitId, date),
    enabled: !isSimulating && !!unitId && !!date,
    retry: 1,
    refetchInterval: 15000, // Background refresh every 15s
  });

  // 2. Notifications Query
  const notificationsQuery = useQuery({
    queryKey: ["dashboard", "notifications"],
    queryFn: () => dashboardService.getNotifications(),
    enabled: !isSimulating && !!unitId,
    retry: 1,
    refetchInterval: 30000,
  });

  // 3. Transfers Query
  const transfersQuery = useQuery({
    queryKey: ["dashboard", "transfers"],
    queryFn: () => dashboardService.getTransfers(),
    enabled: !isSimulating && !!unitId,
    retry: 1,
    refetchInterval: 30000,
  });

  // 4. Organization Units Query
  const orgUnitsQuery = useQuery({
    queryKey: ["dashboard", "orgUnits"],
    queryFn: () => dashboardService.getOrganizationUnits(),
    enabled: !isSimulating && !!unitId,
    retry: 1,
  });

  // ==========================================
  // Manual Refetch / Force Refresh Trigger
  // ==========================================
  const refetch = React.useCallback(async () => {
    if (isSimulating) {
      return;
    }
    await Promise.all([
      summaryQuery.refetch(),
      notificationsQuery.refetch(),
      transfersQuery.refetch(),
      orgUnitsQuery.refetch(),
    ]);
  }, [isSimulating, summaryQuery, notificationsQuery, transfersQuery, orgUnitsQuery]);

  // ==========================================
  // Simulator Override logic
  // ==========================================
  if (isSimulating) {
    const sLoading = simulatorConfig.loading ?? false;
    const sEmpty = simulatorConfig.empty ?? false;
    const sError = simulatorConfig.error ?? false;

    return {
      loading: sLoading,
      error: sError,
      empty: sEmpty,
      summary: sEmpty
        ? {
            workspaceId: unitId,
            readinessScore: 0,
            workforce: {
              totalPersonnel: 0,
              presentCount: 0,
              absentCount: 0,
              sickCount: 0,
              vacationCount: 0,
              courseCount: 0,
              reinforcementCount: 0,
            },
            attendance: {
              reportingDate: date,
              expectedReports: 0,
              submittedReports: 0,
              percentComplete: 0,
              missingSubunits: [],
            },
            alertsCount: 0,
          }
        : mockDashboardSummary,
      alerts: sEmpty ? [] : mockAlerts,
      pendingApprovals: sEmpty ? { count: 0, requests: [] } : mockPendingApprovals,
      shiftCoverage: sEmpty
        ? { date, totalShifts: 0, filledShifts: 0, gapsCount: 0, gapsList: [] }
        : mockShiftCoverage,
      orgTree: sEmpty
        ? {
            workspaceId: unitId,
            rootNode: {
              id: "root",
              name: "גדוד ריק",
              status: "CRITICAL" as const,
              readinessScore: 0,
              children: [],
            },
          }
        : mockOrganizationTree,
      activities: sEmpty ? [] : mockActivities,
      notifications: sEmpty ? [] : mockNotifications,
      quickActions: mockQuickActions,
      refetch,
    };
  }

  // ==========================================
  // Live State Compilations (DTO Mappings)
  // ==========================================
  const loading =
    summaryQuery.isLoading ||
    notificationsQuery.isLoading ||
    transfersQuery.isLoading ||
    orgUnitsQuery.isLoading;

  const error =
    summaryQuery.isError ||
    notificationsQuery.isError ||
    transfersQuery.isError ||
    orgUnitsQuery.isError;

  const liveSummaryData = summaryQuery.data;

  // 1. Map Workforce Summary
  const workforce: DashboardSummaryDTO["workforce"] = {
    totalPersonnel: liveSummaryData?.total_personnel || 0,
    presentCount: Math.round(liveSummaryData?.status_distribution?.["AVAILABLE"] || 0),
    absentCount: Math.round(liveSummaryData?.status_distribution?.["UNASSIGNED"] || 0),
    sickCount: Math.round(liveSummaryData?.status_distribution?.["SICK"] || 0),
    vacationCount: Math.round(liveSummaryData?.status_distribution?.["VACATION"] || 0),
    courseCount: Math.round(liveSummaryData?.status_distribution?.["TRAINING"] || 0),
    reinforcementCount: Math.round(liveSummaryData?.status_distribution?.["MISSION"] || 0),
  };

  // Calculate absent count as unassigned or the remaining
  if (liveSummaryData) {
    const present = workforce.presentCount;
    const sick = workforce.sickCount;
    const vacation = workforce.vacationCount;
    const course = workforce.courseCount;
    const reinforcement = workforce.reinforcementCount;
    workforce.absentCount = Math.max(
      0,
      workforce.totalPersonnel - (present + sick + vacation + course + reinforcement)
    );
  }

  // 2. Map Attendance Summary
  const missingSubunits = (liveSummaryData?.child_units || [])
    .filter((child) => child.unassigned > 0)
    .map((child) => child.unit_name);

  const attendance: DashboardSummaryDTO["attendance"] = {
    reportingDate: date,
    expectedReports: liveSummaryData?.total_personnel || 0,
    submittedReports: Math.round(liveSummaryData?.assigned || 0),
    percentComplete: liveSummaryData?.total_personnel
      ? Math.round((liveSummaryData.assigned / liveSummaryData.total_personnel) * 100)
      : 0,
    missingSubunits,
  };

  // 3. Map Readiness score
  const readinessScore = liveSummaryData
    ? Math.round(liveSummaryData.availability_percentage)
    : 0;

  const summary: DashboardSummaryDTO = {
    workspaceId: unitId,
    readinessScore,
    workforce,
    attendance,
    alertsCount: liveSummaryData?.alerts?.length || 0,
  };

  // 4. Map active Alerts
  const alerts: AlertDTO[] = (liveSummaryData?.alerts || []).map((alert) => ({
    id: alert.id,
    severity: alert.severity,
    title: alert.alert_type.replace(/_/g, " "),
    description: alert.message,
    createdAt: alert.created_at,
    subunitId: alert.organization_unit_id,
  }));

  // 5. Map pending Approvals from live transfers list
  const pendingTransfers = (transfersQuery.data || []).filter(
    (t) => t.status === "PENDING"
  );
  const pendingApprovals: PendingApprovalsDTO = {
    count: pendingTransfers.length,
    requests: pendingTransfers.map((t) => ({
      requestId: t.id,
      employeeName: t.employee_name,
      type: "בקשת מעבר",
      details: `שיוך מ-${t.from_unit_name} אל ${t.to_unit_name}. סיבה: ${
        t.reason || "לא צוינה"
      }`,
      createdAt: t.requested_at,
    })),
  };

  // 6. Map Shift Coverage status
  const gapsList = (liveSummaryData?.child_units || [])
    .filter((child) => child.unassigned > 0)
    .map((child) => ({
      shiftId: child.unit_id,
      role: `מחסור בכוח אדם: ${child.unit_name}`,
      timeSlot: `חוסר של ${Math.round(child.unassigned)} חיילים`,
    }));

  const shiftCoverage: ShiftCoverageDTO = {
    date,
    totalShifts: liveSummaryData?.total_personnel || 0,
    filledShifts: Math.round(liveSummaryData?.assigned || 0),
    gapsCount: gapsList.length,
    gapsList,
  };

  // 7. Map Organization Tree from raw units list
  const rawUnits = orgUnitsQuery.data || [];
  const buildTree = (units: any[], parentId: string | null = null): any[] => {
    return units
      .filter((u) => u.parent_id === parentId)
      .map((u) => {
        // Find children recursion
        const children = buildTree(units, u.id);
        const childStatus = children.some((c) => c.status === "CRITICAL")
          ? "CRITICAL"
          : children.some((c) => c.status === "WARNING")
          ? "WARNING"
          : "OPTIMAL";

        return {
          id: u.id,
          name: u.name,
          status: childStatus,
          readinessScore: 90, // Static default mapping
          children: children.length > 0 ? children : undefined,
        };
      });
  };

  const treeNodes = buildTree(rawUnits, null);
  const orgTree: OrganizationTreeDTO = {
    workspaceId: unitId,
    rootNode: treeNodes[0] || {
      id: unitId,
      name: "יחידה ראשית",
      status: "OPTIMAL" as const,
      readinessScore: 100,
    },
  };

  // 8. Map system activity history (compile from notifications & transfers)
  const activities: ActivityDTO[] = [];
  pendingTransfers.slice(0, 5).forEach((t) => {
    activities.push({
      id: `act-t-${t.id}`,
      actorName: t.employee_name,
      actionDescription: `הגיש בקשת מעבר מ-${t.from_unit_name} אל ${t.to_unit_name}`,
      timestamp: t.requested_at,
      category: "WORKFORCE",
    });
  });

  // 9. Map system Notifications list
  const notifications: NotificationDTO[] = (notificationsQuery.data || [])
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      title: n.notification_type,
      body: n.message,
      isRead: n.status === "READ",
      createdAt: n.created_at,
    }));

  const empty =
    !loading &&
    (!liveSummaryData || liveSummaryData.total_personnel === 0);

  return {
    loading,
    error,
    empty,
    summary,
    alerts,
    pendingApprovals,
    shiftCoverage,
    orgTree,
    activities,
    notifications,
    quickActions: mockQuickActions,
    refetch,
  };
}
