import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  RotateCcw,
  Cake,
  Briefcase,
  Filter,
  X,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DialogTitle, DialogDragHandle } from "@/components/ui/dialog";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

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

interface DashboardFiltersProps {
  structure: Department[];
  statuses: { status_id: number; status_name: string; color: string }[];
  allStatusTypes: any[];
  selectedDeptId?: string;
  selectedSectionId?: string;
  selectedTeamId?: string;
  selectedStatusId?: string;
  serviceTypes: { id: number; name: string }[];
  selectedServiceTypes: string[];
  selectedAgeRange?: { min?: number; max?: number };
  onFilterChange: (
    type:
      | "department"
      | "section"
      | "team"
      | "status"
      | "serviceType"
      | "ageRange"
      | "reset",
    value?: any,
  ) => void;
  canSelectDept: boolean;
  canSelectSection: boolean;
  canSelectTeam: boolean;
  hasActiveFiltersExternal?: boolean;
  activeFilterCountExternal?: number;
  user?: any;
  isMobile?: boolean;
  pillsOnly?: boolean;
  className?: string;
}

export const DashboardFilters = ({
  structure,
  statuses,
  allStatusTypes,
  selectedDeptId,
  selectedSectionId,
  selectedTeamId,
  selectedStatusId,
  serviceTypes,
  selectedServiceTypes,
  selectedAgeRange,
  onFilterChange,
  canSelectDept,
  canSelectSection,
  canSelectTeam,
  hasActiveFiltersExternal,
  activeFilterCountExternal,
  user,
  isMobile = false,
  pillsOnly = false,
  className,
}: DashboardFiltersProps) => {
  const [activeTab, setActiveTab] = useState("org");
  const [stagedFilters, setStagedFilters] = useState({
    deptId: selectedDeptId,
    sectionId: selectedSectionId,
    teamId: selectedTeamId,
    statusId: selectedStatusId,
    serviceTypes: selectedServiceTypes,
    ageRange: selectedAgeRange,
  });

  // Sync with props when modal opens or props change
  useEffect(() => {
    setStagedFilters({
      deptId: selectedDeptId,
      sectionId: selectedSectionId,
      teamId: selectedTeamId,
      statusId: selectedStatusId,
      serviceTypes: selectedServiceTypes,
      ageRange: selectedAgeRange,
    });
  }, [
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusId,
    selectedServiceTypes,
    selectedAgeRange,
  ]);

  const handleApply = () => {
    onFilterChange("department", stagedFilters.deptId);
    onFilterChange("section", stagedFilters.sectionId);
    onFilterChange("team", stagedFilters.teamId);
    onFilterChange("status", stagedFilters.statusId);
    onFilterChange("serviceType", stagedFilters.serviceTypes);

    if (stagedFilters.ageRange?.min) {
      onFilterChange(
        "ageRange",
        stagedFilters.ageRange.max
          ? `${stagedFilters.ageRange.min}-${stagedFilters.ageRange.max}`
          : `${stagedFilters.ageRange.min}+`,
      );
    } else {
      onFilterChange("ageRange", "all");
    }
  };

  const handleLocalReset = () => {
    setStagedFilters({
      deptId: undefined,
      sectionId: undefined,
      teamId: undefined,
      statusId: undefined,
      serviceTypes: [],
      ageRange: {},
    });
  };

  const sections = useMemo(() => {
    const deptId = stagedFilters.deptId || selectedDeptId;
    if (!deptId) return [];
    const dept = structure.find((d) => d.id.toString() === deptId);
    return dept ? dept.sections : [];
  }, [stagedFilters.deptId, selectedDeptId, structure]);

  const teams = useMemo(() => {
    const sectionId = stagedFilters.sectionId || selectedSectionId;
    if (!sectionId) return [];
    const sec = sections.find((s) => s.id.toString() === sectionId);
    return sec ? sec.teams : [];
  }, [stagedFilters.sectionId, selectedSectionId, sections]);

  const currentAgeValue = selectedAgeRange?.min
    ? selectedAgeRange.max
      ? `${selectedAgeRange.min}-${selectedAgeRange.max}`
      : `${selectedAgeRange.min}+`
    : "all";

  const selectedStatus = useMemo(() => {
    if (!selectedStatusId) return null;
    const s = statuses.find(
      (st) => st.status_id.toString() === selectedStatusId,
    );
    if (s) return { id: s.status_id, name: s.status_name, color: s.color };
    return null;
  }, [selectedStatusId, statuses]);

  const selectedDept = structure.find(
    (d) => d.id.toString() === selectedDeptId,
  );
  const selectedSection = sections.find(
    (s) => s.id.toString() === selectedSectionId,
  );
  const selectedTeam = teams.find((t) => t.id.toString() === selectedTeamId);

  const isDeptActive = useMemo(() => {
    if (!selectedDeptId || selectedDeptId === "all") return false;
    if (user?.is_admin) return true;
    if (user?.commands_department_id?.toString() === selectedDeptId)
      return false;
    if (user?.assigned_department_id?.toString() === selectedDeptId)
      return false;
    return true;
  }, [selectedDeptId, user]);

  const isSectionActive = useMemo(() => {
    if (!selectedSectionId || selectedSectionId === "all") return false;
    if (user?.is_admin) return true;
    if (user?.commands_section_id?.toString() === selectedSectionId)
      return false;
    if (user?.assigned_section_id?.toString() === selectedSectionId)
      return false;
    return true;
  }, [selectedSectionId, user]);

  const isTeamActive = useMemo(() => {
    if (!selectedTeamId || selectedTeamId === "all") return false;
    if (user?.is_admin) return true;
    if (user?.commands_team_id?.toString() === selectedTeamId) return false;
    if (user?.assigned_team_id?.toString() === selectedTeamId) return false;
    return true;
  }, [selectedTeamId, user]);

  const hasActiveFilters =
    hasActiveFiltersExternal !== undefined
      ? hasActiveFiltersExternal
      : isDeptActive ||
        isSectionActive ||
        isTeamActive ||
        !!selectedStatusId ||
        selectedServiceTypes.length > 0 ||
        !!selectedAgeRange?.min ||
        !!selectedAgeRange?.max;

  const FilterContent = (
    <div className="flex flex-col h-full bg-background overflow-hidden rounded-t-[2.5rem] sm:rounded-3xl">
      <DialogDragHandle />

      {/* Header */}
      <div className="px-6 pt-2 pb-4 border-b border-border/30 flex items-center justify-between shrink-0">
        <div className="text-xl font-black text-foreground">סינון</div>
        <button
          onClick={handleLocalReset}
          className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          אפס הכל
        </button>
      </div>

      {/* Tabs Strip */}
      <div className="px-4 border-b border-border/30 shrink-0">
        <div
          id="filter-tabs"
          className="flex gap-6 overflow-x-auto no-scrollbar py-3"
        >
          {[
            { id: "org", label: "יחידות ארגוניות" },
            { id: "status", label: "סטטוסים" },
            { id: "service", label: "מעמד" },
            { id: "age", label: "גילאים" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-sm font-black whitespace-nowrap pb-2 border-b-2 transition-all relative",
                activeTab === tab.id
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar max-h-[60vh]">
        {activeTab === "org" && (
          <div className="space-y-3" dir="rtl">
            {/* Dept */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                stagedFilters.deptId && stagedFilters.deptId !== "all"
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/40 bg-muted/20",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base",
                  stagedFilters.deptId && stagedFilters.deptId !== "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                🏢
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  מחלקה
                </span>
                <Select
                  value={stagedFilters.deptId || "all"}
                  onValueChange={(val) =>
                    setStagedFilters({
                      ...stagedFilters,
                      deptId: val === "all" ? undefined : val,
                      sectionId: undefined,
                      teamId: undefined,
                    })
                  }
                  disabled={!canSelectDept && !!stagedFilters.deptId}
                >
                  <SelectTrigger className="h-8 px-3 rounded-lg border border-border/40 font-bold text-sm bg-background/60 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="בחר מחלקה..." />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {user?.is_admin && (
                      <SelectItem value="all">כל המחלקות</SelectItem>
                    )}
                    {structure.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Connector line */}
            <div className="flex items-center gap-3 pr-4 pl-0">
              <div className="flex flex-col items-center" style={{ width: 36 }}>
                <div
                  className={cn(
                    "w-px flex-1 h-4",
                    stagedFilters.deptId ? "bg-primary/30" : "bg-border/30",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  stagedFilters.deptId
                    ? "text-primary/60"
                    : "text-muted-foreground/40",
                )}
              >
                {stagedFilters.deptId ? "↓ בחר מדור" : "בחר קודם מחלקה"}
              </span>
            </div>

            {/* Section */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                !stagedFilters.deptId && "opacity-40 pointer-events-none",
                stagedFilters.sectionId && stagedFilters.sectionId !== "all"
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/40 bg-muted/20",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base",
                  stagedFilters.sectionId && stagedFilters.sectionId !== "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                🏬
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  מדור
                </span>
                <Select
                  value={stagedFilters.sectionId || "all"}
                  onValueChange={(val) =>
                    setStagedFilters({
                      ...stagedFilters,
                      sectionId: val === "all" ? undefined : val,
                      teamId: undefined,
                    })
                  }
                  disabled={
                    !stagedFilters.deptId ||
                    (!canSelectSection && !!stagedFilters.sectionId)
                  }
                >
                  <SelectTrigger className="h-8 px-3 rounded-lg border border-border/40 font-bold text-sm bg-background/60 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="בחר מדור..." />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {(user?.is_admin || user?.commands_department_id) && (
                      <SelectItem value="all">כל המדורים</SelectItem>
                    )}
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id.toString()}>
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Connector line */}
            <div className="flex items-center gap-3 pr-4 pl-0">
              <div className="flex flex-col items-center" style={{ width: 36 }}>
                <div
                  className={cn(
                    "w-px flex-1 h-4",
                    stagedFilters.sectionId ? "bg-primary/30" : "bg-border/30",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  stagedFilters.sectionId
                    ? "text-primary/60"
                    : "text-muted-foreground/40",
                )}
              >
                {stagedFilters.sectionId ? "↓ בחר חוליה" : "בחר קודם מדור"}
              </span>
            </div>

            {/* Team */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                !stagedFilters.sectionId && "opacity-40 pointer-events-none",
                stagedFilters.teamId && stagedFilters.teamId !== "all"
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/40 bg-muted/20",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base",
                  stagedFilters.teamId && stagedFilters.teamId !== "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                👥
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  חוליה
                </span>
                <Select
                  value={stagedFilters.teamId || "all"}
                  onValueChange={(val) =>
                    setStagedFilters({
                      ...stagedFilters,
                      teamId: val === "all" ? undefined : val,
                    })
                  }
                  disabled={
                    !stagedFilters.sectionId ||
                    (!canSelectTeam && !!stagedFilters.teamId)
                  }
                >
                  <SelectTrigger className="h-8 px-3 rounded-lg border border-border/40 font-bold text-sm bg-background/60 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="בחר חוליה..." />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {(user?.is_admin ||
                      user?.commands_department_id ||
                      user?.commands_section_id) && (
                      <SelectItem value="all">כל החוליות</SelectItem>
                    )}
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "status" && (
          <div className="space-y-4">
            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest text-right block">
              סטטוסים
            </Label>
            <div className="flex flex-wrap gap-2.5">
              {allStatusTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="ghost"
                  onClick={() =>
                    setStagedFilters({
                      ...stagedFilters,
                      statusId:
                        stagedFilters.statusId === type.id.toString()
                          ? undefined
                          : type.id.toString(),
                    })
                  }
                  className={cn(
                    "h-10 px-4 rounded-xl text-xs font-black transition-all border",
                    stagedFilters.statusId === type.id.toString()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted",
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full ml-2"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "service" && (
          <div className="space-y-4">
            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest text-right block">
              מעמד
            </Label>
            <div className="flex flex-wrap gap-2.5">
              {serviceTypes.map((type) => {
                const isActive = stagedFilters.serviceTypes.includes(type.name);
                return (
                  <Button
                    key={type.id}
                    variant="ghost"
                    onClick={() => {
                      const newTypes = isActive
                        ? stagedFilters.serviceTypes.filter(
                            (t) => t !== type.name,
                          )
                        : [...stagedFilters.serviceTypes, type.name];
                      setStagedFilters({
                        ...stagedFilters,
                        serviceTypes: newTypes,
                      });
                    }}
                    className={cn(
                      "h-10 px-4 rounded-xl text-xs font-black transition-all border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted",
                    )}
                  >
                    {type.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "age" && (
          <div id="age-range-section" className="space-y-8">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest text-right block">
                טווח גילאים
              </Label>
              <span className="text-lg font-black text-primary">
                {stagedFilters.ageRange?.min || 18} -{" "}
                {stagedFilters.ageRange?.max || 67}
              </span>
            </div>

            <div className="relative h-10 flex items-center px-2">
              {/* Track Background */}
              <div className="absolute left-2 right-2 h-1.5 bg-muted rounded-full" />

              {/* Active Range Highlight */}
              <div
                className="absolute h-1.5 bg-primary rounded-full transition-all"
                style={{
                  right: `calc(2px + ${(((stagedFilters.ageRange?.min || 18) - 18) / (67 - 18)) * 100}%)`,
                  left: `calc(2px + ${100 - (((stagedFilters.ageRange?.max || 67) - 18) / (67 - 18)) * 100}%)`,
                }}
              />

              {/* Dual Inputs */}
              <input
                type="range"
                min="18"
                max="67"
                value={stagedFilters.ageRange?.min || 18}
                onChange={(e) => {
                  const val = Math.min(
                    parseInt(e.target.value),
                    (stagedFilters.ageRange?.max || 67) - 1,
                  );
                  setStagedFilters({
                    ...stagedFilters,
                    ageRange: { ...stagedFilters.ageRange, min: val },
                  });
                }}
                className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
              />
              <input
                type="range"
                min="18"
                max="67"
                value={stagedFilters.ageRange?.max || 67}
                onChange={(e) => {
                  const val = Math.max(
                    parseInt(e.target.value),
                    (stagedFilters.ageRange?.min || 18) + 1,
                  );
                  setStagedFilters({
                    ...stagedFilters,
                    ageRange: { ...stagedFilters.ageRange, max: val },
                  });
                }}
                className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
              />

              <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-2 text-[10px] font-bold text-muted-foreground">
                <span>18</span>
                <span>67</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/30 shrink-0">
        <Button
          id="apply-filters-btn"
          onClick={handleApply}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-14 transition-all active:scale-[0.98] text-base"
        >
          החל סינון
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {isMobile ? (
        <div className="relative z-10">{FilterContent}</div>
      ) : pillsOnly ? (
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-wrap items-center gap-2 py-1"
            >
              {selectedDept && isDeptActive && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  מחלקה:{" "}
                  <span className="font-bold text-foreground">
                    {selectedDept.name}
                  </span>
                  {canSelectDept && (
                    <button
                      onClick={() => onFilterChange("department")}
                      className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              )}
              {selectedSection && isSectionActive && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  מדור:{" "}
                  <span className="font-bold text-foreground">
                    {selectedSection.name}
                  </span>
                  {canSelectSection && (
                    <button
                      onClick={() => onFilterChange("section")}
                      className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              )}
              {selectedTeam && isTeamActive && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  חולייה:{" "}
                  <span className="font-bold text-foreground">
                    {selectedTeam.name}
                  </span>
                  {canSelectTeam && (
                    <button
                      onClick={() => onFilterChange("team")}
                      className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              )}
              {selectedStatus && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  סטטוס:
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: selectedStatus.color || "currentColor",
                      }}
                    />
                    <span className="font-bold text-foreground">
                      {selectedStatus.name}
                    </span>
                  </div>
                  <button
                    onClick={() => onFilterChange("status")}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {(selectedAgeRange?.min || selectedAgeRange?.max) && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  גיל:{" "}
                  <span className="font-bold text-foreground">
                    {currentAgeValue === "all" ? "כל הגילאים" : currentAgeValue}
                  </span>
                  <button
                    onClick={() => onFilterChange("ageRange", "all")}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedServiceTypes.length > 0 && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  מעמד:{" "}
                  <span className="font-bold text-foreground">
                    {selectedServiceTypes.join(", ")}
                  </span>
                  <button
                    onClick={() => onFilterChange("serviceType", [])}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange("reset")}
                className="h-7 rounded-full px-3 text-[11px] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                נקה הכל
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div
          className={cn(
            "flex flex-wrap items-center justify-end gap-2 w-full",
            className,
          )}
        >
          <Popover>
            <div className="relative group">
              <PopoverTrigger asChild>
                <Button
                  id="dashboard-filter-trigger"
                  variant="ghost"
                  className="h-9 rounded-xl flex-col gap-0.5 font-black transition-all px-2 xl:px-3.5 text-primary hover:bg-primary/5 text-sm min-w-[60px] py-1 relative border-none bg-transparent"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="text-[8.5px] xl:text-[9.5px] leading-tight">
                    סינון
                  </span>
                </Button>
              </PopoverTrigger>

              {hasActiveFilters && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterChange("reset");
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-125 active:scale-90 z-20 text-primary/70 hover:text-destructive"
                  title="נקה הכל"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <PopoverContent
              align="end"
              sideOffset={12}
              className="w-[95vw] md:w-[500px] p-0 rounded-[2.5rem] border-none bg-background shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {FilterContent}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};
