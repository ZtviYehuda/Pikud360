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

  const [activeTab, setActiveTab] = useState("pending");
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
          false,
      )
      .slice(0, 5);
  }, [employees, searchTerm]);

  // Cloud Stats
  const stats = useMemo(() => {
    const pending = pendingTransfers.length;
    const approved = history.filter((h) => h.status === "approved").length;
    const rejected = history.filter((h) => h.status === "rejected").length;
    return { pending, approved, rejected };
  }, [pendingTransfers, history]);

  const filteredHistory = useMemo(() => {
    let result = history;
    if (historyFilter) {
      result = result.filter((h) => h.status === historyFilter);
    }
    if (searchTerm && activeTab === "history") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (h) =>
          h.employee_name?.toLowerCase().includes(lowerSearch) ||
          false,
      );
    }
    return result;
  }, [history, historyFilter, searchTerm, activeTab]);

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
    <div className="flex flex-col" dir="rtl">
      <div className="pt-6 pb-4 px-4 sm:px-6 shrink-0 transition-all">
        <PageHeader
          icon={ArrowLeftRight}
          title="בקשות העברה ושיבוץ"
          className="mb-0"
          hideMobile={true}
        />
      </div>

      <div className="space-y-4 sm:space-y-6 pb-6">
        {/* Stats Overview - Compact Grid (No Scroll) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-6 mb-4 sm:mb-6">
          <div
            className="bg-card rounded-xl sm:rounded-[20px] p-2 sm:p-6 border border-border flex flex-col items-center sm:flex-row sm:justify-between transition-all"
          >
            <div className="flex flex-col items-center sm:items-start text-center sm:text-right w-full mb-1 sm:mb-0">
              <span className="text-[8px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">
                ממתינות
              </span>
              <span className="text-lg sm:text-4xl font-black text-amber-500 leading-none">
                {stats.pending}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400" />
            </div>
          </div>

          <div
            className="bg-card rounded-xl sm:rounded-[20px] p-2 sm:p-6 border border-border flex flex-col items-center sm:flex-row sm:justify-between transition-all"
          >
            <div className="flex flex-col items-center sm:items-start text-center sm:text-right w-full mb-1 sm:mb-0">
              <span className="text-[8px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">
                אושרו
              </span>
              <span className="text-lg sm:text-4xl font-black text-emerald-500 leading-none">
                {stats.approved}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>

          <div
            className="bg-card rounded-xl sm:rounded-[20px] p-2 sm:p-6 border border-border flex flex-col items-center sm:flex-row sm:justify-between transition-all"
          >
            <div className="flex flex-col items-center sm:items-start text-center sm:text-right w-full mb-1 sm:mb-0">
              <span className="text-[8px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">
                נדחו
              </span>
              <span className="text-lg sm:text-4xl font-black text-rose-500 leading-none">
                {stats.rejected}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-full bg-rose-500/10 dark:bg-rose-400/10 flex items-center justify-center shrink-0">
              <XCircle className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-rose-500 dark:text-rose-400" />
            </div>
          </div>
        </div>

        {/* Main Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 bg-card/40 backdrop-blur-2xl p-2 sm:px-4 rounded-3xl border border-primary/5 overflow-hidden min-h-[64px]">
          {/* Top Line on Mobile: Primary Action + Search + History Toggle side-by-side */}
          <div className="flex flex-row items-center justify-between gap-2 w-full md:w-auto">
            <Button
              onClick={() => setActiveTab("new")}
              className={cn(
                "h-11 px-4 sm:px-6 rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] shadow-sm shrink-0 text-xs sm:text-sm",
                activeTab === "new"
                  ? "bg-primary text-primary-foreground shadow-primary/20"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.5} />
              <span>בקשה חדשה</span>
            </Button>

            {/* Mobile-only Search (embedded inside the top line next to button) */}
            {activeTab !== "new" && (
              <div className="relative flex-1 md:hidden max-w-[220px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <Input
                  placeholder="חיפוש מהיר..."
                  className="pr-9 h-11 bg-muted/40 border-none hover:bg-muted/60 font-medium text-[11px] rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all text-right w-full"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {/* Mobile-only History Toggle Button (Icon only) */}
            {activeTab !== "new" && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (activeTab === "history") {
                    setActiveTab("pending");
                    setHistoryFilter(null);
                  } else {
                    setActiveTab("history");
                  }
                }}
                className={cn(
                  "md:hidden w-11 h-11 rounded-xl flex items-center justify-center p-0 shrink-0",
                  activeTab === "history"
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-muted/40 text-muted-foreground/75 hover:bg-muted/60"
                )}
              >
                <History className="w-4 h-4" />
              </Button>
            )}
            
            {/* Vertical Divider */}
            <div className="hidden md:block w-px h-6 bg-border/60 mx-1" />
          </div>

          {/* Left Side: Navigation & Desktop Filter (RTL: Left - Hidden on Mobile) */}
          <div className="hidden md:flex flex-col sm:flex-row md:flex-row items-stretch sm:items-center gap-2 md:gap-4 w-full md:w-auto">
            {/* Desktop Search Input */}
            {activeTab !== "new" && (
              <div className="relative w-full md:w-64 lg:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input
                  placeholder="חיפוש מהיר..."
                  className="pr-10 h-11 bg-muted/40 border-none hover:bg-muted/60 font-medium text-xs rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all text-right"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {/* Segmented Control / Navigation */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/30 w-full md:w-auto">
              <div className="flex items-center gap-2 px-3 border-l border-border/40 ml-1">
                <History className="w-4 h-4 text-muted-foreground/40" strokeWidth={1.5} />
                <span className="text-[11px] font-bold text-muted-foreground/50 hidden lg:inline">תצוגה</span>
              </div>
              
              <div className="flex gap-1 flex-1 sm:flex-none">
                <button
                  onClick={() => {
                    setActiveTab("pending");
                    setHistoryFilter(null);
                  }}
                  className={cn(
                    "flex-1 sm:flex-none h-9 px-4 sm:px-5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                    activeTab === "pending"
                      ? "bg-background text-primary shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>פעיל</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("history");
                  }}
                  className={cn(
                    "flex-1 sm:flex-none h-9 px-4 sm:px-5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                    activeTab === "history"
                      ? "bg-background text-primary shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <History className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>היסטוריה</span>
                </button>
              </div>
            </div>
          </div>
        </div>

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
                          <span className="text-[10px] text-muted-foreground font-mono">
                            
                          </span>
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
                                <span className="text-[10px] text-muted-foreground font-mono truncate">
                                  
                                </span>
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
                          <span className="text-[10px] text-muted-foreground font-mono">
                            
                          </span>
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
                                ? "אין בקשות שנדחו"
                                : "אין היסטוריה זמינה"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((req) => (
                        <TableRow
                          key={req.id}
                          className="hover:bg-background/60 border-b last:border-0 transition-colors"
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
                                <span className="text-[10px] text-muted-foreground font-mono truncate">
                                  
                                </span>
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

        {/* New Request Form */}
        {activeTab === "new" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-[20px] border border-border  overflow-hidden">
                <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-border/50">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    הגשת בקשת ניוד
                  </h2>
                  <p className="text-muted-foreground text-[11px] sm:text-sm mt-1">
                    מילוי פרטים לצורך שינוי שיבוץ ארגוני ביחידה
                  </p>
                </div>

                <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                  {/* Step 1 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] sm:text-xs font-bold">
                        1
                      </div>
                      <label className="text-xs sm:text-sm font-bold text-foreground">
                        בחירת שוטר
                      </label>
                    </div>

                    {!selectedEmployee ? (
                      <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          placeholder="חפש לפי שם או שם משתמש..."
                          className="pr-10 sm:pr-12 h-12 sm:h-14 text-right rounded-xl sm:rounded-2xl bg-background border-border/40 focus:ring-4 focus:ring-primary/10 transition-all text-sm sm:text-base hover:border-border/80"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {filteredEmployeesList.length > 0 && searchTerm && (
                          <div className="absolute top-full mt-2 w-full z-50 bg-popover border border-border rounded-xl sm:rounded-2xl  overflow-hidden ring-4 ring-muted/10">
                            {filteredEmployeesList.map((emp) => (
                              <button
                                key={emp.id}
                                className="w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-background text-right transition-colors border-b border-border/50 last:border-0 group"
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setSearchTerm("");
                                }}
                              >
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs sm:text-sm group-hover:scale-110 transition-transform">
                                  {emp.first_name[0]}
                                  {emp.last_name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs sm:text-sm font-bold text-foreground">
                                    {emp.first_name} {emp.last_name}
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                                    {(emp.is_commander || emp.is_admin) && `שם משתמש: ${emp.username} • `}
                                    {emp.department_name}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 border border-primary/20 bg-primary/5 rounded-xl sm:rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base sm:text-lg ">
                            {selectedEmployee.first_name[0]}
                            {selectedEmployee.last_name[0]}
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="font-bold text-xs sm:text-base text-foreground">
                              {selectedEmployee.first_name}{" "}
                              {selectedEmployee.last_name}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              
                              {selectedEmployee.department_name}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10 font-medium text-[10px] sm:text-xs"
                          onClick={() => setSelectedEmployee(null)}
                        >
                          החלף
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] sm:text-xs font-bold">
                        2
                      </div>
                      <label className="text-xs sm:text-sm font-bold text-foreground">
                        יעד המעבר
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground block text-right">
                          מחלקה
                        </span>
                        <Select
                          value={targetDeptId}
                          onValueChange={(v) => {
                            setTargetDeptId(v);
                            setTargetSectionId("");
                            setTargetTeamId("");
                          }}
                        >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl bg-background border border-border/40 hover:border-border/80 focus:ring-2 focus:ring-primary/10 font-medium text-xs sm:text-sm transition-all text-right">
                            <SelectValue placeholder="בחר מחלקה..." />
                          </SelectTrigger>
                          <SelectContent
                            className="rounded-xl border-border  bg-popover"
                            dir="rtl"
                          >
                            {structure.map((d) => (
                              <SelectItem
                                key={d.id}
                                value={d.id.toString()}
                                className="font-medium focus:bg-accent text-foreground text-xs sm:text-sm"
                              >
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground block text-right">
                          מדור
                        </span>
                        <Select
                          value={targetSectionId}
                          onValueChange={(v) => {
                            setTargetSectionId(v);
                            setTargetTeamId("");
                          }}
                          disabled={!targetDeptId}
                        >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl bg-muted/30 border-input focus:ring-2 focus:ring-primary/20 font-medium text-xs sm:text-sm transition-all focus:bg-background disabled:opacity-50 text-right">
                            <SelectValue placeholder="בחר מדור..." />
                          </SelectTrigger>
                          <SelectContent
                            className="rounded-xl border-border  bg-popover"
                            dir="rtl"
                          >
                            {structure
                              .find((d) => d.id.toString() === targetDeptId)
                              ?.sections.map((s: any) => (
                                <SelectItem
                                  key={s.id}
                                  value={s.id.toString()}
                                  className="font-medium focus:bg-accent text-foreground text-xs sm:text-sm"
                                >
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground block text-right">
                          חוליה
                        </span>
                        <Select
                          value={targetTeamId}
                          onValueChange={setTargetTeamId}
                          disabled={!targetSectionId}
                        >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl bg-muted/30 border-input focus:ring-2 focus:ring-primary/20 font-medium text-xs sm:text-sm transition-all focus:bg-background disabled:opacity-50 text-right">
                            <SelectValue placeholder="בחר חוליה..." />
                          </SelectTrigger>
                          <SelectContent
                            className="rounded-xl border-border  bg-popover"
                            dir="rtl"
                          >
                            {structure
                              .find((d) => d.id.toString() === targetDeptId)
                              ?.sections.find(
                                (s: any) => s.id.toString() === targetSectionId,
                              )
                              ?.teams.map((t: any) => (
                                <SelectItem
                                  key={t.id}
                                  value={t.id.toString()}
                                  className="font-medium focus:bg-accent text-foreground text-xs sm:text-sm"
                                >
                                  {t.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] sm:text-xs font-bold">
                        3
                      </div>
                      <label className="text-xs sm:text-sm font-bold text-foreground">
                        נימוקים נוספים
                      </label>
                    </div>

                    <textarea
                      placeholder="פרט את הסיבה לבקשה..."
                      className="w-full min-h-[120px] sm:min-h-[140px] p-4 bg-background rounded-xl sm:rounded-2xl text-xs sm:text-sm border border-border/40 focus:ring-4 focus:ring-primary/10 transition-all resize-none font-sans hover:border-border/80"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      dir="rtl"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleCreateRequest}
                      disabled={
                        isSubmitting || !selectedEmployee || !targetDeptId
                      }
                      className="w-full h-12 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl sm:rounded-2xl   transition-all hover: active:scale-[0.98] text-sm sm:text-base"
                    >
                      {isSubmitting
                        ? "בתהליך שליחה..."
                        : "שלח בקשת ניוד לאישור"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Guidelines */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-primary/5 to-background rounded-[20px] p-5 sm:p-6 border border-border/50 ">
                <div className="flex items-center gap-3 text-primary mb-4 sm:mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-base sm:text-lg font-bold">
                    דגשים להגשה
                  </span>
                </div>
                <ul className="space-y-3 sm:space-y-4">
                  {[
                    "כל ניוד כפוף לאישור מפקד היחידה.",
                    "יש לנמק את הצורך המבצעי במעבר.",
                    "השיבוץ יתעדכן לאחר סיום תהליך האישורים.",
                  ].map((t, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed text-right items-start"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card border border-border rounded-[20px] p-5 sm:p-6 flex items-center gap-4 sm:gap-5 ">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">
                    זמן טיפול משוער
                  </p>
                  <p className="text-base sm:text-lg font-black text-foreground">
                    24-48 שעות
                  </p>
                </div>
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
            className="max-w-lg p-0 overflow-hidden border border-border  rounded-2xl bg-background"
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
                        {(viewingEmployee?.is_commander || viewingEmployee?.is_admin) && (
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

                  {/* Organizational Hierarchy Card */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block mb-2">
                      שיוך ארגוני
                    </span>
                    <div
                      className="flex items-center gap-2 font-bold text-xs text-primary"
                      dir="ltr"
                    >
                      <span>{viewingEmployee?.team_name || "כללי"}</span>
                      <span className="opacity-30">/</span>
                      <span>{viewingEmployee?.section_name || "כללי"}</span>
                      <span className="opacity-30">/</span>
                      <span>{viewingEmployee?.department_name}</span>
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
            className="max-w-4xl p-0 overflow-hidden border border-border rounded-2xl bg-background flex flex-col max-h-[90vh]"
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
        {!canManage && (
          <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-right">
              <p className="text-xs font-black text-amber-900 leading-none">
                מצב צפייה
              </p>
              <p className="text-[10px] font-bold text-amber-800/80 mt-1">
                חשבונך אינו מוגדר לניהול בקשות אחרים.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

