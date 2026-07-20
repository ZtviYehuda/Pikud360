import * as React from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../../../components/ui/app-shell/PageContainer";
import { DashboardHeader } from "../components/DashboardHeader";
import { WorkforceSummaryWidget } from "../widgets/WorkforceSummaryWidget";
import { AttendanceSummaryWidget } from "../widgets/AttendanceSummaryWidget";
import { TodayReadinessWidget } from "../widgets/TodayReadinessWidget";
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
import { cn } from "../../../lib/utils";

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
        
        {/* TOP HERO SECTION: Organization | Summary | Alerts | Quick Actions */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Column 1: Organization metadata (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 pl-6 text-right">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">מבנה שלישות</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">מפקדת גדוד 51 · גולני</h3>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">שעון מקומי ותאריך</span>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1">
                    {selectedDate} · 11:20:00
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-850">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-450">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                  מערכות מסונכרנות ללב שלישות
                </span>
              </div>
            </div>

            {/* Column 2: Today's Summary (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 px-6 text-right">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">סטטוס כוח אדם יומי</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">נוכחים:</span>
                    <span className="font-bold text-slate-800 dark:text-white">142</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">נפקדים:</span>
                    <span className="font-bold text-red-500">2</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">בחופשה:</span>
                    <span className="font-bold text-slate-800 dark:text-white">8</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">חולים:</span>
                    <span className="font-bold text-amber-500">4</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">מילואים:</span>
                    <span className="font-bold text-slate-800 dark:text-white">12</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-450">מרחוק:</span>
                    <span className="font-bold text-slate-800 dark:text-white">6</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Alerts priority queue (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 px-6 text-right">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">התרעות דחופות שלישות</span>
                <div className="space-y-2 mt-3">
                  {alerts.length === 0 ? (
                    <div className="text-[10px] text-slate-400 font-semibold py-4 text-center">אין התרעות דחופות</div>
                  ) : (
                    alerts.slice(0, 2).map((alert) => (
                      <div 
                        key={alert.id}
                        onClick={() => handleResolveAlert(alert.id)}
                        className={cn(
                          "p-2.5 rounded-lg border text-right cursor-pointer transition-colors",
                          alert.severity === "CRITICAL" 
                            ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-750 dark:text-red-400" 
                            : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">{alert.title}</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                            {alert.severity === "CRITICAL" ? "קריטי" : "בינוני"}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{alert.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 4: Quick Action triggers (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col justify-center pr-6 text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">פעולות מהירות מפקד</span>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => navigate("/employees")}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-550 rounded-lg shadow-xs cursor-pointer text-center"
                >
                  הוסף חייל / עובד
                </button>
                <button
                  onClick={() => navigate("/workforce/scheduling")}
                  className="w-full py-2 px-3 text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-center"
                >
                  נהל סידור עבודה
                </button>
                <button
                  onClick={() => navigate("/reports")}
                  className="w-full py-2 px-3 text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer text-center"
                >
                  הפק דוח נוכחות
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ROW 1: Key Metrics summary */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              ROW 1: מדדי שלישות מפתח
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-6 items-stretch">
            <div className="col-span-1 md:col-span-8 lg:col-span-12">
              <WorkforceSummaryWidget data={summary?.workforce} loading={loading} error={error} />
            </div>
            
            <div className="col-span-1 md:col-span-4 lg:col-span-4 flex">
              <TodayReadinessWidget
                score={summary?.readinessScore}
                threshold={85}
                loading={loading}
                error={error}
              />
            </div>
            
            <div className="col-span-1 md:col-span-4 lg:col-span-4 flex">
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
            
            <div className="col-span-1 md:col-span-8 lg:col-span-4 flex">
              <Card className="p-4 border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl flex flex-col justify-between w-full">
                <CardHeader className="p-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-450 dark:text-slate-500">מטלות ממתינות לטיפול</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex flex-col justify-center items-center text-center flex-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">3</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">מטלות שלישות פתוחות</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ROW 2: Charts and timelines */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              ROW 2: ניתוח לוחות זמנים ומגמות
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-6 items-stretch">
            <div className="col-span-1 md:col-span-5 lg:col-span-8 flex">
              <ShiftCoverageWidget data={shiftCoverage} loading={loading} error={error} />
            </div>
            <div className="col-span-1 md:col-span-3 lg:col-span-4 flex">
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
          <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-6 items-stretch">
            <div className="col-span-1 md:col-span-4 lg:col-span-4 flex">
              <RecentActivityWidget activities={activities} loading={loading} error={error} />
            </div>
            <div className="col-span-1 md:col-span-4 lg:col-span-4 flex">
              <NotificationsWidget notifications={notifications} loading={loading} error={error} />
            </div>
            <div className="col-span-1 md:col-span-8 lg:col-span-4 flex">
              <UpcomingEventsWidget loading={loading} error={error} />
            </div>
          </div>
        </section>

        {/* ROW 4: Actions & AI Insights */}
        <section className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              ROW 4: תפעול מערכת ותובנות בינה מלאכותית
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-6 items-stretch">
            <div className="col-span-1 md:col-span-4 lg:col-span-3 flex">
              <QuickActionsWidget actions={quickActions} onActionClick={handleActionClick} />
            </div>
            
            <div className="col-span-1 md:col-span-4 lg:col-span-3 flex">
              <Card className="border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl flex flex-col justify-between w-full">
                <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold text-slate-850 dark:text-white">תובנות בינה מלאכותית (AI)</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 text-right flex-1 flex items-center justify-center">
                  <p className="text-[10px] text-slate-650 dark:text-slate-400 font-medium leading-relaxed">
                    מגמת עליה של 4% בימי מחלה בפלוגת מפקדה בשבוע האחרון. מומלץ לאשר סבבי תגבורת מוקדמים ממאגרי המפח״ט.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-1 md:col-span-8 lg:col-span-6 flex">
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
