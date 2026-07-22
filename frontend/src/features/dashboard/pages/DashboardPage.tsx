import * as React from "react";
import { PageContainer } from "../../../components/ui/app-shell/PageContainer";
import { DashboardHeader } from "../components/DashboardHeader";
import { MetricCard } from "../components/MetricCard";
import { BirthdayCard } from "../components/BirthdayCard";
import { AgeChart } from "../components/AgeChart";
import { TrendChart } from "../components/TrendChart";
import { ProgressCard } from "../components/ProgressCard";
import { StatusChart } from "../components/StatusChart";
import { FloatingHelpButton } from "../components/FloatingHelpButton";
import { Users, TrendingUp, Clock, Search } from "lucide-react";
import { AlertDialog } from "../../../components/ui/dialog";

export const DashboardPage: React.FC = () => {
  const [activeDialog, setActiveDialog] = React.useState<string | null>(null);

  return (
    <PageContainer mode="fluid">
      <div className="space-y-6">
        {/* Top Header & Actions Toolbar */}
        <DashboardHeader
          onFilterClick={() => setActiveDialog("סינון נתונים")}
          onReportsClick={() => setActiveDialog("הפקת דוחות")}
          onEventsClick={() => setActiveDialog("יומן אירועים")}
          onAttendanceClick={() => setActiveDialog("דיווח נוכחות")}
        />

        {/* Row 1: KPI Metric Cards Grid (4 Columns) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title='סה"כ מועסקים'
            value="31"
            icon={Users}
            iconBgColor="bg-purple-100 dark:bg-purple-950/50"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <MetricCard
            title="זמינות מבצעית"
            value="42%"
            subtext="13 מתוך 31"
            icon={TrendingUp}
            iconBgColor="bg-emerald-100 dark:bg-emerald-950/50"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <MetricCard
            title="לא זמינים"
            value="15"
            icon={Clock}
            iconBgColor="bg-amber-100 dark:bg-amber-950/50"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <MetricCard
            title="לא ידוע"
            value="3"
            icon={Search}
            iconBgColor="bg-sky-100 dark:bg-sky-950/50"
            iconColor="text-sky-600 dark:text-sky-400"
          />
        </section>

        {/* Row 2: Secondary Visual Cards (3 Columns) */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-3 flex flex-col">
            <BirthdayCard />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <AgeChart />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <TrendChart />
          </div>
        </section>

        {/* Row 3: Deep Analytics Cards (2 Columns) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pb-12">
          <div className="lg:col-span-6 flex flex-col">
            <ProgressCard />
          </div>
          <div className="lg:col-span-6 flex flex-col">
            <StatusChart />
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <FloatingHelpButton />

      {/* Action Dialog Handler */}
      {activeDialog && (
        <AlertDialog
          open={true}
          onOpenChange={() => setActiveDialog(null)}
          title={activeDialog}
          description={`פעולת ${activeDialog} נפתחה בהצלחה.`}
        />
      )}
    </PageContainer>
  );
};
DashboardPage.displayName = "DashboardPage";
