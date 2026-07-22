import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, CalendarDays, CalendarRange,
  Download, X, CheckCircle2, AlertCircle, ArrowRight, ChevronDown,
  RotateCcw, Filter, Briefcase, Users, Cake,
} from "lucide-react";
import { ShabbatIcon } from "@/components/common/ShabbatIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEmployeeContext } from "@/context/EmployeeContext";
import {
  format, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isSameMonth, isToday, getDay,
} from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { toPng } from "html-to-image";

interface Props {
  statusTypes: any[];
  scopeEmployees: any[];
  onClose: () => void;
  departments?: any[];
  sections?: any[];
  teams?: any[];
  serviceTypes?: any[];
  onDaySelectedChange?: (selected: boolean) => void;
}

// ── Weekly Column Cell for Desktop ──────────────────────────────────────────
function WeekColumnCell({ stats, selectedDate, onClick }: {
  stats: DayStats; selectedDate: Date | null; onClick: () => void;
}) {
  const isSelected = selectedDate && isSameDay(stats.date, selectedDate);
  const today = isToday(stats.date);
  const isWeekend = getDay(stats.date) === 5 || getDay(stats.date) === 6;
  const total = stats.total;
  const present = stats.present;

  const presentPct = total > 0 ? present / total : 0;

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={!isWeekend ? onClick : undefined}
      className={cn(
        "relative flex flex-col p-4 rounded-2xl border transition-all cursor-pointer h-full min-h-[300px]",
        isWeekend && "opacity-40 pointer-events-none bg-muted/20",
        isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/20 z-10"
          : today ? "border-primary/40 bg-primary/5"
          : "border-border/40 bg-card/60 hover:border-primary/30 hover:bg-card hover: hover:",
      )}>
      
      {/* Header Area */}
      <div className="flex flex-col items-center mb-6 pt-2">
        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", 
          today ? "text-primary" : "text-muted-foreground")}>
          {format(stats.date, "EEEE", { locale: he })}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn("text-3xl font-black tabular-nums transition-all", 
            today ? "text-primary scale-110" : "text-foreground")}>
            {format(stats.date, "d")}
          </span>
          <span className="text-xs font-bold text-muted-foreground/60">{format(stats.date, "MMM", { locale: he })}</span>
        </div>
      </div>

      {isWeekend ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40">
          <ShabbatIcon width={32} height={32} />
          <span className="text-xs font-bold mt-2">סופ"ש</span>
        </div>
      ) : total > 0 ? (
        <div className="flex-1 flex flex-col items-center gap-6">
          <div className="relative group">
            <MiniDonut stats={stats} size={80} />
            <div className="absolute -inset-2 rounded-full border border-primary/10 group-hover:border-primary/20 transition-all animate-spin-slow pointer-events-none" />
          </div>

          <div className="w-full space-y-4">
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black text-foreground">{Math.round(presentPct * 100)}% נוכחות</span>
              <span className="text-[10px] font-bold text-muted-foreground/60">{stats.reported}/{stats.total} דיווחו</span>
            </div>

            <div className="space-y-1.5 w-full">
              {stats.statuses.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl border border-border/20 bg-muted/30">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] font-black truncate text-foreground/80">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-black" style={{ color: s.color }}>{s.count}</span>
                </div>
              ))}
              {stats.statuses.length > 3 && (
                <div className="text-center">
                  <span className="text-[9px] font-bold text-muted-foreground italic">+{stats.statuses.length - 3} נוספים...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center opacity-25">
          <span className="text-[11px] font-bold text-muted-foreground">אין נתונים</span>
        </div>
      )}

      {/* Progress Footer */}
      {!isWeekend && total > 0 && (
        <div className="mt-auto pt-4 flex gap-1 h-2 overflow-hidden rounded-full bg-muted/50 border border-border/20">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${presentPct * 100}%` }} />
          <div className="h-full bg-amber-500/80 rounded-full" style={{ width: `${((stats.reported - stats.present) / total) * 100}%` }} />
        </div>
      )}
    </motion.div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayStats {
  date: Date;
  reported: number;
  total: number;
  present: number;
  statuses: {
    name: string;
    color: string;
    count: number;
    emps: { id: number; name: string; deptName?: string }[];
  }[];
  missing: { id: number; name: string; deptName?: string }[];
}

const AGE_RANGES = [
  { label: "18-21", min: 18, max: 21 },
  { label: "22-25", min: 22, max: 25 },
  { label: "26-30", min: 26, max: 30 },
  { label: "31-35", min: 31, max: 35 },
  { label: "36-40", min: 36, max: 40 },
  { label: "41-50", min: 41, max: 50 },
  { label: "51+", min: 51, max: 120 },
];

const HEB_DAYS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

// ── Pre-parsed employee record ────────────────────────────────────────────────
interface ParsedEmp {
  id: number; rawEmp: any;
  hasStatus: boolean;
  startTs: number; startDayTs: number; endTs: number;
  isPersistent: boolean;
  statusName: string; statusColor: string; statusId: number | null;
  fullName: string;
}

function toMidnight(ts: number): number {
  const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime();
}

function prepareEmployees(emps: any[]): ParsedEmp[] {
  return emps.map((emp) => {
    const fullName = `${emp.last_name ?? ""} ${emp.first_name ?? ""}`.trim();
    if (!emp.status_id) return {
      id: emp.id, rawEmp: emp, hasStatus: false,
      startTs: 0, startDayTs: 0, endTs: 0, isPersistent: false,
      statusName: "", statusColor: "", statusId: null, fullName,
    };
    const startTs = emp.last_status_update ? new Date(emp.last_status_update).getTime() : 0;
    let endTs = Infinity;
    if (emp.status_end_datetime) {
      const e = new Date(emp.status_end_datetime);
      e.setHours(23, 59, 59, 999);
      endTs = e.getTime();
    }
    return {
      id: emp.id, rawEmp: emp, hasStatus: true,
      startTs, startDayTs: startTs > 0 ? toMidnight(startTs) : 0, endTs,
      isPersistent: !!emp.status_is_persistent && !emp.status_end_datetime,
      statusName: (emp.status_name || "").trim(),
      statusColor: emp.status_color || "#94a3b8",
      statusId: emp.status_id ?? null, fullName,
    };
  });
}

function isReportedOnDay(emp: ParsedEmp, dayMidnightTs: number, dayEndTs: number): boolean {
  if (!emp.hasStatus || emp.startTs === 0) return false;
  if (emp.startDayTs === dayMidnightTs) return true;
  if (emp.startTs <= dayEndTs && dayMidnightTs <= emp.endTs) return true;
  return false;
}

function computeDayStats(
  parsedEmps: ParsedEmp[],
  subToParent: Map<number, { name: string; color: string }>,
  date: Date,
): DayStats {
  const dayMidnightTs = toMidnight(date.getTime());
  const dayEndTs = dayMidnightTs + 86399999;
  const total = parsedEmps.length;
  let reported = 0;
  let present = 0;
  const statusMap = new Map<string, { name: string; color: string; count: number; emps: { id: number; name: string }[] }>();
  const missing: { id: number; name: string }[] = [];

  for (const emp of parsedEmps) {
    const deptName = emp.rawEmp.department_name || "ללא מחלקה";
    if (!isReportedOnDay(emp, dayMidnightTs, dayEndTs)) {
      missing.push({ id: emp.id, name: emp.fullName, deptName } as any);
      continue;
    }
    reported++;
    if (!emp.statusName) continue;
    const parent = emp.statusId !== null ? subToParent.get(emp.statusId) : undefined;
    const key = parent ? parent.name : emp.statusName;
    const color = parent ? parent.color : emp.statusColor;
    
    const isPresent = key.includes("משרד") || key.includes("קורס") || key.includes("תגבור") || key.includes("שטח") || key.includes("משמרת");
    if (isPresent) {
      present++;
    }

    const existing = statusMap.get(key);
    if (existing) { 
      existing.count++; 
      existing.emps.push({ id: emp.id, name: emp.fullName, deptName } as any); 
    }
    else {
      statusMap.set(key, { 
        name: key, 
        color, 
        count: 1, 
        emps: [{ id: emp.id, name: emp.fullName, deptName } as any] 
      });
    }
  }

  const statuses = Array.from(statusMap.values()).sort((a, b) => b.count - a.count);
  return { date, reported, total, present, statuses, missing };
}


// ── Mini Donut ────────────────────────────────────────────────────────────────
function MiniDonut({ stats, size = 40 }: { stats: DayStats; size?: number }) {
  const { reported, total, statuses } = stats;
  if (total === 0) return null;
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const reportedPct = reported / total;
  let accum = 0;
  const segments = statuses.map((s) => {
    const pct = s.count / total;
    const offset = circumference * (1 - accum);
    const dash = circumference * pct;
    accum += pct;
    return { ...s, offset, dash };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={4} />
      {segments.map((seg, i) => (
        <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={seg.color} strokeWidth={4}
          strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
          strokeDashoffset={seg.offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      ))}
      {reported < total && (
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#ef444420" strokeWidth={4}
          strokeDasharray={`${circumference * (1 - reportedPct)} ${circumference * reportedPct}`}
          strokeDashoffset={circumference * (accum === 0 ? 1 : 1 - accum) - circumference}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize={size < 44 ? "8" : "10"} fontWeight="800" fill="currentColor" fontFamily="sans-serif">
        {Math.round(reportedPct * 100)}%
      </text>
    </svg>
  );
}

// ── Month Day Cell ────────────────────────────────────────────────────────────
function MonthDayCell({ stats, isCurrentMonth, selectedDate, onClick }: {
  stats: DayStats; isCurrentMonth: boolean; selectedDate: Date | null; onClick: () => void;
}) {
  const isSelected = selectedDate && isSameDay(stats.date, selectedDate);
  const today = isToday(stats.date);
  const total = stats.total;
  const reported = stats.reported;
  const present = stats.present;
  
  const reportPct = total > 0 ? reported / total : 0;
  const presentPct = total > 0 ? present / total : 0;
  
  const isWeekend = getDay(stats.date) === 5 || getDay(stats.date) === 6;

  // 🌿 Heatmap logic for subtle background tints
  const getHeatmapClass = () => {
    if (!isCurrentMonth || isWeekend || total === 0) return "";
    if (reportPct < 0.5) return "bg-rose-500/[0.03]"; // Very low reporting
    if (presentPct >= 0.9) return "bg-emerald-500/[0.04]"; // High presence
    if (presentPct >= 0.75) return "bg-amber-500/[0.03]"; // Good presence
    if (presentPct < 0.5) return "bg-rose-500/[0.05]"; // Low presence
    return "";
  };

  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={onClick}
      className={cn(
        "relative flex flex-col items-center p-1.5 rounded-xl cursor-pointer border transition-all overflow-hidden select-none h-[76px] md:h-[105px] group",
        !isCurrentMonth && "opacity-20 pointer-events-none",
        isWeekend && isCurrentMonth && "bg-muted/10 opacity-40",
        getHeatmapClass(),
        isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/20 z-10"
          : today ? "border-primary/60 bg-primary/5"
          : "border-border/30 bg-card/60 hover:border-primary/30 hover:bg-card hover: hover:",
      )}>
      
      {/* 📅 Date & Report Summary */}
      <div className="flex justify-between items-start w-full px-0.5">
        <span className={cn("text-[11px] md:text-sm font-black leading-none transition-colors",
          today ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground")}>
          {format(stats.date, "d")}
        </span>
        {isCurrentMonth && !isWeekend && total > 0 && (
          <span className="hidden md:inline text-[10px] font-black text-muted-foreground/60 transition-opacity opacity-70 group-hover:opacity-100">
            {reported}/{total}
          </span>
        )}
      </div>

      {/* 📊 Presence Metric (The "Hero" of the cell) */}
      {total > 0 && !isWeekend && (
        <div className="flex flex-col items-center justify-center flex-1 w-full -mt-1">
          <div className="relative">
            <span className={cn(
              "text-sm md:text-2xl font-black tabular-nums transition-all tracking-tight",
              presentPct >= 0.9 ? "text-emerald-500" : presentPct >= 0.75 ? "text-amber-500" : "text-rose-500"
            )}>
              {Math.round(presentPct * 100)}%
            </span>
          </div>
          <span className="hidden md:block text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter leading-none">
            נוכחות
          </span>
        </div>
      )}

      {/* 🟢 Status Indicators (Bottom dots) — Desktop only */}
      {total > 0 && !isWeekend && (
        <div className="hidden md:flex gap-1.5 md:gap-2 items-center justify-center w-full pb-1 md:pb-2">
          {stats.statuses.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center gap-0.5" title={s.name}>
               <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
               <span className="text-[9px] md:text-[11px] font-black text-foreground/70">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status Continuity Bar (Bottom edge) */}
      {total > 0 && !isWeekend && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] md:h-[1.5px] bg-border/20 flex w-full">
          <div className="h-full transition-all ease-in-out bg-emerald-500"
            style={{ width: `${presentPct * 100}%` }} />
          <div className="h-full transition-all ease-in-out bg-amber-400"
            style={{ width: `${((reported - present) / total) * 100}%` }} />
          <div className="h-full transition-all ease-in-out bg-rose-500/30"
            style={{ width: `${((total - reported) / total) * 100}%` }} />
        </div>
      )}

      {/* 🕍 Weekend Icon */}
      {isWeekend && isCurrentMonth && (
        <div className="absolute bottom-1 left-1.5 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
          <ShabbatIcon width={16} height={16} />
        </div>
      )}
    </motion.div>
  );
}

// ── Week Day Row ──────────────────────────────────────────────────────────────
function WeekDayRow({ stats, selectedDate, onClick }: {
  stats: DayStats; selectedDate: Date | null; onClick: () => void;
}) {
  const isSelected = selectedDate && isSameDay(stats.date, selectedDate);
  const today = isToday(stats.date);
  const isFriday = getDay(stats.date) === 5;
  const isSaturday = getDay(stats.date) === 6;
  const isWeekend = isFriday || isSaturday;

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
      onClick={!isWeekend ? onClick : undefined}
      className={cn(
        "relative flex items-center gap-3 p-3 md:p-4 rounded-2xl border transition-all cursor-pointer",
        isWeekend && "opacity-40 pointer-events-none bg-muted/20",
        isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/20"
          : today ? "border-primary/40 bg-primary/5"
          : "border-border/40 bg-card/50 hover:border-primary/30 hover:bg-card",
      )}>
      <div className="flex flex-col items-center shrink-0 w-10 md:w-14">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
          {format(stats.date, "EEE", { locale: he })}
        </span>
        <span className={cn("text-xl md:text-2xl font-black leading-none", today ? "text-primary" : "text-foreground")}>
          {format(stats.date, "d")}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground">{format(stats.date, "MMM", { locale: he })}</span>
      </div>
      {!isWeekend && stats.total > 0 && <MiniDonut stats={stats} size={48} />}
      {!isWeekend ? (
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-foreground">{stats.reported}/{stats.total} דיווחו</span>
            {stats.reported === stats.total && stats.total > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            {stats.reported < stats.total && stats.total > 0 && (
              <span className="text-[10px] font-bold text-rose-500">{stats.total - stats.reported} חסרים</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.statuses.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name} · {s.count}
              </div>
            ))}
          </div>
          <div className="h-1 bg-border/30 rounded-full overflow-hidden flex w-full">
            <div className="h-full transition-all bg-[#10b981]"
              style={{ width: `${(stats.present / stats.total) * 100}%` }} />
            <div className="h-full transition-all bg-amber-500/80"
              style={{ width: `${((stats.reported - stats.present) / stats.total) * 100}%` }} />
          </div>
        </div>
      ) : (
        <span className="text-xs font-bold text-muted-foreground flex-1">
          {isFriday ? "שישי - לא יום עבודה" : "שבת - לא יום עבודה"}
        </span>
      )}
    </motion.div>
  );
}

// ── Day Detail View — full rich panel for a selected day ──────────────────────
function DayDetailView({ stats, onBack, subToParent, parsedEmps }: {
  stats: DayStats;
  onBack: () => void;
  subToParent: Map<number, { name: string; color: string }>;
  parsedEmps: ParsedEmp[];
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [missingExpanded, setMissingExpanded] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const { openProfile } = useEmployeeContext();

  const toggleGroup = (name: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });

  // Get employees for a specific status group
  const statusGroups = useMemo(() => {
    const dayMidnightTs = toMidnight(stats.date.getTime());
    const dayEndTs = dayMidnightTs + 86399999;
    const groups = new Map<string, { name: string; color: string; emps: { id: number; name: string }[] }>();

    for (const emp of parsedEmps) {
      if (!isReportedOnDay(emp, dayMidnightTs, dayEndTs) || !emp.statusName) continue;
      const parent = emp.statusId !== null ? subToParent.get(emp.statusId) : undefined;
      const key = parent ? parent.name : emp.statusName;
      const color = parent ? parent.color : emp.statusColor;
      const existing = groups.get(key);
      if (existing) existing.emps.push({ id: emp.id, name: emp.fullName });
      else groups.set(key, { name: key, color, emps: [{ id: emp.id, name: emp.fullName }] });
    }
    return Array.from(groups.values()).sort((a, b) => b.emps.length - a.emps.length);
  }, [stats.date, parsedEmps, subToParent]);

  const handleExport = async () => {
    const target = detailRef.current;
    if (!target || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(target, { 
        quality: 1, 
        pixelRatio: 2, 
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const label = format(stats.date, "dd_MM_yyyy");
      const link = document.createElement("a");
      link.download = `attendance_${label}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("התמונה יוצאה בהצלחה!");
    } catch (e) {
      toast.error("שגיאה בייצוא התמונה");
    } finally {
      setIsExporting(false);
    }
  };

  const presentPct = stats.total > 0 ? stats.present / stats.total : 0;
  const today = isToday(stats.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 w-full"
      dir="rtl"
    >
      {/* Top action header bar (NOT in export) */}
      <div className="flex items-center justify-between gap-3 px-1">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black text-primary hover:underline transition-all">
          <ArrowRight className="w-3.5 h-3.5" />
          חזרה ללוח שנה
        </button>
        
        <Button variant="ghost" size="sm" onClick={handleExport} disabled={isExporting}
          className="h-8.5 gap-1.5 text-xs font-bold border border-border/40 rounded-xl hover:bg-primary/5 hover:text-primary disabled:opacity-60 bg-card">
          {isExporting ? (
            <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg><span>מייצא...</span></>
          ) : (
            <><Download className="w-3.5 h-3.5" /><span>ייצוא תמונה</span></>
          )}
        </Button>
      </div>

      {/* ── Export target ── */}
      <div ref={detailRef} className="flex flex-col gap-4 w-full bg-transparent">
        
        {/* Statistics Header Section — Horizontal layout on desktop, stacked on mobile */}
        <div className="bg-card/45 backdrop-blur-xl rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">נוכחות יומית</span>
            <p className={cn("text-xl sm:text-2xl font-black leading-none tracking-tight", today ? "text-primary" : "text-foreground")}>
              {format(stats.date, "EEEE, d MMMM yyyy", { locale: he })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Presence metric badge */}
            <div className="flex items-center gap-2 bg-emerald-500/10 rounded-xl px-3 py-1.5 text-emerald-600 font-bold text-xs">
              <span className="text-xs font-black">נוכחות ביחידה:</span>
              <span className="text-sm font-black tabular-nums">{Math.round(presentPct * 100)}% ({stats.present}/{stats.total})</span>
            </div>

            {/* Reporting status badge */}
            <div className="bg-muted/50 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground">
              {stats.reported === stats.total && stats.total > 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>כל הסגל דיווח</span>
                </div>
              ) : (
                <button
                  onClick={() => setMissingExpanded((prev) => !prev)}
                  className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-all font-black"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
                  <span className="underline decoration-rose-500/20 underline-offset-2">{stats.total - stats.reported} חסרים דיווח</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", missingExpanded && "rotate-180")} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Missing Reporting List */}
        <AnimatePresence>
          {missingExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 bg-rose-500/5 rounded-2xl overflow-hidden"
            >
              <div className="space-y-4">
                 {Object.entries(
                   stats.missing.reduce((acc, curr) => {
                     const dept = curr.deptName || "אחר";
                     if (!acc[dept]) acc[dept] = [];
                     acc[dept].push(curr);
                     return acc;
                   }, {} as Record<string, typeof stats.missing>)
                 ).map(([dept, emps]) => (
                   <div key={dept} className="space-y-2">
                     <h5 className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest px-1">
                       {dept} • ({emps.length})
                     </h5>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                       {emps.map((m) => (
                         <button key={m.id} onClick={(e) => { e.stopPropagation(); openProfile(m.id); }}
                           className="flex items-center gap-2.5 p-2.5 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-rose-950/60 text-rose-600 hover:bg-rose-500 hover:text-white hover:shadow-sm transition-all text-right group">
                           <div className="w-2 h-2 rounded-full bg-rose-500 group-hover:bg-white shrink-0" />
                           <span className="truncate">{m.name}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Status Detail Cards (Full Width Accordions) ── */}
        {statusGroups.length > 0 ? (
          <div className="flex flex-col gap-3">
            {statusGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.name);
              const groupPct = stats.total > 0 ? group.emps.length / stats.total : 0;
              return (
                <div key={group.name}
                  className={cn("flex flex-col rounded-2xl transition-all h-fit",
                    isExpanded ? "bg-card shadow-sm" : "bg-card/45 hover:bg-card/65")}>
                  <button onClick={() => toggleGroup(group.name)}
                    className="flex items-center justify-between p-4 sm:p-5 w-full group">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-foreground">{group.name}</span>
                          <span className="text-xs font-bold text-muted-foreground">({group.emps.length})</span>
                        </div>
                        <div className="w-24 sm:w-32 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${groupPct * 100}%`, backgroundColor: group.color }} />
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform group-hover:text-primary", isExpanded && "rotate-180")} />
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-4 border-t border-border/10 pt-4">
                           {Object.entries(
                             group.emps.reduce((acc, curr) => {
                               const dept = (curr as any).deptName || "אחר";
                               if (!acc[dept]) acc[dept] = [];
                               acc[dept].push(curr);
                               return acc;
                             }, {} as Record<string, typeof group.emps>)
                           ).map(([dept, emps]) => (
                             <div key={dept} className="space-y-2.5 pt-3 border-t border-border/5 first:border-0 first:pt-0">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{dept}</p>
                               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                                 {emps.map((e) => (
                                   <button key={e.id} onClick={(e_evt) => { e_evt.stopPropagation(); openProfile(e.id); }}
                                     className="flex items-center gap-2.5 p-2.5 px-3.5 rounded-xl text-xs font-bold bg-muted/30 hover:bg-card hover:shadow-sm transition-all text-right group">
                                     <div className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: group.color }} />
                                     <span className="truncate text-foreground/80 group-hover:text-primary">{e.name}</span>
                                   </button>
                                 ))}
                               </div>
                             </div>
                           ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl text-center bg-card/30">
            <AlertCircle className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">אין דיווחים ליום זה</p>
          </div>
        )}

      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AttendanceCalendarView({ statusTypes, scopeEmployees, onClose, departments = [], serviceTypes = [], onDaySelectedChange }: Props) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleSetSelectedDay = (day: Date | null) => {
    setSelectedDay(day);
    onDaySelectedChange?.(day !== null);
  };

  // Filter states (Multi-select)
  const [deptFilters, setDeptFilters] = useState<number[]>([]);
  const [srvFilters, setSrvFilters] = useState<string[]>([]);
  const [ageFilters, setAgeFilters] = useState<string[]>([]);

  const filteredEmployees = useMemo(() => {
    return scopeEmployees.filter(emp => {
      if (deptFilters.length > 0 && !deptFilters.includes(emp.department_id)) return false;
      if (srvFilters.length > 0 && !srvFilters.includes(emp.service_type_name)) return false;
      
      if (ageFilters.length > 0) {
        if (!emp.birth_date) return false;
        const currentYear = new Date().getFullYear();
        const birthYear = new Date(emp.birth_date).getFullYear();
        const age = currentYear - birthYear;
        
        const matchesAge = ageFilters.some(label => {
          const range = AGE_RANGES.find(r => r.label === label);
          if (!range) return false;
          return age >= range.min && age <= range.max;
        });
        if (!matchesAge) return false;
      }
      
      return true;
    });
  }, [scopeEmployees, deptFilters, srvFilters, ageFilters]);

  const days = useMemo(() => {
    if (viewMode === "week") {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      });
    }
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
      end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
    });
  }, [currentDate, viewMode]);

  const parsedEmps = useMemo(() => prepareEmployees(filteredEmployees), [filteredEmployees]);

  const subToParent = useMemo(() => {
    const m = new Map<number, { name: string; color: string }>();
    statusTypes.forEach((st) => {
      if (st.parent_status_id) {
        const parent = statusTypes.find((p) => p.id === st.parent_status_id);
        if (parent) m.set(st.id, { name: parent.name, color: parent.color });
      }
    });
    return m;
  }, [statusTypes]);

  const dayStats = useMemo(
    () => days.map((day) => computeDayStats(parsedEmps, subToParent, day)),
    [days, parsedEmps, subToParent],
  );

  const selectedDayStats = useMemo(
    () => (selectedDay ? dayStats.find((d) => isSameDay(d.date, selectedDay)) ?? null : null),
    [selectedDay, dayStats],
  );

  const navigate = useCallback((dir: 1 | -1) => {
    if (viewMode === "week") setCurrentDate((p) => dir === 1 ? addWeeks(p, 1) : subWeeks(p, 1));
    else setCurrentDate((p) => dir === 1 ? addMonths(p, 1) : subMonths(p, 1));
  }, [viewMode]);

  const goToday = () => setCurrentDate(new Date());

  const periodLabel = useMemo(() => {
    if (viewMode === "week") {
      const s = startOfWeek(currentDate, { weekStartsOn: 0 });
      const e = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(s, "d MMM", { locale: he })} – ${format(e, "d MMM", { locale: he })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: he });
  }, [currentDate, viewMode]);

  // Hide the "go to today" button when the current period already contains today
  const isOnCurrentPeriod = useMemo(() => {
    const today = new Date();
    if (viewMode === "week") {
      const s = startOfWeek(currentDate, { weekStartsOn: 0 });
      const e = endOfWeek(currentDate, { weekStartsOn: 0 });
      return today >= s && today <= e;
    }
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth();
  }, [currentDate, viewMode]);

  // Calendar image export
  const handleExport = async () => {
    const target = exportRef.current;
    if (!target || isExporting) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(target, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const label = periodLabel.replace(/[\s/–]/g, "_");
      const link = document.createElement("a");
      link.download = `attendance_report_${label}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("דו״ח הופק בהצלחה!");
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("שגיאה בהפקת הדו״ח - נסה שוב");
    } finally {
      setIsExporting(false);
    }
  };

  // If a day is selected → show the day detail view
  if (selectedDay && selectedDayStats) {
    return (
      <DayDetailView
        stats={selectedDayStats}
        onBack={() => handleSetSelectedDay(null)}
        subToParent={subToParent}
        parsedEmps={parsedEmps}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col gap-3"
      dir="rtl"
    >
      {/* ══ RESPONSIVE TOOLBAR — 1 row on desktop, 2 rows on mobile ══ */}
      <div className="flex flex-col md:flex-row md:items-center gap-1.5 bg-card/40 px-3 py-2.5 rounded-2xl border border-border/40 sticky top-0 md:static z-30 backdrop-blur-md md:backdrop-blur-none">

        {/* DATE NAVIGATION — always visible */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl border border-border/40 flex items-center justify-center hover:bg-muted active:scale-95 transition-all shrink-0">
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex-1 md:flex-none flex items-center justify-center gap-2 min-w-0 md:min-w-[200px]">
            <span className="text-sm font-black text-foreground tracking-tight truncate">{periodLabel}</span>
          </div>

          <button onClick={() => navigate(1)}
            className="w-8 h-8 rounded-xl border border-border/40 flex items-center justify-center hover:bg-muted active:scale-95 transition-all shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Today button — only shown when not on current period */}
          {!isOnCurrentPeriod && (
            <button onClick={goToday}
              title="חזור לתאריך היום"
              className="flex items-center gap-1 h-7 px-2.5 rounded-xl border border-primary/30 bg-primary/8 text-primary hover:bg-primary/15 transition-all text-[10px] font-black shrink-0">
              <CalendarDays className="w-3 h-3" />
              <span>חזור להיום</span>
            </button>
          )}
        </div>

        {/* SPACER on desktop */}
        <div className="hidden md:block flex-1" />

        {/* CONTROLS ROW */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-0.5 border border-border/40 shrink-0">
            <button onClick={() => setViewMode("week")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
                viewMode === "week" ? "bg-card text-primary border border-border/40 shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <CalendarDays className="w-3.5 h-3.5" /><span>שבועי</span>
            </button>
            <button onClick={() => setViewMode("month")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all",
                viewMode === "month" ? "bg-card text-primary border border-border/40 shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <CalendarRange className="w-3.5 h-3.5" /><span>חודשי</span>
            </button>
          </div>

          <div className="h-5 w-px bg-border/30" />

          {/* Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-8 rounded-xl gap-1.5 font-black text-xs transition-all border-border/40 px-2.5",
                (deptFilters.length > 0 || srvFilters.length > 0 || ageFilters.length > 0) ? "bg-primary/5 text-primary border-primary/20" : "bg-card/40 text-muted-foreground hover:bg-primary/5")}>
                <Filter className="w-3.5 h-3.5" />
                {(deptFilters.length > 0 || srvFilters.length > 0 || ageFilters.length > 0) && (
                  <Badge variant="secondary" className="h-4 px-1 min-w-[16px] rounded-full bg-primary text-white text-[9px] border-none">
                    {deptFilters.length + srvFilters.length + ageFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" side="bottom" className="w-[300px] sm:w-[450px] p-5 rounded-3xl backdrop-blur-3xl border-primary/10 bg-card/95 z-50">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h4 className="text-sm font-black flex items-center gap-2">
                     <Filter className="w-4 h-4 text-primary" /> אפשרויות סינון
                  </h4>
                  {(deptFilters.length > 0 || srvFilters.length > 0 || ageFilters.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={() => { setDeptFilters([]); setSrvFilters([]); setAgeFilters([]); }}
                      className="h-7 text-[10px] font-black text-muted-foreground hover:text-destructive">
                      <RotateCcw className="w-3 h-3 ml-1.5" /> נקה הכל
                    </Button>
                  )}
                </div>

                {/* Departments */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                     <Briefcase className="w-3 h-3" /> מחלקות
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.map(d => (
                      <label key={d.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-primary/5 cursor-pointer border border-transparent hover:border-primary/10 transition-all">
                        <input type="checkbox" checked={deptFilters.includes(d.id)} onChange={() => setDeptFilters(prev => deptFilters.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])}
                          className="w-4 h-4 rounded border-border/40 text-primary focus:ring-primary" />
                        <span className="text-xs font-bold truncate">{d.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Service Types */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                     <Users className="w-3 h-3" /> מעמד
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {serviceTypes.map(s => {
                      const active = srvFilters.includes(s.name);
                      return (
                        <button key={s.id} onClick={() => setSrvFilters(prev => active ? prev.filter(v => v !== s.name) : [...prev, s.name])}
                          className={cn("px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all",
                            active ? "bg-emerald-500 text-white border-emerald-600" : "bg-muted/40 text-muted-foreground border-border/40 hover:border-emerald-300")}>
                          {s.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Age Ranges */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                     <Cake className="w-3 h-3" /> קבוצות גיל
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map(range => {
                      const active = ageFilters.includes(range.label);
                      return (
                        <button key={range.label} onClick={() => setAgeFilters(prev => active ? prev.filter(v => v !== range.label) : [...prev, range.label])}
                          className={cn("px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all",
                            active ? "bg-amber-500 text-white border-amber-600" : "bg-muted/40 text-muted-foreground border-border/40 hover:border-amber-300")}>
                          {range.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export */}
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={isExporting}
            className="h-8 w-8 p-0 rounded-xl border border-border/40 hover:bg-primary/5 hover:text-primary disabled:opacity-60 shrink-0">
            {isExporting ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </Button>

          <div className="h-5 w-px bg-border/30" />

          {/* Close */}
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border/40 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-muted-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>



      {/* ══ Calendar grid (export target) ══ */}
      <div ref={exportRef} className="flex flex-col gap-3">
        {viewMode === "month" && (
          <div className="overflow-x-hidden">
            <div className="grid-calendar-view gap-[1px] md:gap-[2px] mb-[2px]">
              {HEB_DAYS.map((day) => (
                <div key={day} className="text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest py-1">{day}</div>
              ))}
            </div>
            <div className="grid-calendar-view gap-[1px] md:gap-2">
              {dayStats.map((ds) => (
                <MonthDayCell key={ds.date.toISOString()} stats={ds}
                  isCurrentMonth={isSameMonth(ds.date, currentDate)}
                  selectedDate={selectedDay} onClick={() => handleSetSelectedDay(ds.date)} />
              ))}
            </div>
          </div>
        )}
        {viewMode === "week" && (
          <div className="flex flex-col md:grid md:grid-cols-7 gap-3">
            {dayStats.map((ds) => (
              <div key={ds.date.toISOString()} className="h-full">
                {/* Mobile: Row view */}
                <div className="md:hidden">
                  <WeekDayRow stats={ds} selectedDate={selectedDay} onClick={() => handleSetSelectedDay(ds.date)} />
                </div>
                {/* Desktop: Column view */}
                <div className="hidden md:block h-full">
                  <WeekColumnCell stats={ds} selectedDate={selectedDay} onClick={() => handleSetSelectedDay(ds.date)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

