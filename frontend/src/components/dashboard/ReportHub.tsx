import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  BarChart2,
  TrendingUp,
  Users,
  Gift,
  ArrowRight,
  Eye,
  Lock,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReportToolbar } from "@/components/dashboard/ReportToolbar";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { differenceInDays, format, isBefore } from "date-fns";
import type { DateRange } from "react-day-picker";
import { RestorationRequestDialog } from "@/components/dashboard/RestorationRequestDialog";

interface ReportHubProps {
  onShareBirthdays: () => void;
  className?: string;
  id?: string;
  initialDate?: Date;
  initialViewMode?: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  filters?: {
    department_id: string;
    section_id: string;
    team_id: string;
    serviceTypes: string[];
    unitName: string;
    statusName?: string;
    status_id?: string;
  };
}

export const ReportHub: React.FC<ReportHubProps> = ({
  onShareBirthdays,
  className,
  id,
  initialDate = new Date(),
  initialViewMode = "weekly",
  filters = {
    department_id: "",
    section_id: "",
    team_id: "",
    serviceTypes: [],
    unitName: "כלל היחידה",
    status_id: undefined,
  },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewType, setPreviewType] = useState<null | 'snapshot' | 'trend' | 'comparison' | 'birthdays'>(null);
  const [localDate, setLocalDate] = useState<Date>(initialDate);
  const [localViewMode, setLocalViewMode] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "custom"
  >(initialViewMode);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasArchiveAccess, setHasArchiveAccess] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [renderCharts, setRenderCharts] = useState(false);

  const { user } = useAuthContext();
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Stabilize filters reference to prevent fetch loop when parent re-renders
  const stableFilters = useMemo(() => filters, [
    filters.department_id,
    filters.section_id,
    filters.team_id,
    filters.status_id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.serviceTypes.join(","),
  ]);

  useEffect(() => {
    const tutorial = searchParams.get("tutorial");
    if (tutorial === "report-hub" || tutorial === "report-hub-inside") {
      setActiveTutorial(tutorial);
      if (tutorial === "report-hub-inside") {
        setIsOpen(true);
      }
      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("tutorial");
        setSearchParams(newParams, { replace: true });
        setTimeout(() => setActiveTutorial(null), 1000);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  // When moving past the report-hub-inside step to attendance, ensure Dialog closes
  useEffect(() => {
    const isAttendance = location.pathname.includes('attendance');
    if (isAttendance && isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const isOldDate = useMemo(() => {
    if (user?.is_admin) return false;
    const today = new Date();
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return isBefore(localDate, startOfPrevMonth);
  }, [localDate, user]);

  const trendRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const snapshotRef = useRef<any>(null);

  const { getTrendStats, getComparisonStats, getDashboardStats } =
    useEmployees();

  const snapshotTotal = useMemo(() => {
    return snapshotStats.reduce((acc, curr) => acc + curr.count, 0);
  }, [snapshotStats]);

  const activeDaysRange = useMemo(() => {
    if (localViewMode === "custom") {
      if (dateRange?.from && dateRange?.to) {
        return Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1);
      }
      return 7;
    }

    switch (localViewMode) {
      case "daily": return 1;
      case "weekly": return 7;
      case "monthly": return 30;
      case "yearly": return 365;
      default: return 7;
    }
  }, [localViewMode, dateRange]);

  const maxDate = useMemo(() => undefined, []);

  useEffect(() => {
    if (isOpen) {
      // Only reset date/viewMode when the dialog first opens (not on every previewType change)
      setLocalDate(initialDate);
      setLocalViewMode(initialViewMode);
      setRenderCharts(false);
      const timer = setTimeout(() => {
        setRenderCharts(true);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setPreviewType(null);
      setRenderCharts(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // intentionally excludes initialDate/initialViewMode/previewType to avoid reset loops

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      let effectiveDate = localDate;
      const days = activeDaysRange;

      if (localViewMode === "custom") {
        if (!dateRange?.from) {
          setLoading(false);
          return;
        }
        effectiveDate = dateRange.to || dateRange.from;
      }

      const formattedDate = format(effectiveDate, "yyyy-MM-dd");

      try {
        const [tData, cData, dData] = await Promise.all([
          getTrendStats(days, formattedDate, {
            department_id: stableFilters.department_id,
            section_id: stableFilters.section_id,
            team_id: stableFilters.team_id,
            serviceTypes: stableFilters.serviceTypes.join(","),
            status_id: stableFilters.status_id,
          }),
          getComparisonStats(formattedDate, days, {
            department_id: stableFilters.department_id,
            section_id: stableFilters.section_id,
            team_id: stableFilters.team_id,
            serviceTypes: stableFilters.serviceTypes.join(","),
            status_id: stableFilters.status_id,
          }),
          getDashboardStats({
            department_id: stableFilters.department_id,
            section_id: stableFilters.section_id,
            team_id: stableFilters.team_id,
            date: formattedDate,
            serviceTypes: stableFilters.serviceTypes.join(","),
            status_id: stableFilters.status_id,
          })
        ]);
        setTrendStats(tData || []);
        setComparisonStats(cData || []);
        setSnapshotStats(dData?.stats || []);
        setBirthdays(dData?.birthdays || []);
        setHasArchiveAccess(dData?.has_archive_access || false);
      } catch (err) {
        toast.error("שגיאה בטעינת נתוני דוחות");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // activeDaysRange already encapsulates localViewMode + dateRange, so we don't list them separately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, localDate, activeDaysRange, stableFilters]);

  const downloadCard = async (ref: any) => {
    if (!ref.current) return;
    try {
      if (ref.current.download) await ref.current.download();
    } catch (e) { toast.error("שגיאה בהורדה"); }
  };

  const shareCard = async (ref: any) => {
    if (ref.current && ref.current.share) await ref.current.share();
  };

  // Clean, minimal report card - no borders, just subtle hover
  const ReportCard = ({ icon: Icon, title, subtitle, onDownload, onWhatsApp, hasDownload = true, onClick, colorClass = "bg-primary/10 text-primary" }: any) => (
    <div
      onClick={onClick}
      className="group flex justify-between items-center py-3.5 px-2 transition-all active:scale-[0.99] cursor-pointer hover:bg-muted/40 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", colorClass)}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">{title}</span>
          {subtitle && <span className="text-[10px] font-medium text-muted-foreground/50 leading-none mt-0.5">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 no-export" onClick={(e) => e.stopPropagation()}>
        {hasDownload ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onWhatsApp(); }} className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-90" aria-label="share">
              <FaWhatsapp className="w-[18px] h-[18px]" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="p-2 rounded-xl text-muted-foreground/40 hover:bg-primary/10 hover:text-primary transition-all active:scale-90" aria-label="download">
              <Download className="w-[18px] h-[18px]" />
            </button>
          </>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onWhatsApp(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-90">
            <FaWhatsapp className="w-4 h-4" />
            שיתוף
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            id={id || "report-hub-card"}
            variant="ghost" 
            className={cn(
              "rounded-xl font-black transition-all text-primary hover:bg-primary/5 min-w-[60px] border-none bg-transparent",
              !className && "h-9 flex-col gap-0.5 px-2 xl:px-3.5 text-sm py-1",
              className,
              (searchParams.get("tutorial") === "report-hub" || activeTutorial === "report-hub") && "tutorial-highlight"
            )}
          >
            {className?.includes("flex-col") ? (
              <>
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black leading-none">דוחות</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[8.5px] xl:text-[9.5px] leading-tight">מרכז דוחות</span>
              </>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className={cn(
          "p-0 overflow-hidden border-0 bg-background/97 backdrop-blur-3xl sm:rounded-[2rem] flex flex-col transition-all duration-300 shadow-2xl",
          "h-auto max-h-[92svh] sm:max-h-[88vh]",
          "sm:max-w-3xl w-full sm:w-[95vw] sm:mx-auto"
        )}>
          <DialogDragHandle />

          {previewType === null ? (
            <>
              {/* Menu Header */}
              <div className="px-5 pt-4 pb-3 sm:px-7 sm:pt-6 sm:pb-4 text-right shrink-0">
                <DialogHeader className="text-right">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <DialogTitle className="text-base font-black text-foreground tracking-tight leading-none mb-0.5">מרכז הפקת דוחות</DialogTitle>
                      <DialogDescription className="text-[11px] font-medium text-muted-foreground/70 leading-none">הפקה ושיתוף נתונים מבצעיים</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* Menu Toolbar */}
              <div className="px-4 sm:px-7 pb-3 shrink-0 overflow-x-auto no-scrollbar border-b border-border/10 pl-10 sm:pl-12">
                <ReportToolbar viewMode={localViewMode} onViewModeChange={setLocalViewMode} date={localDate} onDateChange={setLocalDate} dateRange={dateRange} onDateRangeChange={setDateRange} maxDate={maxDate} />
              </div>
            </>
          ) : (
            <div className="px-5 pt-4 pb-3 sm:px-7 sm:pt-5 sm:pb-4 border-b border-border/10 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-right">
              {/* Title & Back Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewType(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all border border-border/20 shadow-sm active:scale-95 shrink-0"
                  title="חזור לתפריט"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-6 bg-border/20 mx-1 shrink-0" />
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0", 
                  previewType === 'snapshot' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                  previewType === 'trend' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  previewType === 'comparison' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}>
                  {previewType === 'snapshot' && <Users className="w-[18px] h-[18px]" />}
                  {previewType === 'trend' && <TrendingUp className="w-[18px] h-[18px]" />}
                  {previewType === 'comparison' && <BarChart2 className="w-[18px] h-[18px]" />}
                  {previewType === 'birthdays' && <Gift className="w-[18px] h-[18px]" />}
                </div>
                <div className="text-right">
                  <h4 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-none mb-1">
                    {previewType === 'snapshot' ? "מצבת כוח אדם" :
                     previewType === 'trend' ? "מגמות וזמינות" :
                     previewType === 'comparison' ? "השוואת תת-יחידות" : "חוגגי ימי הולדת"}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/50 leading-none">{filters.unitName}</p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="w-full md:w-auto overflow-x-auto no-scrollbar scroll-smooth pl-10 sm:pl-12">
                <ReportToolbar viewMode={localViewMode} onViewModeChange={setLocalViewMode} date={localDate} onDateChange={setLocalDate} dateRange={dateRange} onDateRangeChange={setDateRange} maxDate={maxDate} />
              </div>
            </div>
          )}

          <div className="px-3 sm:px-5 py-4 overflow-y-auto custom-scrollbar flex-1 min-h-0 relative">
            {(isOldDate && !hasArchiveAccess) ? (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md rounded-b-[1.5rem] sm:rounded-b-[2rem]">
                <div className="bg-card border border-border/50 rounded-[2rem] p-8 max-w-md text-center space-y-4 m-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-black">נתוני ארכיון חסומים</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    הנתונים מהתקופה הזו הועברו לארכיון. על מנת לצפות ולהפיק דוחות, עליך לבקש אישור גישה.
                  </p>
                  <Button 
                    onClick={() => setRestoreDialogOpen(true)}
                    className="w-full rounded-xl h-12 font-black mt-4"
                  >
                    הגש בקשת גישה לארכיון
                  </Button>
                </div>
              </div>
            ) : null}

            {previewType === null ? (
              <div id="report-hub-content" className="flex flex-col divide-y divide-border/20 animate-in fade-in duration-300">
                <ReportCard icon={Users} title="מצבת כוח אדם" subtitle="פילוח סטטוסים בזמן אמת" colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400" onClick={() => setPreviewType('snapshot')} onDownload={() => downloadCard(snapshotRef)} onWhatsApp={() => shareCard(snapshotRef)} />
                <ReportCard icon={TrendingUp} title="מגמות וזמינות" subtitle="גרף מגמת נוכחות לאורך זמן" colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" onClick={() => setPreviewType('trend')} onDownload={() => downloadCard(trendRef)} onWhatsApp={() => shareCard(trendRef)} />
                <ReportCard icon={BarChart2} title="השוואת תת-יחידות" subtitle="השוואת זמינות בין מחלקות" colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400" onClick={() => setPreviewType('comparison')} onDownload={() => downloadCard(comparisonRef)} onWhatsApp={() => shareCard(comparisonRef)} />
                <ReportCard icon={Gift} title="ריכוז ימי הולדת" subtitle="חוגגים בתקופה הנבחרת" colorClass="bg-rose-500/10 text-rose-600 dark:text-rose-400" onClick={() => setPreviewType('birthdays')} hasDownload={false} onWhatsApp={() => onShareBirthdays()} />
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in duration-500">
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto no-scrollbar p-1 flex flex-col min-h-0">
                    {/* Initial load — no charts yet, show full spinner */}
                    {!renderCharts && previewType !== 'birthdays' ? (
                      <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] gap-3">
                        <div className="w-10 h-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                        <p className="text-xs font-black text-muted-foreground/60">מכין את הגרף...</p>
                      </div>
                    ) : (
                      /* Charts always rendered — overlay spinner on reload (no layout jump) */
                      <div className="relative flex-1 flex flex-col min-h-0">
                        {previewType === 'snapshot' && (
                          <div className="w-full h-[380px] sm:h-[450px] flex flex-col mt-2">
                            <EmployeesChart stats={snapshotStats} total={snapshotTotal} hideHeader={true} unitName={filters.unitName} selectedDate={localDate} compact={true} />
                          </div>
                        )}
                        {previewType === 'trend' && (
                          <div className="w-full h-[350px] sm:h-[420px] flex flex-col mt-2">
                            <AttendanceTrendCard data={trendStats} range={activeDaysRange} unitName={filters.unitName} hideHeader={true} selectedDate={localDate} compact={true} />
                          </div>
                        )}
                        {previewType === 'comparison' && (
                          <div className="w-full h-auto flex flex-col mt-2">
                            <StatsComparisonCard data={comparisonStats} days={activeDaysRange} unitName={filters.unitName} hideHeader={true} selectedDate={localDate} compact={true} />
                          </div>
                        )}
                        {previewType === 'birthdays' && (
                          <div className="flex-1 overflow-y-auto min-h-[300px] p-1">
                            {birthdays.length === 0 ? (
                              <div className="text-center py-10 sm:py-12"><Gift className="w-10 h-10 text-muted-foreground/15 mx-auto mb-3" /><p className="text-xs font-bold text-muted-foreground/50">אין חוגגים בטווח הנבחר</p></div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {birthdays.map((emp, i) => (
                                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-500/5 dark:bg-white/5 rounded-2xl border border-border/10 shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">{emp.first_name[0]}{emp.last_name[0]}</div>
                                      <div><p className="font-bold text-[13px] text-foreground">{emp.first_name} {emp.last_name}</p><p className="text-[10px] font-medium text-muted-foreground/50">{emp.sub_unit || filters.unitName}</p></div>
                                    </div>
                                    <div className="text-left shrink-0"><p className="text-xs font-bold text-rose-500">{format(new Date(emp.birth_date), 'dd/MM')}</p></div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Non-jumping loading overlay — shows on date/mode change without re-mounting chart */}
                        {loading && previewType !== 'birthdays' && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/65 backdrop-blur-[2px] rounded-2xl">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-10 h-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                              <p className="text-[11px] font-black text-muted-foreground/60">טוען נתונים...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-4 flex flex-row items-center gap-3 shrink-0 pt-3 border-t border-border/10">
                  {(previewType !== 'birthdays') && (
                    <Button 
                      onClick={() => { 
                        if (previewType === 'snapshot') downloadCard(snapshotRef); 
                        if (previewType === 'trend') downloadCard(trendRef); 
                        if (previewType === 'comparison') downloadCard(comparisonRef); 
                      }} 
                      disabled={loading} 
                      className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex-1 gap-2 active:scale-[0.98] transition-all"
                    >
                      <Download className="w-5 h-5" />
                      <span>הורדה למכשיר</span>
                    </Button>
                  )}
                  <Button 
                    onClick={() => { 
                      if (previewType === 'birthdays') onShareBirthdays(); 
                      else if (previewType === 'snapshot') shareCard(snapshotRef); 
                      else if (previewType === 'trend') shareCard(trendRef); 
                      else if (previewType === 'comparison') shareCard(comparisonRef); 
                    }} 
                    disabled={loading} 
                    className="h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm flex-1 gap-2 active:scale-[0.98] transition-all"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                    <span>שיתוף מהיר</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Hidden high-res capture divs — only mount when dialog is open and rendering is stable to prevent recharts measuring zero-sized containers */}
      {isOpen && renderCharts && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none text-right" dir="rtl">
          <div style={{ width: "650px", height: "460px" }}><EmployeesChart ref={snapshotRef} stats={snapshotStats} total={snapshotTotal} loading={loading} unitName={filters.unitName} selectedDate={localDate} /></div>
          <div style={{ width: "650px", height: "460px" }}><AttendanceTrendCard ref={trendRef} data={trendStats} loading={loading} range={activeDaysRange} unitName={filters.unitName} selectedDate={localDate} /></div>
          <div style={{ width: "650px", height: "460px" }}><StatsComparisonCard ref={comparisonRef} data={comparisonStats} loading={loading} days={activeDaysRange} unitName={filters.unitName} selectedDate={localDate} /></div>
        </div>
      )}

      <RestorationRequestDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        targetDate={localDate}
      />
    </>
  );
};
