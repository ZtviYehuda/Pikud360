import { useState, useEffect, useMemo, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { useDateContext } from "@/context/DateContext";
import { format } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FilterTriggerButton, FilterDialog } from "@/components/shared/page-toolbar";
import {
  CalendarDays,
  CalendarRange,
  Search,
  Filter,
  ClipboardCheck,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CheckCheck,
  History,
  RotateCcw,
} from "lucide-react";
import { AttendanceCalendarView } from "@/components/attendance/AttendanceCalendarView";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn, cleanUnitName } from "@/lib/utils";
import {
  BulkStatusUpdateModal,
  StatusUpdateModal,
  StatusHistoryModal,
  ExportReportDialog,
} from "@/components/employees/modals";
import type { Employee } from "@/types/employee.types";

export default function AttendancePage() {
  const { user } = useAuthContext();
  const { selectedDate } = useDateContext();

  const location = useLocation();
  const navigate = useNavigate();
  const {
    employees,
    loading,
    fetchEmployees,
    getStructure,
    getStatusTypes,
    getServiceTypes,
    getEmployeeById,
    verifyRoster,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState("org");
  const [desktopFiltersExpanded, setDesktopFiltersExpanded] = useState(() => {
    const savedFilters = localStorage.getItem("attendance_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        return !!(
          (filters.deptId && filters.deptId !== "all") ||
          (filters.sectionId && filters.sectionId !== "all") ||
          (filters.teamId && filters.teamId !== "all") ||
          (filters.statusId && filters.statusId !== "all") ||
          (filters.serviceTypeId && filters.serviceTypeId !== "all")
        );
      } catch {
        return false;
      }
    }
    return false;
  });
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [selectedStatusId, setSelectedStatusId] = useState("all");
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState("all");

  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [currentUserEmp, setCurrentUserEmp] = useState<Employee | null>(null);
  const [alertContext, setAlertContext] = useState<{
    missing_ids: number[];
  } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isViewingDayDetails, setIsViewingDayDetails] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Wrap in startTransition so the button press is instant
  const openCalendar = () => startTransition(() => setCalendarOpen((v) => !v));
  const closeCalendar = () =>
    startTransition(() => {
      setCalendarOpen(false);
      setIsViewingDayDetails(false);
    });

  // Load filters from localStorage on mount
  const isFilterActive = useMemo(() => {
    if (searchTerm !== "") return true;
    if (selectedStatusId !== "all") return true;
    if (selectedServiceTypeId !== "all") return true;

    const isDeptFilterable = !(user && !user.is_admin && user.department_id);
    if (isDeptFilterable && selectedDeptId !== "all") return true;

    const isSectionFilterable = !(user && !user.is_admin && user.section_id);
    if (isSectionFilterable && selectedSectionId !== "all") return true;

    const isTeamFilterable = !(user && !user.is_admin && user.team_id);
    if (isTeamFilterable && selectedTeamId !== "all") return true;

    return false;
  }, [
    searchTerm,
    selectedStatusId,
    selectedServiceTypeId,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    user,
  ]);

  const handleClearFilters = () => {
    localStorage.removeItem("attendance_filters");
    if (!user || user.is_admin) {
      setSelectedDeptId("all");
    } else if (!user.department_id) {
      setSelectedDeptId("all");
    }

    if (!user || user.is_admin || (!user.section_id && !user.team_id)) {
      setSelectedSectionId("all");
    }

    if (!user || user.is_admin || !user.team_id) {
      setSelectedTeamId("all");
    }

    setSelectedStatusId("all");
    setSelectedServiceTypeId("all");
    setSearchTerm("");
    setSelectedEmployeeIds([]);
  };
  useEffect(() => {
    const savedFilters = localStorage.getItem("attendance_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
        if (filters.deptId !== undefined) setSelectedDeptId(filters.deptId);
        if (filters.sectionId !== undefined)
          setSelectedSectionId(filters.sectionId);
        if (filters.teamId !== undefined) setSelectedTeamId(filters.teamId);
        if (filters.statusId !== undefined)
          setSelectedStatusId(filters.statusId);
        if (filters.serviceTypeId !== undefined)
          setSelectedServiceTypeId(filters.serviceTypeId);
      } catch (e) {
        console.error("Failed to parse saved attendance filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return; // Wait until loaded
    if (user?.is_impersonated) return; // Don't save filters when impersonating

    const filters = {
      searchTerm,
      deptId: selectedDeptId,
      sectionId: selectedSectionId,
      teamId: selectedTeamId,
      statusId: selectedStatusId,
      serviceTypeId: selectedServiceTypeId,
    };
    localStorage.setItem("attendance_filters", JSON.stringify(filters));
  }, [
    isInitialized,
    searchTerm,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusId,
    selectedServiceTypeId,
    user?.is_impersonated,
  ]);

  // Check for auto-open modal from navigation state
  useEffect(() => {
    if (location.state?.openBulkModal) {
      if (location.state.alertData) {
        setAlertContext(location.state.alertData);
        if (location.state.alertData.missing_ids) {
          setSelectedEmployeeIds(location.state.alertData.missing_ids);
        }
      } else if (location.state.missingIds) {
        setAlertContext({ missing_ids: location.state.missingIds });
        setSelectedEmployeeIds(location.state.missingIds);
      } else {
        setAlertContext(null);
      }
      setBulkModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Refetch employees when selectedDate changes
  useEffect(() => {
    fetchEmployees(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      format(selectedDate, "yyyy-MM-dd"),
    );
  }, [selectedDate, fetchEmployees]);

  useEffect(() => {
    const init = async () => {
      const struct = await getStructure();
      if (struct) {
        setDepartments(struct);

        // Auto-initialize filters based on user command scope if NOT already loaded from localStorage
        const savedFilters = localStorage.getItem("attendance_filters");
        if (!savedFilters && user && !user.is_admin) {
          if (user.commands_department_id) {
            setSelectedDeptId(user.commands_department_id.toString());
          } else if (user.commands_section_id) {
            if (user.assigned_department_id)
              setSelectedDeptId(user.assigned_department_id.toString());
            setSelectedSectionId(user.commands_section_id.toString());
          } else if (user.commands_team_id) {
            if (user.assigned_department_id)
              setSelectedDeptId(user.assigned_department_id.toString());
            if (user.assigned_section_id)
              setSelectedSectionId(user.assigned_section_id.toString());
            setSelectedTeamId(user.commands_team_id.toString());
          }
        }
      }

      const statuses = await getStatusTypes();
      if (statuses) setStatusTypes(statuses);

      const sTypes = await getServiceTypes();
      if (sTypes) setServiceTypes(sTypes);

      if (user) {
        const me = await getEmployeeById(user.id);
        setCurrentUserEmp(me);
      }
    };
    init();
  }, [getStructure, getStatusTypes, getServiceTypes, getEmployeeById, user]);

  // Update sections and teams when department/section changes
  useEffect(() => {
    const currentDept = departments.find(
      (d: any) => d.id.toString() === selectedDeptId,
    );
    const newSections = currentDept?.sections || [];
    setSections(newSections);

    // Only reset if the current selection is no longer valid
    if (
      selectedSectionId !== "all" &&
      !newSections.find((s: any) => s.id.toString() === selectedSectionId)
    ) {
      setSelectedSectionId("all");
    }
  }, [selectedDeptId, departments]);

  useEffect(() => {
    const currentSection = sections.find(
      (s: any) => s.id.toString() === selectedSectionId,
    );
    const newTeams = currentSection?.teams || [];
    setTeams(newTeams);

    // Only reset if the current selection is no longer valid
    if (
      selectedTeamId !== "all" &&
      !newTeams.find((t: any) => t.id.toString() === selectedTeamId)
    ) {
      setSelectedTeamId("all");
    }
  }, [selectedSectionId, sections]);

  // Smart Continuity Logic - matches the backend get_dashboard_stats and the Work Roster
  // An employee is "active" (reported) for a date if:
  //   1. They have a PERSISTENT status that started on or before that date
  //   2. They are in a DATE-RANGE status (has end_datetime) that covers that date
  //   3. Their status started on that exact date
  // "Not Reported" = NO status entry at all
  const isReportedOnDate = (emp: any, date: Date) => {
    if (!emp.status_id) return false;

    const targetDateStr = date.toDateString();
    const startDate = emp.last_status_update
      ? new Date(emp.last_status_update)
      : null;

    // Started on the exact target date
    if (startDate && startDate.toDateString() === targetDateStr) return true;

    // Within an active date range (has an end date that hasn't passed)
    if (emp.status_end_datetime) {
      const endDate = new Date(emp.status_end_datetime);
      endDate.setHours(23, 59, 59, 999);
      if (startDate && startDate <= date && date <= endDate) return true;
    }

    // Persistent status active from a previous day (no end date = ongoing)
    if (emp.status_is_persistent && !emp.status_end_datetime) {
      if (startDate && startDate <= date) return true;
    }

    return false;
  };

  // Calculate employees within user's command scope
  const scopeEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!user) return true;
      if (user.is_admin) return true;

      if (user.is_commander) {
        // Commander: Filter strictly by commanded units
        // If a command ID is present, the employee MUST match it
        if (
          user.commands_department_id &&
          emp.department_id !== user.commands_department_id
        )
          return false;
        if (
          user.commands_section_id &&
          emp.section_id !== user.commands_section_id
        )
          return false;
        if (user.commands_team_id && emp.team_id !== user.commands_team_id)
          return false;
        return true;
      } else {
        // Regular User: Filter strictly by residence (Team level visibility)
        if (user.department_id && emp.department_id !== user.department_id)
          return false;
        if (user.section_id && emp.section_id !== user.section_id) return false;
        if (user.team_id && emp.team_id !== user.team_id) return false;
        return true;
      }
    });
  }, [employees, user]);

  const filteredEmployees = useMemo(() => {
    return scopeEmployees.filter((emp) => {
      // Basic Search
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const searchMatch = fullName.includes(searchTerm.toLowerCase()) || false;
      if (!searchMatch) return false;

      // Organizational Filters (Selection)
      if (
        selectedDeptId !== "all" &&
        emp.department_id !== parseInt(selectedDeptId)
      )
        return false;
      if (
        selectedSectionId !== "all" &&
        emp.section_id !== parseInt(selectedSectionId)
      )
        return false;
      if (selectedTeamId !== "all" && emp.team_id !== parseInt(selectedTeamId))
        return false;

      // Status Filter
      if (selectedStatusId !== "all") {
        if (selectedStatusId === "GROUP_VACATION") {
          if (!emp.status_name?.includes("חופשה")) return false;
        } else if (selectedStatusId === "GROUP_OFFICE") {
          if (!emp.status_name?.includes("משרד")) return false;
        } else if (emp.status_id?.toString() !== selectedStatusId) {
          return false;
        }
      }

      // Service Type Filter
      if (
        selectedServiceTypeId !== "all" &&
        emp.service_type_id?.toString() !== selectedServiceTypeId
      )
        return false;

      return true;
    });
  }, [
    scopeEmployees,
    searchTerm,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusId,
    selectedServiceTypeId,
  ]);

  const employeesForModal = useMemo(() => {
    if (alertContext && alertContext.missing_ids) {
      return employees.filter((e) => alertContext.missing_ids.includes(e.id));
    }
    return filteredEmployees;
  }, [employees, alertContext, filteredEmployees]);

  const refreshData = async () => {
    await fetchEmployees(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      format(selectedDate, "yyyy-MM-dd"),
    );
    if (user) {
      const me = await getEmployeeById(user.id);
      setCurrentUserEmp(me);
    }
    setSelectedEmployeeIds([]);
  };

  const handleOpenStatusModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStatusModalOpen(true);
  };

  const handleOpenHistoryModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setHistoryModalOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds((prev) => [...prev, id]);
    } else {
      setSelectedEmployeeIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  // 1. Superset (For logic/missing checks - includes long-term statuses)
  const activeEmployees = useMemo(() => {
    return scopeEmployees.filter((emp) => isReportedOnDate(emp, selectedDate));
  }, [scopeEmployees, selectedDate]);

  const unverifiedEmployees = useMemo(
    () => activeEmployees.filter((e) => e.status_id && e.is_verified === false),
    [activeEmployees],
  );

  const computedStats = useMemo(() => {
    const statusMap = new Map<
      string,
      { status_id: number; status_name: string; color: string; count: number }
    >();

    // Build a lookup: sub-status id → parent status
    const subToParent = new Map<number, any>();
    statusTypes.forEach((st) => {
      if (st.parent_status_id) {
        const parent = statusTypes.find((p) => p.id === st.parent_status_id);
        if (parent) subToParent.set(st.id, parent);
      }
    });

    // 1. Initialize with PARENT status types only (no parent_status_id)
    statusTypes
      .filter((st) => !st.parent_status_id)
      .forEach((st) => {
        statusMap.set(st.name, {
          status_id: st.id,
          status_name: st.name,
          color: st.color || "#cbd5e1",
          count: 0,
        });
      });

    // 2. Count active employees - sub-statuses count toward their parent
    activeEmployees.forEach((emp: any) => {
      const statusName = emp.status_name?.trim();
      if (!statusName) return;

      // Check if this is a sub-status → map to parent name
      const parent = emp.status_id ? subToParent.get(emp.status_id) : null;
      const key = parent ? parent.name : statusName;

      if (statusMap.has(key)) {
        statusMap.get(key)!.count++;
      } else {
        // Unknown status not yet in map (e.g. custom added) — add it
        statusMap.set(key, {
          status_id: parent ? parent.id : emp.status_id,
          status_name: key,
          color: parent ? parent.color : emp.status_color || "#cbd5e1",
          count: 1,
        });
      }
    });

    return Array.from(statusMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.status_name.localeCompare(b.status_name);
    });
  }, [activeEmployees, statusTypes]);

  const totalCount = scopeEmployees.length;

  const missingEmployeeIds = useMemo(() => {
    return scopeEmployees
      .filter((emp) => !isReportedOnDate(emp, selectedDate))
      .map((e) => e.id);
  }, [scopeEmployees, selectedDate]);

  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.team_name && emp.team_name !== "מטה") return "מפקד חוליה";
      if (emp.section_name && emp.section_name !== "מטה") return "מפקד מדור";
      if (emp.department_name && emp.department_name !== "מטה")
        return "מפקד מחלקה";
      return "מפקד יחידה";
    }
    return "שוטר";
  };

  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-clear tutorial param after 5 seconds
  useEffect(() => {
    if (searchParams.get("tutorial")) {
      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("tutorial");
        setSearchParams(newParams, { replace: true });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  const isReportedToday = currentUserEmp
    ? isReportedOnDate(currentUserEmp, selectedDate)
    : false;

  const isAllReported = totalCount > 0 && activeEmployees.length === totalCount;

  return (
    <div
      id="attendance-header"
      className="flex flex-col min-h-full selection:bg-primary/10 selection:text-primary transition-all"
      dir="rtl"
    >
      <div className="pt-4 pb-2 px-4 sm:px-6 shrink-0 transition-all">
        {/* Premium Page Header Section */}
        <PageHeader
          icon={CalendarDays}
          title="מעקב נוכחות"
          className="mb-0"
          hideMobile={true}
          badge={
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 w-full lg:w-auto mt-4 lg:mt-0">
              {/* Unified Date Selector (Removed as it is now Global) */}
              {/* Mobile-First Action Bar */}
              <div className="lg:hidden">
                {/* Mobile buttons outside PageHeader to achieve full screen width */}
              </div>

              {/* Desktop Action Bar */}
              {!isViewingDayDetails && (
                <div className="hidden lg:flex items-center gap-2 w-full lg:w-auto">
                  {/* Calendar toggle button */}
                  <Button
                    id="attendance-calendar-btn"
                    variant="ghost"
                    className={cn(
                      "h-11 rounded-xl flex-col gap-0.5 font-black transition-all px-2 xl:px-4 py-1 justify-center min-w-[64px] border-none bg-transparent text-primary hover:bg-primary/5",
                      calendarOpen && "bg-primary/10",
                    )}
                    onClick={openCalendar}
                  >
                    <CalendarRange className="w-4 h-4" />
                    <span className="text-[9px] xl:text-[10px] leading-tight mt-0.5">
                      לוח שנה
                    </span>
                  </Button>

                  {!user?.is_temp_commander && (
                    <Button
                      id="attendance-export-btn"
                      variant="ghost"
                      className="h-11 rounded-xl flex-col gap-0.5 font-black transition-all px-2 xl:px-4 py-1 justify-center min-w-[64px] border-none bg-transparent text-primary hover:bg-primary/5"
                      onClick={() => setExportDialogOpen(true)}
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-[9px] xl:text-[10px] leading-tight mt-0.5">
                        ייצוא
                      </span>
                    </Button>
                  )}

                  <Button
                    id="self-report-button"
                    variant={isReportedToday ? "default" : "ghost"}
                    className={cn(
                      "h-11 rounded-xl flex-col gap-0.5 font-black transition-all px-2 xl:px-4 py-1 justify-center min-w-[64px]",
                      isReportedToday
                        ? "bg-emerald-500/90 hover:bg-emerald-600 text-white"
                        : "border-none bg-transparent text-primary hover:bg-primary/5",
                      searchParams.get("tutorial") === "self-report" &&
                        "tutorial-highlight",
                    )}
                    onClick={() => {
                      if (currentUserEmp) {
                        setSelectedEmployee(currentUserEmp);
                        setStatusModalOpen(true);
                      }
                    }}
                  >
                    {isReportedToday ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[9px] xl:text-[10px] leading-tight mt-0.5">
                          דווח
                        </span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        <span className="text-[9px] xl:text-[10px] leading-tight mt-0.5">
                          דיווח עצמי
                        </span>
                      </>
                    )}
                  </Button>

                  {unverifiedEmployees.length > 0 && (
                    <Button
                      variant="default"
                      className="h-11 rounded-xl flex-col gap-0.5 font-black px-2 xl:px-4 py-1 justify-center transition-all bg-primary hover:bg-primary/90 text-white min-w-[64px]"
                      onClick={async () => {
                        const success = await verifyRoster(
                          format(selectedDate, "yyyy-MM-dd"),
                          unverifiedEmployees.map((e) => e.id),
                        );
                        if (success) {
                          toast.success(
                            `אושר סידור עבור ${unverifiedEmployees.length} שוטרים`,
                          );
                          refreshData();
                        }
                      }}
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="text-[9px] xl:text-[10px] leading-tight mt-0.5">
                        אישור ({unverifiedEmployees.length})
                      </span>
                    </Button>
                  )}

                  <Button
                    id="bulk-update-btn"
                    variant="ghost"
                    className={cn(
                      "h-11 rounded-xl flex-col gap-0.5 font-black transition-all px-2 xl:px-4 py-1 justify-center min-w-[64px] border-none bg-transparent text-primary hover:bg-primary/5",
                      selectedEmployeeIds.length > 0 && "bg-primary/10",
                    )}
                    onClick={() => {
                      setAlertContext(null);
                      setBulkModalOpen(true);
                    }}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="text-[9px] xl:text-[10px] leading-tight mt-0.5">
                      עדכון מרוכז
                    </span>
                  </Button>
                </div>
              )}
            </div>
          }
        />

        {/* Mobile Action Buttons & Reminders */}
        {!isViewingDayDetails && (
          <>
            {/* Mobile Action Buttons - Full Screen Width */}
            <div className="lg:hidden w-full px-0 mb-2">
              <div
                className={cn(
                  "grid gap-2",
                  unverifiedEmployees.length > 0 && !user?.is_temp_commander
                    ? "grid-cols-5"
                    : !user?.is_temp_commander
                      ? "grid-cols-4"
                      : "grid-cols-3",
                )}
              >
                {/* Calendar button mobile */}
                <Button
                  id="mobile-attendance-calendar-btn"
                  variant="ghost"
                  className={cn(
                    "h-11 rounded-xl gap-1 font-black text-[10px] flex-col py-2 px-1 border-none bg-transparent text-primary hover:bg-primary/5",
                    calendarOpen && "bg-primary/10",
                  )}
                  onClick={openCalendar}
                >
                  <CalendarRange className="w-4 h-4" />
                  <span>לוח שנה</span>
                </Button>
                {!user?.is_temp_commander && (
                  <Button
                    id="mobile-attendance-export-btn"
                    variant="ghost"
                    className="h-11 rounded-xl text-primary hover:bg-primary/5 gap-1 font-black text-[10px] flex-col py-2 px-1 border-none bg-transparent"
                    onClick={() => setExportDialogOpen(true)}
                  >
                    <Download className="w-4 h-4" />
                    <span>ייצוא</span>
                  </Button>
                )}

                <Button
                  id="mobile-self-report-btn"
                  variant={isReportedToday ? "default" : "ghost"}
                  className={cn(
                    "h-11 rounded-xl gap-1 font-black text-[10px] flex-col py-2 px-1",
                    isReportedToday
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "border-none bg-transparent text-primary hover:bg-primary/5",
                  )}
                  onClick={() => {
                    if (currentUserEmp) {
                      setSelectedEmployee(currentUserEmp);
                      setStatusModalOpen(true);
                    }
                  }}
                >
                  {isReportedToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>דווח</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      <span>דיווח עצמי</span>
                    </>
                  )}
                </Button>

                {unverifiedEmployees.length > 0 && (
                  <Button
                    variant="default"
                    className="h-11 rounded-xl gap-1 font-black text-[10px] flex-col py-2 px-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      const success = await verifyRoster(
                        format(selectedDate, "yyyy-MM-dd"),
                        unverifiedEmployees.map((e) => e.id),
                      );
                      if (success) {
                        toast.success(
                          `אושר סידור עבור ${unverifiedEmployees.length} שוטרים`,
                        );
                        refreshData();
                      }
                    }}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>אישור ({unverifiedEmployees.length})</span>
                  </Button>
                )}

                <Button
                  id="mobile-bulk-update-btn"
                  variant="ghost"
                  className={cn(
                    "h-11 text-primary hover:bg-primary/5 gap-1 font-black text-[10px] flex-col py-2 px-1 border-none bg-transparent",
                    selectedEmployeeIds.length > 0 && "bg-primary/10",
                  )}
                  onClick={() => {
                    setAlertContext(null);
                    setBulkModalOpen(true);
                  }}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>עדכון מרוכז</span>
                </Button>
              </div>
            </div>

            {/* Mobile Reminder Banner */}
            <div className="lg:hidden w-full mb-4">
              {!isAllReported && (
                <div
                  className="w-full bg-amber-500/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                  onClick={() => {
                    setAlertContext({ missing_ids: missingEmployeeIds });
                    setSelectedEmployeeIds(missingEmployeeIds);
                    setBulkModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-px font-bold text-foreground leading-tight">
                        נשארו דיווחים
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/60">
                        יעד יום: 09:00
                      </span>
                    </div>
                  </div>
                  <div className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <span className="text-[10px] font-bold text-amber-700">
                      נותרו: {totalCount - activeEmployees.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main content: calendar view OR normal stats+table */}
      <AnimatePresence>
        {calendarOpen ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-1 px-0 sm:px-2 pb-4"
          >
            <div
              className={cn(
                isViewingDayDetails
                  ? "bg-transparent border-none p-0"
                  : "bg-card border border-border/50 rounded-2xl p-3 sm:p-4 md:p-5 h-full",
                "transition-all",
              )}
            >
              <AttendanceCalendarView
                statusTypes={statusTypes}
                scopeEmployees={scopeEmployees}
                onClose={closeCalendar}
                departments={departments}
                sections={sections}
                teams={teams}
                serviceTypes={serviceTypes}
                onDaySelectedChange={setIsViewingDayDetails}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="pb-4 space-y-4"
          >
            {/* Filters Bar */}
            <div
              id="status-filters"
              className="overflow-visible bg-transparent w-full"
            >
              {/* Responsive Search + Advanced Filters Row */}
              <div className="flex items-center gap-2.5 sm:gap-3 w-full">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input
                    placeholder="חיפוש שם שוטר או מ.א..."
                    className="h-10 pr-10 bg-background border border-border/40 focus:ring-ring/20 focus:border-ring rounded-xl text-sm font-bold w-full transition-all hover:border-border/80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <FilterTriggerButton
                  hasActiveFilters={isFilterActive}
                  onReset={handleClearFilters}
                  onClick={() => setFilterOpen(true)}
                />
              </div>

            {/* Shared Filter Modal */}
            <FilterDialog
              open={filterOpen}
              onOpenChange={setFilterOpen}
              title="סינון"
              description="סינון נוכחות עובדים"
              onApply={() => setFilterOpen(false)}
              onReset={() => {
                handleClearFilters();
                setFilterOpen(false);
              }}
              hasActiveFilters={isFilterActive}
              headerContent={
                <div className="flex gap-6 overflow-x-auto no-scrollbar pt-2">
                  {[
                    { id: "org", label: "יחידות ארגוניות" },
                    { id: "status", label: "סטטוסים" },
                    { id: "service", label: "מעמד" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilterTab(tab.id)}
                      className={cn(
                        "text-sm font-black whitespace-nowrap pb-2 border-b-2 transition-all relative cursor-pointer",
                        activeFilterTab === tab.id
                          ? "text-foreground border-primary"
                          : "text-muted-foreground border-transparent"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              }
            >
              {activeFilterTab === "org" && (
                <div className="space-y-4 py-2">
                  {(user?.is_admin || !user?.department_id) && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        מחלקה
                      </label>
                      <Select
                        value={selectedDeptId}
                        onValueChange={(val) => {
                          setSelectedDeptId(val);
                          setSelectedSectionId("all");
                          setSelectedTeamId("all");
                        }}
                        disabled={
                          !!(user && !user.is_admin && user.department_id)
                        }
                      >
                        <SelectTrigger className="w-full text-right h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="all">כל המחלקות</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id.toString()}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(user?.is_admin || !user?.section_id) && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        מדור
                      </label>
                      <Select
                        value={selectedSectionId}
                        onValueChange={(val) => {
                          setSelectedSectionId(val);
                          setSelectedTeamId("all");
                        }}
                        disabled={
                          !selectedDeptId ||
                          selectedDeptId === "all" ||
                          !!(user && !user.is_admin && user.section_id)
                        }
                      >
                        <SelectTrigger className="w-full text-right h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="all">כל המדורים</SelectItem>
                          {sections.map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(user?.is_admin || !user?.team_id) && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">
                        חוליה
                      </label>
                      <Select
                        value={selectedTeamId}
                        onValueChange={(val) => setSelectedTeamId(val)}
                        disabled={
                          !selectedSectionId ||
                          selectedSectionId === "all" ||
                          !!(user && !user.is_admin && user.team_id)
                        }
                      >
                        <SelectTrigger className="w-full text-right h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="all">כל החוליות</SelectItem>
                          {teams.map((t: any) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {activeFilterTab === "status" && (
                <div className="space-y-2 py-2">
                  <label className="text-xs font-bold text-muted-foreground">
                    סטטוס נוכחות
                  </label>
                  <Select
                    value={selectedStatusId}
                    onValueChange={setSelectedStatusId}
                  >
                    <SelectTrigger className="w-full text-right h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="all">כל הסטטוסים</SelectItem>
                      {statusTypes.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeFilterTab === "service" && (
                <div className="space-y-2 py-2">
                  <label className="text-xs font-bold text-muted-foreground">
                    סוג שירות / מעמד
                  </label>
                  <Select
                    value={selectedServiceTypeId}
                    onValueChange={setSelectedServiceTypeId}
                  >
                    <SelectTrigger className="w-full text-right h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="all">כל המעמדות</SelectItem>
                      {serviceTypes.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </FilterDialog>
          </div>

            {/* Attendance Table - Desktop Only */}
            <div
              id="attendance-table"
              className="hidden lg:block bg-card rounded-2xl border border-border  overflow-hidden"
            >
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-background/20 backdrop-blur-sm">
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="text-right px-6 font-bold text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            className="w-5 h-5 border-2 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-lg transition-all"
                            checked={
                              filteredEmployees.length > 0 &&
                              selectedEmployeeIds.length ===
                                filteredEmployees.length
                            }
                            onCheckedChange={(checked) =>
                              handleSelectAll(checked as boolean)
                            }
                          />
                          <span>שוטר</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                        תפקיד/סמכות
                      </TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                        שיוך ארגוני
                      </TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                        סטטוס נוכחות
                      </TableHead>
                      <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                        עדכון אחרון
                      </TableHead>
                      <TableHead className="text-center font-bold text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                        פעולות
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-32 text-center text-muted-foreground"
                        >
                          טוען נתונים...
                        </TableCell>
                      </TableRow>
                    ) : filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-32 text-center text-muted-foreground font-medium"
                        >
                          לא נמצאו שוטרים התואמים את הסינון
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isUpdatedToday = isReportedOnDate(
                          emp,
                          selectedDate,
                        );
                        const isSelected = selectedEmployeeIds.includes(emp.id);

                        return (
                          <TableRow
                            key={emp.id}
                            data-state={isSelected ? "selected" : "unchecked"}
                            className={cn(
                              "group/row transition-all border-b border-border/40",
                              isSelected
                                ? "bg-primary/[0.03] border-r-4 border-r-primary"
                                : "hover:bg-slate-50 dark:hover:bg-slate-900/40 border-r-4 border-r-transparent hover:border-r-primary/40",
                              user &&
                                emp.id === user.id &&
                                !isSelected &&
                                "bg-emerald-500/[0.02] border-r-4 border-r-emerald-500",
                            )}
                          >
                            <TableCell className="py-5 px-6 text-right align-middle">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectOne(emp.id, !isSelected);
                                    }}
                                    className={cn(
                                      "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm hover:scale-110 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm",
                                      isSelected
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-400 border border-border/50 hover:border-primary/40",
                                    )}
                                  >
                                    {isSelected ? (
                                      <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                      <span>
                                        {emp.first_name[0]}
                                        {emp.last_name[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col text-right min-w-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/employees/${emp.id}`);
                                    }}
                                    className={cn(
                                      "text-base font-bold truncate tracking-tight transition-colors hover:underline text-right hover:text-primary w-fit",
                                      isSelected
                                        ? "text-primary"
                                        : "text-foreground group-hover/row:text-primary",
                                    )}
                                  >
                                    {emp.dominant_name
                                      ? `${emp.dominant_name} ${emp.last_name}`
                                      : `${emp.first_name} ${emp.last_name}`}
                                  </button>
                                  {(emp.is_commander || emp.is_admin) && (
                                    <span className="text-[10px] text-muted-foreground/50 font-bold tracking-[0.1em]">
                                      #{emp.username}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col">
                                <Badge
                                  variant="outline"
                                  className="font-medium text-[10px] border-none px-2.5 py-1 bg-background/50 text-muted-foreground w-fit mb-1 border border-border/20"
                                >
                                  {getProfessionalTitle(emp)}
                                </Badge>
                                {emp.service_type_name && (
                                  <span className="text-[10px] font-bold text-muted-foreground/60">
                                    {emp.service_type_name}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-5">
                              <div className="flex flex-col text-right min-w-[140px]">
                                {emp.department_name &&
                                emp.department_name !== "מטה" ? (
                                  <>
                                    <span className="text-[11px] font-bold text-foreground">
                                      {cleanUnitName(emp.department_name)}
                                    </span>
                                    {((emp.section_name &&
                                      emp.section_name !== "מטה") ||
                                      (emp.team_name &&
                                        emp.team_name !== "מטה")) && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[10px] font-bold text-primary/60 truncate bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                          {emp.team_name &&
                                          emp.team_name !== "מטה"
                                            ? cleanUnitName(emp.team_name)
                                            : cleanUnitName(
                                                emp.section_name || "",
                                              )}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[10px] font-bold text-muted-foreground/30">
                                    מטה / ללא שיוך
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: (() => {
                                      const isToday =
                                        selectedDate.toDateString() ===
                                        new Date().toDateString();

                                      const rawName =
                                        emp.status_name?.trim() || "";
                                      const statusName =
                                        rawName === "חופשה חול" ||
                                        rawName === 'חופשה חו"ל'
                                          ? "חו' חול"
                                          : rawName;
                                      const isDefaultStatus = [
                                        "משרד",
                                        "נוכח",
                                        "ביחידה",
                                        "בבסיס",
                                        "רגיל",
                                      ].some((s) => statusName.includes(s));

                                      if (!isToday && isDefaultStatus) {
                                        return "var(--muted-foreground)"; // Gray for unreported
                                      }
                                      return (
                                        emp.status_color ||
                                        "var(--muted-foreground)"
                                      );
                                    })(),
                                  }}
                                />
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold border-none bg-muted py-0.5 px-2 text-muted-foreground"
                                >
                                  {(() => {
                                    const isToday =
                                      selectedDate.toDateString() ===
                                      new Date().toDateString();

                                    // Check if status is "Default" (Office/Present)
                                    const rawName =
                                      emp.status_name?.trim() || "";
                                    const statusName =
                                      rawName === "חופשה חול" ||
                                      rawName === 'חופשה חו"ל'
                                        ? "חו' חול"
                                        : rawName;
                                    const isDefaultStatus = [
                                      "משרד",
                                      "נוכח",
                                      "ביחידה",
                                      "בבסיס",
                                      "רגיל",
                                    ].some((s) => statusName.includes(s));

                                    // Logic: If NOT today, and status is default -> It's a placeholder -> Show Unreported
                                    if (!isToday && isDefaultStatus) {
                                      return "לא דווח";
                                    }
                                    return statusName || "לא מדווח";
                                  })()}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isUpdatedToday ? (
                                emp.is_verified !== false ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold">
                                      {selectedDate.toDateString() ===
                                      new Date().toDateString()
                                        ? "היום"
                                        : format(selectedDate, "dd/MM")}
                                      ,{" "}
                                      {activeEmployees.find(
                                        (e) =>
                                          e.id === emp.id &&
                                          new Date(
                                            e.last_status_update!,
                                          ).toDateString() !==
                                            selectedDate.toDateString(),
                                      )
                                        ? "08:00"
                                        : new Date(
                                            emp.last_status_update!,
                                          ).toLocaleTimeString("he-IL", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">
                                      מתוכנן
                                    </span>
                                  </div>
                                )
                              ) : (
                                <div className="flex items-center gap-1.5 text-rose-500/80">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span className="text-xs font-bold">
                                    לא עודכן
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                {!user?.is_temp_commander && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                                    onClick={() => handleOpenHistoryModal(emp)}
                                  >
                                    <History className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg"
                                  onClick={() => handleOpenStatusModal(emp)}
                                >
                                  <ClipboardCheck className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div
              id="attendance-table-mobile"
              className="lg:hidden flex flex-col gap-3"
            >
              {loading ? (
                <div className="bg-card rounded-xl p-8 text-center border border-border">
                  <p className="text-xs font-bold text-muted-foreground">
                    טוען נתונים...
                  </p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center border border-border">
                  <p className="text-xs font-bold text-muted-foreground">
                    לא נמצאו שוטרים
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 text-xs font-bold text-muted-foreground uppercase">
                    <span>רשימת שוטרים ({filteredEmployees.length})</span>
                    <div className="flex items-center gap-3">
                      <span
                        onClick={() =>
                          handleSelectAll(
                            selectedEmployeeIds.length !==
                              filteredEmployees.length,
                          )
                        }
                        className="text-primary cursor-pointer active:opacity-70 select-none text-[11px] font-black"
                      >
                        {selectedEmployeeIds.length === filteredEmployees.length
                          ? "בטל בחירה"
                          : "בחר הכל"}
                      </span>
                      <Checkbox
                        className="w-4 h-4 border-2 rounded"
                        checked={
                          filteredEmployees.length > 0 &&
                          selectedEmployeeIds.length ===
                            filteredEmployees.length
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAll(checked as boolean)
                        }
                      />
                    </div>
                  </div>
                  {filteredEmployees.map((emp) => {
                    const isUpdatedToday =
                      emp.last_status_update &&
                      new Date(emp.last_status_update).toDateString() ===
                        selectedDate.toDateString();
                    const isSelected = selectedEmployeeIds.includes(emp.id);

                    const isToday =
                      selectedDate.toDateString() === new Date().toDateString();
                    const rawName = emp.status_name?.trim() || "";
                    const statusName =
                      rawName === "חופשה חול" || rawName === 'חופשה חו"ל'
                        ? "חו' חול"
                        : rawName;
                    const isDefaultStatus = [
                      "משרד",
                      "נוכח",
                      "ביחידה",
                      "בבסיס",
                      "רגיל",
                    ].some((s) => statusName.includes(s));

                    const isAbsent =
                      !isUpdatedToday ||
                      (!isToday && isDefaultStatus) ||
                      statusName === "לא מדווח" ||
                      statusName === "לא דווח";

                    return (
                      <div
                        key={emp.id}
                        className={cn(
                          "group bg-card/60 dark:bg-card/30 rounded-2xl border border-border/40 p-4 transition-all text-right shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl",
                          isSelected
                            ? "ring-2 ring-primary/80 bg-primary/[0.02] dark:bg-primary/[0.04]"
                            : "hover:border-primary/40",
                          !emp.is_active && "grayscale opacity-80",
                        )}
                      >
                        {/* Upper Section: Avatar + Name on Right, Status Tag on Left */}
                        <div className="flex justify-between items-center mb-3.5">
                          <div className="flex items-center gap-3">
                            {/* Small Avatar */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOne(emp.id, !isSelected);
                              }}
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-transform cursor-pointer hover:scale-110 active:scale-95 shadow-sm",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground border border-border/50",
                              )}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span>
                                  {emp.first_name[0]}
                                  {emp.last_name[0]}
                                </span>
                              )}
                            </div>

                            {/* Employee Name */}
                            <div className="flex flex-col text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/employees/${emp.id}`);
                                }}
                                className="text-sm font-bold text-foreground hover:underline p-0 h-auto text-right hover:text-primary"
                              >
                                {emp.dominant_name
                                  ? `${emp.dominant_name} ${emp.last_name}`
                                  : `${emp.first_name} ${emp.last_name}`}
                              </button>
                              {(emp.is_commander || emp.is_admin) && (
                                <span className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">
                                  #{emp.username}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Tag (נוכח/נעדר) */}
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-black border transition-colors",
                              !isAbsent
                                ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20",
                            )}
                          >
                            {isAbsent ? "נעדר" : "נוכח"} (
                            {statusName || "לא דווח"})
                          </span>
                        </div>

                        {/* Middle Section: Details (Role, Unit) with theme responsive colors */}
                        <div className="space-y-1 text-right mb-4 text-[11px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-1 font-medium">
                            <span className="opacity-70">תפקיד:</span>
                            <span className="text-foreground/90 font-bold">
                              {getProfessionalTitle(emp)}
                            </span>
                            {emp.service_type_name && (
                              <>
                                <span className="opacity-40">•</span>
                                <span className="text-foreground/90 font-bold">
                                  {emp.service_type_name}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 font-medium">
                            <span className="opacity-70">שיוך ארגוני:</span>
                            <span className="text-foreground/90 font-bold">
                              {emp.department_name}
                              {emp.section_name && ` / ${emp.section_name}`}
                              {emp.team_name && ` / ${emp.team_name}`}
                            </span>
                          </div>
                        </div>

                        {/* Actions Row at bottom of card */}
                        <div className="flex gap-2 pt-3 border-t border-border/30 dark:border-border/10 no-export">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 flex-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold gap-1 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusModal(emp);
                            }}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>עדכן נוכחות</span>
                          </Button>
                          {!user?.is_temp_commander && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 flex-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-bold gap-1 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenHistoryModal(emp);
                              }}
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>היסטוריה</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {selectedEmployee && (
              <StatusUpdateModal
                open={statusModalOpen}
                onOpenChange={setStatusModalOpen}
                employee={selectedEmployee}
                onSuccess={refreshData}
                selectedDate={selectedDate}
              />
            )}

            {selectedEmployee && (
              <StatusHistoryModal
                open={historyModalOpen}
                onOpenChange={setHistoryModalOpen}
                employee={selectedEmployee}
              />
            )}

            <BulkStatusUpdateModal
              open={bulkModalOpen}
              onOpenChange={(open) => {
                setBulkModalOpen(open);
                if (!open) setAlertContext(null);
              }}
              employees={employeesForModal}
              initialSelectedIds={selectedEmployeeIds}
              onSuccess={refreshData}
              alertContext={alertContext}
              selectedDate={selectedDate}
              isReportedCheck={isReportedOnDate}
            />
            <ExportReportDialog
              open={exportDialogOpen}
              onOpenChange={setExportDialogOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
