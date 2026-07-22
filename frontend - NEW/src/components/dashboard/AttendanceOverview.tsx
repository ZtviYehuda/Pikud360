import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { DashboardStat } from "@/types/attendance.types";

interface AttendanceOverviewProps {
  stats: DashboardStat[];
}

export const AttendanceOverview = ({ stats }: AttendanceOverviewProps) => {
  const total = stats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="border border-slate-100  bg-white dark:bg-card dark:border-border h-full">
      <CardHeader className="pb-8">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-black text-[#001e30] dark:text-white mb-1">
              פילוח נוכחות יחידתי
            </CardTitle>
            <CardDescription className="font-bold text-xs text-slate-400">
              סטטוס כוח אדם בזמן אמת
            </CardDescription>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-[#eff6ff] text-[#0074ff] border border-blue-100">
            <span className="font-black text-xs">A1</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8 py-2">
          {stats.map((s, i) => (
            <div key={i} className="group">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-6 rounded-full "
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                    {(() => {
                      const n = s.status_name?.trim() || "";
                      return (n === "חופשה חול" || n === "חופשה חו\"ל") ? "חו' חול" : n;
                    })()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-[#001e30] dark:text-white leading-none mb-1">
                    {s.count} משרתים
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {total > 0 ? Math.round((s.count / total) * 100) : 0}%
                    Distribution
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700/50">
                <div
                  className="h-full rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] "
                  style={{
                    backgroundColor: s.color,
                    width: `${total > 0 ? (s.count / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
