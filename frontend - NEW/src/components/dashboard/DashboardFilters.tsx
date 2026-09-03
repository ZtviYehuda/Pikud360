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
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, cleanUnitName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DialogDragHandle } from "@/components/ui/dialog";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";

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
  structure?: Department[];
  statuses?: { status_id: number; status_name: string; color: string }[];
  allStatusTypes?: any[];
  selectedDeptId?: string;
  selectedSectionId?: string;
  selectedTeamId?: string;
  selectedStatusId?: string;
  serviceTypes?: { id: number; name: string }[];
  selectedServiceTypes?: string[];
  selectedAgeRange?: { min?: number; max?: number };
  onFilterChange?: (
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
  onApplyModal?: (filters: any) => void;
  canSelectDept?: boolean;
  canSelectSection?: boolean;
  canSelectTeam?: boolean;
  hasActiveFiltersExternal?: boolean;
  activeFilterCountExternal?: number;
  user?: any;
  isMobile?: boolean;
  pillsOnly?: boolean;
  isDialogContent?: boolean;
  className?: string;
}

export const DashboardFilters = ({
  structure: propStructure,
  statuses: propStatuses,
  allStatusTypes: propAllStatusTypes,
  selectedDeptId,
  selectedSectionId,
  selectedTeamId,
  selectedStatusId,
  serviceTypes: propServiceTypes,
  selectedServiceTypes = [],
  selectedAgeRange,
  onFilterChange,
  onApplyModal,
  canSelectDept: propCanSelectDept,
  canSelectSection: propCanSelectSection,
  canSelectTeam: propCanSelectTeam,
  hasActiveFiltersExternal,
  activeFilterCountExternal,
  user: propUser,
  isMobile = false,
  pillsOnly = false,
  isDialogContent = false,
  className,
}: DashboardFiltersProps) => {
  const { user: authUser } = useAuthContext();
  const activeUser = propUser || authUser;

  const [internalStructure, setInternalStructure] = useState<Department[]>([]);
  const [internalStatuses, setInternalStatuses] = useState<any[]>([]);
  const [internalServiceTypes, setInternalServiceTypes] = useState<any[]>([]);
  const { getStructure, getStatusTypes, getServiceTypes } = useEmployees();

  useEffect(() => {
    let active = true;
    if (!propStructure || propStructure.length === 0) {
      getStructure().then((res) => {
        if (active && res && Array.isArray(res)) setInternalStructure(res);
      });
    }
    if (!propStatuses || propStatuses.length === 0) {
      getStatusTypes().then((res) => {
        if (active && res && Array.isArray(res)) setInternalStatuses(res);
      });
    }
    if (!propServiceTypes || propServiceTypes.length === 0) {
      getServiceTypes().then((res) => {
        if (active && res && Array.isArray(res)) setInternalServiceTypes(res);
      });
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const structure = propStructure && propStructure.length > 0 ? propStructure : internalStructure;
  const statuses = propStatuses && propStatuses.length > 0 ? propStatuses : internalStatuses;
  const allStatusTypes = propAllStatusTypes && propAllStatusTypes.length > 0 ? propAllStatusTypes : statuses;
  const serviceTypes = propServiceTypes && propServiceTypes.length > 0 ? propServiceTypes : internalServiceTypes;

  const canSelectDept = propCanSelectDept !== undefined ? propCanSelectDept : activeUser?.is_admin || !activeUser?.department_id;
  const canSelectSection = propCanSelectSection !== undefined ? propCanSelectSection : activeUser?.is_admin || !activeUser?.section_id;
  const canSelectTeam = propCanSelectTeam !== undefined ? propCanSelectTeam : activeUser?.is_admin || !activeUser?.team_id;

  const [activeTab, setActiveTab] = useState("org");
  const [stagedFilters, setStagedFilters] = useState<{
    deptIds: string[];
    sectionIds: string[];
    teamIds: string[];
    statusIds: string[];
    serviceTypes: string[];
    ageRange: { min?: number; max?: number };
  }>(() => {
    const initDepts = selectedDeptId && selectedDeptId !== "all" ? [selectedDeptId] : [];
    const initSecs = selectedSectionId && selectedSectionId !== "all" ? [selectedSectionId] : [];
    const initTeams = selectedTeamId && selectedTeamId !== "all" ? [selectedTeamId] : [];
    const initStatuses = selectedStatusId && selectedStatusId !== "all" ? [selectedStatusId] : [];
    return {
      deptIds: initDepts,
      sectionIds: initSecs,
      teamIds: initTeams,
      statusIds: initStatuses,
      serviceTypes: selectedServiceTypes || [],
      ageRange: selectedAgeRange || {},
    };
  });

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange("department", stagedFilters.deptIds);
      onFilterChange("section", stagedFilters.sectionIds);
      onFilterChange("team", stagedFilters.teamIds);
      onFilterChange("status", stagedFilters.statusIds);
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
    }

    if (onApplyModal) {
      const modalPayload: any = {};
      if (stagedFilters.deptIds.length > 0) {
        const selectedDepts = (structure || []).filter((d) =>
          stagedFilters.deptIds.includes(String(d?.id ?? ""))
        );
        modalPayload.departments = selectedDepts.map((d) => d.name);
      }
      if (stagedFilters.sectionIds.length > 0) {
        const allSections = (structure || []).flatMap((d) => d?.sections || []);
        const selectedSecs = allSections.filter((s) =>
          stagedFilters.sectionIds.includes(String(s?.id ?? ""))
        );
        modalPayload.sections = selectedSecs.map((s) => s.name);
      }
      if (stagedFilters.teamIds.length > 0) {
        const allTeams = (structure || []).flatMap((d) =>
          (d?.sections || []).flatMap((s) => s?.teams || [])
        );
        const selectedTeams = allTeams.filter((t) =>
          stagedFilters.teamIds.includes(String(t?.id ?? ""))
        );
        modalPayload.teams = selectedTeams.map((t) => t.name);
      }
      if (stagedFilters.statusIds.length > 0) {
        const selectedStatuses = (statuses || []).filter((st: any) =>
          stagedFilters.statusIds.includes(String(st?.status_id ?? st?.id ?? ""))
        );
        modalPayload.statuses = selectedStatuses.map(
          (st: any) => st.status_name || st.name
        );
      }
      if (stagedFilters.serviceTypes.length > 0) {
        modalPayload.serviceTypes = stagedFilters.serviceTypes;
      }
      onApplyModal(modalPayload);
    }
  };

  const handleLocalReset = () => {
    setStagedFilters({
      deptIds: [],
      sectionIds: [],
      teamIds: [],
      statusIds: [],
      serviceTypes: [],
      ageRange: {},
    });
  };

  const sections = useMemo(() => {
    if (!stagedFilters.deptIds || stagedFilters.deptIds.length === 0) {
      return [];
    }
    return (structure || [])
      .filter((d) => stagedFilters.deptIds.includes(String(d?.id ?? "")))
      .flatMap((d) => d?.sections || []);
  }, [stagedFilters.deptIds, structure]);

  const teams = useMemo(() => {
    if (!stagedFilters.sectionIds || stagedFilters.sectionIds.length === 0) {
      return [];
    }
    return (sections || [])
      .filter((s) => stagedFilters.sectionIds.includes(String(s?.id ?? "")))
      .flatMap((s) => s?.teams || []);
  }, [stagedFilters.sectionIds, sections]);

  const currentAgeValue = selectedAgeRange?.min
    ? selectedAgeRange.max
      ? `${selectedAgeRange.min}-${selectedAgeRange.max}`
      : `${selectedAgeRange.min}+`
    : "all";

  const isDeptActive = stagedFilters.deptIds.length > 0;
  const isSectionActive = stagedFilters.sectionIds.length > 0;
  const isTeamActive = stagedFilters.teamIds.length > 0;

  const hasActiveFilters =
    hasActiveFiltersExternal !== undefined
      ? hasActiveFiltersExternal
      : stagedFilters.deptIds.length > 0 ||
        stagedFilters.sectionIds.length > 0 ||
        stagedFilters.teamIds.length > 0 ||
        stagedFilters.statusIds.length > 0 ||
        stagedFilters.serviceTypes.length > 0 ||
        !!stagedFilters.ageRange?.min ||
        !!stagedFilters.ageRange?.max;
        isSectionActive ||
        isTeamActive ||
        !!selectedStatusId ||
        selectedServiceTypes.length > 0 ||
        !!selectedAgeRange?.min ||
        !!selectedAgeRange?.max;

  const FilterContent = (
    <div className="flex flex-col h-full bg-card overflow-hidden font-sans">
      <DialogDragHandle />

      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between shrink-0" dir="rtl">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">סינון</h2>
        </div>

        {/* Reset Action */}
        {hasActiveFilters && (
          <button
            onClick={handleLocalReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>איפוס הכל</span>
          </button>
        )}
      </div>

      {/* Tabs Strip */}
      <div className="px-6 border-b border-border/40 shrink-0 bg-muted/20" dir="rtl">
        <div
          id="filter-tabs"
          className="flex gap-6 overflow-x-auto no-scrollbar pt-3"
        >
          {[
            { id: "org", label: "יחידות ארגוניות", count: stagedFilters.deptIds.length + stagedFilters.sectionIds.length + stagedFilters.teamIds.length },
            { id: "status", label: "סטטוסים", count: stagedFilters.statusIds.length },
            { id: "service", label: "מעמד", count: stagedFilters.serviceTypes.length },
            { id: "age", label: "גילאים", count: (stagedFilters.ageRange?.min && (stagedFilters.ageRange.min > 18 || stagedFilters.ageRange.max! < 67)) ? 1 : 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "text-xs sm:text-sm font-semibold whitespace-nowrap pb-2.5 border-b-2 transition-all relative flex items-center gap-1.5 cursor-pointer",
                activeTab === tab.id
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold inline-flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area - Fixed uniform height across all tabs */}
      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar h-[360px] min-h-[360px] max-h-[360px]">
        {activeTab === "org" && (
          <div className="space-y-5" dir="rtl">
            {/* Departments Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">מחלקות</Label>
                  {stagedFilters.deptIds.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold rounded-md">
                      {stagedFilters.deptIds.length} נבחרו
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStagedFilters((prev) => ({ ...prev, deptIds: [], sectionIds: [], teamIds: [] }))}
                  className={cn(
                    "text-xs transition-colors cursor-pointer",
                    stagedFilters.deptIds.length === 0 ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {stagedFilters.deptIds.length === 0 ? "✓ כל המחלקות" : "איפוס מחלקות"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                {(structure || []).map((dept) => {
                  const deptIdStr = String(dept?.id ?? "");
                  const isSelected = stagedFilters.deptIds.includes(deptIdStr);
                  return (
                    <button
                      key={dept?.id}
                      type="button"
                      onClick={() => {
                        const newDepts = isSelected
                          ? stagedFilters.deptIds.filter((id) => id !== deptIdStr)
                          : [...stagedFilters.deptIds, deptIdStr];
                        setStagedFilters((prev) => ({
                          ...prev,
                          deptIds: newDepts,
                          sectionIds: [],
                          teamIds: [],
                        }));
                      }}
                      className={cn(
                        "h-8 px-3 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-muted/40 text-foreground/85 border-border/60 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{cleanUnitName(dept?.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/40" />

            {/* Sections Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">מדורים</Label>
                  {stagedFilters.sectionIds.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold rounded-md">
                      {stagedFilters.sectionIds.length} נבחרו
                    </Badge>
                  )}
                </div>
                {stagedFilters.deptIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStagedFilters((prev) => ({ ...prev, sectionIds: [], teamIds: [] }))}
                    className={cn(
                      "text-xs transition-colors cursor-pointer",
                      stagedFilters.sectionIds.length === 0 ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {stagedFilters.sectionIds.length === 0 ? "✓ כל המדורים במחלקה" : "איפוס מדורים"}
                  </button>
                )}
              </div>

              {stagedFilters.deptIds.length === 0 ? (
                <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/50 text-center flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <span className="text-xs text-muted-foreground">
                    יש לבחור מחלקה תחילה על מנת להציג מדורים
                  </span>
                </div>
              ) : sections.length === 0 ? (
                <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/50 text-center flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <span className="text-xs text-muted-foreground">
                    לא נמצאו מדורים במחלקה שנבחרה
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                  {sections.map((sec) => {
                    const secIdStr = String(sec?.id ?? "");
                    const isSelected = stagedFilters.sectionIds.includes(secIdStr);
                    return (
                      <button
                        key={sec?.id}
                        type="button"
                        onClick={() => {
                          const newSecs = isSelected
                            ? stagedFilters.sectionIds.filter((id) => id !== secIdStr)
                            : [...stagedFilters.sectionIds, secIdStr];
                          setStagedFilters((prev) => ({
                            ...prev,
                            sectionIds: newSecs,
                            teamIds: [],
                          }));
                        }}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                            : "bg-muted/40 text-foreground/85 border-border/60 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{cleanUnitName(sec?.name)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/40" />

            {/* Teams Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">חוליות</Label>
                  {stagedFilters.teamIds.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold rounded-md">
                      {stagedFilters.teamIds.length} נבחרו
                    </Badge>
                  )}
                </div>
                {stagedFilters.sectionIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStagedFilters((prev) => ({ ...prev, teamIds: [] }))}
                    className={cn(
                      "text-xs transition-colors cursor-pointer",
                      stagedFilters.teamIds.length === 0 ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {stagedFilters.teamIds.length === 0 ? "✓ כל החוליות במדור" : "איפוס חוליות"}
                  </button>
                )}
              </div>

              {stagedFilters.sectionIds.length === 0 ? (
                <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/50 text-center flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <span className="text-xs text-muted-foreground">
                    יש לבחור מדור תחילה על מנת להציג חוליות
                  </span>
                </div>
              ) : teams.length === 0 ? (
                <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border/50 text-center flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <span className="text-xs text-muted-foreground">
                    לא נמצאו חוליות במדור שנבחר
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                  {teams.map((team) => {
                    const teamIdStr = String(team?.id ?? "");
                    const isSelected = stagedFilters.teamIds.includes(teamIdStr);
                    return (
                      <button
                        key={team?.id}
                        type="button"
                        onClick={() => {
                          const newTeams = isSelected
                            ? stagedFilters.teamIds.filter((id) => id !== teamIdStr)
                            : [...stagedFilters.teamIds, teamIdStr];
                          setStagedFilters((prev) => ({
                            ...prev,
                            teamIds: newTeams,
                          }));
                        }}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                            : "bg-muted/40 text-foreground/85 border-border/60 hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{cleanUnitName(team?.name)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "status" && (
          <div className="space-y-4" dir="rtl">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right block">
                סטטוסי נוכחות
              </Label>
              <button
                type="button"
                onClick={() => setStagedFilters((prev) => ({ ...prev, statusIds: [] }))}
                className={cn(
                  "text-xs transition-colors cursor-pointer",
                  stagedFilters.statusIds.length === 0 ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {stagedFilters.statusIds.length === 0 ? "✓ כל הסטטוסים" : "איפוס סטטוסים"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(allStatusTypes || []).map((type: any) => {
                const statusIdStr = String(type?.status_id ?? type?.id ?? "");
                const isSelected = stagedFilters.statusIds.includes(statusIdStr);
                return (
                  <button
                    key={statusIdStr || type?.name}
                    type="button"
                    onClick={() => {
                      const newStatusIds = isSelected
                        ? stagedFilters.statusIds.filter((id) => id !== statusIdStr)
                        : [...stagedFilters.statusIds, statusIdStr];
                      setStagedFilters((prev) => ({
                        ...prev,
                        statusIds: newStatusIds,
                      }));
                    }}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-medium transition-all border flex items-center gap-2 cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-muted/40 text-foreground/85 border-border/60 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: type?.color || "#3b82f6" }}
                    />
                    <span>{type?.name || type?.status_name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "service" && (
          <div className="space-y-4" dir="rtl">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right block">
                מעמד ושירות
              </Label>
              <button
                type="button"
                onClick={() => setStagedFilters((prev) => ({ ...prev, serviceTypes: [] }))}
                className={cn(
                  "text-xs transition-colors cursor-pointer",
                  stagedFilters.serviceTypes.length === 0 ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {stagedFilters.serviceTypes.length === 0 ? "✓ כל המעמדות" : "איפוס מעמדות"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {serviceTypes.map((type) => {
                const isActive = stagedFilters.serviceTypes.includes(type.name);
                return (
                  <button
                    key={type.id}
                    type="button"
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
                      "h-8 px-3 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-muted/40 text-foreground/85 border-border/60 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "age" && (
          <div id="age-range-section" className="space-y-8" dir="rtl">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right block">
                טווח גילאים
              </Label>
              <Badge variant="secondary" className="text-xs font-bold text-primary bg-primary/10">
                {stagedFilters.ageRange?.min || 18} - {stagedFilters.ageRange?.max || 67}
              </Badge>
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
                className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
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
                className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
              />

              <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-2 text-[10px] font-medium text-muted-foreground">
                <span>18</span>
                <span>67</span>
              </div>
            </div>

            {/* Quick Age Presets */}
            <div className="space-y-2 pt-6">
              <span className="text-[11px] font-semibold text-muted-foreground">טווחים נפוצים</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "הכל (18-67)", min: 18, max: 67 },
                  { label: "סדיר (18-21)", min: 18, max: 21 },
                  { label: "מילואים צעיר (22-40)", min: 22, max: 40 },
                  { label: "מילואים ותיק (41-67)", min: 41, max: 67 },
                ].map((preset) => {
                  const isPresetActive =
                    (stagedFilters.ageRange?.min ?? 18) === preset.min &&
                    (stagedFilters.ageRange?.max ?? 67) === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setStagedFilters({
                          ...stagedFilters,
                          ageRange: { min: preset.min, max: preset.max },
                        })
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                        isPresetActive
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-muted/40 text-foreground/80 border-border/60 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/40 shrink-0 bg-card" dir="rtl">
        <Button
          id="apply-filters-btn"
          onClick={handleApply}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-10 transition-all active:scale-[0.99] text-xs sm:text-sm shadow-xs cursor-pointer"
        >
          החל סינון
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {isDialogContent ? (
        FilterContent
      ) : isMobile ? (
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
              {stagedFilters.deptIds.length > 0 && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  מחלקות:{" "}
                  <span className="font-bold text-foreground">
                    {(structure || [])
                      .filter((d) => stagedFilters.deptIds.includes(String(d?.id ?? "")))
                      .map((d) => d.name)
                      .join(", ")}
                  </span>
                  <button
                    onClick={() => {
                      setStagedFilters((prev) => ({ ...prev, deptIds: [], sectionIds: [], teamIds: [] }));
                      if (onFilterChange) onFilterChange("department", []);
                    }}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {stagedFilters.sectionIds.length > 0 && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  מדורים:{" "}
                  <span className="font-bold text-foreground">
                    {(sections || [])
                      .filter((s) => stagedFilters.sectionIds.includes(String(s?.id ?? "")))
                      .map((s) => s.name)
                      .join(", ")}
                  </span>
                  <button
                    onClick={() => {
                      setStagedFilters((prev) => ({ ...prev, sectionIds: [], teamIds: [] }));
                      if (onFilterChange) onFilterChange("section", []);
                    }}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {stagedFilters.teamIds.length > 0 && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  חוליות:{" "}
                  <span className="font-bold text-foreground">
                    {(teams || [])
                      .filter((t) => stagedFilters.teamIds.includes(String(t?.id ?? "")))
                      .map((t) => t.name)
                      .join(", ")}
                  </span>
                  <button
                    onClick={() => {
                      setStagedFilters((prev) => ({ ...prev, teamIds: [] }));
                      if (onFilterChange) onFilterChange("team", []);
                    }}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {stagedFilters.statusIds.length > 0 && (
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground"
                >
                  סטטוסים:{" "}
                  <span className="font-bold text-foreground">
                    {(statuses || [])
                      .filter((st: any) => stagedFilters.statusIds.includes(String(st?.status_id ?? st?.id ?? "")))
                      .map((st: any) => st.status_name || st.name)
                      .join(", ")}
                  </span>
                  <button
                    onClick={() => {
                      setStagedFilters((prev) => ({ ...prev, statusIds: [] }));
                      if (onFilterChange) onFilterChange("status", []);
                    }}
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
                    onClick={() => onFilterChange && onFilterChange("ageRange", "all")}
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
                    onClick={() => onFilterChange && onFilterChange("serviceType", [])}
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
                  variant="outline"
                  className={cn(
                    "h-9 rounded-xl gap-1.5 font-bold transition-all px-3 text-foreground bg-card/70 dark:bg-card/50 hover:bg-accent/60 border-border/60 text-xs shadow-xs flex items-center",
                    hasActiveFilters && "border-primary/50 text-primary bg-primary/5 dark:bg-primary/10",
                  )}
                >
                  <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-bold">
                    סינון
                  </span>
                  {hasActiveFilters && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-0.5" />
                  )}
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
              className="w-[95vw] sm:w-[580px] sm:min-w-[580px] sm:max-w-[580px] p-0 rounded-2xl border border-border/80 dark:border-white/15 bg-card/98 backdrop-blur-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-50 flex flex-col overflow-hidden"
            >
              {FilterContent}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};
