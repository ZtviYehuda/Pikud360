import * as React from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../../components/ui/app-shell/PageContainer";
import { DashboardLayout } from "../components/DashboardLayout";
import { DashboardHeader } from "../components/DashboardHeader";
import { WorkforceSummaryWidget } from "../widgets/WorkforceSummaryWidget";
import { AttendanceSummaryWidget } from "../widgets/AttendanceSummaryWidget";
import { TodayReadinessWidget } from "../widgets/TodayReadinessWidget";
import { CriticalAlertsWidget } from "../widgets/CriticalAlertsWidget";
import { PendingApprovalsWidget } from "../widgets/PendingApprovalsWidget";
import { ShiftCoverageWidget } from "../widgets/ShiftCoverageWidget";
import { OrganizationOverviewWidget } from "../widgets/OrganizationOverviewWidget";
import { RecentActivityWidget } from "../widgets/RecentActivityWidget";
import { QuickActionsWidget } from "../widgets/QuickActionsWidget";
import { NotificationsWidget } from "../widgets/NotificationsWidget";
import { UpcomingEventsWidget } from "../widgets/UpcomingEventsWidget";
import { useDashboardData } from "../hooks/useDashboardData";
import { AlertDialog } from "../../../components/ui/dialog";

import { useCommanderWorkspace } from "../../commander/context/CommanderWorkspaceContext";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Try retrieving unit ID from active commander context
  let selectedUnitId = "unit-uuid-555";
  try {
    const workspaceCtx = useCommanderWorkspace();
    if (workspaceCtx && workspaceCtx.selectedUnitId) {
      selectedUnitId = workspaceCtx.selectedUnitId;
    }
  } catch (e) {
    // Fallback if rendered outside workspace provider context (e.g. testing)
  }

  const [selectedDate] = React.useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Simulator states for testing templates during visual review
  const [simulateLoading, setSimulateLoading] = React.useState(false);
  const [simulateEmpty, setSimulateEmpty] = React.useState(false);
  const [simulateError, setSimulateError] = React.useState(false);

  // Dialog visual states
  const [feedbackDialog, setFeedbackDialog] = React.useState<{ title: string; message: string } | null>(null);

  const {
    loading,
    error,
    summary,
    alerts,
    pendingApprovals,
    shiftCoverage,
    orgTree,
    activities,
    notifications,
    quickActions,
    refetch,
  } = useDashboardData(selectedUnitId, selectedDate, {
    loading: simulateLoading,
    empty: simulateEmpty,
    error: simulateError,
  });

  const handleActionClick = (id: string, type: string, target: string) => {
    if (type === "NAVIGATE") {
      navigate(target);
    } else if (id === "add-employee") {
      // Redirect directly to employees and toggle add modal view
      navigate("/employees");
    } else {
      setFeedbackDialog({
        title: "פעולת מערכת",
        message: `פעולת מהירה "${id}" הופעלה בהצלחה.`,
      });
    }
  };

  const handleApprove = (id: string) => {
    setFeedbackDialog({
      title: "אישור בקשה",
      message: `בקשת מעבר מזהה ${id} אושרה בהצלחה בהתאם לנהלי השלישות.`,
    });
  };

  const handleReject = (id: string) => {
    setFeedbackDialog({
      title: "דחיית בקשה",
      message: `בקשת מעבר מזהה ${id} נדחתה. הודעה נשלחה לגורם המבקש.`,
    });
  };

  const handleResolveAlert = (id: string) => {
    setFeedbackDialog({
      title: "טיפול בהתרעה",
      message: `התרעה ${id} סומנה כטופלה והוסרה מלוח הבקרה המבצעי.`,
    });
  };

  return (
    <PageContainer mode="fluid">
      {/* Simulation controller bar */}
      <DashboardHeader
        pageTitle="לוח בקרה מפקד"
        loading={simulateLoading}
        empty={simulateEmpty}
        error={simulateError}
        onToggleLoading={() => setSimulateLoading((prev) => !prev)}
        onToggleEmpty={() => setSimulateEmpty((prev) => !prev)}
        onToggleError={() => setSimulateError((prev) => !prev)}
        onRefresh={refetch}
      />

      <DashboardLayout>
        {/* Row 1: Workforce Summary KPI cards (Full row - spans all 12 columns) */}
        <div className="col-span-12">
          <WorkforceSummaryWidget data={summary?.workforce} loading={loading} error={error} />
        </div>

        {/* Column Left (Desktop: 3 cols, Tablet: 4 cols, Mobile: 12 cols) */}
        <div className="col-span-12 md:col-span-3 space-y-6 flex flex-col justify-start">
          <QuickActionsWidget actions={quickActions} onActionClick={handleActionClick} />
          
          <CriticalAlertsWidget
            alerts={alerts}
            loading={loading}
            error={error}
            onResolve={handleResolveAlert}
          />
          
          <PendingApprovalsWidget
            data={pendingApprovals}
            loading={loading}
            error={error}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>

        {/* Column Middle (Desktop: 6 cols, Tablet: 8 cols, Mobile: 12 cols) */}
        <div className="col-span-12 md:col-span-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TodayReadinessWidget
              score={summary?.readinessScore}
              threshold={85}
              loading={loading}
              error={error}
            />
            
            <AttendanceSummaryWidget
              data={summary?.attendance}
              loading={loading}
              error={error}
              onSendReminder={(subunit) => setFeedbackDialog({
                title: "שליחת תזכורת",
                message: `תזכורת דיווח נוכחות נשלחה בהצלחה למפקד מחלקת ${subunit}.`
              })}
            />
          </div>

          <ShiftCoverageWidget data={shiftCoverage} loading={loading} error={error} />

          <OrganizationOverviewWidget data={orgTree} loading={loading} error={error} />
        </div>

        {/* Column Right (Desktop: 3 cols, Tablet: 12 cols, Mobile: 12 cols) */}
        <div className="col-span-12 md:col-span-3 space-y-6">
          <UpcomingEventsWidget loading={loading} error={error} />

          <RecentActivityWidget activities={activities} loading={loading} error={error} />

          <NotificationsWidget notifications={notifications} loading={loading} error={error} />
        </div>
      </DashboardLayout>

      {feedbackDialog && (
        <AlertDialog
          open={true}
          onOpenChange={() => setFeedbackDialog(null)}
          title={feedbackDialog.title}
          description={feedbackDialog.message}
        />
      )}
    </PageContainer>
  );
};
DashboardPage.displayName = "DashboardPage";
