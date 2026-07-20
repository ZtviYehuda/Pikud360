import * as React from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../../components/ui/app-shell/PageContainer";
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
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Sparkles, Terminal, Activity } from "lucide-react";

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

      <div className="space-y-8 mt-6">
        
        {/* TOP: Critical Alerts Banner & Summary Header */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">מבנה נוכחי</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">מפקדת גדוד 51 · מפח״ט</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">תאריך דיווח</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1">{selectedDate}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">סטטוס סנכרון</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                מחובר ללב פיקודי
              </span>
            </div>
          </div>
          
          <CriticalAlertsWidget
            alerts={alerts}
            loading={loading}
            error={error}
            onResolve={handleResolveAlert}
          />
        </section>

        {/* ROW 1: Key Metrics summary */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              ROW 1: מדדי שלישות מפתח
            </h2>
          </div>
          <div className="col-span-12">
            <WorkforceSummaryWidget data={summary?.workforce} loading={loading} error={error} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Card className="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-enterprise-md">
              <CardHeader className="p-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-450 dark:text-slate-500">מטלות ממתינות לטיפול</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">3</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">מטלות שלישות פתוחות</span>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ROW 2: Charts and timelines */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              ROW 2: ניתוח לוחות זמנים ומגמות
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <ShiftCoverageWidget data={shiftCoverage} loading={loading} error={error} />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <OrganizationOverviewWidget data={orgTree} loading={loading} error={error} />
            </div>
          </div>
        </section>

        {/* ROW 3: Feeds & logs updates */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              ROW 3: עדכוני פעילות וסבבי מעבר
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RecentActivityWidget activities={activities} loading={loading} error={error} />
            <NotificationsWidget notifications={notifications} loading={loading} error={error} />
            <UpcomingEventsWidget loading={loading} error={error} />
          </div>
        </section>

        {/* ROW 4: Actions & AI Insights */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              ROW 4: תפעול מערכת ותובנות בינה מלאכותית
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionsWidget actions={quickActions} onActionClick={handleActionClick} />
            
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-enterprise-md">
              <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-bold text-slate-850 dark:text-white">תובנות בינה מלאכותית (AI)</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 text-right">
                <p className="text-[10px] text-slate-650 dark:text-slate-400 font-medium leading-relaxed">
                  מגמת עליה של 4% בימי מחלה בפלוגת מפקדה בשבוע האחרון. מומלץ לאשר סבבי תגבורת מוקדמים ממאגרי המפח״ט.
                </p>
              </CardContent>
            </Card>

            <div className="col-span-12 md:col-span-2">
              <PendingApprovalsWidget
                data={pendingApprovals}
                loading={loading}
                error={error}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </div>
          </div>
        </section>

        {/* BOTTOM: Audit Feeds & Versions */}
        <section className="space-y-4 border-t border-slate-200/60 dark:border-slate-850 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500 font-bold select-none">
            <div className="flex items-center gap-3">
              <Terminal className="h-4 w-4 text-slate-400" />
              <span>יומן פעילות אודיט פיקודי פעיל</span>
            </div>
            <div className="flex items-center gap-4">
              <span>גרסת מערכת: 2026.4.1</span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450">
                <Activity className="h-3.5 w-3.5" />
                מערכות תקינות
              </span>
            </div>
          </div>
        </section>

      </div>

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
