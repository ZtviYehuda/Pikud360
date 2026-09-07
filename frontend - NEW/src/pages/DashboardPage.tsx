import { useRef, useState, useEffect, useMemo } from "react";
import { cn, formatUnitName } from "@/lib/utils";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { BirthdayBanner } from "@/components/dashboard/BirthdayBanner";
import { BirthdaysCard } from "@/components/dashboard/BirthdaysCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { WhatsAppReportDialog } from "@/components/dashboard/WhatsAppReportDialog";
import { DashboardStatusTable } from "@/components/dashboard/DashboardStatusTable";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { useDateContext } from "@/context/DateContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { StatCards } from "@/components/dashboard/StatCards";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AgeDistributionChart } from "@/components/dashboard/AgeDistributionChart";
import { Button } from "@/components/ui/button";
import { ReportHub } from "@/components/dashboard/ReportHub";
import { RestorationRequestDialog } from "@/components/dashboard/RestorationRequestDialog";
import { WhatsAppBroadcastModal } from "@/components/employees/modals/WhatsAppBroadcastModal";
import { MessageSquare, Filter, Calendar } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { GlobalEventModal } from "@/components/employees/modals/GlobalEventModal";
import { getJewishHoliday } from "@/lib/hebrewDate";

// Helper types for structure
interface Team {
  id: number;
  name: string;
  section_id: number;
}
interface Section {
  id: number;
  name: string;
  department_id: number;
  teams: Team[];
}
interface Department {
  id: number;
  name: string;
  sections: Section[];
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  const { selectedDate, setSelectedDate } = useDateContext();
  const holiday = useMemo(() => getJewishHoliday(selectedDate), [selectedDate]);

  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  // Auto-clear tutorial param and manage local state
  useEffect(() => {
    const tutorial = searchParams.get("tutorial");
    if (tutorial) {
      setActiveTutorial(tutorial);
      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("tutorial");
        setSearchParams(newParams, { replace: true });
        // We keep activeTutorial for a bit longer to ensure visibility
        setTimeout(() => setActiveTutorial(null), 1000);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  // Refs for reports
  const snapshotRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const comparisonTreeRef = useRef<{
    departments?: any[];
    sections?: Record<string, any[]>;
    teams?: Record<string, any[]>;
  } | null>(null);
  const {
    getStructure,
    getDashboardStats,
    getComparisonStats,
    getTrendStats,
    getStatusTypes,
    getServiceTypes,
  } = useEmployees();

  const [stats, setStats] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [allStatusTypes, setAllStatusTypes] = useState<any[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [structure, setStructure] = useState<Department[]>([]);

  // Filters State (must be declared BEFORE any useEffect referencing them)
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedStatusData, setSelectedStatusData] = useState<{
    id: number;
    name: string;
    color: string;
  } | null>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(
    [],
  );
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
  const [selectedAgeRange, setSelectedAgeRange] = useState<{
    min?: number;
    max?: number;
  }>({});

  // Filter Modal State
  const [filterOpen, setFilterOpen] = useState(false);

  // New Stats
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [averageAge, setAverageAge] = useState(0);
  const [birthdays, setBirthdays] = useState<any[]>([]);

  const [viewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    "weekly",
  );

  const [trendRange, setTrendRange] = useState<number>(30);

  const comparisonRange = useMemo(() => {
    switch (viewMode) {
      case "daily":
        return 1;
      case "weekly":
        return 7;
      case "monthly":
        return 30;
      case "yearly":
        return 365;
      default:
        return 1;
    }
  }, [viewMode]);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [whatsappBroadcastOpen, setWhatsappBroadcastOpen] = useState(false);
  const [globalEventOpen, setGlobalEventOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const isOldDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  }, [selectedDate]);

  // Fetch Trend Stats
  useEffect(() => {
    const fetchTrend = async () => {
      setTrendLoading(true);
      try {
        const referenceDate = isOldDate ? selectedDate : new Date();
        const formattedDate = format(referenceDate, "yyyy-MM-dd");
        
        const trendData = await getTrendStats(trendRange, formattedDate, {
          department_id: selectedDeptId,
          section_id: selectedSectionId,
          status_id: (selectedStatusData?.id && selectedStatusData.id > 0) ? selectedStatusData.id.toString() : undefined,
          serviceTypes: selectedServiceTypes.join(","),
          min_age: selectedAgeRange.min,
          max_age: selectedAgeRange.max,
        });
        setTrendStats(trendData || []);
      } catch (err) {
        console.error("fetchTrend error", err);
        setTrendStats([]);
      } finally {
        setTrendLoading(false);
      }
    };
    fetchTrend();
  }, [
    getTrendStats,
    isOldDate ? format(selectedDate, "yyyy-MM-dd") : "current",
    trendRange,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData?.id,
    selectedServiceTypes,
    selectedAgeRange,
  ]);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("dashboard_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.deptId !== undefined) {
          const val = filters.deptId;
          setSelectedDeptId(Array.isArray(val) ? (val[0] ? String(val[0]) : "") : (val ? String(val) : ""));
        }
        if (filters.sectionId !== undefined) {
          const val = filters.sectionId;
          setSelectedSectionId(Array.isArray(val) ? (val[0] ? String(val[0]) : "") : (val ? String(val) : ""));
        }
        if (filters.teamId !== undefined) {
          const val = filters.teamId;
          setSelectedTeamId(Array.isArray(val) ? (val[0] ? String(val[0]) : "") : (val ? String(val) : ""));
        }
        if (filters.statusId !== undefined) setSelectedStatusId(filters.statusId);
        if (filters.statusData !== undefined) setSelectedStatusData(filters.statusData);
        if (filters.serviceTypes !== undefined) setSelectedServiceTypes(filters.serviceTypes);
        if (filters.ageRange !== undefined) setSelectedAgeRange(filters.ageRange);
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return; // Wait until loaded
    if (user?.is_impersonated) return; // Don't save filters when impersonating

    const filters = {
      deptId: selectedDeptId,
      sectionId: selectedSectionId,
      teamId: selectedTeamId,
      statusId: selectedStatusId,
      statusData: selectedStatusData && selectedStatusData.id > 0 ? selectedStatusData : null,
      serviceTypes: selectedServiceTypes,
      ageRange: selectedAgeRange,
    };
    localStorage.setItem("dashboard_filters", JSON.stringify(filters));
  }, [
    isInitialized,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusId,
    selectedStatusData,
    selectedServiceTypes,
    selectedAgeRange,
    user?.is_impersonated,
  ]);

  // Determine if user has top-level organizational command access (admin, commander, or unassigned top level)
  const isTopLevelCommander = useMemo(() => {
    if (!user) return true;
    if (user.is_admin || user.is_commander) return true;
    if (
      !user.commands_department_id &&
      !user.commands_section_id &&
      !user.commands_team_id &&
      !user.assigned_department_id &&
      !user.assigned_section_id &&
      !user.assigned_team_id
    ) {
      return true;
    }
    return false;
  }, [user]);

  // Initialize filters based on user permissions (only if no saved filters AND initialized)
  useEffect(() => {
    if (!isInitialized) return;
    const savedFilters = localStorage.getItem("dashboard_filters");

    // Check if saved filters are effectively empty
    const hasSavedData =
      savedFilters &&
      (() => {
        try {
          const f = JSON.parse(savedFilters);
          const hasDept = Array.isArray(f.deptId) ? f.deptId.length > 0 : !!f.deptId;
          const hasSect = Array.isArray(f.sectionId) ? f.sectionId.length > 0 : !!f.sectionId;
          const hasTeam = Array.isArray(f.teamId) ? f.teamId.length > 0 : !!f.teamId;
          return (
            hasDept ||
            hasSect ||
            hasTeam ||
            (f.statusData && f.statusData.id > 0) ||
            (f.serviceTypes && f.serviceTypes.length > 0)
          );
        } catch (e) {
          return false;
        }
      })();

    if (hasSavedData) return;

    if (!isTopLevelCommander && user) {
      if (user.commands_department_id || user.assigned_department_id) {
        setSelectedDeptId((user.commands_department_id || user.assigned_department_id).toString());
      } else if (user.commands_section_id || user.assigned_section_id) {
        if (user.assigned_department_id)
          setSelectedDeptId(user.assigned_department_id.toString());
        setSelectedSectionId((user.commands_section_id || user.assigned_section_id).toString());
      } else if (user.commands_team_id || user.assigned_team_id) {
        if (user.assigned_department_id)
          setSelectedDeptId(user.assigned_department_id.toString());
        if (user.assigned_section_id)
          setSelectedSectionId(user.assigned_section_id.toString());
        setSelectedTeamId((user.commands_team_id || user.assigned_team_id).toString());
      }
    } else {
      setSelectedDeptId("");
      setSelectedSectionId("");
      setSelectedTeamId("");
    }
  }, [user, isInitialized, isTopLevelCommander]);

  // Fetch Structure  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const [struct, stTypes, svTypes] = await Promise.all([
          getStructure(),
          getStatusTypes(),
          getServiceTypes(),
        ]);
        setStructure(struct);
        setAllStatusTypes(stTypes);
        setServiceTypes(svTypes);
      } catch (error) {
        console.error("DashboardPage init error", error);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, [getStructure, getStatusTypes, getServiceTypes]);

  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Fetch Comparison Stats without triggering full page layout shifts
  useEffect(() => {
    const fetchComparison = async () => {
      if (!comparisonStats || comparisonStats.length === 0) {
        setComparisonLoading(true);
      }
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      const compData = await getComparisonStats(
        formattedDate,
        comparisonRange,
        {
          department_id: selectedDeptId,
          section_id: selectedSectionId,
          team_id: selectedTeamId,
          status_id: (selectedStatusData?.id && selectedStatusData.id > 0) ? selectedStatusData.id.toString() : undefined,
          serviceTypes: selectedServiceTypes.join(","),
          min_age: selectedAgeRange.min,
          max_age: selectedAgeRange.max,
        },
      );

      if ((compData as any)?.all_levels) {
        comparisonTreeRef.current = (compData as any).all_levels;
      }

      setComparisonStats(compData);
      setComparisonLoading(false);
    };
    fetchComparison();
  }, [
    getComparisonStats,
    format(selectedDate, "yyyy-MM-dd"),
    comparisonRange,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData?.id,
    selectedServiceTypes,
    selectedAgeRange,
  ]);

  // Fetch Trend Stats
  useEffect(() => {
    const fetchTrend = async () => {
      // Use today as reference for trend unless we are looking at older historical data
      // This prevents the chart from "sliding" when clicking dates within the current month
      const referenceDate = isOldDate ? selectedDate : new Date();
      const formattedDate = format(referenceDate, "yyyy-MM-dd");
      
      const trendData = await getTrendStats(trendRange, formattedDate, {
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        status_id: (selectedStatusData?.id && selectedStatusData.id > 0) ? selectedStatusData.id.toString() : undefined,
        serviceTypes: selectedServiceTypes.join(","),
        min_age: selectedAgeRange.min,
        max_age: selectedAgeRange.max,
      });
      setTrendStats(trendData);
    };
    fetchTrend();
  }, [
    getTrendStats,
    isOldDate ? format(selectedDate, "yyyy-MM-dd") : "current",
    trendRange,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData?.id,
    selectedServiceTypes,
    selectedAgeRange,
  ]);


  // Fetch birthdays and unverified count - ALWAYS get full breakdown for the selected group
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const data = await getDashboardStats({
          department_id: selectedDeptId,
          section_id: selectedSectionId,
          team_id: selectedTeamId,
          date: format(selectedDate, "yyyy-MM-dd"),
          serviceTypes: selectedServiceTypes.join(","),
          min_age: selectedAgeRange.min,
          max_age: selectedAgeRange.max,
          status_id: (selectedStatusId !== null && selectedStatusId > 0) ? selectedStatusId.toString() : undefined,
        });

        if (data) {
          setStats(data.stats || []);
          setTotalEmployees(data.total_employees || 0);
          setBirthdays(data.birthdays || []);
          setAgeDistribution(data.age_distribution || []);
          setAverageAge(data.average_age || 0);
          // setHasArchiveAccess(data.has_archive_access || false);
        }
      } catch (error) {
        console.error("DashboardPage fetchStatsData error", error);
      }
    };

    fetchStatsData();
  }, [
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedServiceTypes,
    selectedAgeRange,
    getDashboardStats,
    selectedDate,
    selectedStatusId,
  ]);

  // Derived stats for the chart (Client-side drilling)
  const chartStats = useMemo(() => {
    return stats;
  }, [stats]);

  const handleFilterChange = (
    type:
      | "department"
      | "section"
      | "team"
      | "status"
      | "serviceType"
      | "ageRange"
      | "reset",
    value?: any,
  ) => {
    if (type === "reset" || type === "clearAll") {
      localStorage.removeItem("dashboard_filters");
      if (isTopLevelCommander) {
        setSelectedDeptId("");
        setSelectedSectionId("");
        setSelectedTeamId("");
      } else if (user?.commands_department_id || user?.assigned_department_id) {
        setSelectedDeptId((user.commands_department_id || user.assigned_department_id).toString());
        setSelectedSectionId("");
        setSelectedTeamId("");
      } else if (user?.commands_section_id || user?.assigned_section_id) {
        if (user?.assigned_department_id) {
          setSelectedDeptId(user.assigned_department_id.toString());
        }
        setSelectedSectionId((user.commands_section_id || user.assigned_section_id).toString());
        setSelectedTeamId("");
      } else if (user?.commands_team_id || user?.assigned_team_id) {
        if (user?.assigned_department_id) setSelectedDeptId(user.assigned_department_id.toString());
        if (user?.assigned_section_id) setSelectedSectionId(user.assigned_section_id.toString());
        setSelectedTeamId((user.commands_team_id || user.assigned_team_id).toString());
      } else {
        setSelectedDeptId("");
        setSelectedSectionId("");
        setSelectedTeamId("");
      }
      setSelectedStatusData(null);
      setSelectedStatusId(null);
      setSelectedServiceTypes([]);
      setSelectedAgeRanges([]);
      setSelectedAgeRange({});
      setFilterOpen(false);

      if (comparisonTreeRef.current?.departments) {
        setComparisonStats(comparisonTreeRef.current.departments);
      }
      return;
    }

    if (type === "ageRange") {
      let nextRanges: string[] = [];
      if (Array.isArray(value)) {
        nextRanges = value;
      } else if (value === "all" || !value) {
        nextRanges = [];
      } else {
        const strVal = String(value);
        if (selectedAgeRanges.includes(strVal)) {
          nextRanges = selectedAgeRanges.filter((r) => r !== strVal);
        } else {
          nextRanges = [...selectedAgeRanges, strVal];
        }
      }
      setSelectedAgeRanges(nextRanges);

      if (nextRanges.length === 0) {
        setSelectedAgeRange({});
      } else {
        let min = 999;
        let max = 0;
        for (const r of nextRanges) {
          if (r === "50+") {
            min = Math.min(min, 50);
            max = Math.max(max, 120);
          } else if (r.includes("-")) {
            const parts = r.split("-");
            min = Math.min(min, parseInt(parts[0]));
            max = Math.max(max, parseInt(parts[1]));
          }
        }
        setSelectedAgeRange({
          min: min === 999 ? undefined : min,
          max: max === 0 ? undefined : max,
        });
      }
    }

    if (type === "serviceType") {
      setSelectedServiceTypes(value || []);
    } else if (type === "department") {
      const deptIds = Array.isArray(value)
        ? value.map(String).filter(Boolean)
        : (value !== undefined && value !== null && value !== "" && value !== "all" ? [String(value)] : []);
      const deptId = deptIds.join(",");
      setSelectedDeptId(deptId);
      if (!Array.isArray(value)) {
        setSelectedSectionId("");
        setSelectedTeamId("");
      }

      if (comparisonTreeRef.current) {
        if (deptIds.length === 1 && comparisonTreeRef.current.sections?.[deptIds[0]]) {
          setComparisonStats(comparisonTreeRef.current.sections[deptIds[0]]);
        } else if (comparisonTreeRef.current.departments) {
          setComparisonStats(comparisonTreeRef.current.departments);
        }
      }
    } else if (type === "section") {
      const sectIds = Array.isArray(value)
        ? value.map(String).filter(Boolean)
        : (value !== undefined && value !== null && value !== "" && value !== "all" ? [String(value)] : []);
      const sectId = sectIds.join(",");
      setSelectedSectionId(sectId);
      if (!Array.isArray(value)) {
        setSelectedTeamId("");
      }

      if (comparisonTreeRef.current) {
        if (sectIds.length === 1 && comparisonTreeRef.current.teams?.[sectIds[0]]) {
          setComparisonStats(comparisonTreeRef.current.teams[sectIds[0]]);
        } else if (comparisonTreeRef.current.sections && selectedDeptId) {
          const firstDept = selectedDeptId.split(",")[0];
          setComparisonStats(comparisonTreeRef.current.sections[firstDept] || []);
        }
      }
    } else if (type === "team") {
      const teamIds = Array.isArray(value)
        ? value.map(String).filter(Boolean)
        : (value !== undefined && value !== null && value !== "" && value !== "all" ? [String(value)] : []);
      const teamId = teamIds.join(",");
      setSelectedTeamId(teamId);
    } else if (type === "status") {
      // If clicking the same status, deselect it
      if (selectedStatusId === (value ? parseInt(value) : null)) {
        setSelectedStatusId(null);
        setSelectedStatusData(null);
        return;
      }

      // Check for special stats-grid status buttons
      const specialStatuses = [
        { id: -1, name: "לא דווח", color: "#f43f5e" },
        { id: -2, name: "לא זמינים", color: "#f59e0b" },
        { id: -3, name: "זמינות מבצעית", color: "#10b981" },
        { id: -4, name: "סה\"כ שוטרים", color: "#6366f1" },
      ];

      const special = specialStatuses.find(s => s.id.toString() === value?.toString());
      if (special) {
        setSelectedStatusData({
          id: special.id,
          name: special.name,
          color: special.color,
        });
        setSelectedStatusId(special.id);
        return;
      }

      // Look up status in both active stats and all possible types
      const statusType = allStatusTypes.find((s: any) => s.id.toString() === value?.toString());
      const activeStatus = stats.find(
        (s: any) => s.status_id?.toString() === value?.toString(),
      );

      if (statusType) {
        setSelectedStatusData({
          id: statusType.id,
          name: statusType.name,
          color: statusType.color || activeStatus?.color || "#94a3b8",
        });
        setSelectedStatusId(statusType.id);
      } else if (activeStatus) {
        setSelectedStatusData({
          id: activeStatus.status_id,
          name: activeStatus.status_name,
          color: activeStatus.color,
        });
        setSelectedStatusId(activeStatus.status_id);
      } else {
        setSelectedStatusData(null);
        setSelectedStatusId(null);
      }
    }
  };

  // Normalize string IDs
  const cleanDeptId = typeof selectedDeptId === "string" ? selectedDeptId : (Array.isArray(selectedDeptId) && selectedDeptId[0] !== undefined && selectedDeptId[0] !== null ? String(selectedDeptId[0]) : "");
  const cleanSectionId = typeof selectedSectionId === "string" ? selectedSectionId : (Array.isArray(selectedSectionId) && selectedSectionId[0] !== undefined && selectedSectionId[0] !== null ? String(selectedSectionId[0]) : "");
  const cleanTeamId = typeof selectedTeamId === "string" ? selectedTeamId : (Array.isArray(selectedTeamId) && selectedTeamId[0] !== undefined && selectedTeamId[0] !== null ? String(selectedTeamId[0]) : "");

  const canGoBack = useMemo(() => {
    if (isTopLevelCommander) {
      return !!cleanTeamId || !!cleanSectionId || !!cleanDeptId;
    }
    
    if (user?.commands_department_id) {
      return !!cleanTeamId || !!cleanSectionId;
    }
    
    if (user?.commands_section_id) {
      return !!cleanTeamId;
    }

    return false;
  }, [cleanTeamId, cleanSectionId, cleanDeptId, isTopLevelCommander, user]);

  const handleGoBack = () => {
    if (cleanTeamId) {
      handleFilterChange("team", "");
    } else if (cleanSectionId) {
      handleFilterChange("section", "");
    } else if (cleanDeptId && isTopLevelCommander) {
      handleFilterChange("department", "");
    }
  };

  const safeStructure = Array.isArray(structure) ? structure : [];

  const allDepartments = useMemo(() => safeStructure, [safeStructure]);

  const allSections = useMemo(() => {
    return safeStructure.flatMap((d) =>
      (d.sections || []).map((s) => ({
        ...s,
        departmentId: d.id,
        departmentName: d.name,
      }))
    );
  }, [safeStructure]);

  const allTeams = useMemo(() => {
    return safeStructure.flatMap((d) =>
      (d.sections || []).flatMap((s) =>
        (s.teams || []).map((t) => ({
          ...t,
          sectionId: s.id,
          sectionName: s.name,
          departmentId: d.id,
          departmentName: d.name,
        }))
      )
    );
  }, [safeStructure]);

  const currentTeam = useMemo(() => {
    if (!cleanTeamId) return null;
    return allTeams.find((t) => String(t.id) === cleanTeamId) || null;
  }, [allTeams, cleanTeamId]);

  const currentSection = useMemo(() => {
    if (cleanSectionId) {
      const found = allSections.find((s) => String(s.id) === cleanSectionId);
      if (found) return found;
    }
    if (currentTeam?.sectionId) {
      return allSections.find((s) => s.id === currentTeam.sectionId) || null;
    }
    return null;
  }, [allSections, cleanSectionId, currentTeam]);

  const currentDept = useMemo(() => {
    if (cleanDeptId) {
      const found = allDepartments.find((d) => String(d.id) === cleanDeptId);
      if (found) return found;
    }
    if (currentSection?.departmentId) {
      return allDepartments.find((d) => d.id === currentSection.departmentId) || null;
    }
    if (currentTeam?.departmentId) {
      return allDepartments.find((d) => d.id === currentTeam.departmentId) || null;
    }
    return null;
  }, [allDepartments, cleanDeptId, currentSection, currentTeam]);

  const unitName = useMemo(() => {
    if (cleanTeamId) {
      const ids = cleanTeamId.split(",");
      if (ids.length > 1) {
        return `${ids.length} חוליות`;
      }
      return currentTeam ? formatUnitName("team", currentTeam.name) : `חוליה ${cleanTeamId}`;
    }
    if (cleanSectionId) {
      const ids = cleanSectionId.split(",");
      if (ids.length > 1) {
        return `${ids.length} מדורים`;
      }
      return currentSection ? formatUnitName("section", currentSection.name) : `מדור ${cleanSectionId}`;
    }
    if (cleanDeptId) {
      const ids = cleanDeptId.split(",");
      if (ids.length > 1) {
        return `${ids.length} מחלקות`;
      }
      return currentDept ? formatUnitName("department", currentDept.name) : `מחלקה ${cleanDeptId}`;
    }

    if (user?.commands_team_id) {
      const userTeam = allTeams.find((t) => String(t.id) === String(user.commands_team_id));
      return userTeam ? formatUnitName("team", userTeam.name) : "כלל החוליה";
    }
    if (user?.commands_section_id) {
      const userSection = allSections.find((s) => String(s.id) === String(user.commands_section_id));
      return userSection ? formatUnitName("section", userSection.name) : "כלל המדור";
    }
    if (user?.commands_department_id) {
      const userDept = allDepartments.find((d) => String(d.id) === String(user.commands_department_id));
      return userDept ? formatUnitName("department", userDept.name) : "כלל המחלקה";
    }
    return "כלל היחידה";
  }, [
    cleanTeamId,
    cleanSectionId,
    cleanDeptId,
    currentTeam,
    currentSection,
    currentDept,
    allTeams,
    allSections,
    allDepartments,
    user,
  ]);

  const activeFilterInfo = useMemo(() => {
    const filters = [
      !!selectedStatusData,
      selectedServiceTypes.length > 0,
      !!selectedAgeRange.min || !!selectedAgeRange.max,
    ];

    // For admins, any org filter is "active"
    if (user?.is_admin) {
      filters.push(!!cleanDeptId, !!cleanSectionId, !!cleanTeamId);
    } else {
      // For commanders, only count org filters if they go BEYOND their default view
      if (user?.commands_department_id) {
        filters.push(!!cleanSectionId, !!cleanTeamId);
      } else if (user?.commands_section_id) {
        filters.push(!!cleanTeamId);
      } else if (user?.commands_team_id) {
        // Team commanders are already at the lowest level
      } else {
        // Regular users/others
        filters.push(!!cleanDeptId, !!cleanSectionId, !!cleanTeamId);
      }
    }

    return {
      hasActive: filters.some(Boolean),
      count: filters.filter(Boolean).length
    };
  }, [
    cleanDeptId,
    cleanSectionId,
    cleanTeamId,
    selectedStatusData,
    selectedServiceTypes,
    selectedAgeRange,
    user
  ]);

  const activeFilterTags = useMemo(() => {
    const tags: string[] = [];
    if (selectedStatusData) {
      tags.push(selectedStatusData.name);
    }
    if (selectedServiceTypes.length > 0) {
      tags.push(...selectedServiceTypes);
    }
    if (selectedAgeRange.min || selectedAgeRange.max) {
      const ageText = selectedAgeRange.max
        ? `גילאי ${selectedAgeRange.min}-${selectedAgeRange.max}`
        : `גילאי ${selectedAgeRange.min}+`;
      tags.push(ageText);
    }
    
    // Add org filter tag if selected
    if (cleanTeamId) {
      const ids = cleanTeamId.split(",");
      if (ids.length > 1) {
        tags.push(`${ids.length} חוליות`);
      } else if (currentTeam) {
        tags.push(formatUnitName("team", currentTeam.name));
      }
    } else if (cleanSectionId) {
      const ids = cleanSectionId.split(",");
      if (ids.length > 1) {
        tags.push(`${ids.length} מדורים`);
      } else if (currentSection) {
        tags.push(formatUnitName("section", currentSection.name));
      }
    } else if (cleanDeptId) {
      const ids = cleanDeptId.split(",");
      if (ids.length > 1) {
        tags.push(`${ids.length} מחלקות`);
      } else if (currentDept) {
        tags.push(formatUnitName("department", currentDept.name));
      }
    }

    return tags;
  }, [
    selectedStatusData,
    selectedServiceTypes,
    selectedAgeRange,
    cleanDeptId,
    cleanSectionId,
    cleanTeamId,
    currentDept,
    currentSection,
    currentTeam,
  ]);

  const handleStatusClick = (
    statusId: number,
    statusName: string,
    statusColor: string,
  ) => {
    // Toggle behavior: if clicking the same status, deselect it.
    if (selectedStatusId === statusId) {
      setSelectedStatusId(null);
      setSelectedStatusData(null);
    } else {
      setSelectedStatusId(statusId);
      setSelectedStatusData({
        id: statusId,
        name: statusName,
        color: statusColor,
      });
    }
  };

  const memoizedFilters = useMemo(() => ({
    department_id: selectedDeptId,
    section_id: selectedSectionId,
    team_id: selectedTeamId,
    serviceTypes: selectedServiceTypes,
    unitName: unitName,
    status_id: selectedStatusId?.toString()
  }), [selectedDeptId, selectedSectionId, selectedTeamId, selectedServiceTypes, unitName, selectedStatusId]);

  const canSelectDept = !!user?.is_admin;
  const canSelectSection = !!user?.is_admin || !!user?.commands_department_id;
  const canSelectTeam =
    !!user?.is_admin ||
    !!user?.commands_department_id ||
    !!user?.commands_section_id;


  return (
    <div
      className="w-full relative min-h-screen pb-10"
      dir="rtl"
    >
      <div className="relative z-10 space-y-3 sm:space-y-4 pt-2 sm:pt-6 pb-2 sm:pb-4 px-2 sm:px-6 max-w-full mx-auto transition-all">

        <div className="hidden sm:block">
          <PageHeader
            icon={LayoutDashboard}
            title="לוח בקרה"
            className="mb-0"
            badge={
              // Desktop only — mobile uses the grid below
              <div className="hidden lg:flex items-center gap-2">
                <div id="dashboard-filter-btn">
                <DashboardFilters
                  structure={structure}
                  statuses={allStatusTypes.map((s: any) => ({ status_id: s.id, status_name: s.name, color: s.color }))}
                  allStatusTypes={allStatusTypes}
                  selectedDeptId={selectedDeptId}
                  selectedSectionId={selectedSectionId}
                  selectedTeamId={selectedTeamId}
                  selectedStatusId={selectedStatusId?.toString()}
                  serviceTypes={serviceTypes}
                  selectedServiceTypes={selectedServiceTypes}
                  selectedAgeRange={selectedAgeRange}
                  onFilterChange={handleFilterChange}
                  canSelectDept={canSelectDept}
                  canSelectSection={canSelectSection}
                  canSelectTeam={canSelectTeam}
                  hasActiveFiltersExternal={activeFilterInfo.hasActive}
                  activeFilterCountExternal={activeFilterInfo.count}
                  user={user}
                />
                </div>

                <ReportHub
                  id="report-hub-card"
                  onShareBirthdays={() => setWhatsAppDialogOpen(true)}
                  filters={memoizedFilters}
                  initialDate={selectedDate}
                />

                <Button
                  id="event-button"
                  variant="outline"
                  onClick={() => setGlobalEventOpen(true)}
                  className={cn(
                    "h-9 rounded-xl gap-1.5 font-bold transition-all px-3 text-foreground bg-card/70 dark:bg-card/50 hover:bg-accent/60 border-border/60 text-xs shadow-xs",
                    activeTutorial === "event" && "tutorial-highlight"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>אירוע</span>
                </Button>

                <Button
                  id="broadcast-button"
                  variant="outline"
                  onClick={() => setWhatsappBroadcastOpen(true)}
                  className={cn(
                    "h-9 rounded-xl gap-1.5 font-bold transition-all px-3 text-foreground bg-card/70 dark:bg-card/50 hover:bg-accent/60 border-border/60 text-xs shadow-xs",
                    activeTutorial === "broadcast" && "tutorial-highlight"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span>רשימת תפוצה</span>
                </Button>
              </div>
            }
          />
        </div>

        {/* Mobile Quick Actions Bar — Modern Elevated App Bar */}
        <div className="grid grid-cols-4 gap-2 sm:hidden mb-2">
          <Button
            id="mobile-filter-trigger"
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="flex flex-col items-center justify-center gap-1 h-14 rounded-2xl bg-card/80 dark:bg-card/60 backdrop-blur-md border-border/60 text-foreground hover:bg-accent/50 active:scale-95 transition-all p-1 shadow-xs"
          >
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[11px] font-bold leading-none">סינון</span>
          </Button>

          <ReportHub
            id="report-hub-card-mobile"
            onShareBirthdays={() => setWhatsAppDialogOpen(true)}
            filters={memoizedFilters}
            initialDate={selectedDate}
            className="flex flex-col items-center justify-center gap-1 h-14 rounded-2xl bg-card/80 dark:bg-card/60 backdrop-blur-md border border-border/60 text-foreground hover:bg-accent/50 active:scale-95 transition-all p-1 shadow-xs"
          />

          <Button
            id="mobile-event-button"
            variant="outline"
            onClick={() => setGlobalEventOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-14 rounded-2xl bg-card/80 dark:bg-card/60 backdrop-blur-md border-border/60 text-foreground hover:bg-accent/50 active:scale-95 transition-all p-1 shadow-xs",
              activeTutorial === "event" && "tutorial-highlight"
            )}
          >
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[11px] font-bold leading-none">אירוע</span>
          </Button>

          <Button
            id="mobile-broadcast-button"
            variant="outline"
            onClick={() => setWhatsappBroadcastOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-14 rounded-2xl bg-card/80 dark:bg-card/60 backdrop-blur-md border-border/60 text-foreground hover:bg-accent/50 active:scale-95 transition-all p-1 shadow-xs",
              activeTutorial === "broadcast" && "tutorial-highlight"
            )}
          >
            <MessageSquare className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[11px] font-bold leading-none">תפוצה</span>
          </Button>
        </div>


        <div className="space-y-3 sm:space-y-5 transition-all mt-1 relative">

          {/* Stat Cards - New Redesigned Component */}
          <StatCards 
            stats={stats} 
            totalEmployees={totalEmployees} 
            selectedStatusId={selectedStatusId}
            onCardSelect={(statusId) => {
              if (statusId === null) {
                setSelectedStatusId(null);
                setSelectedStatusData(null);
              } else {
                handleFilterChange("status", statusId.toString());
              }
            }}
          />

          {/* Birthday Banner — appears above charts only when there are real birthdays this week */}
          <BirthdayBanner
            birthdays={birthdays}
            selectedDate={selectedDate}
            className="sm:hidden"
          />

          {/* Unified Dashboard Grid for perfect responsive layout and card alignment */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 items-stretch">
            {/* Left/Main Area Chart - Trend (מגמת זמינות) */}
            <div className="col-span-2 md:col-span-2 xl:col-span-2 order-3 md:order-1 xl:order-1">
              <AttendanceTrendCard 
                data={trendStats}
                loading={trendLoading}
                range={trendRange}
                unitName={unitName}
                filterTags={activeFilterTags}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onRangeChange={setTrendRange}
                totalEmployees={totalEmployees}
              />
            </div>

            {/* Right/Third Chart - Age Distribution (חתך גילאים) */}
            <div className="col-span-2 sm:col-span-1 md:col-span-1 xl:col-span-1 order-2 md:order-3 xl:order-2">
              <AgeDistributionChart
                data={ageDistribution}
                averageAge={averageAge}
                totalEmployees={selectedStatusId !== null ? ageDistribution.reduce((acc, curr) => acc + curr.count, 0) : totalEmployees}
                filterTags={activeFilterTags}
                onRangeSelect={(range) => handleFilterChange("ageRange", range)}
                selectedRanges={selectedAgeRanges}
                selectedRange={
                  selectedAgeRanges.length === 1
                    ? selectedAgeRanges[0]
                    : selectedAgeRanges.length > 1
                    ? selectedAgeRanges.join(", ")
                    : selectedAgeRange?.min
                    ? selectedAgeRange.max
                      ? `${selectedAgeRange.min}-${selectedAgeRange.max}`
                      : `${selectedAgeRange.min}+`
                    : "all"
                }
              />
            </div>

            {/* BirthdaysCard (Shown on desktop/tablet only) */}
            <div className="hidden sm:block sm:col-span-1 sm:order-4 xl:col-span-1 xl:order-3">
              <BirthdaysCard 
                id="birthdays-card"
                birthdays={birthdays}
                loading={false}
                unitName={unitName}
                className={cn(
                  activeTutorial === "birthdays" && "tutorial-highlight"
                )}
              />
            </div>

            {/* Middle/Secondary Donut Chart - Status Distribution (חלוקת סטטוסים) */}
            <div className="col-span-2 sm:col-span-1 md:col-span-1 xl:col-span-2 order-1 md:order-2 xl:order-4">
              <EmployeesChart
                ref={snapshotRef}
                stats={chartStats}
                total={totalEmployees}
                totalEmployeesInScope={totalEmployees}
                onStatusClick={handleStatusClick}
                hasArchiveAccess={true}
                onRequestRestore={() => setRestoreDialogOpen(true)}
                unitName={unitName}
                selectedDate={selectedDate}
                selectedStatusId={selectedStatusId}
                filterTags={activeFilterTags}
                title="חלוקת סטטוסים"
              />
            </div>

            {/* Team Comparison (השוואת כוח אדם) (Shown on both mobile and desktop) */}
            <div className="col-span-2 sm:col-span-1 sm:order-5 xl:col-span-2 xl:order-5">
              <StatsComparisonCard
                ref={comparisonRef}
                data={comparisonStats}
                loading={comparisonLoading}
                days={comparisonRange}
                unitName={unitName}
                filterTags={activeFilterTags}
                canGoBack={canGoBack}
                onGoBack={handleGoBack}
                selectedUnitId={
                  cleanTeamId ? parseInt(cleanTeamId.split(",")[0]) :
                  cleanSectionId ? parseInt(cleanSectionId.split(",")[0]) :
                  cleanDeptId ? parseInt(cleanDeptId.split(",")[0]) : null
                }
                selectedUnitIds={
                  cleanTeamId ? cleanTeamId.split(",").map(Number).filter(Boolean) :
                  cleanSectionId ? cleanSectionId.split(",").map(Number).filter(Boolean) :
                  cleanDeptId ? cleanDeptId.split(",").map(Number).filter(Boolean) : undefined
                }
                onUnitClick={(unitId, level) => {
                  const currentStr = level === 'department' ? cleanDeptId : level === 'section' ? cleanSectionId : cleanTeamId;
                  const currentIds = currentStr ? currentStr.split(",").filter(Boolean) : [];
                  const idStr = unitId.toString();
                  const nextIds = currentIds.includes(idStr)
                    ? currentIds.filter((id) => id !== idStr)
                    : [...currentIds, idStr];
                  handleFilterChange(level as any, nextIds);
                }}
              />
            </div>
          </div>

          {/* Status Details Table (Full Width) */}
          {!user?.is_temp_commander && (
            <div id="status-details-table" className="w-full">
              <DashboardStatusTable
                statusId={selectedStatusData?.id || null}
                statusName={selectedStatusData?.name || ""}
                statusColor={selectedStatusData?.color || ""}
                departmentId={cleanDeptId}
                sectionId={cleanSectionId}
                teamId={cleanTeamId}
                date={format(selectedDate, "yyyy-MM-dd")}
                serviceTypes={selectedServiceTypes}
              />
            </div>
          )}
        </div>

        <WhatsAppReportDialog
          open={whatsAppDialogOpen}
          onOpenChange={setWhatsAppDialogOpen}
          currentStats={stats}
          unitName={unitName}
          isFiltered={activeFilterInfo.hasActive}
        />

        <RestorationRequestDialog
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          targetDate={selectedDate}
        />

        <WhatsAppBroadcastModal
          open={whatsappBroadcastOpen}
          onOpenChange={setWhatsappBroadcastOpen}
        />

        {/* Mobile Filter Dialog */}
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="p-0 border-none sm:max-w-lg">
            <DashboardFilters
              structure={structure}
              statuses={allStatusTypes.map((s: any) => ({ status_id: s.id, status_name: s.name, color: s.color }))}
              allStatusTypes={allStatusTypes}
              selectedDeptId={selectedDeptId}
              selectedSectionId={selectedSectionId}
              selectedTeamId={selectedTeamId}
              selectedStatusId={selectedStatusId?.toString()}
              serviceTypes={serviceTypes}
              selectedServiceTypes={selectedServiceTypes}
              selectedAgeRange={selectedAgeRange}
              onFilterChange={handleFilterChange}
              canSelectDept={canSelectDept}
              canSelectSection={canSelectSection}
              canSelectTeam={canSelectTeam}
              hasActiveFiltersExternal={activeFilterInfo.hasActive}
              activeFilterCountExternal={activeFilterInfo.count}
              user={user}
              isMobile={true}
            />
          </DialogContent>
        </Dialog>
        <GlobalEventModal
          isOpen={globalEventOpen}
          onClose={() => setGlobalEventOpen(false)}
          statusTypes={allStatusTypes}
          structure={structure}
        />
      </div>
    </div>
  );
}

