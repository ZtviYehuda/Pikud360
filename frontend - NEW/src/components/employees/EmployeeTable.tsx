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
  MessageCircle,
  Upload,
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn, cleanUnitName, calculateAge, getWhatsAppUrl } from "@/lib/utils";
import { FilterModal, ImportEmployeesModal } from "./modals";
import type { EmployeeFilters } from "./modals/FilterModal";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
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
  const isSupportAdmin = Boolean(
    user?.is_admin &&
    !user?.is_impersonated &&
    !localStorage.getItem("admin_token") &&
    (
      user?.username === "admin" ||
      user?.email === "admin@matzevet.gov.il" ||
      user?.role_name === "מנהל מערכת ראשי" ||
      (user?.first_name === "צוות" && user?.last_name === "תמיכה") ||
      user?.team_name === "צוות תמיכה" ||
      (!user?.commands_department_id && !user?.commands_section_id)
    )
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<EmployeeFilters>(
    initialFilters || {},
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedFilters = localStorage.getItem("employee_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.activeFilters) setActiveFilters(filters.activeFilters);
        if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
      } catch (e) {
        console.error("Failed to parse saved employee filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (user?.is_impersonated) return;

    const filters = {
      activeFilters,
      searchTerm,
    };
    localStorage.setItem("employee_filters", JSON.stringify(filters));
  }, [isInitialized, activeFilters, searchTerm, user?.is_impersonated]);

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

  const safeEmployeesList = Array.isArray(employees) ? employees : [];
  const filteredEmployees = safeEmployeesList.filter((emp) => {
    // Hide commander / logged-in user from their own subordinate workforce list (Admin still sees everyone)
    if (user && !user.is_admin) {
      if (
        emp.id === user.id ||
        (emp as any).user_id === user.id ||
        (user.username && emp.username && emp.username.toLowerCase() === user.username.toLowerCase()) ||
        (`${emp.first_name || ""} ${emp.last_name || ""}`.trim().toLowerCase() === `${user.first_name || ""} ${user.last_name || ""}`.trim().toLowerCase())
      ) {
        return false;
      }
    }

    // Commanders do not see themselves in their own team/subordinate workforce list
    if (user && !user.is_admin) {
      const eAny = emp as any;
      const uAny = user as any;
      const isSelf =
        (uAny.id && (String(eAny.id) === String(uAny.id) || String(eAny.user_id) === String(uAny.id))) ||
        (uAny.employee_id && (String(eAny.id) === String(uAny.employee_id) || String(eAny.user_id) === String(uAny.employee_id))) ||
        (uAny.username && (eAny.username === uAny.username || eAny.personal_number === uAny.username)) ||
        (uAny.first_name && uAny.last_name && eAny.first_name?.trim() === uAny.first_name?.trim() && eAny.last_name?.trim() === uAny.last_name?.trim());

      if (isSelf) return false;
    }

    // Inactive officers are strictly visible only to Admins in the repository
    if (!user?.is_admin && !emp.is_active) {
      return false;
    }

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
    if (!isSupportAdmin) return;
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
      <div id="employees-search-container" className="flex items-center justify-between gap-1.5 sm:gap-3 p-0 bg-transparent w-full">
        {/* Right side: Search & Filter */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 max-w-[200px] sm:max-w-md md:max-w-xl">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="חיפוש..."
              className="pr-8 sm:pr-10 h-10 text-right border-input focus:ring-ring/20 focus:border-ring rounded-xl text-xs sm:text-sm w-full truncate"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Button
            variant="outline"
            className={cn(
              "h-9 px-3.5 rounded-xl border-border/60 bg-card/70 dark:bg-card/50 hover:bg-accent/60 text-foreground font-bold text-xs gap-1.5 shrink-0 shadow-xs transition-all relative",
              Object.keys(activeFilters).length > 0
                ? "text-primary border-primary/40 bg-primary/5"
                : "",
            )}
            onClick={() => setFilterModalOpen(true)}
            title="סינון מתקדם"
          >
            <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="hidden sm:inline">סינון</span>
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!user?.is_temp_commander && (
            <>
              {user?.is_admin && (
                <Button
                  id="import-employees-button"
                  variant="outline"
                  className="h-9 rounded-xl gap-1.5 font-bold transition-all px-3 text-foreground bg-card/70 dark:bg-card/50 hover:bg-accent/60 border-border/60 text-xs shadow-xs shrink-0 whitespace-nowrap"
                  onClick={() => setImportModalOpen(true)}
                  title="ייבוא עובדים מקובץ"
                >
                  <Upload className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>ייבוא מקובץ</span>
                </Button>
              )}
              <Button
                id="add-employee-button"
                className={cn(
                  "h-9 rounded-xl gap-1.5 font-bold transition-all px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs shrink-0 whitespace-nowrap",
                  searchParams.get("tutorial") === "add-employee" && "tutorial-highlight"
                )}
                onClick={() => navigate("/employees/new")}
                title="הוספת עובד חדש"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>הוספה</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Table - Desktop View */}
      <div
        id="employees-table"
        className="hidden lg:block rounded-xl border border-border/50 bg-card/40 dark:bg-card/20 backdrop-blur-xs overflow-hidden shadow-2xs"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/30 border-b border-border/40">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-right px-4 font-semibold text-muted-foreground text-xs h-11">
                  שוטר
                </TableHead>
                <TableHead className="text-right px-4 font-semibold text-muted-foreground text-xs h-11">
                  טלפון
                </TableHead>
                <TableHead className="text-right px-4 font-semibold text-muted-foreground text-xs h-11">
                  תאריך לידה
                </TableHead>
                <TableHead className="text-right px-4 font-semibold text-muted-foreground text-xs h-11">
                  תפקיד / סמכות
                </TableHead>
                <TableHead className="text-right px-4 font-semibold text-muted-foreground text-xs h-11">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right px-4 font-semibold text-muted-foreground text-xs h-11">
                  מעמד
                </TableHead>
                <TableHead className="text-center px-4 font-semibold text-muted-foreground text-xs h-11">
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
                    className="h-32 text-center text-muted-foreground font-medium"
                  >
                    לא נמצאו שוטרים התואמים את החיפוש והסינון
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className={cn(
                      "group/row transition-all border-b border-border/30 last:border-none",
                      "hover:bg-muted/30 border-r-2 border-r-transparent hover:border-r-primary/40",
                      !emp.is_active && "opacity-75 grayscale-[0.2]",
                    )}
                  >
                    <TableCell className="py-2.5 px-4 text-right align-middle">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border transition-all",
                              emp.is_active
                                ? "bg-muted/70 text-foreground/80 border-border/50 group-hover/row:border-primary/40"
                                : "bg-muted text-muted-foreground border-border/40",
                            )}
                          >
                            <span>
                              {emp.first_name?.[0]}
                              {emp.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col text-right min-w-0">
                          <EmployeeLink
                            employee={emp}
                            className={cn(
                              "text-xs sm:text-sm font-semibold truncate tracking-tight transition-colors hover:underline text-right hover:text-primary w-fit cursor-pointer",
                              emp.is_active
                                ? "text-foreground group-hover/row:text-primary"
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
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-right align-middle">
                      {emp.phone_number ? (
                        <a
                          href={`tel:${emp.phone_number}`}
                          className="font-mono text-xs text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-1.5"
                          dir="ltr"
                        >
                          <span>{emp.phone_number}</span>
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/40 font-mono">
                          -
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-right align-middle text-xs text-muted-foreground">
                      {emp.birth_date
                        ? new Date(emp.birth_date).toLocaleDateString("he-IL")
                        : "-"}
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-right align-middle">
                      <span className="text-xs font-medium text-foreground">
                        {getProfessionalTitle(emp)}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-right align-middle">
                      {emp.department_name && emp.department_name !== "מטה" ? (
                        <div className="flex flex-col text-right min-w-[130px]">
                          <span
                            className="text-xs font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
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
                            <span
                              className="text-[10px] text-muted-foreground truncate cursor-pointer hover:text-foreground transition-colors"
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
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40">
                          מטה / ללא שיוך
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-right align-middle">
                      <span className="text-xs text-muted-foreground">
                        {emp.service_type_name || "-"}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 px-4 align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        {isSupportAdmin && emp.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-xs font-medium cursor-pointer"
                            onClick={() =>
                              handleImpersonate(
                                emp.id,
                                `${emp.first_name} ${emp.last_name}`,
                              )
                            }
                            title="התחבר כמשתמש זה"
                          >
                            <LogIn className="w-3.5 h-3.5 ml-1 text-primary" />
                            <span>התחבר</span>
                          </Button>
                        )}
                        {emp.phone_number && (
                          <a
                            href={getWhatsAppUrl(emp.phone_number)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 px-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-xs font-medium transition-colors"
                            title="פתח צ'אט ב-WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 ml-1 text-emerald-600 dark:text-emerald-400" />
                            <span>וואטסאפ</span>
                          </a>
                        )}
                        {!user?.is_temp_commander && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-xs font-medium cursor-pointer"
                            onClick={() =>
                              navigate(`/employees/edit/${emp.id}`)
                            }
                            title="עריכת עובד"
                          >
                            <Pencil className="w-3.5 h-3.5 ml-1" />
                            <span>עריכה</span>
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
        <div className="px-4 py-3 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20">
          <div className="text-xs font-medium text-muted-foreground">
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
              className="w-8 h-8 rounded-lg cursor-pointer"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer",
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
              className="w-8 h-8 rounded-lg cursor-pointer"
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
                  {emp.phone_number && (
                    <a
                      href={getWhatsAppUrl(emp.phone_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                      title="פתח צ'אט ב-WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                  )}
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
        activeFilters={activeFilters}
      />

      <ImportEmployeesModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          if (fetchEmployees) fetchEmployees();
        }}
      />
    </div>
  );
};
