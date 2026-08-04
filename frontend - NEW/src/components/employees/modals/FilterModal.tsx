import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogDragHandle,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Filter,
  RotateCcw,
  Check,
  Search,
  ChevronDown,
  Layers,
  ShieldCheck,
  UserMinus,
  CheckCircle2,
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn, calculateAge } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: EmployeeFilters) => void;
  employees: Employee[];
}

export interface EmployeeFilters {
  departments?: string[];
  sections?: string[];
  teams?: string[];
  serviceTypes?: string[];
  statuses?: string[];
  isCommander?: boolean;
  isAdmin?: boolean;
  hasSecurityClearance?: boolean;
  hasPoliceRicense?: boolean;
  searchText?: string;
  showInactive?: boolean;
  ageRange?: [number, number];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onOpenChange,
  onApply,
  employees = [],
}) => {
  const { user } = useAuthContext();
  const [filters, setFilters] = useState<EmployeeFilters>({
    departments: [],
    sections: [],
    teams: [],
    serviceTypes: [],
    statusNames: [],
    isCommander: false,
    isAdmin: false,
    hasSecurityClearance: false,
    hasPoliceRicense: false,
    searchText: "",
    showInactive: false,
    ageRange: [18, 67],
  });

  const [activeTab, setActiveTab] = useState("org");

  // Extract unique values and build hierarchy
  const hierarchyData = useMemo(() => {
    const departments = new Map<string, Set<string>>();
    const sections = new Map<string, Set<string>>();
    const teams = new Set<string>();
    const srvTypes = new Set<string>();
    const currStatuses = new Set<string>();

    const safeList = Array.isArray(employees) ? employees : [];
    safeList.forEach((emp) => {
      if (emp.team_name) teams.add(emp.team_name);
      if (emp.service_type_name) srvTypes.add(emp.service_type_name);
      if (emp.status_name) currStatuses.add(emp.status_name);

      if (emp.department_name) {
        if (!departments.has(emp.department_name)) {
          departments.set(emp.department_name, new Set());
        }
        if (emp.section_name) {
          departments.get(emp.department_name)?.add(emp.section_name);
        }
      }

      if (emp.section_name) {
        if (!sections.has(emp.section_name)) {
          sections.set(emp.section_name, new Set());
        }
        if (emp.team_name) {
          sections.get(emp.section_name)?.add(emp.team_name);
        }
      }
    });

    return {
      departments: new Map<string, string[]>(
        Array.from(departments.entries())
          .map(
            ([dept, sects]) =>
              [dept, Array.from(sects).sort()] as [string, string[]],
          )
          .sort(),
      ),
      sections: new Map<string, string[]>(
        Array.from(sections.entries())
          .map(
            ([sect, tms]) =>
              [sect, Array.from(tms).sort()] as [string, string[]],
          )
          .sort(),
      ),
      teams: Array.from(teams).sort(),
      serviceTypes: Array.from(srvTypes).sort(),
      statuses: Array.from(currStatuses).sort(),
    };
  }, [employees]);

  const toggleFilter = (type: keyof EmployeeFilters, value: any) => {
    setFilters((prev: any) => {
      if (Array.isArray(prev[type])) {
        const current = (prev[type] as string[]) || [];
        const isSelected = current.includes(value);
        let next = isSelected
          ? current.filter((v) => v !== value)
          : [...current, value];

        // Hierarchical cleanup
        if (type === "departments") {
          return { ...prev, departments: next, sections: [], teams: [] };
        }
        if (type === "sections") {
          return { ...prev, sections: next, teams: [] };
        }

        return {
          ...prev,
          [type]: next,
        };
      }
      return { ...prev, [type]: value };
    });
  };

  // Filter labels based on user role
  const availableDepts = useMemo(() => {
    const depts = Array.from(hierarchyData.departments.keys());
    if (user?.is_admin) return depts;
    if (user?.department_name) return [user.department_name];
    return depts;
  }, [hierarchyData, user]);

  const availableSections = useMemo(() => {
    let sects: string[] = [];

    if (filters.departments && filters.departments.length > 0) {
      filters.departments.forEach((d) => {
        sects = [...sects, ...(hierarchyData.departments.get(d) || [])];
      });
    } else if (user?.is_admin) {
      if (user.department_name) {
        sects = hierarchyData.departments.get(user.department_name) || [];
      }
    } else if (user?.department_name) {
      sects = hierarchyData.departments.get(user.department_name) || [];
    } else if (user?.section_name) {
      sects = [user.section_name];
    }

    if (user?.section_name && !user?.is_admin) {
      return [user.section_name];
    }

    return Array.from(new Set(sects)).sort();
  }, [filters.departments, hierarchyData, user]);

  const availableTeams = useMemo(() => {
    let tms: string[] = [];
    if (filters.sections && filters.sections.length > 0) {
      filters.sections.forEach((s) => {
        tms = [...tms, ...(hierarchyData.sections.get(s) || [])];
      });
    } else if (user?.section_name && !user?.is_admin) {
      tms = hierarchyData.sections.get(user.section_name) || [];
    }
    return Array.from(new Set(tms)).sort();
  }, [filters.sections, hierarchyData, user]);

  const filteredCount = useMemo(() => {
    const safeList = Array.isArray(employees) ? employees : [];
    return safeList.filter((emp) => {
      // Basic search
      if (filters.searchText) {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        if (!fullName.includes(filters.searchText.toLowerCase())) return false;
      }

      // Org filters
      if (filters.departments?.length && (!emp.department_name || !filters.departments.includes(emp.department_name))) return false;
      if (filters.sections?.length && (!emp.section_name || !filters.sections.includes(emp.section_name))) return false;
      if (filters.teams?.length && (!emp.team_name || !filters.teams.includes(emp.team_name))) return false;
      
      // Status & Service
      if (filters.statuses?.length && (!emp.status_name || !filters.statuses.includes(emp.status_name))) return false;
      if (filters.serviceTypes?.length && (!emp.service_type_name || !filters.serviceTypes.includes(emp.service_type_name))) return false;

      // Attributes
      if (filters.isCommander && !emp.is_commander) return false;
      if (filters.isAdmin && !emp.is_admin) return false;
      if (filters.hasSecurityClearance && !emp.security_clearance) return false;
      if (filters.hasPoliceRicense && !emp.police_license) return false;

      // Inactive
      if (!filters.showInactive && !emp.is_active) return false;

      // Age range
      if (filters.ageRange) {
        const age = calculateAge(emp.birth_date);
        if (age < filters.ageRange[0] || age > filters.ageRange[1]) return false;
      }

      return true;
    }).length;
  }, [employees, filters]);

  const handleApply = () => {
    onApply({
      departments: filters.departments?.length
        ? filters.departments
        : undefined,
      sections: filters.sections?.length ? filters.sections : undefined,
      teams: filters.teams?.length ? filters.teams : undefined,
      serviceTypes: filters.serviceTypes?.length
        ? filters.serviceTypes
        : undefined,
      statuses: filters.statuses?.length ? filters.statuses : undefined,
      isCommander: filters.isCommander || undefined,
      isAdmin: filters.isAdmin || undefined,
      hasSecurityClearance: filters.hasSecurityClearance || undefined,
      hasPoliceRicense: filters.hasPoliceRicense || undefined,
      searchText: filters.searchText || undefined,
      showInactive: filters.showInactive || undefined,
      ageRange: filters.ageRange,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      departments: [],
      sections: [],
      teams: [],
      serviceTypes: [],
      statuses: [],
      isCommander: false,
      isAdmin: false,
      hasSecurityClearance: false,
      hasPoliceRicense: false,
      searchText: "",
      showInactive: false,
      ageRange: [18, 67],
    });
    onApply({});
    onOpenChange(false);
  };

  const toggleSelectAll = (type: keyof EmployeeFilters, allValues: string[]) => {
    setFilters((prev: any) => {
      const current = (prev[type] as string[]) || [];
      const isAllSelected = current.length === allValues.length && allValues.every((v) => current.includes(v));
      return {
        ...prev,
        [type]: isAllSelected ? [] : [...allValues],
      };
    });
  };

  const activeFiltersCount = Object.entries(filters).reduce((acc, [_, val]) => {
    if (Array.isArray(val)) return acc + val.length;
    if (typeof val === "boolean" && val) return acc + 1;
    if (typeof val === "string" && val.trim() !== "") return acc + 1;
    return acc;
  }, 0);

  const orgSelectedCount = (filters.departments?.length || 0) + (filters.sections?.length || 0) + (filters.teams?.length || 0);
  const statusSelectedCount = filters.statuses?.length || 0;
  const serviceSelectedCount = filters.serviceTypes?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] md:max-w-[620px] max-h-[92vh] sm:max-h-[85vh] p-0 border border-primary/20 dark:border-white/15 bg-card/98 backdrop-blur-2xl flex flex-col overflow-hidden !gap-0 pointer-events-auto rounded-t-[2.5rem] sm:rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10"
        dir="rtl"
      >
        <DialogDragHandle />
        
        {/* Header */}
        <div className="px-6 pt-4 pb-4 border-b border-border/30 flex items-center justify-between shrink-0 relative">
          <DialogTitle className="text-xl font-black text-foreground">
            סינון
          </DialogTitle>

          {/* Reset Action (aligned perfectly at top-4 h-9 w-9 beside Close X button) */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              title="אפס את כל המסננים"
              aria-label="אפס את כל המסננים"
              className="absolute left-4 sm:left-[3.75rem] top-4 h-9 w-9 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10 hover:bg-destructive/15 hover:border-destructive/30 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all z-[50] active:scale-95 group/reset shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 transition-transform group-hover/reset:-rotate-90" />
            </button>
          )}
        </div>

        {/* Tabs Scrollable Strip */}
        <div className="px-4 border-b border-border/30 shrink-0">
          <div className="flex gap-6 overflow-x-auto no-scrollbar py-3">
            {[
              { id: "org", label: `יחידות ארגוניות${orgSelectedCount ? ` (${orgSelectedCount})` : ""}` },
              { id: "statuses", label: `סטטוסים${statusSelectedCount ? ` (${statusSelectedCount})` : ""}` },
              { id: "service", label: `מעמד${serviceSelectedCount ? ` (${serviceSelectedCount})` : ""}` },
              { id: "ages", label: "גילאים" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-sm font-black whitespace-nowrap pb-2 border-b-2 transition-all relative flex items-center gap-1.5",
                  activeTab === tab.id
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {activeTab === "org" && (
            <div className="space-y-8">
              {/* Departments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    מחלקות {filters.departments?.length ? `(${filters.departments.length})` : ""}
                  </Label>
                  {availableDepts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleSelectAll("departments", availableDepts)}
                      className="text-[11px] font-black text-primary hover:underline"
                    >
                      {filters.departments?.length === availableDepts.length ? "בטל הכל" : "בחר הכל"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {availableDepts.map((dept) => {
                    const isSelected = filters.departments?.includes(dept);
                    return (
                      <Button
                        key={dept}
                        variant="ghost"
                        onClick={() => toggleFilter("departments", dept)}
                        className={cn(
                          "h-10 px-4 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-xs"
                            : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {dept}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    מדורים {filters.sections?.length ? `(${filters.sections.length})` : ""}
                  </Label>
                  {availableSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleSelectAll("sections", availableSections)}
                      className="text-[11px] font-black text-primary hover:underline"
                    >
                      {filters.sections?.length === availableSections.length ? "בטל הכל" : "בחר הכל"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {availableSections.length > 0 ? (
                    availableSections.map((sect) => {
                      const isSelected = filters.sections?.includes(sect);
                      return (
                        <Button
                          key={sect}
                          variant="ghost"
                          onClick={() => toggleFilter("sections", sect)}
                          className={cn(
                            "h-10 px-4 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-xs"
                              : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          {sect}
                        </Button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">בחר מחלקה תחילה</span>
                  )}
                </div>
              </div>

              {/* Teams */}
              {availableTeams.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      חוליות / צוותים {filters.teams?.length ? `(${filters.teams.length})` : ""}
                    </Label>
                    {availableTeams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => toggleSelectAll("teams", availableTeams)}
                        className="text-[11px] font-black text-primary hover:underline"
                      >
                        {filters.teams?.length === availableTeams.length ? "בטל הכל" : "בחר הכל"}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {availableTeams.map((team) => {
                      const isSelected = filters.teams?.includes(team);
                      return (
                        <Button
                          key={team}
                          variant="ghost"
                          onClick={() => toggleFilter("teams", team)}
                          className={cn(
                            "h-10 px-4 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-xs"
                              : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          {team}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "statuses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  סטטוסים נוכחיים {filters.statuses?.length ? `(${filters.statuses.length})` : ""}
                </Label>
                {hierarchyData.statuses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => toggleSelectAll("statuses", hierarchyData.statuses)}
                    className="text-[11px] font-black text-primary hover:underline"
                  >
                    {filters.statuses?.length === hierarchyData.statuses.length ? "בטל הכל" : "בחר הכל"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {hierarchyData.statuses.map((status) => {
                  const isSelected = filters.statuses?.includes(status);
                  return (
                    <Button
                      key={status}
                      variant="ghost"
                      onClick={() => toggleFilter("statuses", status)}
                      className={cn(
                        "h-10 px-4 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-xs"
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      {status}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "service" && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    מעמד שוטר {filters.serviceTypes?.length ? `(${filters.serviceTypes.length})` : ""}
                  </Label>
                  {hierarchyData.serviceTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => toggleSelectAll("serviceTypes", hierarchyData.serviceTypes)}
                      className="text-[11px] font-black text-primary hover:underline"
                    >
                      {filters.serviceTypes?.length === hierarchyData.serviceTypes.length ? "בטל הכל" : "בחר הכל"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {hierarchyData.serviceTypes.map((type) => {
                    const isSelected = filters.serviceTypes?.includes(type);
                    return (
                      <Button
                        key={type}
                        variant="ghost"
                        onClick={() => toggleFilter("serviceTypes", type)}
                        className={cn(
                          "h-10 px-4 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-xs"
                            : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {type}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  מאפיינים נוספים
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: "isCommander", label: "מפקדים בלבד" },
                    { id: "hasSecurityClearance", label: "בעלי סיווג ביטחוני" },
                    { id: "hasPoliceRicense", label: "רישיון נהיגה משטרתי" },
                    { id: "showInactive", label: "הצג שוטרים שאינם פעילים" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleFilter(item.id as any, !filters[item.id as keyof EmployeeFilters])}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                        filters[item.id as keyof EmployeeFilters]
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/30"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-black",
                        filters[item.id as keyof EmployeeFilters] ? "text-primary" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all",
                        filters[item.id as keyof EmployeeFilters]
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      )}>
                        {filters[item.id as keyof EmployeeFilters] && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ages" && (
            <div className="space-y-8 py-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    טווח גילאים
                  </Label>
                  <span className="text-lg font-black text-primary">
                    {filters.ageRange?.[0] || 18} - {filters.ageRange?.[1] || 67}
                  </span>
                </div>

                <div className="relative h-10 flex items-center px-2">
                  {/* Track Background */}
                  <div className="absolute left-2 right-2 h-1.5 bg-muted rounded-full" />
                  
                  {/* Active Range Highlight */}
                  <div 
                    className="absolute h-1.5 bg-primary rounded-full transition-all"
                    style={{
                      right: `calc(2px + ${((filters.ageRange?.[0] || 18) - 18) / (67 - 18) * 100}%)`,
                      left: `calc(2px + ${100 - ((filters.ageRange?.[1] || 67) - 18) / (67 - 18) * 100}%)`,
                    }}
                  />

                  {/* Dual Inputs */}
                  <input
                    type="range"
                    min="18"
                    max="67"
                    value={filters.ageRange?.[0] || 18}
                    onChange={(e) => {
                      const val = Math.min(parseInt(e.target.value), (filters.ageRange?.[1] || 67) - 1);
                      setFilters({ ...filters, ageRange: [val, filters.ageRange?.[1] || 67] });
                    }}
                    className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
                  />
                  <input
                    type="range"
                    min="18"
                    max="67"
                    value={filters.ageRange?.[1] || 67}
                    onChange={(e) => {
                      const val = Math.max(parseInt(e.target.value), (filters.ageRange?.[0] || 18) + 1);
                      setFilters({ ...filters, ageRange: [filters.ageRange?.[0] || 18, val] });
                    }}
                    className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
                  />

                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 shrink-0">
          <Button
            onClick={handleApply}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-12 transition-all active:scale-[0.98] text-sm gap-2 shadow-none"
          >
            <Filter className="w-4 h-4 shrink-0" />
            הצג {filteredCount} תוצאות
            {activeFiltersCount > 0 && (
              <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[10px] font-black">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

  );
};
