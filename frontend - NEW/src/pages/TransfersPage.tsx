import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTransfers } from "@/hooks/useTransfers";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/config/api.client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeftRight,
  CheckCircle2,
  Search,
  Clock,
  ArrowLeft,
  ArrowRight,
  History,
  ShieldAlert,
  Plus,
  MapPin,
  ShieldCheck,
  User,
  Phone,
  XCircle,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  FileText,
  CornerDownLeft,
  Filter,
  X,
  RotateCcw,
  Send,
  Sparkles,
  Building2,
  Layers,
  Users,
  Check,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn, cleanUnitName } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Employee } from "@/types/employee.types";

export default function TransfersPage() {
  const { user } = useAuthContext();
  const { employees, getStructure, fetchEmployees } = useEmployees();
  const [searchParams] = useSearchParams();
  const {
    pendingTransfers,
    history,
    loading,
    fetchPending,
    fetchHistory,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    cancelTransfer,
  } = useTransfers();

  const [activeTab, setActiveTab] = useState("history");
  const [structure, setStructure] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Request Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(undefined);

  const [isSnoozing, setIsSnoozing] = useState(false);

  // Expanded Text State
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const renderUnitCell = (
    source: string,
    target: string,
    type: "source" | "target",
  ) => {
    const sParts = (source || "").split(" / ").map((p) => p.trim());
    const tParts = (target || "").split(" / ").map((p) => p.trim());

    const isTarget = type === "target";
    const deptCommon = sParts[0] === tParts[0];
    const sectCommon = deptCommon && sParts[1] === tParts[1];

    const currentParts = isTarget ? tParts : sParts;
    const [dept, sect, team] = currentParts;

    const showDept = !isTarget || !deptCommon;
    const showSect = !isTarget || !sectCommon;

    const hasBottomLine = (sect && showSect) || team;

    return (
      <div
        className="flex flex-col text-right group/unit sm:min-w-[140px] w-full"
        dir="rtl"
      >
        {/* Department Name */}
        {showDept && dept && dept !== "מטה" ? (
          <span
            className={cn(
              "text-[13px] sm:text-[13px] font-black tracking-tight leading-tight",
              isTarget ? "text-primary dark:text-blue-400" : "text-foreground",
            )}
          >
            {cleanUnitName(dept)}
          </span>
        ) : (
          isTarget &&
          !showDept && (
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter mb-0.5">
              באותה מחלקה
            </span>
          )
        )}

        {/* Section & Team Line */}
        {hasBottomLine && (
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1 justify-start">
            {isTarget && (
              <div className="w-1 h-1 rounded-full bg-primary shrink-0 animate-pulse ml-0.5 sm:ml-1" />
            )}
            <span
              className={cn(
                "text-[10px] sm:text-[10px]",
                isTarget
                  ? "text-primary font-black sm:font-bold dark:text-blue-400"
                  : "text-muted-foreground font-medium",
              )}
            >
              {showSect &&
                sect &&
                sect !== "מטה" &&
                `מדור ${cleanUnitName(sect)}`}
              {showSect && sect && sect !== "מטה" && team && team !== "מטה" && (
                <span className="mx-1 opacity-30 select-none">•</span>
              )}
              {team && team !== "מטה" && `חוליה ${cleanUnitName(team)}`}
            </span>
          </div>
        )}

        {/* Arrow for Target context */}
        {isTarget && !showDept && !hasBottomLine && (
          <div className="flex items-center gap-2 mt-0.5">
            <div className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-black text-primary">
              ללא שינוי נוסף
            </div>
          </div>
        )}
      </div>
    );
  };

  // Form State
  const [targetDeptId, setTargetDeptId] = useState<string>("");
  const [targetSectionId, setTargetSectionId] = useState<string>("");
  const [targetTeamId, setTargetTeamId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPending();
    fetchHistory();
    fetchEmployees();
    const loadStructure = async () => {
      const data = await getStructure(true);
      if (data) setStructure(data);
    };
    loadStructure();
  }, [fetchPending, fetchHistory, getStructure, fetchEmployees]);

  useEffect(() => {
    const empId = searchParams.get("employeeId");
    if (empId && employees.length > 0) {
      const emp = employees.find((e) => e.id === Number(empId));
      if (emp) {
        setSelectedEmployee(emp);
        setActiveTab("new");
      }
    }
  }, [searchParams, employees]);

  const filteredEmployeesList = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    return employees
      .filter(
        (emp) =>
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(lower) ||
          emp.username?.toLowerCase().includes(lower) ||
          emp.department_name?.toLowerCase().includes(lower) ||
          false,
      )
      .slice(0, 6);
  }, [employees, searchTerm]);

  const PRESET_REASONS = [
    "צורך מבצעי דחוף ביחידה",
    "קידום ושינוי תפקיד",
    "מעבר מדור / חוליה",
    "בקשת פרט ורווחה",
    "ארגון מחדש ואיחוד תקנים",
  ];

  const selectedTargetDept = useMemo(
    () => structure.find((d) => d.id.toString() === targetDeptId),
    [structure, targetDeptId]
  );
  const selectedTargetSection = useMemo(
    () => selectedTargetDept?.sections?.find((s: any) => s.id.toString() === targetSectionId),
    [selectedTargetDept, targetSectionId]
  );
  const selectedTargetTeam = useMemo(
    () => selectedTargetSection?.teams?.find((t: any) => t.id.toString() === targetTeamId),
    [selectedTargetSection, targetTeamId]
  );

  const targetUnitDisplay = useMemo(() => {
    return [
      selectedTargetDept?.name,
      selectedTargetSection?.name,
      selectedTargetTeam?.name
    ].filter(Boolean).map(cleanUnitName).join(" / ");
  }, [selectedTargetDept, selectedTargetSection, selectedTargetTeam]);

  // Cloud Stats
  const stats = useMemo(() => {
    const safePending = Array.isArray(pendingTransfers) ? pendingTransfers : [];
    const safeHistory = Array.isArray(history) ? history : [];
    const pending = safePending.length;
    const approved = safeHistory.filter((h) => h?.status?.toLowerCase() === "approved").length;
    const rejected = safeHistory.filter((h) => h?.status?.toLowerCase() === "rejected").length;
    return { pending, approved, rejected };
  }, [pendingTransfers, history]);

  const filteredHistory = useMemo(() => {
    const safePending = Array.isArray(pendingTransfers) ? pendingTransfers : [];
    const safeHistory = Array.isArray(history) ? history : [];
    const historyIds = new Set(safeHistory.map((h) => h.id));
    const uniquePending = safePending.filter((p) => !historyIds.has(p.id));
    const allList = [...uniquePending, ...safeHistory];

    let result = allList;
    if (historyFilter) {
      result = result.filter((h) => h.status?.toLowerCase() === historyFilter.toLowerCase());
    }
    if (searchTerm && activeTab === "history") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (h) => h.employee_name?.toLowerCase().includes(lowerSearch) || false,
      );
    }
    return result;
  }, [history, pendingTransfers, historyFilter, searchTerm, activeTab]);

  const handleCreateRequest = async () => {
    if (!selectedEmployee || !targetDeptId) {
      toast.error("יש למלא את כל שדות החובה");
      return;
    }

    let targetType: "department" | "section" | "team" = "department";
    let targetId = targetDeptId;

    if (targetTeamId) {
      targetType = "team";
      targetId = targetTeamId;
    } else if (targetSectionId) {
      targetType = "section";
      targetId = targetSectionId;
    }

    setIsSubmitting(true);
    const success = await createTransfer({
      employee_id: selectedEmployee.id,
      target_type: targetType,
      target_id: parseInt(targetId),
      reason,
    });

    if (success) {
      toast.success("בקשת ההעברה הוגשה בהצלחה");
      setSelectedEmployee(null);
      setTargetDeptId("");
      setTargetSectionId("");
      setTargetTeamId("");
      setReason("");
      setActiveTab("pending");
      fetchPending();
    }
    setIsSubmitting(false);
  };

  const handleApprove = async (id: number) => {
    if (await approveTransfer(id)) {
      toast.success("הבקשה אושרה והשיבוץ עודכן");
      fetchPending();
      fetchHistory();
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason) {
      toast.error("חובה לציין סיבת דחייה");
      return;
    }
    if (await rejectTransfer(id, rejectionReason)) {
      toast.info("הבקשה נדחתה");
      setRejectionReason("");
      setIsRejecting(false);
      setSelectedRequest(null); // Close modal
      fetchPending();
      fetchHistory();
    }
  };

  const handleCancel = async (id: number) => {
    if (confirm("האם אתה בתוך שברצונך לבטל את הבקשה?")) {
      if (await cancelTransfer(id)) {
        toast.info("הבקשה בוטלה");
        setSelectedRequest(null);
        fetchPending();
        fetchHistory();
      }
    }
  };

  const handleSnooze = async () => {
    if (!snoozeDate || !selectedRequest) return;

    // Simulation of backend snooze logic
    toast.success(
      `תזכורת נקבעה לתאריך ${snoozeDate.toLocaleDateString("he-IL")}`,
    );
    setIsSnoozing(false);
    setSnoozeDate(undefined);
    setSelectedRequest(null);
  };

  const openProfile = async (empId: number) => {
    // First try to find in existing employees list
    let emp = employees.find((e) => e.id === empId);

    // If not found (e.g., employee from another unit in transfer request), fetch directly
    if (!emp) {
      try {
        const { data } = await apiClient.get(`/employees/${empId}`);
        emp = data;
      } catch (error) {
        toast.error("לא ניתן לטעון את פרטי השוטר");
        return;
      }
    }

    if (emp) setViewingEmployee(emp);
    else toast.error("נתוני שוטר לא נמצאו");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      rejected:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      cancelled: "bg-muted text-muted-foreground border-border/50",
      pending:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
    const labels: Record<string, string> = {
      approved: "אושר",
      rejected: "נדחה",
      cancelled: "בוטל",
      pending: "ממתין",
    };
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-bold text-[10px] px-2",
          styles[status] || styles.pending,
        )}
      >
        {labels[status] || labels.pending}
      </Badge>
    );
  };

  const canManage = user?.is_admin || user?.is_commander;

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 pb-8" dir="rtl">
      {/* Page Header */}
      <div className="pt-2 sm:pt-4 pb-1 px-1 sm:px-2 shrink-0">
        <PageHeader
          icon={ArrowLeftRight}
          title="בקשות העברה ושיבוץ"
          className="mb-0"
        />
      </div>

      {/* Main Navigation Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-2 shadow-2xs">
        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/40 rounded-xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              setHistoryFilter(null);
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer",
              activeTab === "history"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
          >
            <History className="w-4 h-4" />
            <span>כלל הבקשות</span>
            <span className="px-1.5 py-0.2 rounded-md bg-muted text-[10px] font-black text-muted-foreground">
              {stats.approved + stats.rejected + stats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("pending");
              setHistoryFilter(null);
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer",
              activeTab === "pending"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>ממתינות לאישור</span>
            {stats.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer",
              activeTab === "new"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-primary hover:bg-primary/10",
            )}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>הגשת בקשת ניוד</span>
          </button>
        </div>

        {/* Search Input when in list mode */}
        {activeTab !== "new" && (
          <div className="relative w-full sm:w-64 md:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="חיפוש לפי שם שוטר או יחידה..."
              value={searchTerm}
              className="pr-10 h-10 bg-background border-border/60 hover:border-border font-medium text-xs rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-right w-full"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Overview Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            if (historyFilter === "pending") {
              setHistoryFilter(null);
            } else {
              setActiveTab("history");
              setHistoryFilter("pending");
            }
          }}
          className={cn(
            "bg-card rounded-2xl p-3 sm:p-4 border transition-all text-right w-full cursor-pointer flex flex-col justify-between gap-2 active:scale-[0.99] relative overflow-hidden group shadow-2xs",
            historyFilter === "pending"
              ? "border-amber-500/80 bg-amber-500/5 ring-2 ring-amber-500/20"
              : "border-border/70 hover:border-amber-500/40 hover:bg-amber-500/[0.02]",
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">
              בהמתנה לטיפול
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.pending}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
              בקשות
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (historyFilter === "approved") {
              setHistoryFilter(null);
            } else {
              setActiveTab("history");
              setHistoryFilter("approved");
            }
          }}
          className={cn(
            "bg-card rounded-2xl p-3 sm:p-4 border transition-all text-right w-full cursor-pointer flex flex-col justify-between gap-2 active:scale-[0.99] relative overflow-hidden group shadow-2xs",
            historyFilter === "approved"
              ? "border-emerald-500/80 bg-emerald-500/5 ring-2 ring-emerald-500/20"
              : "border-border/70 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]",
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">
              בקשות שאושרו
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.approved}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
              בוצעו
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (historyFilter === "rejected") {
              setHistoryFilter(null);
            } else {
              setActiveTab("history");
              setHistoryFilter("rejected");
            }
          }}
          className={cn(
            "bg-card rounded-2xl p-3 sm:p-4 border transition-all text-right w-full cursor-pointer flex flex-col justify-between gap-2 active:scale-[0.99] relative overflow-hidden group shadow-2xs",
            historyFilter === "rejected"
              ? "border-rose-500/80 bg-rose-500/5 ring-2 ring-rose-500/20"
              : "border-border/70 hover:border-rose-500/40 hover:bg-rose-500/[0.02]",
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">
              בקשות שנדחו
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.rejected}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
              נדחו
            </span>
          </div>
        </button>
      </div>

      {/* Active Filter Pill Banner */}
      {activeTab !== "new" && historyFilter !== null && (
        <div className="flex items-center justify-between p-2.5 sm:p-3 px-3.5 sm:px-4 rounded-xl bg-card border border-border/80 shadow-2xs transition-all animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                historyFilter === "pending"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : historyFilter === "approved"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              )}
            >
              {historyFilter === "pending" ? (
                <Clock className="w-3.5 h-3.5" />
              ) : historyFilter === "approved" ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex items-center gap-1.5 truncate text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">סינון מוצג:</span>
              <span className="font-bold text-foreground truncate">
                {historyFilter === "pending"
                  ? "בהמתנה לאישור"
                  : historyFilter === "approved"
                    ? "בקשות שאושרו"
                    : "בקשות שנדחו"}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-black text-foreground shrink-0">
                {historyFilter === "pending"
                  ? stats.pending
                  : historyFilter === "approved"
                    ? stats.approved
                    : stats.rejected}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistoryFilter(null)}
            className="h-7 px-2.5 text-xs font-bold text-foreground hover:bg-muted border-border rounded-lg flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-muted-foreground" />
            <span>הצג הכל</span>
          </Button>
        </div>
      )}

        {activeTab === "pending" && (
          <>
            {/* Mobile View - Pending Cards */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground animate-pulse border border-border">
                  טוען נתונים...
                </div>
              ) : pendingTransfers.length === 0 ? (
                <div className="bg-card rounded-2xl p-12 text-center border border-border border-dashed">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">
                    אין בקשות ממתינות
                  </p>
                </div>
              ) : (
                pendingTransfers.map((req) => (
                  <div
                    key={req.id}
                    className="bg-card border border-border rounded-2xl p-4  hover:border-primary/20 transition-all active:scale-[0.98]"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/5">
                          {req.employee_name?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-foreground">
                            {req.employee_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono"></span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 border-amber-200/50 text-[10px] h-6"
                      >
                        ממתין
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2.5 mb-4">
                      <div className="bg-muted/30 dark:bg-slate-900/50 rounded-2xl p-3 text-right flex flex-col justify-center min-h-[70px] border border-border/20">
                        <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1.5 tracking-widest pl-2">
                          מעבר מ:
                        </span>
                        {renderUnitCell(
                          req.source_name,
                          req.target_name,
                          "source",
                        )}
                      </div>
                      <div className="bg-primary/[0.03] dark:bg-primary/[0.05] rounded-2xl p-3 text-right flex flex-col justify-center min-h-[70px] border border-primary/10">
                        <span className="text-[9px] font-black text-primary uppercase block mb-1.5 tracking-widest pl-2">
                          אל יעד:
                        </span>
                        {renderUnitCell(
                          req.source_name,
                          req.target_name,
                          "target",
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground leading-none">
                            הוגש ע"י
                          </span>
                          <span className="text-[10px] font-bold text-foreground">
                            {req.requester_name}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View - Pending Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border  overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                        שוטר
                      </TableHead>
                      <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                        יחידה נוכחית
                      </TableHead>
                      <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                        יחידה מבוקשת
                      </TableHead>
                      <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[12%]">
                        הוגש ע"י
                      </TableHead>
                      <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[10%]">
                        תאריך
                      </TableHead>
                      <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[10%]">
                        סטטוס
                      </TableHead>
                      <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                        מידע נוסף
                      </TableHead>
                      <TableHead className="text-center px-6 font-bold text-muted-foreground text-xs h-14 w-[10%]">
                        הצגת הבקשה
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-40 text-center text-muted-foreground italic"
                        >
                          טוען נתונים...
                        </TableCell>
                      </TableRow>
                    ) : pendingTransfers.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={8}
                          className="h-[400px] text-center border-none"
                        >
                          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                              <CheckCircle2 className="w-10 h-10 text-muted-foreground/40" />
                            </div>
                            <p className="text-lg font-bold text-slate-400">
                              אין בקשות ממתינות
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingTransfers.map((req) => (
                        <TableRow
                          key={req.id}
                          className="group hover:bg-muted/30 border-b last:border-0 transition-colors"
                        >
                          <TableCell className="px-6 py-4 align-middle">
                            <button
                              onClick={() => openProfile(req.employee_id)}
                              className="flex items-center gap-3 text-right hover:bg-muted/50 p-2 -mr-2 rounded-xl transition-colors outline-none group/btn max-w-full"
                            >
                              <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center font-black text-xs text-muted-foreground  group-hover/btn:scale-110 transition-transform shrink-0">
                                {req.employee_name?.[0]}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-xs text-foreground truncate block max-w-[120px]">
                                  {req.employee_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono truncate"></span>
                              </div>
                            </button>
                          </TableCell>
                          <TableCell className="px-6 py-4 align-middle">
                            {renderUnitCell(
                              req.source_name,
                              req.target_name,
                              "source",
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 align-middle">
                            {renderUnitCell(
                              req.source_name,
                              req.target_name,
                              "target",
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col leading-tight">
                              <span className="text-xs font-bold text-foreground">
                                {req.requester_name}
                              </span>
                              <span className="text-[9px] text-primary font-black opacity-80 uppercase tracking-tighter">
                                {req.requester_unit || "מטה"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase">
                            {new Date(req.created_at).toLocaleDateString(
                              "he-IL",
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200  rounded-lg px-2"
                            >
                              <Clock className="w-3 h-3 ml-1" />
                              ממתין
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {req.reason ? (
                              <div className="flex flex-col items-start gap-1 transition-all">
                                <span
                                  className={cn(
                                    "text-xs text-muted-foreground block max-w-[200px] break-words whitespace-pre-wrap transition-all",
                                    !expandedRows.has(req.id) && "line-clamp-2",
                                  )}
                                >
                                  {req.reason}
                                </span>
                                {req.reason.length > 30 && (
                                  <button
                                    onClick={() => toggleRowExpansion(req.id)}
                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 mt-1"
                                  >
                                    {expandedRows.has(req.id) ? (
                                      <>
                                        הצג פחות
                                        <div className="rotate-180 transition-transform">
                                          <MoreHorizontal className="w-3 h-3" />
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        הצג הכל
                                        <MoreHorizontal className="w-3 h-3" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/50 italic">
                                אין הערות
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full hover:bg-primary/5 hover:text-primary transition-colors border border-transparent hover:border-primary/10"
                                onClick={() => setSelectedRequest(req)}
                                title="צפייה בפרטים מלאים"
                              >
                                <FileText className="w-4.5 h-4.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {/* History Table */}
        {activeTab === "history" && (
          <>
            {/* Mobile View - History Cards */}
            <div className="md:hidden space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="bg-card rounded-2xl p-12 text-center border border-dashed border-border">
                  <p className="text-sm font-bold text-muted-foreground italic">
                    {historyFilter
                      ? "אין נתונים התומכים בסינון זה"
                      : "אין היסטוריה זמינה"}
                  </p>
                </div>
              ) : (
                filteredHistory.map((req) => (
                  <div
                    key={req.id}
                    className="bg-card border border-border rounded-2xl p-4 "
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-black text-[10px] text-muted-foreground border border-border">
                          {req.employee_name?.[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                            {req.employee_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono"></span>
                        </div>
                      </div>
                      {statusBadge(req.status)}
                    </div>

                    <div className="flex flex-col gap-2.5 mb-4">
                      <div className="bg-background/40 dark:bg-slate-900/50 rounded-2xl p-3 text-right flex flex-col justify-center min-h-[60px] border border-border/20">
                        <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1.5 tracking-widest pl-2">
                          מעבר מ:
                        </span>
                        {renderUnitCell(
                          req.source_name,
                          req.target_name,
                          "source",
                        )}
                      </div>
                      <div className="bg-primary/[0.03] dark:bg-primary/[0.05] rounded-2xl p-3 text-right flex flex-col justify-center min-h-[60px] border border-primary/10">
                        <span className="text-[9px] font-black text-primary uppercase block mb-1.5 tracking-widest pl-2">
                          אל יעד:
                        </span>
                        {renderUnitCell(
                          req.source_name,
                          req.target_name,
                          "target",
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40 text-[10px]">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-muted-foreground">
                          טופל ע"י:
                        </span>
                        <span className="font-bold text-foreground">
                          {req.resolver_name || "---"}
                        </span>
                      </div>
                      <span className="font-bold text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View - History Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border  overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-background/20 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                        שוטר
                      </TableHead>
                      <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                        מסלול קודם
                      </TableHead>
                      <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                        מסלול יעד
                      </TableHead>
                      <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                        הוגש ע"י
                      </TableHead>
                      <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                        טופל ע"י
                      </TableHead>
                      <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                        תאריך
                      </TableHead>
                      <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                        סטטוס סופי
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-64 text-center border-none"
                        >
                          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                            <History className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-bold italic">
                              {historyFilter
                                ? "אין בקשות התואמות לסינון הנבחר"
                                : "אין בקשות העברה זמינות"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((req) => (
                        <TableRow
                          key={req.id}
                          onClick={() => setSelectedRequest(req)}
                          className="hover:bg-muted/40 border-b last:border-0 transition-colors cursor-pointer"
                        >
                          <TableCell className="px-6 py-4 align-middle">
                            <button
                              onClick={() => openProfile(req.employee_id)}
                              className="flex items-center gap-3 text-right hover:bg-background border border-transparent hover:border-border/40 p-2 -mr-2 rounded-xl transition-all outline-none group/btn max-w-full"
                            >
                              <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center font-black text-[10px] text-muted-foreground  shrink-0">
                                {req.employee_name?.[0]}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate block max-w-[120px]">
                                  {req.employee_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono truncate"></span>
                              </div>
                            </button>
                          </TableCell>
                          <TableCell className="px-6 py-4 align-middle">
                            {renderUnitCell(
                              req.source_name,
                              req.target_name,
                              "source",
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 align-middle">
                            {renderUnitCell(
                              req.source_name,
                              req.target_name,
                              "target",
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col leading-tight">
                              <span className="text-[10px] font-bold">
                                {req.requester_name}
                              </span>
                              <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                                {req.requester_unit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col leading-tight">
                              <span className="text-[10px] font-bold">
                                {req.resolver_name || "---"}
                              </span>
                              <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                                {req.resolver_unit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase">
                            {new Date(req.created_at).toLocaleDateString(
                              "he-IL",
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {statusBadge(req.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {/* New Request Form - Modern Linear/Vercel Enterprise Form */}
        {activeTab === "new" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Main Form Column */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              <div className="bg-card rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
                {/* Form Header */}
                <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <ArrowLeftRight className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                        הגשת בקשת ניוד ושיבוץ
                      </h2>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        מילוי פרטי השוטר, הגדרת יעד השיבוץ ונימוק הצורך המבצעי
                      </p>
                    </div>
                  </div>

                  {(selectedEmployee || targetDeptId || reason) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setTargetDeptId("");
                        setTargetSectionId("");
                        setTargetTeamId("");
                        setReason("");
                        setSearchTerm("");
                      }}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg"
                    >
                      <RotateCcw className="w-3.5 h-3.5 ml-1" />
                      <span>איפוס טופס</span>
                    </Button>
                  )}
                </div>

                <div className="p-5 sm:p-7 space-y-6 sm:space-y-7">
                  {/* Step 1: Employee Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                        1
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-foreground block leading-tight">
                          בחירת שוטר לניוד
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          חפש לפי שם מלא, שם משתמש או יחידה נוכחית
                        </span>
                      </div>
                    </div>

                    {!selectedEmployee ? (
                      <div className="relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <Input
                          placeholder="הקלד שם שוטר לחיפוש..."
                          className="pr-10 h-11 text-right rounded-xl bg-background border-border/70 focus:ring-2 focus:ring-primary/20 transition-all text-xs sm:text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {filteredEmployeesList.length > 0 && searchTerm && (
                          <div className="absolute top-full mt-2 w-full z-50 bg-popover border border-border/80 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto">
                              {filteredEmployeesList.map((emp) => (
                                <button
                                  key={emp.id}
                                  type="button"
                                  className="w-full p-2.5 flex items-center justify-between gap-3 hover:bg-muted/70 text-right rounded-lg transition-colors group cursor-pointer"
                                  onClick={() => {
                                    setSelectedEmployee(emp);
                                    setSearchTerm("");
                                  }}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                                      {emp.first_name?.[0] || ""}
                                      {emp.last_name?.[0] || ""}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-bold text-foreground truncate">
                                        {emp.first_name} {emp.last_name}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground truncate">
                                        {emp.rank && `${emp.rank} • `}
                                        {emp.department_name || "ללא מחלקה"}
                                      </span>
                                    </div>
                                  </div>

                                  <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                                    בחר
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 sm:p-4 border border-primary/25 bg-primary/[0.03] dark:bg-primary/[0.06] rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/25">
                            {selectedEmployee.first_name?.[0] || ""}
                            {selectedEmployee.last_name?.[0] || ""}
                          </div>
                          <div className="flex flex-col text-right min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-foreground">
                                {selectedEmployee.first_name} {selectedEmployee.last_name}
                              </span>
                              {selectedEmployee.rank && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold bg-background">
                                  {selectedEmployee.rank}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate mt-0.5">
                              שיבוץ נוכחי: {cleanUnitName(selectedEmployee.department_name || "מטה")}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold h-8 px-3 rounded-lg border-border hover:bg-muted shrink-0"
                          onClick={() => setSelectedEmployee(null)}
                        >
                          החלף שוטר
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Destination Target Selection */}
                  <div className="space-y-3 pt-5 border-t border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                        2
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-foreground block leading-tight">
                          יעד השיבוץ החדש
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          בחר מחלקה (חובה), מדור וחוליה (בהתאם למבנה הארגוני)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Department Select */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block text-right">
                          מחלקה <span className="text-destructive">*</span>
                        </label>
                        <Select
                          value={targetDeptId}
                          onValueChange={(v) => {
                            setTargetDeptId(v);
                            setTargetSectionId("");
                            setTargetTeamId("");
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-background border-border/70 hover:border-border font-medium text-xs transition-all text-right w-full">
                            <SelectValue placeholder="בחר..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border bg-popover max-h-56" dir="rtl">
                            {structure.map((d) => (
                              <SelectItem
                                key={d.id}
                                value={d.id.toString()}
                                className="font-medium text-xs cursor-pointer"
                              >
                                {cleanUnitName(d.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Section Select */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-muted-foreground block text-right">
                            מדור
                          </label>
                          {targetSectionId && (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetSectionId("");
                                setTargetTeamId("");
                              }}
                              className="text-[10px] text-muted-foreground hover:text-primary"
                            >
                              איפוס
                            </button>
                          )}
                        </div>
                        <Select
                          value={targetSectionId}
                          onValueChange={(v) => {
                            setTargetSectionId(v);
                            setTargetTeamId("");
                          }}
                          disabled={!targetDeptId}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-background border-border/70 hover:border-border font-medium text-xs transition-all text-right w-full disabled:opacity-50">
                            <SelectValue placeholder={targetDeptId ? "בחר..." : "בחר מחלקה תחילה"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border bg-popover max-h-56" dir="rtl">
                            {selectedTargetDept?.sections?.map((s: any) => (
                              <SelectItem
                                key={s.id}
                                value={s.id.toString()}
                                className="font-medium text-xs cursor-pointer"
                              >
                                {cleanUnitName(s.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Team Select */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-muted-foreground block text-right">
                            חוליה
                          </label>
                          {targetTeamId && (
                            <button
                              type="button"
                              onClick={() => setTargetTeamId("")}
                              className="text-[10px] text-muted-foreground hover:text-primary"
                            >
                              איפוס
                            </button>
                          )}
                        </div>
                        <Select
                          value={targetTeamId}
                          onValueChange={setTargetTeamId}
                          disabled={!targetSectionId}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-background border-border/70 hover:border-border font-medium text-xs transition-all text-right w-full disabled:opacity-50">
                            <SelectValue placeholder={targetSectionId ? "בחר..." : "בחר מדור תחילה"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border bg-popover max-h-56" dir="rtl">
                            {selectedTargetSection?.teams?.map((t: any) => (
                              <SelectItem
                                key={t.id}
                                value={t.id.toString()}
                                className="font-medium text-xs cursor-pointer"
                              >
                                {cleanUnitName(t.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Live Transition Preview Card */}
                    {(selectedEmployee || targetDeptId) && (
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs mt-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground font-bold shrink-0">מיקום נוכחי:</span>
                          <span className="font-bold text-foreground truncate">
                            {selectedEmployee ? cleanUnitName(selectedEmployee.department_name || "מטה") : "---"}
                          </span>
                        </div>

                        <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border text-muted-foreground shrink-0">
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-primary font-bold shrink-0">יעד חדש:</span>
                          <span className="font-bold text-primary truncate">
                            {targetUnitDisplay || "טרם נבחר יעד"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Reason & Justification */}
                  <div className="space-y-3 pt-5 border-t border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                        3
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-foreground block leading-tight">
                          נימוק ופירוט הצורך המבצעי
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          בחר סיבה מהירה או פרט בהרחבה לצורך בחינה ואישור הבקשה
                        </span>
                      </div>
                    </div>

                    {/* Quick Preset Reason Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PRESET_REASONS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (!reason) {
                              setReason(preset);
                            } else if (!reason.includes(preset)) {
                              setReason(`${reason} • ${preset}`);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>

                    <Textarea
                      placeholder="פרט את הסיבה לבקשת הניוד, צורך מבצעי או נסיבות רלוונטיות..."
                      className="w-full min-h-[100px] p-3.5 bg-background rounded-xl text-xs sm:text-sm border-border/70 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      dir="rtl"
                    />
                  </div>

                  {/* Actions Button */}
                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={handleCreateRequest}
                      disabled={isSubmitting || !selectedEmployee || !targetDeptId}
                      className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? "בתהליך שליחה..." : "שלח בקשת ניוד לאישור"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("history")}
                      className="h-11 px-4 rounded-xl text-xs font-bold border-border text-foreground hover:bg-muted shrink-0"
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Guidelines Column */}
            <div className="lg:col-span-4 space-y-4">
              {/* SLA Card */}
              <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground block leading-none">
                      זמן טיפול משוער
                    </span>
                    <span className="text-base sm:text-lg font-black text-foreground">
                      24-48 שעות
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border/50">
                  בקשות ניוד מועברות ישירות לבחינת מפקד המחלקה וראש החטיבה לצורך קבלת החלטה.
                </p>
              </div>

              {/* Guidelines Card */}
              <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-2.5 text-foreground mb-3 pb-2.5 border-b border-border/50">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold">
                    דגשים ונהלי הגשה
                  </span>
                </div>

                <ul className="space-y-2.5 text-[11px] text-muted-foreground font-medium leading-relaxed">
                  <li className="flex items-start gap-2 text-right">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>כל ניוד כפוף לאישור מפקד היחידה המוסמך.</span>
                  </li>
                  <li className="flex items-start gap-2 text-right">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>יש לנמק באופן ברור את הצורך המבצעי או האישי במעבר.</span>
                  </li>
                  <li className="flex items-start gap-2 text-right">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>השיבוץ הארגוני במערכת יתעדכן אוטומטית עם אישור הבקשה.</span>
                  </li>
                  <li className="flex items-start gap-2 text-right">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>ניתן לעקוב אחר סטטוס הטיפול בטאב "כלל הבקשות".</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal - Birthday Card Style */}
        <Dialog
          open={!!viewingEmployee}
          onOpenChange={(open) => !open && setViewingEmployee(null)}
        >
          <DialogContent
            className="w-full sm:w-auto sm:max-w-lg p-0 overflow-hidden border border-border rounded-t-[2.2rem] rounded-b-none sm:rounded-2xl bg-background"
            dir="rtl"
          >
            {viewingEmployee && (
              <div className="flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-border/40 bg-background/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-lg font-black text-foreground leading-none">
                          {viewingEmployee?.first_name}{" "}
                          {viewingEmployee?.last_name}
                        </h2>
                        {(viewingEmployee?.is_commander ||
                          viewingEmployee?.is_admin) && (
                          <span className="text-[11px] font-bold text-muted-foreground mt-1">
                            שם משתמש: {viewingEmployee?.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "px-3 py-1 text-[10px] font-black rounded-full border-none ",
                        viewingEmployee?.is_active
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white",
                      )}
                    >
                      {viewingEmployee?.is_active ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  {/* Personal Info Card */}

                  <a
                    href={`tel:${viewingEmployee?.phone_number}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 transition-all hover:border-primary/50 hover:bg-primary/5 group/phone"
                  >
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0 group-hover/phone:border-primary/30 transition-colors">
                      <Phone className="w-4 h-4 text-muted-foreground group-hover/phone:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold text-foreground truncate group-hover/phone:text-primary transition-colors"
                        dir="ltr"
                      >
                        {viewingEmployee?.phone_number || "---"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        טלפון נייד
                      </p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/40 transition-all hover:border-border">
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {viewingEmployee?.city || "לא הוזנה כתובת"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        עיר מגורים
                      </p>
                    </div>
                  </div>

                  {/* Service Dates Card */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                          תאריך גיוס
                        </span>
                        <span className="text-xs font-bold text-foreground mt-1">
                          {viewingEmployee?.enlistment_date
                            ? new Date(
                                viewingEmployee.enlistment_date,
                              ).toLocaleDateString("he-IL")
                            : "---"}
                        </span>
                      </div>
                      <div className="flex flex-col border-r border-primary/10 pr-4">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                          הצבה ביחידה
                        </span>
                        <span className="text-xs font-bold text-primary mt-1">
                          {viewingEmployee?.assignment_date
                            ? new Date(
                                viewingEmployee.assignment_date,
                              ).toLocaleDateString("he-IL")
                            : "---"}
                        </span>
                      </div>
                    </div>
                    {viewingEmployee?.discharge_date && (
                      <div className="flex flex-col mt-3 pt-3 border-t border-primary/10">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">
                          צפי שחרור
                        </span>
                        <span className="text-xs font-bold text-rose-600 mt-1">
                          {new Date(
                            viewingEmployee.discharge_date,
                          ).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Professional Status Card */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/40 transition-all hover:border-border">
                    <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">
                          סטטוס שירות
                        </span>
                        <span className="text-[11px] font-bold text-primary truncate">
                          {viewingEmployee?.service_type_name || "---"}
                        </span>
                      </div>
                      <div className="flex flex-col border-r border-border/10 pr-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">
                          נוכחות
                        </span>
                        <span className="text-[11px] font-bold text-foreground truncate">
                          {viewingEmployee?.status_name || "משרד"}
                        </span>
                      </div>
                      <div className="flex flex-col border-r border-border/10 pr-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">
                          סיווג
                        </span>
                        <span className="text-[11px] font-bold text-foreground">
                          רמה {viewingEmployee?.security_clearance || "0"}
                        </span>
                      </div>
                      <div className="flex flex-col border-r border-border/10 pr-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">
                          רישיון
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-black",
                            viewingEmployee?.police_license
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-500",
                          )}
                        >
                          {viewingEmployee?.police_license
                            ? "בתוקף"
                            : "לא בתוקף"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background/20 border-t border-border/50 flex justify-end">
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl font-black text-xs px-6 border-border hover:bg-muted"
                    onClick={() => setViewingEmployee(null)}
                  >
                    סגור
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Request Details Modal */}
        <Dialog
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        >
          <DialogContent
            className="w-full sm:w-auto sm:max-w-4xl p-0 overflow-hidden border border-border rounded-t-[2.2rem] rounded-b-none sm:rounded-2xl bg-background flex flex-col max-h-[94dvh] sm:max-h-[90vh]"
            dir="rtl"
          >
            {selectedRequest && (
              <div className="flex flex-col h-full">
                <div className="px-6 py-5 border-b border-border/40 bg-background/20 flex items-center justify-between shrink-0 pl-12">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-base border border-primary/10">
                      {selectedRequest.employee_name?.[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground leading-none mb-1.5">
                        {selectedRequest.employee_name}
                      </h2>
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/5 text-primary border-primary/10 text-[10px] px-1.5 h-5"
                        >
                          {selectedRequest.rank || "שוטר"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-background text-muted-foreground border-border/50 text-[10px] px-1.5 h-auto py-0.5 flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3 text-muted-foreground/70 ml-1" />
                          <span>
                            הוגשה ב:{" "}
                            {new Date(
                              selectedRequest.created_at,
                            ).toLocaleDateString("he-IL")}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  {/* Movement Flow - Enhanced Contextual */}
                  <div className="bg-muted/30 border border-border/50 rounded-xl p-4 sm:p-5">
                    {(() => {
                      const sourceParts = (
                        selectedRequest.source_name || ""
                      ).split(" / ");
                      const targetParts = (
                        selectedRequest.target_name || ""
                      ).split(" / ");

                      // Find common prefix
                      let commonIndex = 0;
                      while (
                        commonIndex < sourceParts.length &&
                        commonIndex < targetParts.length &&
                        sourceParts[commonIndex] === targetParts[commonIndex]
                      ) {
                        commonIndex++;
                      }

                      // Diverging parts calculations removed as we iterate full path
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative">
                            {/* Source Unit */}
                            <div className="flex-1 w-full text-right bg-background/50 rounded-xl p-3 border border-border/30 relative overflow-hidden group hover:border-border/60 transition-all">
                              <div className="absolute top-0 right-0 w-1 h-full bg-slate-300 dark:bg-slate-700" />
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                יחידה נוכחית
                              </span>
                              <div className="flex flex-col gap-1 pr-1">
                                {sourceParts.map((part: string, i: number) => {
                                  const isCommon = i < commonIndex;
                                  return (
                                    <div
                                      key={i}
                                      className={cn(
                                        "flex items-center gap-1.5",
                                        i > 0 && "mr-3",
                                        isCommon && "opacity-60",
                                      )}
                                    >
                                      {i > 0 && (
                                        <CornerDownLeft className="w-3 h-3 text-muted-foreground/40" />
                                      )}
                                      <span
                                        className={cn(
                                          "break-words leading-tight transition-all",
                                          isCommon
                                            ? "text-xs font-bold text-muted-foreground"
                                            : "text-sm font-black text-foreground",
                                        )}
                                      >
                                        {part}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Arrow Indicator */}
                            <div className="flex flex-col items-center justify-center shrink-0 z-10 -my-2 sm:my-0">
                              <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                                <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-90 sm:rotate-0 transition-transform" />
                              </div>
                            </div>

                            {/* Target Unit */}
                            <div className="flex-1 w-full text-right bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all">
                              <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
                              <span className="text-[10px] font-black text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" />
                                יחידה מבוקשת
                              </span>
                              <div className="flex flex-col gap-1 pr-1">
                                {targetParts.map((part: string, i: number) => {
                                  const isCommon = i < commonIndex;
                                  return (
                                    <div
                                      key={i}
                                      className={cn(
                                        "flex items-center gap-1.5",
                                        i > 0 && "mr-3",
                                        isCommon && "opacity-60",
                                      )}
                                    >
                                      {i > 0 && (
                                        <CornerDownLeft className="w-3 h-3 text-emerald-500/40" />
                                      )}
                                      <span
                                        className={cn(
                                          "break-words leading-tight transition-all",
                                          isCommon
                                            ? "text-xs font-bold text-emerald-700/70 dark:text-emerald-400/70"
                                            : "text-sm font-black text-emerald-900 dark:text-emerald-100",
                                        )}
                                      >
                                        {part}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Reason Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-black text-foreground">
                        נימוקי הבקשה
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-sm leading-relaxed text-muted-foreground min-h-[100px]  break-words whitespace-pre-wrap">
                      {selectedRequest.reason || "לא צורפו הערות לבקשה זו."}
                    </div>
                  </div>

                  {/* Requester Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                    <span>
                      הוגש ע"י:{" "}
                      <span className="font-bold text-foreground">
                        {selectedRequest.requester_name}
                      </span>
                    </span>
                    <span>{selectedRequest.requester_unit || "מטה"}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 sm:p-6 bg-muted/10 border-t border-border/50">
                  {/* Rejection / Snooze / Approve Logic */}
                  {isRejecting ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="נא לפרט את סיבת הדחייה..."
                        className="bg-background min-h-[100px] rounded-xl sm:rounded-2xl"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button
                          variant="ghost"
                          className="w-full sm:w-auto h-11 sm:h-10 rounded-xl"
                          onClick={() => setIsRejecting(false)}
                        >
                          ביטול
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto h-11 sm:h-10 rounded-xl font-bold"
                          onClick={() => handleReject(selectedRequest.id)}
                        >
                          אישור דחייה
                        </Button>
                      </div>
                    </div>
                  ) : isSnoozing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">
                          מתי להזכיר לך לטפל בבקשה?
                        </span>
                      </div>
                      <div className="flex justify-center p-2 bg-muted/20 rounded-2xl border border-border/50">
                        <CalendarComponent
                          mode="single"
                          selected={snoozeDate}
                          onSelect={setSnoozeDate}
                          className="rounded-md"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                        <Button
                          variant="ghost"
                          className="w-full sm:w-auto h-11 sm:h-10 rounded-xl"
                          onClick={() => setIsSnoozing(false)}
                        >
                          ביטול
                        </Button>
                        <Button
                          onClick={handleSnooze}
                          disabled={!snoozeDate}
                          className="w-full sm:w-auto h-11 sm:h-10 rounded-xl font-bold"
                        >
                          קבע תזכורת
                        </Button>
                      </div>
                    </div>
                  ) : selectedRequest.can_approve ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <Button
                        variant="outline"
                        className="w-full h-12 sm:h-11 border-muted-foreground/30 hover:bg-accent hover:text-accent-foreground rounded-xl"
                        onClick={() => setIsSnoozing(true)}
                      >
                        <Clock className="w-4 h-4 ml-2" />
                        טיפול בעתיד
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full h-12 sm:h-11 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl"
                        onClick={() => setIsRejecting(true)}
                      >
                        <XCircle className="w-4 h-4 ml-2" />
                        דחיית בקשה
                      </Button>

                      <Button
                        className="w-full h-12 sm:h-11 bg-emerald-600 hover:bg-emerald-700 text-white  -600/20 rounded-xl"
                        onClick={() => {
                          handleApprove(selectedRequest.id);
                          setSelectedRequest(null);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 ml-2" />
                        אישור והעברה
                      </Button>
                    </div>
                  ) : selectedRequest.can_cancel ? (
                    <div className="w-full">
                      <Button
                        variant="destructive"
                        className="w-full h-12 sm:h-11 rounded-xl "
                        onClick={() => handleCancel(selectedRequest.id)}
                      >
                        <XCircle className="w-4 h-4 ml-2" />
                        ביטול בקשה
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full p-3 bg-muted/20 border border-muted text-center rounded-xl">
                      <span className="text-xs text-muted-foreground font-bold">
                        אין פעולות זמינות עבור בקשה זו
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
