import { useFeedback } from "@/context/FeedbackContext";
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
import { ReportToolbar, ReportDatePicker } from "@/components/dashboard/ReportToolbar";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { BirthdaysCard } from "@/components/dashboard/BirthdaysCard";
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
  const { openFeedback } = useFeedback();
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
  const birthdaysRef = useRef<any>(null);

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
            view_mode: localViewMode,
            start_date: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
            end_date: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
            days: activeDaysRange,
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
  }, [isOpen, localDate, localViewMode, dateRange?.from, dateRange?.to, activeDaysRange, stableFilters]);

  const filteredBirthdays = useMemo(() => {
    if (!birthdays || !birthdays.length) return [];
    const getEmpDay = (emp: any): number | null => {
      if (emp?.day) return Number(emp.day);
      if (emp?.raw_date) {
        const d = new Date(emp.raw_date);
        if (!isNaN(d.getTime())) return d.getDate();
      }
      if (emp?.date && typeof emp.date === "string" && emp.date.includes("/")) {
        const d = Number(emp.date.split("/")[0]);
        if (!isNaN(d)) return d;
      }
      return null;
    };
    const getEmpMonth = (emp: any): number | null => {
      if (emp?.month) return Number(emp.month);
      if (emp?.raw_date) {
        const d = new Date(emp.raw_date);
        if (!isNaN(d.getTime())) return d.getMonth() + 1;
      }
      if (emp?.date && typeof emp.date === "string" && emp.date.includes("/")) {
        const m = Number(emp.date.split("/")[1]);
        if (!isNaN(m)) return m;
      }
      return null;
    };

    return birthdays.filter((emp: any) => {
      const d = getEmpDay(emp);
      const m = getEmpMonth(emp);
      if (!d || !m) return true;

      if (localViewMode === "daily") {
        return d === localDate.getDate() && m === localDate.getMonth() + 1;
      }
      if (localViewMode === "weekly") {
        const targetDow = localDate.getDay();
        const sunday = new Date(localDate);
        sunday.setDate(localDate.getDate() - targetDow);
        sunday.setHours(0, 0, 0, 0);
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);
        saturday.setHours(23, 59, 59, 999);
        for (const yr of [localDate.getFullYear(), localDate.getFullYear() - 1, localDate.getFullYear() + 1]) {
          const cand = new Date(yr, m - 1, d);
          if (cand >= sunday && cand <= saturday) return true;
        }
        return false;
      }
      if (localViewMode === "monthly") {
        return m === localDate.getMonth() + 1;
      }
      if (localViewMode === "custom" && dateRange?.from && dateRange?.to) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        for (const yr of [from.getFullYear(), to.getFullYear(), localDate.getFullYear()]) {
          const cand = new Date(yr, m - 1, d);
          if (cand >= from && cand <= to) return true;
        }
        return false;
      }
      return true;
    });
  }, [birthdays, localViewMode, localDate, dateRange]);

  const downloadCard = async (ref: any) => {
    if (!ref?.current) {
      toast.error("טוען את נתוני הדוח, אנא נסה שוב בעוד רגע");
      return;
    }
    try {
      if (ref.current.download) {
        await ref.current.download();
      } else {
        toast.error("שגיאה בהורדת הגרף");
      }
    } catch (e) {
      toast.error("שגיאה בהורדה");
    }
  };

  const shareCard = async (ref: any) => {
    if (!ref?.current) {
      toast.error("טוען את נתוני הדוח, אנא נסה שוב בעוד רגע");
      return;
    }
    try {
      if (ref.current.share) {
        await ref.current.share();
      } else {
        toast.error("שגיאה בשיתוף הגרף");
      }
    } catch (e) {
      toast.error("שגיאה בשיתוף");
    }
  };

  // Distinct, card-like container with rounded square action buttons
  const ReportCard = ({ icon: Icon, title, subtitle, onDownload, onWhatsApp, onClick, colorClass = "bg-primary/10 text-primary" }: any) => (
    <div
      onClick={onClick}
      className="group flex justify-between items-center p-3.5 sm:p-4 bg-slate-100/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer gap-3"
    >
      {/* Right Side: Icon & Title */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col text-right min-w-0">
          <span className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">{title}</span>
          {subtitle && <span className="text-[11px] font-medium text-muted-foreground/60 leading-tight mt-0.5 truncate">{subtitle}</span>}
        </div>
      </div>

      {/* Left Side: Uniform Action Buttons (Download & WhatsApp - Min 44x44px Tappable Area) */}
      <div className="flex items-center gap-2 shrink-0 no-export" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
          className="w-11 h-11 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#25D366] border border-emerald-500/20 flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0"
          title="שיתוף לוואטסאפ"
          aria-label="whatsapp"
        >
          <FaWhatsapp className="w-5 h-5 text-[#25D366]" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="w-11 h-11 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-300/60 dark:hover:bg-slate-600/60 text-slate-600 dark:text-slate-200 border border-slate-300/50 dark:border-slate-600/50 flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0"
          title="הורדת דוח"
          aria-label="download"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            id={id || "report-hub-card"}
            variant="outline" 
            className={cn(
              "h-9 rounded-xl gap-1.5 font-bold transition-all px-3 text-foreground bg-card/70 dark:bg-card/50 hover:bg-accent/60 border-border/60 text-xs shadow-xs flex items-center",
              className,
              (searchParams.get("tutorial") === "report-hub" || activeTutorial === "report-hub") && "tutorial-highlight"
            )}
          >
            {className?.includes("flex-col") ? (
              <>
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] font-bold leading-none">דוחות</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-bold">מרכז דוחות</span>
              </>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
          className={cn(
            "p-0 overflow-hidden border-0 bg-background/97 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col transition-all duration-300 shadow-2xl",
          "h-auto max-h-[82vh] sm:max-h-[88vh]",
          "sm:max-w-2xl w-full sm:w-[95vw] sm:mx-auto"
        )}>
          <DialogDragHandle />

          {previewType === null ? (
            <>
              {/* Menu Header */}
              <div className="px-5 pt-5 pb-3 sm:px-7 sm:pt-6 sm:pb-3 text-right shrink-0 flex items-center justify-between gap-4">
                <DialogHeader className="text-right flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <DialogTitle className="text-base sm:text-lg font-black text-foreground tracking-tight leading-snug">
                        מרכז הפקת דוחות
                      </DialogTitle>
                      <DialogDescription className="text-xs font-medium text-muted-foreground/70 leading-tight mt-0.5">
                        הפקה ושיתוף נתונים מבצעיים
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              {/* Unified Controls Bar (Period Tabs + Date Picker) */}
              <div className="px-5 sm:px-7 pb-4 shrink-0 border-b border-border/30">
                <ReportToolbar
                  viewMode={localViewMode}
                  onViewModeChange={setLocalViewMode}
                  date={localDate}
                  onDateChange={setLocalDate}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  maxDate={maxDate}
                  hideDatePicker={false}
                />
              </div>
            </>
          ) : (
            <>
              {/* Preview Header */}
              <div className="px-5 pt-5 pb-3 sm:px-7 sm:pt-6 sm:pb-3 text-right shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewType(null);
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-xl text-muted-foreground/70 hover:text-foreground hover:bg-muted/40 transition-all border border-border/40 shadow-xs active:scale-95 shrink-0 cursor-pointer"
                    title="חזרה לתפריט הדוחות"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-6 bg-border/30 mx-0.5 shrink-0" />
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0", 
                    previewType === 'snapshot' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    previewType === 'trend' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                    previewType === 'comparison' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  )}>
                    {previewType === 'snapshot' && <Users className="w-5 h-5" />}
                    {previewType === 'trend' && <TrendingUp className="w-5 h-5" />}
                    {previewType === 'comparison' && <BarChart2 className="w-5 h-5" />}
                    {previewType === 'birthdays' && <Gift className="w-5 h-5" />}
                  </div>
                  <div className="text-right min-w-0">
                    <h4 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-snug truncate">
                      {previewType === 'snapshot' ? "מצבת כוח אדם" :
                       previewType === 'trend' ? "מגמות וזמינות" :
                       previewType === 'comparison' ? "השוואת תת-יחידות" : "ריכוז ימי הולדת"}
                    </h4>
                    <p className="text-xs font-medium text-muted-foreground/70 leading-tight mt-0.5 truncate">{filters.unitName}</p>
                  </div>
                </div>
              </div>

              {/* Unified Controls Bar (Period Tabs + Date Picker) */}
              <div className="px-5 sm:px-7 pb-4 shrink-0 border-b border-border/30">
                <ReportToolbar
                  viewMode={localViewMode}
                  onViewModeChange={setLocalViewMode}
                  date={localDate}
                  onDateChange={setLocalDate}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  maxDate={maxDate}
                  hideDatePicker={false}
                />
              </div>
            </>
          )}

          <div className="px-4 sm:px-6 py-4 overflow-y-auto custom-scrollbar flex-1 min-h-0 relative">
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
              <div id="report-hub-content" className="flex flex-col gap-3 sm:gap-3.5 animate-in fade-in duration-300">
                <ReportCard 
                  icon={Users} 
                  title="מצבת כוח אדם" 
                  subtitle="פילוח סטטוסים בזמן אמת" 
                  colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                  onClick={() => setPreviewType('snapshot')} 
                  onDownload={() => downloadCard(snapshotRef)} 
                  onWhatsApp={() => shareCard(snapshotRef)} 
                />
                <ReportCard 
                  icon={TrendingUp} 
                  title="מגמות וזמינות" 
                  subtitle="גרף מגמת נוכחות לאורך זמן" 
                  colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                  onClick={() => setPreviewType('trend')} 
                  onDownload={() => downloadCard(trendRef)} 
                  onWhatsApp={() => shareCard(trendRef)} 
                />
                <ReportCard 
                  icon={BarChart2} 
                  title="השוואת תת-יחידות" 
                  subtitle="השוואת זמינות בין מחלקות" 
                  colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                  onClick={() => setPreviewType('comparison')} 
                  onDownload={() => downloadCard(comparisonRef)} 
                  onWhatsApp={() => shareCard(comparisonRef)} 
                />
                <ReportCard 
                  icon={Gift} 
                  title="ריכוז ימי הולדת" 
                  subtitle="חוגגים בתקופה הנבחרת" 
                  colorClass="bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                  onClick={() => setPreviewType('birthdays')} 
                  onDownload={() => downloadCard(birthdaysRef)} 
                  onWhatsApp={() => onShareBirthdays()} 
                />
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
                            <AttendanceTrendCard data={trendStats} range={activeDaysRange} unitName={filters.unitName} hideHeader={true} selectedDate={localDate} compact={true} onDateSelect={setLocalDate} />
                          </div>
                        )}
                        {previewType === 'comparison' && (
                          <div className="w-full h-auto flex flex-col mt-2">
                            <StatsComparisonCard data={comparisonStats} days={activeDaysRange} unitName={filters.unitName} hideHeader={true} selectedDate={localDate} compact={true} />
                          </div>
                        )}
                        {previewType === 'birthdays' && (
                          <div className="w-full h-auto min-h-[300px] flex flex-col mt-2">
                            <BirthdaysCard birthdays={filteredBirthdays} selectedDate={localDate} hideHeader={true} compact={true} />
                          </div>
                        )}

                        {/* Non-jumping loading overlay - shows on date/mode change without re-mounting chart */}
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
                  <Button 
                    onClick={() => { 
                      if (previewType === 'snapshot') downloadCard(snapshotRef); 
                      else if (previewType === 'trend') downloadCard(trendRef); 
                      else if (previewType === 'comparison') downloadCard(comparisonRef); 
                      else if (previewType === 'birthdays') downloadCard(birthdaysRef); 
                    }} 
                    disabled={loading} 
                    className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex-1 gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>הורדה למכשיר</span>
                  </Button>
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
                <div className="pt-2 pb-1 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                      setTimeout(() => {
                        openFeedback(
                          `מרכז דוחות (${previewType ? `תצוגת ${previewType}` : "תפריט ראשי"})`,
                          () => setIsOpen(true)
                        );
                      }, 80);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>מצאת שגיאה או אי-התאמה בנתונים?</span>
                    <span className="underline underline-offset-4 font-semibold">דווח כאן</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Hidden high-res capture divs — only mount when dialog is open and rendering is stable to prevent recharts measuring zero-sized containers */}
      {isOpen && renderCharts && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none text-right" dir="rtl">
          <div style={{ width: "750px", height: "480px" }}><EmployeesChart ref={snapshotRef} stats={snapshotStats} total={snapshotTotal} loading={loading} unitName={filters.unitName} selectedDate={localDate} /></div>
          <div style={{ width: "750px", height: "480px" }}><AttendanceTrendCard ref={trendRef} data={trendStats} loading={loading} range={activeDaysRange} unitName={filters.unitName} selectedDate={localDate} /></div>
          <div style={{ width: "750px", height: "480px" }}><StatsComparisonCard ref={comparisonRef} data={comparisonStats} loading={loading} days={activeDaysRange} unitName={filters.unitName} selectedDate={localDate} /></div>
          <div style={{ width: "750px", height: "480px" }}><BirthdaysCard ref={birthdaysRef} birthdays={filteredBirthdays} selectedDate={localDate} /></div>
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
