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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      {/* Search & Filter Bar */}
      <div id="employees-search-container" className="flex flex-col sm:flex-row items-center justify-between gap-3 p-0 bg-transparent w-full">
        {/* Right side: Search & Filter */}
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto sm:flex-1 max-w-md md:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש שם או שם משתמש..."
              className="pr-10 h-10 text-right border-input focus:ring-ring/20 focus:border-ring rounded-xl text-sm w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 text-xs sm:text-sm border-border/60 dark:border-slate-800 hover:bg-muted rounded-xl px-4 flex items-center justify-center shrink-0 relative",
              Object.keys(activeFilters).length > 0
                ? "text-primary border-primary"
                : "text-muted-foreground",
            )}
            onClick={() => setFilterModalOpen(true)}
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
            <span>סינון</span>
            {Object.keys(activeFilters).filter(k => {
              const val = activeFilters[k as keyof EmployeeFilters];
              if (Array.isArray(val)) return val.length > 0;
              if (typeof val === 'boolean') return val;
              if (k === 'ageRange') return val && ((val as any)[0] !== 18 || (val as any)[1] !== 67);
              return val;
            }).length > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                {Object.keys(activeFilters).filter(k => {
                  const val = activeFilters[k as keyof EmployeeFilters];
                  if (Array.isArray(val)) return val.length > 0;
                  if (typeof val === 'boolean') return val;
                  if (k === 'ageRange') return val && ((val as any)[0] !== 18 || (val as any)[1] !== 67);
                  return val;
                }).length}
              </span>
            )}
          </Button>
        </div>

        {/* Left side: Import & Add */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:mr-auto">
          {!user?.is_temp_commander && (
            <>
              {user?.is_admin && (
                <>
                  <Button
                    id="import-employees-button"
                    variant="outline"
                    className="h-10 text-xs sm:text-sm bg-background border-border/60 hover:bg-muted text-foreground rounded-xl flex items-center justify-center"
                    onClick={() => document.getElementById('employee-upload-input')?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 text-primary" />
                    ייבוא מקובץ
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
                  "h-10 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center",
                  searchParams.get("tutorial") === "add-employee" && "tutorial-highlight"
                )}
                onClick={() => navigate("/employees/new")}
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
                הוספה
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Table - Desktop View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/30 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  שוטר
                </TableHead>

                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  טלפון
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  תאריך לידה
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  תפקיד/סמכות
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  מעמד
                </TableHead>
                <TableHead className="text-center font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    טוען נתונים...
                  </TableCell>
                </TableRow>
              ) : paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    לא נמצאו שוטרים התואמים את החיפוש והסינון
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
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm group-hover/row:scale-110 transition-all",
                              emp.is_active
                                ? "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-400 border border-border/50"
                                : "bg-muted text-muted-foreground ",
                            )}
                          >
                            {emp.is_admin ? "💬" : `${emp.first_name[0]}${emp.last_name[0]}`}
                          </div>
                        </div>
                        <div className="flex flex-col text-right min-w-0">
                          <EmployeeLink
                            employee={emp}
                            className={cn(
                              "text-base font-black truncate tracking-tight group-hover/row:text-primary transition-colors",
                              emp.is_active
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                          {!emp.is_active && (
                            <Badge
                              variant="destructive"
                              className="w-fit h-4 text-[8px] px-1.5 font-black uppercase leading-none bg-destructive/10 text-destructive border-destructive/20 mt-1"
                            >
                              לא פעיל
                            </Badge>
                          )}
                          {emp.is_active && (emp.is_commander || emp.is_admin) && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black text-muted-foreground/50 tracking-[0.1em]">
                                #{emp.username}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-right">
                      {emp.phone_number ? (
                        <a
                          href={`tel:${emp.phone_number}`}
                          className="font-mono text-xs text-primary hover:text-primary transition-colors hover:brightness-75 inline-flex items-center gap-2"
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
                    <TableCell className="px-6 py-4 text-right text-xs text-muted-foreground">
                      {emp.birth_date
                        ? new Date(emp.birth_date).toLocaleDateString("he-IL")
                        : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Badge
                        variant="outline"
                        className="font-medium text-[10px] border-none px-2.5 py-1 bg-muted text-muted-foreground"
                      >
                        {getProfessionalTitle(emp)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      {emp.department_name && emp.department_name !== "מטה" ? (
                        <div className="flex flex-col text-right">
                          <span
                            className="text-[11px] font-black text-foreground cursor-pointer hover:text-primary transition-colors"
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
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className="text-[10px] font-black text-primary/60 truncate bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 cursor-pointer hover:bg-primary/10 transition-all"
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
                        <span className="text-[10px] font-black text-muted-foreground/30">
                          מטה / ללא שיוך
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className="text-xs font-medium text-muted-foreground">
                        {emp.service_type_name || "-"}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4">
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
