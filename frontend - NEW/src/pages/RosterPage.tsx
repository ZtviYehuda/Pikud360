import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  startOfWeek,
  endOfWeek,
  format,
  addDays,
  isSameDay,
  startOfDay,
  getDay,
} from "date-fns";
import { he } from "date-fns/locale";
import {
  Users,
  Search,
  Plus,
  Calendar as CalendarIcon,
  CalendarRange,
  BadgeInfo,
  Undo2,
  Save,
  Loader2,
  AlertCircle,
  Filter,
  X,
  RotateCcw,
  Home,
  Building2,
  MapPin,
  UserCheck,
  Sun,
  Activity,
  GraduationCap,
  Shield,
  Plane,
  Briefcase,
  Flag,
  Check,
} from "lucide-react";

import { ShabbatIcon } from "@/components/common/ShabbatIcon";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useDateContext } from "@/context/DateContext";

const getStatusIcon = (name: string) => {
  const n = (name || "").toLowerCase();
  if (n === "מהבית" || n.includes("בית")) return Home;
  if (n === "מתקן חיצוני" || n.includes("מתקן") || n.includes("חיצוני")) return Building2;
  if (n === "שטח" || n.includes("שטח")) return MapPin;
  if (n.includes("נוכח") || n.includes("משרד") || n.includes("ביחידה")) return UserCheck;
  if (n.includes("חופשה") || n.includes("חופש")) return Sun;
  if (n.includes("מחלה") || n.includes("גימל") || n.includes("ביקור רופא")) return Activity;
  if (n.includes("קורס") || n.includes("הדרכה")) return GraduationCap;
  if (n.includes("אבטחה") || n.includes("תורנות") || n.includes("תגבור") || n.includes("שמירה")) return Shield;
  if (n.includes('חו"ל') || n.includes("טיסה") || n.includes("חול")) return Plane;
  if (n.includes("יום יחידה") || n.includes("אירוע") || n.includes("משימה")) return Flag;
  return Briefcase;
};

const StatusCard = ({
  type,
  onClick,
  isSub = false,
  large = false,
  active = false,
}: {
  type: any;
  onClick: () => void;
  isSub?: boolean;
  large?: boolean;
  active?: boolean;
}) => {
  const Icon = getStatusIcon(type.name);
  const color = type.color || "#64748B";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-2xl border transition-all cursor-pointer select-none text-right overflow-hidden shadow-2xs hover:shadow-md",
        large
          ? "col-span-full sm:col-span-2 flex-row gap-3.5 p-3.5 sm:p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-500/40 text-emerald-950 dark:text-emerald-100"
          : isSub
          ? "p-2.5 sm:p-3 bg-muted/30 hover:bg-muted/60 border-border/50 hover:border-primary/40 text-foreground min-h-[70px] sm:min-h-[76px]"
          : "p-2.5 sm:p-3.5 bg-card hover:bg-muted/40 border-border/60 hover:border-primary/40 text-foreground min-h-[78px] sm:min-h-[86px]",
        active && "ring-2 ring-primary ring-offset-2 border-primary bg-primary/10 dark:bg-primary/20 shadow-sm"
      )}
    >
      {active && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      )}

      <div
        className={cn(
          "rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
          large
            ? "w-11 h-11 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : isSub
            ? "w-8 h-8 rounded-lg bg-background text-muted-foreground group-hover:text-primary border border-border/40"
            : "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted/60 text-foreground group-hover:text-primary"
        )}
        style={!large && !isSub ? { backgroundColor: `${color}15`, color } : undefined}
      >
        <Icon className={cn(large ? "w-5 h-5" : isSub ? "w-4 h-4" : "w-4.5 h-4.5 sm:w-5 sm:h-5")} />
      </div>

      <div className={cn("flex flex-col min-w-0", large ? "flex-1 items-start" : "items-center text-center mt-1.5")}>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-bold leading-tight tracking-tight",
              large ? "text-sm sm:text-base text-foreground font-extrabold" : "text-xs font-bold text-foreground"
            )}
          >
            {type.name}
          </span>
          {large && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              נוכחות רגילה
            </span>
          )}
        </div>
        {isSub ? (
          <span className="text-[9px] text-muted-foreground font-medium mt-0.5">
            עבודה בריחוק
          </span>
        ) : large ? (
          <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
            הגעה ועבודה סדירה בבסיס/משרד
          </span>
        ) : null}
      </div>
    </button>
  );
};

export default function RosterPage() {
  const { getRosterMatrix, getStatusTypes, getStructure, logBulkStatus } =
    useEmployees();
  const { user } = useAuthContext();
  // const navigate = useNavigate();

  // State
  const { selectedDate: currentDate } = useDateContext();

  const [employees, setEmployees] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedFilters = localStorage.getItem("roster_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.selectedDept !== undefined) setSelectedDept(filters.selectedDept);
        if (filters.selectedSection !== undefined) setSelectedSection(filters.selectedSection);
        if (filters.selectedTeam !== undefined) setSelectedTeam(filters.selectedTeam);
        if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter);
        if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
      } catch (e) {
        console.error("Failed to parse saved roster filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (user?.is_impersonated) return;

    const filters = {
      selectedDept,
      selectedSection,
      selectedTeam,
      statusFilter,
      searchTerm,
    };
    localStorage.setItem("roster_filters", JSON.stringify(filters));
  }, [
    isInitialized,
    selectedDept,
    selectedSection,
    selectedTeam,
    statusFilter,
    searchTerm,
    user?.is_impersonated,
  ]);

  // Pending Changes State
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    empId: number;
    date: Date;
  } | null>(null);

  // Range Mode State
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeEndDate, setRangeEndDate] = useState<string>("");

  const [selectedDayMobile, setSelectedDayMobile] = useState<Date>(new Date());

  // Other Status Note State
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherNote, setOtherNote] = useState("");
  const [targetOtherStatus, setTargetOtherStatus] = useState<any>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);

  // Constants
  const today = startOfDay(new Date());

  // Week Calculation
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  );

  // Sync mobile selected day when week changes
  useEffect(() => {
    // If current selected day is not in the new week, set it to the first day of that week
    if (
      selectedDayMobile < weekStart ||
      selectedDayMobile > addDays(weekStart, 6)
    ) {
      setSelectedDayMobile(weekStart);
    }
  }, [weekStart]);
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  );
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  // Tour Guide State Integration
  const [currentTourStepId, setCurrentTourStepId] = useState<string | null>(
    () => localStorage.getItem("active_tour_step_id"),
  );
  const openedByTour = useRef(false);

  useEffect(() => {
    const handleTourStep = (e: any) => {
      setCurrentTourStepId(e.detail.stepId);
    };
    window.addEventListener("tour-step-changed", handleTourStep);
    return () => {
      window.removeEventListener("tour-step-changed", handleTourStep);
    };
  }, []);

  useEffect(() => {
    if (currentTourStepId === "roster_status_change") {
      setSelectedDayMobile(weekDays[0]);
      if (
        employees.length > 0 &&
        (!isDialogOpen || !selectedCell || selectedCell.date !== weekDays[0])
      ) {
        setSelectedCell({
          empId: employees[0].id,
          date: weekDays[0],
        });
        setIsDialogOpen(true);
        openedByTour.current = true;
      }
    } else if (currentTourStepId === "roster_weekend_holidays") {
      setSelectedDayMobile(weekDays[5]);
      if (
        employees.length > 0 &&
        (!isDialogOpen || !selectedCell || selectedCell.date !== weekDays[5])
      ) {
        setSelectedCell({
          empId: employees[0].id,
          date: weekDays[5],
        });
        setIsDialogOpen(true);
        openedByTour.current = true;
      }
    } else {
      if (openedByTour.current) {
        if (isDialogOpen) {
          setIsDialogOpen(false);
        }
        openedByTour.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTourStepId, employees, weekDays]);

  // Initial Data
  useEffect(() => {
    const init = async () => {
      const types = await getStatusTypes();
      setStatusTypes(types || []);
      const struct = await getStructure();
      setDepartments(struct || []);
    };
    init();
  }, [getStatusTypes, getStructure, user]); // Added user dependency

  // Default org filters based on permissions
  useEffect(() => {
    if (!user || user.is_admin) return;

    if (user.commands_department_id) {
      setSelectedDept(user.commands_department_id.toString());
    } else if (user.commands_section_id) {
      if (user.assigned_department_id)
        setSelectedDept(user.assigned_department_id.toString());
      setSelectedSection(user.commands_section_id.toString());
    } else if (user.commands_team_id) {
      if (user.assigned_department_id)
        setSelectedDept(user.assigned_department_id.toString());
      if (user.assigned_section_id)
        setSelectedSection(user.assigned_section_id.toString());
      setSelectedTeam(user.commands_team_id.toString());
    }
  }, [user]);

  // Fetch Matrix
  const fetchMatrix = async () => {
    setLoadingMatrix(true);
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");

    const filters: any = {};
    if (selectedDept !== "all") filters.department_id = selectedDept;
    if (selectedSection !== "all") filters.section_id = selectedSection;
    if (selectedTeam !== "all") filters.team_id = selectedTeam;

    try {
      const data = await getRosterMatrix(startStr, endStr, filters);
      setEmployees(data.employees || []);
      setLogs(data.logs || []);
      setPendingUpdates([]);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בטעינת נתונים");
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [weekStart, selectedDept, selectedSection, selectedTeam]);

  const getLogForCell = (empId: any, date: Date) => {
    const targetStr = format(date, "yyyy-MM-dd");
    return logs.find((l) => {
      if (String(l.employee_id) !== String(empId)) return false;

      const startStr = (l.start_datetime || "").slice(0, 10);
      const endStr = (l.end_datetime || l.start_datetime || "").slice(0, 10);

      if (targetStr >= startStr && targetStr <= endStr) {
        const dayOfW = getDay(date);
        const isFriSat = dayOfW === 5 || dayOfW === 6;
        if (isFriSat) {
          const typeName =
            statusTypes.find((t) => t.id === l.status_type_id)?.name ||
            l.status_name ||
            "";
          if (!typeName.includes("תגבור") && !typeName.includes("אחר")) {
            return false;
          }
        }
        return true;
      }
      return false;
    });
  };

  const getStatusById = (id: any) => statusTypes.find((s) => String(s.id) === String(id));

  // --- Actions ---

  const handleCellClick = (empId: any, date: Date) => {
    const existingLog = getLogForCell(empId, date);
    setSelectedCell({ empId, date });
    if (existingLog) {
      setSelectedStatusId(existingLog.status_type_id);
      const st = getStatusById(existingLog.status_type_id);
      if (st?.name === "אחר") {
        setShowOtherInput(true);
        setOtherNote(existingLog.notes || "");
        setTargetOtherStatus(st);
      } else {
        setShowOtherInput(false);
        setOtherNote("");
        setTargetOtherStatus(null);
      }
    } else {
      setSelectedStatusId(null);
      setShowOtherInput(false);
      setOtherNote("");
      setTargetOtherStatus(null);
    }
    setRangeMode(false);
    setRangeEndDate("");
    setIsDialogOpen(true);
  };

  const handleSelectStatus = (status: any) => {
    setSelectedStatusId(status.id);
    if (status.name === "אחר") {
      setTargetOtherStatus(status);
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      setTargetOtherStatus(null);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setRangeMode(false);
    setRangeEndDate("");
    setShowOtherInput(false);
    setOtherNote("");
    setTargetOtherStatus(null);
    setSelectedStatusId(null);
  };

  const handleConfirmStatus = () => {
    if (!selectedCell || !selectedStatusId) return;
    const status = getStatusById(selectedStatusId);
    if (!status) return;

    if (status.name === "אחר" && !otherNote.trim()) {
      toast.error("יש להזין פירוט עבור סטטוס אחר");
      return;
    }

    addPendingUpdate(
      selectedCell.empId,
      selectedStatusId,
      selectedCell.date,
      rangeMode && rangeEndDate ? new Date(rangeEndDate) : undefined,
      status.name === "אחר" ? otherNote.trim() : undefined,
    );
  };

  const addPendingUpdate = (
    empId: any,
    statusId: any,
    startDate: Date,
    endDate?: Date,
    note?: string,
  ) => {
    const status = getStatusById(statusId);
    if (!status) return;

    const newUpdates: any[] = [];
    let curr = startOfDay(startDate);
    const endBound = startOfDay(endDate || startDate);

    while (curr <= endBound) {
      const dayOfW = getDay(curr);
      const isFriSat = dayOfW === 5 || dayOfW === 6;

      if (
        isFriSat &&
        !status.name.includes("תגבור") &&
        !status.name.includes("אחר")
      ) {
        curr = addDays(curr, 1);
        continue;
      }

      newUpdates.push({
        employee_id: empId,
        status_type_id: statusId,
        start_date: format(curr, "yyyy-MM-dd"),
        end_date: format(curr, "yyyy-MM-dd"),
        note: note,
      });
      curr = addDays(curr, 1);
    }

    const newLogs = [...logs];
    newUpdates.forEach((upd) => {
      const log = {
        employee_id: upd.employee_id,
        status_type_id: upd.status_type_id,
        status_name: upd.note || status.name,
        status_color: status.color,
        notes: upd.note,
        start_datetime: `${upd.start_date}T00:00:00`,
        end_datetime: `${upd.start_date}T23:59:59`,
        is_verified: true,
        is_pending: true,
      };

      const existingIdx = newLogs.findIndex(
        (l) =>
          String(l.employee_id) === String(upd.employee_id) &&
          (l.start_datetime || "").slice(0, 10) === upd.start_date,
      );

      if (existingIdx >= 0) newLogs[existingIdx] = log;
      else newLogs.push(log);
    });

    setLogs(newLogs);

    setPendingUpdates((prev) => {
      const next = [...prev];
      newUpdates.forEach((nou) => {
        const idx = next.findIndex(
          (p) =>
            p.employee_id === nou.employee_id &&
            p.start_date === nou.start_date,
        );
        if (idx >= 0) next[idx] = nou;
        else next.push(nou);
      });
      return next;
    });

    setIsDialogOpen(false);
    setRangeMode(false);
    setRangeEndDate("");
    setShowOtherInput(false);
    setOtherNote("");
    setTargetOtherStatus(null);
    setSelectedStatusId(null);
  };

  const handleSaveAll = async () => {
    if (pendingUpdates.length === 0) return;

    setSaving(true);
    try {
      const success = await logBulkStatus(pendingUpdates);
      if (success) {
        toast.success("סידור העבודה עודכן בהצלחה");
        await fetchMatrix();
      } else {
        toast.error("עדכון סידור העבודה נכשל");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const handleUndoAll = () => {
    setPendingUpdates([]);
    fetchMatrix();
  };

  const activeDepartment = useMemo(
    () => departments.find((d) => d.id.toString() === selectedDept),
    [departments, selectedDept],
  );
  const sections = activeDepartment?.sections || [];
  const activeSection = useMemo(
    () => sections.find((s: any) => s.id.toString() === selectedSection),
    [sections, selectedSection],
  );
  const teams = activeSection?.teams || [];

  const activeTeam = useMemo(
    () => teams.find((t: any) => t.id.toString() === selectedTeam),
    [teams, selectedTeam],
  );

  const hasActiveFilters = useMemo(() => {
    if (statusFilter !== "all" || searchTerm !== "") return true;
    if (user?.is_admin) {
      return (
        selectedDept !== "all" ||
        selectedSection !== "all" ||
        selectedTeam !== "all"
      );
    }
    if (user?.commands_department_id) {
      return (
        selectedDept !== user.commands_department_id.toString() ||
        selectedSection !== "all" ||
        selectedTeam !== "all"
      );
    }
    if (user?.commands_section_id) {
      return (
        selectedSection !== user.commands_section_id.toString() ||
        selectedTeam !== "all"
      );
    }
    if (user?.commands_team_id) {
      return selectedTeam !== user.commands_team_id.toString();
    }
    return false;
  }, [
    selectedDept,
    selectedSection,
    selectedTeam,
    statusFilter,
    searchTerm,
    user,
  ]);

  const handleResetFilters = () => {
    if (!user || user.is_admin) {
      setSelectedDept("all");
      setSelectedSection("all");
      setSelectedTeam("all");
    } else {
      if (user.commands_department_id) {
        setSelectedDept(user.commands_department_id.toString());
        setSelectedSection("all");
        setSelectedTeam("all");
      } else if (user.commands_section_id) {
        if (user.assigned_department_id)
          setSelectedDept(user.assigned_department_id.toString());
        setSelectedSection(user.commands_section_id.toString());
        setSelectedTeam("all");
      } else if (user.commands_team_id) {
        if (user.assigned_department_id)
          setSelectedDept(user.assigned_department_id.toString());
        if (user.assigned_section_id)
          setSelectedSection(user.assigned_section_id.toString());
        setSelectedTeam(user.commands_team_id.toString());
      } else {
        setSelectedDept("all");
        setSelectedSection("all");
        setSelectedTeam("all");
      }
    }
    setStatusFilter("all");
    setSearchTerm("");
  };

  const filterButtonLabel = useMemo(() => {
    const activeUnitName =
      activeTeam?.name || activeSection?.name || activeDepartment?.name;
    const activeStatusName =
      statusFilter === "none"
        ? "לא דווח"
        : statusFilter !== "all"
          ? statusTypes.find((s) => s.id.toString() === statusFilter)?.name
          : null;

    const parts = [activeUnitName, activeStatusName].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : null;
  }, [activeDepartment, activeSection, activeTeam, statusFilter, statusTypes]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (user) {
        const eAny = emp as any;
        const uAny = user as any;
        const isSelf =
          (uAny.id && (String(eAny.id) === String(uAny.id) || String(eAny.user_id) === String(uAny.id))) ||
          (uAny.employee_id && (String(eAny.id) === String(uAny.employee_id) || String(eAny.user_id) === String(uAny.employee_id))) ||
          (uAny.username && (eAny.username === uAny.username || eAny.personal_number === uAny.username)) ||
          (uAny.first_name && uAny.last_name && eAny.first_name?.trim() === uAny.first_name?.trim() && eAny.last_name?.trim() === uAny.last_name?.trim());

        if (isSelf) return false;
      }

      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) || false;

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;

      const log = getLogForCell(emp.id, today);
      if (statusFilter === "none") return !log;

      const selectedST = statusTypes.find(
        (s) => s.id.toString() === statusFilter,
      );
      if (log && selectedST) {
        if (log.status_type_id === selectedST.id) return true;
        const logST = statusTypes.find((s) => s.id === log.status_type_id);
        if (logST?.parent_status_id === selectedST.id) return true;
      }

      return log?.status_type_id.toString() === statusFilter;
    });
  }, [employees, user, searchTerm, statusFilter, logs, statusTypes, today]);

  const dailyTotals = useMemo(() => {
    const totals: Record<
      string,
      { present: number; absent: number; total: number }
    > = {};

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      let present = 0;
      let absent = 0;

      filteredEmployees.forEach((emp) => {
        const log = getLogForCell(emp.id, day);
        if (log) {
          const st = statusTypes.find((s) => s.id === log.status_type_id);
          if (st?.is_presence) present++;
          else absent++;
        }
      });

      totals[dayKey] = { present, absent, total: present + absent };
    });

    return totals;
  }, [logs, filteredEmployees, weekDays, statusTypes]);

  const weekdayAverageAttendance = useMemo(() => {
    const workDayEntries = Object.entries(dailyTotals).filter(([dateKey]) => {
      const d = new Date(dateKey + "T12:00:00");
      return getDay(d) !== 5 && getDay(d) !== 6;
    });
    if (workDayEntries.length === 0 || filteredEmployees.length === 0) return 0;
    const sum = workDayEntries.reduce(
      (acc, [, v]) => acc + v.present / filteredEmployees.length,
      0,
    );
    return Math.round((sum / workDayEntries.length) * 100);
  }, [dailyTotals, filteredEmployees.length]);

  const rosterParentStatuses = useMemo(
    () => statusTypes.filter((s: any) => !s.parent_status_id),
    [statusTypes],
  );
  const rosterSubStatusMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    statusTypes.forEach((s: any) => {
      if (s.parent_status_id) {
        if (!map[s.parent_status_id]) map[s.parent_status_id] = [];
        map[s.parent_status_id].push(s);
      }
    });
    return map;
  }, [statusTypes]);

  return (
    <div
      id="roster-page-container"
      className="flex flex-col h-full selection:bg-primary/10 selection:text-primary"
      dir="rtl"
    >
      <div className="flex flex-col h-full">
        {/* Unified Page Header - Premium Layout Style */}
        <div className="hidden sm:block pt-6 pb-4 shrink-0 transition-all px-4 sm:px-6">
          <PageHeader
            icon={CalendarRange}
            title="סידור עבודה שבועי"
            className="mb-0"
            hideMobile={true}
            badge={
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 lg:mt-0 w-full sm:w-auto">
                {/* Save/Undo Actions */}
                <AnimatePresence>
                  {pendingUpdates.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-1.5 shrink-0"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUndoAll}
                        className="h-9 w-9 p-0 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-500/20 transition-all"
                        title="בטל הכל"
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="h-9 rounded-xl px-4 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white gap-2 transition-all"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        שמור חלון ({pendingUpdates.length})
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filters & Search - Minimalist Right Side */}
                {/* Mobile Search & Filter Row - Merged */}
                <div className="lg:hidden flex items-center gap-2 w-full">
                  <div className="relative flex-1 group/search">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within/search:text-primary transition-colors z-10" />
                    <Input
                      placeholder="חיפוש..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 w-full pr-9 pl-4 bg-muted/30 border-transparent focus:bg-background focus:border-primary/30 rounded-xl font-bold text-xs transition-all duration-300"
                    />
                  </div>

                  <div className="relative group">
                    <Button
                      variant="outline"
                      onClick={() => setFilterModalOpen(true)}
                      className={cn(
                        "h-10 w-10 p-0 rounded-xl border-border/40 hover:bg-muted/30 shrink-0 shadow-sm transition-all bg-background",
                        hasActiveFilters
                          ? "text-primary border-primary/30 bg-primary/5"
                          : "",
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      {hasActiveFilters && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-sm border border-background" />
                      )}
                    </Button>
                    {hasActiveFilters && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetFilters();
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background transition-all hover:scale-110 active:scale-90 z-20 shadow-sm"
                        title="נקה הכל"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Only Filter/Search */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="relative group">
                    <Button
                      variant="outline"
                      onClick={() => setFilterModalOpen(true)}
                      className={cn(
                        "h-9 rounded-xl px-3 border-border/60 hover:bg-accent/60 font-bold text-xs gap-1.5 shrink-0 shadow-xs transition-all bg-card/70 dark:bg-card/50 text-foreground",
                        hasActiveFilters
                          ? "text-primary border-primary/40 bg-primary/5"
                          : "",
                      )}
                    >
                      <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{filterButtonLabel || "סינון"}</span>
                      {hasActiveFilters && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary relative -right-0.5 shadow-xs" />
                      )}
                    </Button>
                    {hasActiveFilters && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetFilters();
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background transition-all hover:scale-110 active:scale-90 z-20 shadow-xs"
                        title="נקה הכל"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative group/search">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within/search:text-primary transition-colors z-10" />
                    <Input
                      placeholder="חיפוש..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 w-full sm:w-32 lg:w-40 pr-9 pl-4 bg-card/70 dark:bg-card/50 border-border/60 hover:bg-accent/40 focus:bg-background focus:border-primary/40 focus:sm:w-48 focus:lg:w-56 rounded-xl font-bold text-xs transition-all duration-300 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* Unified Filter Dialog (Native Bottom Sheet on mobile, Centered Modal on desktop) */}
        <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
          <DialogContent
            className="w-full sm:w-[580px] sm:min-w-[580px] sm:max-w-[580px] p-0 border border-border/80 dark:border-white/15 bg-card flex flex-col overflow-hidden !gap-0 pointer-events-auto rounded-t-[2.2rem] rounded-b-none sm:rounded-2xl shadow-xl"
            dir="rtl"
          >
            <DialogTitle className="sr-only">סינון סידור עבודה</DialogTitle>
            {filterModalOpen && (
              <DashboardFilters
                isDialogContent={true}
                onClose={() => setFilterModalOpen(false)}
                selectedDeptId={selectedDept}
                selectedSectionId={selectedSection}
                selectedTeamId={selectedTeam}
                selectedStatusId={statusFilter}
                onApplyModal={(filters) => {
                  if (filters.deptIds?.length) {
                    setSelectedDept(filters.deptIds.join(","));
                  } else {
                    setSelectedDept("all");
                  }
                  if (filters.sectionIds?.length) {
                    setSelectedSection(filters.sectionIds.join(","));
                  } else {
                    setSelectedSection("all");
                  }
                  if (filters.teamIds?.length) {
                    setSelectedTeam(filters.teamIds.join(","));
                  } else {
                    setSelectedTeam("all");
                  }
                  if (filters.statusIds?.length) {
                    setStatusFilter(filters.statusIds[0]);
                  } else {
                    setStatusFilter("all");
                  }
                  setFilterModalOpen(false);
                }}
                onFilterChange={(type, val) => {
                  const formatVal = (v: any) => {
                    if (!v || v === "all" || (Array.isArray(v) && v.length === 0)) return "all";
                    if (Array.isArray(v)) return v.join(",");
                    return String(v);
                  };
                  if (type === "department") {
                    setSelectedDept(formatVal(val));
                    setSelectedSection("all");
                    setSelectedTeam("all");
                  } else if (type === "section") {
                    setSelectedSection(formatVal(val));
                    setSelectedTeam("all");
                  } else if (type === "team") {
                    setSelectedTeam(formatVal(val));
                  } else if (type === "status") {
                    const statusStr = Array.isArray(val) ? (val[0] || "all") : (val || "all");
                    setStatusFilter(statusStr);
                  } else if (type === "reset") {
                    handleResetFilters();
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <div className="flex-1 overflow-auto py-3 sm:py-4 md:py-6 custom-scrollbar relative">
          {/* Mobile Calendar & Stats - Refactored */}
          <div className="lg:hidden bg-background/95 backdrop-blur-xl sticky top-0 z-40 mb-3 -mx-4 border-b border-border/20 px-4 pt-2 pb-3">
            {/* Month & Year Indicator */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-black text-primary/80 uppercase tracking-[0.2em]">
                {format(selectedDayMobile, "MMMM yyyy", { locale: he })}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent mr-4" />
            </div>

            {/* Horizontal Date Picker - 7 Column Grid with Animated Selection */}
            <div className="grid grid-cols-7 gap-1.5 px-1 relative">
              {weekDays.map((day, i) => {
                const isSelected = isSameDay(day, selectedDayMobile);
                const isToday = isSameDay(day, today);
                const weekend = getDay(day) === 5 || getDay(day) === 6;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDayMobile(day);
                      if (window.navigator.vibrate)
                        window.navigator.vibrate(10);
                    }}
                    className={cn(
                      "h-13 flex flex-col items-center justify-center rounded-xl transition-colors relative outline-none",
                      isSelected
                        ? "text-white z-10"
                        : "bg-muted/30 text-foreground hover:bg-muted/50",
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeDayMobile"
                        className="absolute inset-0 bg-primary rounded-xl shadow-[0_8px_16px_-4px_rgba(59,130,246,0.4)]"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    <span
                      className={cn(
                        "text-[10px] font-black mb-0.5 relative z-10",
                        isSelected
                          ? "text-white/80"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {format(day, "EEE", { locale: he })}
                    </span>
                    <span className="text-sm font-black tabular-nums relative z-10 leading-tight">
                      {format(day, "dd")}
                    </span>

                    {weekend && !isSelected && (
                      <ShabbatIcon className="w-2.5 h-2.5 text-amber-500/60 absolute bottom-0.5 left-1/2 -translate-x-1/2 z-10" />
                    )}
                    {isToday && !isSelected && (
                      <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary left-1/2 -translate-x-1/2 z-10" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive Stats Pills */}
            <div className="flex items-center gap-2 mt-2 px-1">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all font-black text-[11px]",
                  "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10 active:scale-95",
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span>
                  נוכחים:{" "}
                  {dailyTotals[format(selectedDayMobile, "yyyy-MM-dd")]
                    ?.present || 0}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("none")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all font-black text-[11px]",
                  "bg-rose-500/10 text-rose-600 border border-rose-500/10 active:scale-95",
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span>
                  נעדרים:{" "}
                  {dailyTotals[format(selectedDayMobile, "yyyy-MM-dd")]
                    ?.absent || 0}
                </span>
              </button>
            </div>
          </div>

          {/* Layout Wrapper */}
          <div className="relative group">
            {/* Desktop Roster Grid (hidden on mobile) */}
            <div className="hidden lg:block bg-background border border-border/40 rounded-2xl min-w-max lg:min-w-full overflow-hidden relative">
              {/* Table Header */}
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-[minmax(240px,1.5fr)_repeat(7,minmax(110px,1fr))] border-b border-border/30 sticky top-0 z-30 backdrop-blur-2xl bg-background/95">
                  <div className="p-4 flex items-center justify-between border-l border-border/30 sticky right-0 z-40 bg-background/95 backdrop-blur-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground uppercase tracking-widest">
                        שם השוטר
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold mt-0.5 flex items-center gap-1.5">
                        <span>{filteredEmployees.length} שוטרים בסינון</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-primary">
                          {weekdayAverageAttendance}% ממוצע נוכחות
                        </span>
                      </span>
                    </div>
                  </div>

                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    const weekend = getDay(day) === 5 || getDay(day) === 6;
                    const dailyTotal = dailyTotals[
                      format(day, "yyyy-MM-dd")
                    ] || {
                      present: 0,
                      absent: 0,
                      total: 0,
                    };

                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-4 flex flex-col items-center justify-center border-l border-border/30 transition-colors relative",
                          isToday && "bg-primary/[0.04]",
                        )}
                      >
                        {/* Today indicator line on top */}
                        {isToday && (
                          <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-primary" />
                        )}

                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-1.5",
                            isToday
                              ? "text-primary"
                              : "text-muted-foreground/50",
                          )}
                        >
                          {format(day, "EEEE", { locale: he })}
                        </span>

                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={cn(
                              "text-xl font-black tabular-nums leading-none",
                              isToday ? "text-primary" : "text-foreground/80",
                            )}
                          >
                            {format(day, "dd")}
                          </span>
                        </div>

                        {weekend && (
                          <ShabbatIcon className="w-5 h-5 text-amber-500 mt-0.5" />
                        )}
                        {!weekend && dailyTotal.total > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] font-black text-emerald-600 tabular-nums">
                              {dailyTotal.present}
                            </span>
                            <span className="text-[9px] text-muted-foreground/40">
                              /
                            </span>
                            <span className="text-[9px] font-black text-rose-600 tabular-nums">
                              {dailyTotal.absent}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border/20 relative">
                  {loadingMatrix ? (
                    <div className="py-48 flex flex-col items-center justify-center gap-6">
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-16 h-16 rounded-full border-4 border-border/40 border-t-primary"
                        />
                      </div>
                      <span className="text-sm font-black text-muted-foreground animate-pulse tracking-widest uppercase">
                        טוען נתונים...
                      </span>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="py-48 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6">
                        <Users className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-lg font-black text-foreground tracking-tight">
                        לא נמצאו תוצאות
                      </h3>
                      <p className="text-xs text-muted-foreground/70 mt-2 font-bold max-w-xs">
                        נסה לשנות את מסנני החיפוש
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map((emp, empIdx) => (
                      <motion.div
                        key={emp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(empIdx * 0.05, 0.5) }}
                        className="grid grid-cols-[minmax(240px,1.5fr)_repeat(7,minmax(110px,1fr))] group/row hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all"
                      >
                        <div className="p-4 border-l border-border/30 sticky right-0 z-20 bg-background/90 backdrop-blur-xl transition-all border-r-2 border-r-transparent group-hover/row:border-r-primary">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-border/40 flex items-center justify-center text-slate-500 font-black text-xs group-hover/row:scale-105 transition-all">
                              {emp.first_name?.[0] || ""}
                              {emp.last_name?.[0] || ""}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <EmployeeLink
                                employee={emp}
                                className="text-sm font-black text-foreground truncate tracking-tight group-hover/row:text-primary transition-colors text-right"
                              />
                              <div className="flex items-center gap-1.5 mt-1">
                                {(emp.is_commander || emp.is_admin) && (
                                  <>
                                    <span className="text-[9px] font-black text-muted-foreground/60 tracking-widest">
                                      {emp.username}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-border/60" />
                                  </>
                                )}
                                <span className="text-[9px] font-black text-primary/70 truncate bg-primary/5 px-1.5 py-0.5 rounded-md">
                                  {emp.team_name || emp.section_name || "כללי"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {weekDays.map((day, i) => {
                          const log = getLogForCell(emp.id, day);
                          const weekend =
                            getDay(day) === 5 || getDay(day) === 6;
                          const isPending = log?.is_pending;
                          const isSundayTourCell =
                            empIdx === 0 && getDay(day) === 0;
                          const isFridayTourCell =
                            empIdx === 0 && getDay(day) === 5;
                          const forceShowPlus =
                            (isSundayTourCell &&
                              currentTourStepId === "roster_status_change") ||
                            (isFridayTourCell &&
                              currentTourStepId === "roster_weekend_holidays");

                          return (
                            <div
                              key={i}
                              id={
                                isSundayTourCell
                                  ? "tour-roster-cell"
                                  : isFridayTourCell
                                    ? "tour-roster-weekend-cell"
                                    : undefined
                              }
                              onClick={() => handleCellClick(emp.id, day)}
                              className={cn(
                                "p-2 border-l border-border/30 flex items-center justify-center cursor-pointer transition-all relative group/cell min-h-[72px]",
                                weekend && "bg-muted/5",
                                "hover:bg-muted/30",
                              )}
                            >
                              {!log || forceShowPlus ? (
                                <div
                                  className={cn(
                                    "group-hover/cell:opacity-100 transition-all transform scale-75 group-hover/cell:scale-100 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:bg-primary/10 hover:text-primary",
                                    forceShowPlus
                                      ? "opacity-100 scale-100 bg-primary/10 text-primary border border-primary/20"
                                      : "opacity-0",
                                  )}
                                >
                                  <Plus className="w-4 h-4" />
                                </div>
                              ) : (
                                <motion.div
                                  initial={false}
                                  animate={
                                    isPending
                                      ? { scale: [1, 1.02, 1] }
                                      : { scale: 1 }
                                  }
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className={cn(
                                    "w-full h-full max-h-[55px] flex items-center justify-center p-2 rounded-xl transition-all relative overflow-hidden group/status",
                                    isPending
                                      ? "ring-2 ring-primary ring-offset-1"
                                      : "border border-transparent hover:border-border/60",
                                  )}
                                  style={{
                                    backgroundColor: `${log.status_color}10`,
                                    borderLeft: `3px solid ${log.status_color}`,
                                  }}
                                >
                                  <div
                                    className="absolute inset-0 opacity-0 group-hover/status:opacity-5 transition-opacity"
                                    style={{
                                      backgroundColor: log.status_color,
                                    }}
                                  />
                                  <span
                                    className="text-[11px] font-black text-center leading-tight tracking-tight z-10 truncate px-1"
                                    style={{ color: log.status_color }}
                                    title={log.notes || log.status_name}
                                  >
                                    {log.notes || log.status_name}
                                  </span>
                                  {isPending && (
                                    <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  )}
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Employee List (Only visible on small screens) */}
            <div className="lg:hidden space-y-2 pb-32">
              {loadingMatrix ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm font-bold">טוען נתונים...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-16 text-center bg-muted/10 rounded-[2rem] border border-dashed border-border/60 p-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-2">
                    לא נמצאו שוטרים
                  </h3>
                  <p className="text-sm text-muted-foreground/60 font-bold mb-8">
                    נסה לשנות את המסננים או מילת החיפוש
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setSelectedDept("all");
                    }}
                    className="rounded-full px-8 font-black text-xs h-10 bg-background border-primary/20 text-primary"
                  >
                    נקה את כל המסננים
                  </Button>
                </div>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const log = getLogForCell(emp.id, selectedDayMobile);
                  const isWeekend =
                    getDay(selectedDayMobile) === 5 ||
                    getDay(selectedDayMobile) === 6;
                  const mobileForceShowPlus =
                    idx === 0 &&
                    (currentTourStepId === "roster_status_change" ||
                      currentTourStepId === "roster_weekend_holidays");
                  return (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleCellClick(emp.id, selectedDayMobile)}
                      className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-xl p-2.5 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden"
                    >
                      {/* Left status accent line */}
                      {log && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: log.status_color }}
                        />
                      )}

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9.5 h-9.5 rounded-lg bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center font-black text-[11px] shrink-0 text-muted-foreground border border-border/20">
                            {emp.first_name?.[0] || ""}
                            {emp.last_name?.[0] || ""}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[14px] font-black text-foreground truncate tracking-tight leading-tight">
                              {emp.first_name} {emp.last_name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-black text-primary/80 bg-primary/5 px-1 py-0.5 rounded-md">
                                {emp.team_name || emp.section_name || "כללי"}
                              </span>
                              {(emp.is_commander || emp.is_admin) && (
                                <span className="text-[9px] font-bold text-muted-foreground/50">
                                  • {emp.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className="shrink-0"
                          id={
                            idx === 0
                              ? currentTourStepId === "roster_weekend_holidays"
                                ? "mobile-tour-roster-weekend-cell"
                                : "mobile-tour-roster-cell"
                              : undefined
                          }
                        >
                          {log && !mobileForceShowPlus ? (
                            <div
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-tight text-center min-w-[75px] flex items-center justify-center"
                              style={{
                                backgroundColor: `${log.status_color}1a`,
                                color: log.status_color,
                                border: `1px solid ${log.status_color}30`,
                              }}
                            >
                              {log.notes || log.status_name}
                            </div>
                          ) : isWeekend && !mobileForceShowPlus ? (
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                              <ShabbatIcon className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                              <Plus className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            id="tour-roster-dialog"
            className="w-full sm:w-[92vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92dvh] sm:max-h-[85vh] p-0 rounded-t-3xl sm:rounded-2xl overflow-hidden border shadow-2xl flex flex-col justify-between bg-card text-foreground dir-rtl"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0">
                  {selectedCell && employees.find((e) => e.id === selectedCell.empId) ? (
                    `${employees.find((e) => e.id === selectedCell.empId).first_name[0]}${employees.find((e) => e.id === selectedCell.empId).last_name[0]}`
                  ) : (
                    <CalendarIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 text-right">
                  <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                    {selectedCell
                      ? employees.find((e) => e.id === selectedCell.empId)
                        ? `${employees.find((e) => e.id === selectedCell.empId).first_name} ${employees.find((e) => e.id === selectedCell.empId).last_name}`
                        : "עדכון שיבוץ"
                      : "עדכון שיבוץ"}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">
                      {selectedCell &&
                        format(selectedCell.date, "EEEE, dd בMMMM yyyy", {
                          locale: he,
                        })}
                    </span>
                    {selectedCell && employees.find((e) => e.id === selectedCell.empId)?.team_name && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-[11px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">
                          {employees.find((e) => e.id === selectedCell.empId).team_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 sm:space-y-5">
              
              {/* Date Range Selector Banner */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-muted/25 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CalendarRange className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-foreground block">
                      {rangeMode ? "החלת סטטוס על טווח תאריכים" : "עדכון לתאריך בודד"}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {rangeMode
                        ? "בחר תאריך סיום כדי להחיל את הסטטוס על מספר ימים רצופים"
                        : "לחץ כדי להרחיב למספר ימים (חופשה מרוכזת, קורס, מחלה וכו')"}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={rangeMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setRangeMode(!rangeMode);
                    if (!rangeMode && selectedCell) {
                      setRangeEndDate(format(addDays(selectedCell.date, 1), "yyyy-MM-dd"));
                    }
                  }}
                  className="h-8.5 px-3.5 text-xs font-bold rounded-lg cursor-pointer shrink-0"
                >
                  {rangeMode ? "ביטול טווח (יום בודד)" : "החל על טווח"}
                </Button>
              </div>

              {/* Range Inputs (When active) */}
              <AnimatePresence>
                {rangeMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 sm:p-4 bg-primary/[0.03] border border-primary/20 rounded-xl space-y-3 overflow-hidden shadow-2xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-muted-foreground">
                          מתאריך התחלה
                        </label>
                        <div className="h-9.5 flex items-center px-3 bg-background rounded-lg border border-border text-xs font-bold text-foreground">
                          {selectedCell && format(selectedCell.date, "dd/MM/yyyy")}
                        </div>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-bold text-muted-foreground">
                          עד תאריך סיום
                        </label>
                        <Input
                          type="date"
                          value={rangeEndDate}
                          min={selectedCell ? format(selectedCell.date, "yyyy-MM-dd") : ""}
                          onChange={(e) => setRangeEndDate(e.target.value)}
                          className="h-9.5 bg-background border-border text-xs font-bold rounded-lg focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Sections */}
              {(() => {
                const dayOfW = selectedCell ? getDay(selectedCell.date) : -1;
                const isWeekendDay = dayOfW === 5 || dayOfW === 6;

                const officeParent = rosterParentStatuses.find((p) => p.name === "משרד");
                const otherParents = rosterParentStatuses.filter((p) => p.name !== "משרד");
                const subStatuses = officeParent ? rosterSubStatusMap[officeParent.id] || [] : [];

                return (
                  <div className="space-y-4">
                    {/* Work / Office Section */}
                    {!isWeekendDay && officeParent && (
                      <div className="space-y-2 text-right">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          סטטוס נוכחות ועבודה
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <StatusCard
                            type={officeParent}
                            large
                            active={selectedStatusId === officeParent.id}
                            onClick={() => handleSelectStatus(officeParent)}
                          />
                          {subStatuses.map((sub) => (
                            <StatusCard
                              key={sub.id}
                              type={sub}
                              isSub
                              active={selectedStatusId === sub.id}
                              onClick={() => handleSelectStatus(sub)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Absences / Activities Section */}
                    <div className="space-y-2 text-right">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {isWeekendDay ? "סטטוסים לסוף שבוע (תורנות / תגבור / מיוחד)" : "סטטוס היעדרות ופעילויות"}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
                        {otherParents
                          .filter((p) => {
                            if (isWeekendDay) {
                              return p.name.includes("תגבור") || p.name.includes("אחר") || p.name.includes("תורנות") || p.name.includes("משימה");
                            }
                            return true;
                          })
                          .map((parent) => (
                            <StatusCard
                              key={parent.id}
                              type={parent}
                              active={selectedStatusId === parent.id}
                              onClick={() => handleSelectStatus(parent)}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Custom Status "Other" Slide-down */}
                    <AnimatePresence>
                      {showOtherInput && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-muted/40 rounded-xl border border-border/80 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-bold text-xs">
                              <Plus className="w-4 h-4" />
                              <span>פירוט סטטוס מותאם אישית (אחר)</span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                autoFocus
                                placeholder="הזן תיאור סטטוס (למשל: יום עיון, בדיקות רפואיות...)"
                                value={otherNote}
                                onChange={(e) => setOtherNote(e.target.value)}
                                className="h-10 bg-background border-border rounded-lg text-xs font-bold"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && otherNote.trim()) {
                                    handleConfirmStatus();
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseDialog}
                className="px-5 h-9 text-xs font-bold rounded-lg cursor-pointer"
              >
                ביטול
              </Button>

              <div className="flex items-center gap-3">
                {selectedStatusId ? (
                  <span className="text-xs font-bold text-primary hidden sm:inline-block">
                    נבחר: {getStatusById(selectedStatusId)?.name}
                    {rangeMode && rangeEndDate ? ` (עד ${format(new Date(rangeEndDate), "dd/MM/yyyy")})` : ""}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                    בחר סטטוס מהרשימה ולחץ על אישור
                  </span>
                )}

                <Button
                  type="button"
                  size="sm"
                  disabled={
                    !selectedStatusId ||
                    (getStatusById(selectedStatusId)?.name === "אחר" && !otherNote.trim())
                  }
                  onClick={handleConfirmStatus}
                  className="px-6 h-9 text-xs font-black rounded-lg gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  אישור שיבוץ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Mobile FAB was removed due to duplication with Chat FAB */}
    </div>
  );
}
