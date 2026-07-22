import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PageToolbar,
  SearchInput,
  ToolbarActions,
  FilterTriggerButton,
} from "@/components/shared/page-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Filter,
  User,
  Plus,
  Pencil,
  LogIn,
  Phone,
  Upload,
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn, cleanUnitName, calculateAge } from "@/lib/utils";
import { FilterModal } from "./modals";
import type { EmployeeFilters } from "./modals/FilterModal";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import apiClient from "@/config/api.client";
import { toast } from "sonner";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  onFilteredEmployeesChange?: (employees: Employee[]) => void;
  fetchEmployees?: (
    search?: string,
    dept_id?: number,
    include_inactive?: boolean,
  ) => Promise<void>;
  initialFilters?: EmployeeFilters;
}

export const EmployeeTable = ({
  employees,
  loading,
  fetchEmployees,
  initialFilters,
}: EmployeeTableProps) => {
  const navigate = useNavigate();
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

  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<EmployeeFilters>(
    initialFilters || {},
  );

  useEffect(() => {
    if (initialFilters) {
      setActiveFilters(initialFilters);
      setCurrentPage(1);
    }
  }, [initialFilters]);
  const itemsPerPage = 10;

  // Role Logic implementation base on user request
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

  const filteredEmployees = employees.filter((emp) => {
    // Hide current user
    if (user && emp.id === user.id) return false;

    // Search filter
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase()) || false;

    if (!searchMatch) return false;

    // Advanced filters
    if (activeFilters.departments && activeFilters.departments.length > 0) {
      if (
        !emp.department_name ||
        !activeFilters.departments.includes(emp.department_name)
      ) {
        return false;
      }
    }

    if (activeFilters.sections && activeFilters.sections.length > 0) {
      if (
        !emp.section_name ||
        !activeFilters.sections.includes(emp.section_name)
      ) {
        return false;
      }
    }

    if (activeFilters.teams && activeFilters.teams.length > 0) {
      if (!emp.team_name || !activeFilters.teams.includes(emp.team_name)) {
        return false;
      }
    }

    if (activeFilters.serviceTypes && activeFilters.serviceTypes.length > 0) {
      if (
        !emp.service_type_name ||
        !activeFilters.serviceTypes.includes(emp.service_type_name)
      ) {
        return false;
      }
    }

    if (activeFilters.statuses && activeFilters.statuses.length > 0) {
      if (
        !emp.status_name ||
        !activeFilters.statuses.includes(emp.status_name)
      ) {
        return false;
      }
    }

    if (activeFilters.isCommander) {
      if (!emp.is_commander) return false;
    }

    if (activeFilters.isAdmin) {
      if (!emp.is_admin) return false;
    }

    if (activeFilters.hasSecurityClearance) {
      if (!emp.security_clearance) return false;
    }

    if (activeFilters.hasPoliceRicense) {
      if (!emp.police_license) return false;
    }

    if (activeFilters.searchText) {
      const lowerSearch = activeFilters.searchText.toLowerCase();
      const matchesSearch =
        fullName.includes(lowerSearch) ||
        emp.username.toLowerCase().includes(lowerSearch);
      if (!matchesSearch) return false;
    }

    // Age range
    if (activeFilters.ageRange) {
      const age = calculateAge(emp.birth_date);
      if (age < activeFilters.ageRange[0] || age > activeFilters.ageRange[1]) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleViewDetails = (employee: Employee) => {
    if (user?.is_temp_commander && employee.is_commander) {
      toast.error("אין לך הרשאה לצפות בפרופיל של מפקד");
      return;
    }
    navigate(`/employees/${employee.id}`);
  };

  const handleApplyFilters = (filters: EmployeeFilters) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page

    // Check if we need to fetch inactive employees
    if (fetchEmployees) {
      // If "showInactive" is true, we must fetch from backend with include_inactive=true
      // If "showInactive" is false (or undefined), we fetch standard list
      // Note: This relies on setFilters being called first or passed directly
      fetchEmployees(searchTerm, undefined, filters.showInactive);
    }
  };

  const handleImpersonate = async (targetId: number, name: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך להתחבר כ-${name}?`)) return;

    try {
      const { data } = await apiClient.post("/auth/impersonate", {
        target_id: targetId,
      });
      if (data.success && data.token) {
        // Save current admin token if not already saved
        const currentToken = localStorage.getItem("token");
        if (currentToken && !localStorage.getItem("admin_token")) {
          localStorage.setItem("admin_token", currentToken);
        }

        localStorage.setItem("token", data.token);
        localStorage.removeItem("dashboard_filters"); // Ensure fresh dashboard state for impersonated user
        toast.success(`התחברת בהצלחה כ-${name}`);
        // Force full reload to update Context and Reset App State
        window.location.href = "/";
      }
    } catch (e) {
      toast.error("שגיאה בהתחברות כמשתמש");
      console.error(e);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadingToastId = toast.loading("מייבא עובדים מקובץ, אנא המתן...");
    try {
      const { data } = await apiClient.post("/employees/import", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        toast.success(data.message || "יובאו בהצלחה", { id: loadingToastId });
        if (fetchEmployees) fetchEmployees();
      } else {
        toast.error(data.error || "שגיאה בייבוא", { id: loadingToastId });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || "שגיאה בייבוא קובץ. אנא ודא שהפורמט תקין.", { id: loadingToastId });
      console.error(e);
    }
    // reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Shared Page Toolbar */}
      <PageToolbar id="employees-search-container">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="חיפוש שם או שם משתמש..."
          className="max-w-md flex-1"
        />

        <ToolbarActions>
          <FilterTriggerButton
            hasActiveFilters={Object.keys(activeFilters).length > 0}
            activeCount={Object.keys(activeFilters).filter(k => {
              const val = activeFilters[k as keyof EmployeeFilters];
              if (Array.isArray(val)) return val.length > 0;
              if (typeof val === 'boolean') return val;
              if (k === 'ageRange') return val && ((val as any)[0] !== 18 || (val as any)[1] !== 67);
              return val;
            }).length}
            onReset={() => handleApplyFilters({})}
            onClick={() => setFilterModalOpen(true)}
          />
          {!user?.is_temp_commander && (
            <>
              {user?.is_admin && (
                <>
                  <Button
                    id="import-employees-button"
                    variant="outline"
                    className="h-9 text-xs bg-card border-border/50 hover:bg-muted text-foreground rounded-xl px-3 flex items-center justify-center font-bold shadow-2xs cursor-pointer"
                    onClick={() => document.getElementById('employee-upload-input')?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 ml-1 text-primary" />
                    ייבוא
                  </Button>
                  <input 
                    type="file" 
                    id="employee-upload-input" 
                    className="hidden" 
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                </>
              )}
              <Button
                id="add-employee-button"
                className={cn(
                  "h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-3.5 flex items-center justify-center font-bold shadow-2xs cursor-pointer",
                  searchParams.get("tutorial") === "add-employee" && "tutorial-highlight"
                )}
                onClick={() => navigate("/employees/new")}
              >
                <Plus className="w-3.5 h-3.5 ml-1" />
                הוספה
              </Button>
            </>
          )}
        </ToolbarActions>
      </PageToolbar>

      {/* Main Table - Desktop View */}
      <Card className="hidden lg:block overflow-hidden border-slate-200/60 dark:border-slate-800 shadow-xs rounded-xl">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs">
              <TableRow className="hover:bg-transparent border-b border-slate-200/60 dark:border-slate-800">
                <TableHead className="text-right font-bold text-slate-500 uppercase text-[11px] h-9 px-4 tracking-wider">
                  שוטר
                </TableHead>

                <TableHead className="text-right font-bold text-slate-500 uppercase text-[11px] h-9 px-4 tracking-wider">
                  טלפון
                </TableHead>
                <TableHead className="text-right font-bold text-slate-500 uppercase text-[11px] h-9 px-4 tracking-wider">
                  תאריך לידה
                </TableHead>
                <TableHead className="text-right font-bold text-slate-500 uppercase text-[11px] h-9 px-4 tracking-wider">
                  תפקיד/סמכות
                </TableHead>
                <TableHead className="text-right font-bold text-slate-500 uppercase text-[11px] h-9 px-4 tracking-wider">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right font-bold text-slate-500 uppercase text-[11px] h-9 px-4 tracking-wider">
                  מעמד
                </TableHead>
                <TableHead className="text-center font-bold text-slate-500 uppercase text-[11px] h-9 px-4 tracking-wider">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground text-xs"
                  >
                    טוען נתונים...
                  </TableCell>
                </TableRow>
              ) : paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">
                    <EmptyState
                      compact={true}
                      title="לא נמצאו שוטרים"
                      description="לא נמצאו שוטרים התואמים את החיפוש והסינון שהוגדרו."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className={cn(
                      "group/row transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 border-b border-border/40",
                      !emp.is_active &&
                        "bg-destructive/[0.02] opacity-80 grayscale-[0.2] border-r-4 border-r-destructive",
                      emp.is_active &&
                        "border-r-4 border-r-primary/30 hover:border-r-primary transition-all",
                    )}
                  >
                    <TableCell className="px-4 py-2.5 text-right">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs group-hover/row:scale-105 transition-all shrink-0",
                              emp.is_active
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-border/50"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {emp.is_admin ? "💬" : `${emp.first_name[0]}${emp.last_name[0]}`}
                          </div>
                        </div>
                        <div className="flex flex-col text-right min-w-0">
                          <EmployeeLink
                            employee={emp}
                            className={cn(
                              "text-xs font-bold truncate tracking-tight group-hover/row:text-primary transition-colors",
                              emp.is_active
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                          {!emp.is_active && (
                            <Badge
                              variant="destructive"
                              className="w-fit h-4 text-[8px] px-1.5 font-bold uppercase leading-none bg-destructive/10 text-destructive border-destructive/20 mt-0.5"
                            >
                              לא פעיל
                            </Badge>
                          )}
                          {emp.is_active && (emp.is_commander || emp.is_admin) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] font-mono text-muted-foreground/60">
                                #{emp.username}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-2.5 text-right">
                      {emp.phone_number ? (
                        <a
                          href={`tel:${emp.phone_number}`}
                          className="font-mono text-xs text-primary hover:text-primary transition-colors hover:brightness-75 inline-flex items-center gap-1.5"
                        >
                          <Phone className="w-3 h-3" />
                          {emp.phone_number}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/30 font-mono inline-flex">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {emp.birth_date
                        ? new Date(emp.birth_date).toLocaleDateString("he-IL")
                        : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right">
                      <Badge
                        variant="outline"
                        className="font-bold text-[10px] border-none px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {getProfessionalTitle(emp)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right">
                      {emp.department_name && emp.department_name !== "מטה" ? (
                        <div className="flex flex-col text-right">
                          <span
                            className="text-[11px] font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              const isSelected =
                                activeFilters.departments?.includes(
                                  emp.department_name || "",
                                ) && activeFilters.departments.length === 1;
                              setActiveFilters({
                                ...activeFilters,
                                departments: isSelected
                                  ? []
                                  : [emp.department_name || ""],
                              });
                              setCurrentPage(1);
                            }}
                          >
                            {cleanUnitName(emp.department_name)}
                          </span>
                          {((emp.section_name && emp.section_name !== "מטה") ||
                            (emp.team_name && emp.team_name !== "מטה")) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="text-[10px] font-bold text-primary/70 truncate bg-primary/5 px-1.5 py-0.2 rounded-md border border-primary/10 cursor-pointer hover:bg-primary/10 transition-all"
                                onClick={() => {
                                  if (
                                    emp.team_name &&
                                    emp.team_name !== "מטה"
                                  ) {
                                    const isSelected =
                                      activeFilters.teams?.includes(
                                        emp.team_name,
                                      ) && activeFilters.teams.length === 1;
                                    setActiveFilters({
                                      ...activeFilters,
                                      teams: isSelected ? [] : [emp.team_name],
                                    });
                                  } else if (
                                    emp.section_name &&
                                    emp.section_name !== "מטה"
                                  ) {
                                    const isSelected =
                                      activeFilters.sections?.includes(
                                        emp.section_name,
                                      ) && activeFilters.sections.length === 1;
                                    setActiveFilters({
                                      ...activeFilters,
                                      sections: isSelected
                                        ? []
                                        : [emp.section_name],
                                    });
                                  }
                                  setCurrentPage(1);
                                }}
                              >
                                {emp.team_name && emp.team_name !== "מטה"
                                  ? cleanUnitName(emp.team_name)
                                  : cleanUnitName(emp.section_name || "")}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground/40">
                          מטה / ללא שיוך
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right">
                      <span className="text-xs font-medium text-muted-foreground">
                        {emp.service_type_name || "-"}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        {((user?.is_admin &&
                          (emp.is_commander || emp.is_admin)) ||
                          (user?.is_commander &&
                            !user?.is_admin &&
                            !user?.is_temp_commander &&
                            user?.active_delegate_id === emp.id)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                            onClick={() =>
                              handleImpersonate(
                                emp.id,
                                `${emp.first_name} ${emp.last_name}`,
                              )
                            }
                            title="התחבר כמשתמש זה"
                          >
                            <LogIn className="w-3.5 h-3.5 ml-1" />
                            התחבר
                          </Button>
                        )}
                        {!user?.is_temp_commander && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                            onClick={() => handleViewDetails(emp)}
                          >
                            <User className="w-3.5 h-3.5 ml-1" />
                            פרופיל
                          </Button>
                        )}
                        {!user?.is_temp_commander && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                            onClick={() =>
                              navigate(`/employees/edit/${emp.id}`)
                            }
                          >
                            <Pencil className="w-3.5 h-3.5 ml-1" />
                            עריכה
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs font-medium text-muted-foreground uppercase">
            מציג{" "}
            {filteredEmployees.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}
            -{Math.min(filteredEmployees.length, currentPage * itemsPerPage)}{" "}
            מתוך {filteredEmployees.length} שוטרים
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                    currentPage === i + 1
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Mobile Row View (Kodkod Style) */}
      <div className="lg:hidden space-y-1.5 px-2">
        {loading ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border/40">
            <p className="text-sm font-black text-muted-foreground animate-pulse">
              טוען מצבת כוח אדם...
            </p>
          </div>
        ) : paginatedEmployees.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center border border-border/40">
            <p className="text-sm font-black text-muted-foreground">
              לא נמצאו שוטרים
            </p>
          </div>
        ) : (
          paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-[1.25rem] border border-border/50 active:scale-[0.99] transition-all overflow-hidden shadow-sm",
                !emp.is_active && "bg-destructive/[0.02] grayscale-[0.3]",
              )}
              onClick={() => handleViewDetails(emp)}
            >
              <div className="p-2.5 flex items-center gap-3 sm:gap-4">
                {/* Right Side: Avatar */}
                <div className="shrink-0 relative">
                  <div
                    className={cn(
                      "w-10.5 h-10.5 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-primary-foreground font-black text-xs sm:text-sm",
                      emp.is_active
                        ? "bg-primary shadow-[0_4px_10px_rgba(59,130,246,0.25)]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {emp.is_admin ? "💬" : `${emp.first_name[0]}${emp.last_name[0]}`}
                  </div>
                </div>

                {/* Center: Info */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-baseline gap-1.5 mb-0.5 min-w-0">
                    <h4 className="font-black text-[13.5px] sm:text-sm text-foreground truncate max-w-[150px] leading-tight">
                      {emp.dominant_name
                        ? `${emp.dominant_name} ${emp.last_name}`
                        : emp.first_name.split(" ").length > 2
                          ? `${emp.first_name.split(" ")[0]} ${emp.last_name}`
                          : `${emp.first_name} ${emp.last_name}`}
                    </h4>
                    {(emp.is_commander || emp.is_admin) && (
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-muted-foreground/50 shrink-0">
                        {emp.username}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground leading-none">
                      {emp.status_name || "לא הוזן"}
                    </span>
                  </div>
                </div>

                {/* Left Side: Actions */}
                <div
                  className="flex items-center gap-2 sm:gap-4 no-export shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {emp.phone_number && (
                    <a
                      href={`tel:${emp.phone_number}`}
                      className="p-1.5 sm:p-2 bg-muted/40 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleViewDetails(emp)}
                    className="p-1.5 sm:p-2 bg-muted/40 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <div className="w-px h-4.5 sm:h-5 bg-border/40 mx-0.5 sm:mx-1" />
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/40" />
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        <div className="bg-background/50 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-border/40 p-3 sm:p-4 mt-2 shadow-none sm:shadow-sm">
          <div className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase text-center mb-2">
            מציג{" "}
            {filteredEmployees.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}
            -{Math.min(filteredEmployees.length, currentPage * itemsPerPage)}{" "}
            מתוך {filteredEmployees.length} שוטרים
          </div>
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px]">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg text-xs font-semibold transition-all shrink-0",
                    currentPage === i + 1
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-lg"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        onApply={handleApplyFilters}
        employees={employees}
      />
    </div>
  );
};
