import React, { useState, useMemo, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { AppModalContent, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/common/AppModal";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Select,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Users,
  Building2,
  LayoutPanelLeft,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { cn, cleanUnitName, formatUnitName, formatUnitToName } from "@/lib/utils";

interface GlobalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusTypes: any[];
  structure: any[];
}

export const GlobalEventModal: React.FC<GlobalEventModalProps> = ({
  isOpen,
  onClose,
  statusTypes,
  structure,
}) => {
  const { user } = useAuthContext();
  const { logScopeStatus, isUpdatingScope } = useEmployees();

  const unitDayStatus =
    statusTypes.find((s) => s.name === "יום יחידה") ||
    statusTypes.find((s) => s.code === "UNIT_DAY");

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");

  const isAdmin = user?.is_admin;

  // Hierarchical selection state
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Accessible departments
  const departments = useMemo(() => {
    if (isAdmin) return structure;
    if (user?.commands_department_id)
      return structure.filter((d: any) => d.id === user.commands_department_id);
    return structure;
  }, [structure, isAdmin, user]);

  // All accessible sections
  const allSections = useMemo(() => {
    const result: any[] = [];
    for (const d of structure) {
      const secs: any[] = d.sections || [];
      for (const s of secs) {
        const commandsDept = user?.commands_department_id === d.id;
        const commandsSec = user?.commands_section_id === s.id;
        const commandsAnyTeamInSection = (s.teams || []).some(
          (t: any) => user?.commands_team_id === t.id,
        );

        if (
          !isAdmin &&
          !commandsDept &&
          !commandsSec &&
          !commandsAnyTeamInSection &&
          user?.commands_department_id
        )
          continue;

        result.push({ ...s, dept_id: d.id, dept_name: d.name });
      }
    }
    return result;
  }, [structure, isAdmin, user]);

  // All accessible teams
  const allTeams = useMemo(() => {
    const result: any[] = [];
    for (const d of structure) {
      for (const s of d.sections || []) {
        for (const t of s.teams || []) {
          const commandsDept = user?.commands_department_id === d.id;
          const commandsSec = user?.commands_section_id === s.id;
          const commandsTeam = user?.commands_team_id === t.id;
          if (
            !isAdmin &&
            !commandsDept &&
            !commandsSec &&
            !commandsTeam &&
            user?.commands_department_id
          )
            continue;
          result.push({ ...t, section_id: s.id, section_name: s.name, dept_id: d.id, dept_name: d.name });
        }
      }
    }
    return result;
  }, [structure, isAdmin, user]);

  // Available sections based on department selection
  const availableSections = useMemo(() => {
    if (selectedDeptId) {
      return allSections.filter((s: any) => s.dept_id.toString() === selectedDeptId);
    }
    return allSections;
  }, [allSections, selectedDeptId]);

  // Available teams based on section and department selection
  const availableTeams = useMemo(() => {
    if (selectedSectionId) {
      return allTeams.filter((t: any) => t.section_id.toString() === selectedSectionId);
    }
    if (selectedDeptId) {
      return allTeams.filter((t: any) => t.dept_id.toString() === selectedDeptId);
    }
    return allTeams;
  }, [allTeams, selectedSectionId, selectedDeptId]);

  // Selected entities names
  const selectedDept = useMemo(
    () => departments.find((d: any) => d.id.toString() === selectedDeptId),
    [departments, selectedDeptId]
  );
  const selectedSection = useMemo(
    () => allSections.find((s: any) => s.id.toString() === selectedSectionId),
    [allSections, selectedSectionId]
  );
  const selectedTeam = useMemo(
    () => allTeams.find((t: any) => t.id.toString() === selectedTeamId),
    [allTeams, selectedTeamId]
  );

  // Active target calculation (most specific selected level)
  const activeTarget = useMemo(() => {
    if (selectedTeamId && selectedTeam) {
      return {
        scope: "team" as const,
        targetId: selectedTeamId,
        name: selectedTeam.name,
        deptName: selectedDept?.name ? formatUnitName("department", selectedDept.name) : "",
        sectionName: selectedSection?.name ? formatUnitName("section", selectedSection.name) : "",
        teamName: formatUnitName("team", selectedTeam.name),
        label: formatUnitName("team", selectedTeam.name),
        toLabel: formatUnitToName("team", selectedTeam.name),
        scopeLabel: "רמת חוליה",
      };
    }
    if (selectedSectionId && selectedSection) {
      return {
        scope: "section" as const,
        targetId: selectedSectionId,
        name: selectedSection.name,
        deptName: selectedDept?.name ? formatUnitName("department", selectedDept.name) : "",
        sectionName: formatUnitName("section", selectedSection.name),
        teamName: "",
        label: formatUnitName("section", selectedSection.name),
        toLabel: formatUnitToName("section", selectedSection.name),
        scopeLabel: "רמת מדור",
      };
    }
    if (selectedDeptId && selectedDept) {
      return {
        scope: "department" as const,
        targetId: selectedDeptId,
        name: selectedDept.name,
        deptName: formatUnitName("department", selectedDept.name),
        sectionName: "",
        teamName: "",
        label: formatUnitName("department", selectedDept.name),
        toLabel: formatUnitToName("department", selectedDept.name),
        scopeLabel: "רמת מחלקה",
      };
    }
    return null;
  }, [selectedDeptId, selectedSectionId, selectedTeamId, selectedDept, selectedSection, selectedTeam]);

  // Initial user default scope
  useEffect(() => {
    if (user?.commands_department_id && !selectedDeptId) {
      setSelectedDeptId(user.commands_department_id.toString());
    }
    if (user?.commands_section_id && !selectedSectionId) {
      setSelectedSectionId(user.commands_section_id.toString());
    }
    if (user?.commands_team_id && !selectedTeamId) {
      setSelectedTeamId(user.commands_team_id.toString());
    }
  }, [user]);

  // Reset note when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNote("");
    }
  }, [isOpen]);

  const hasCommandPower =
    isAdmin ||
    user?.is_commander ||
    user?.commands_department_id ||
    user?.commands_section_id ||
    user?.commands_team_id;

  const isContentValid = note.trim().length > 0;
  const isDateRangeValid = !!startDate && !!endDate && endDate >= startDate;
  const canSubmit =
    !isUpdatingScope &&
    !!hasCommandPower &&
    !!activeTarget &&
    isContentValid &&
    isDateRangeValid;

  const handleSubmit = async () => {
    if (!hasCommandPower) {
      toast.error("אין לך הרשאה לקבוע אירוע יחידה");
      return;
    }
    if (!activeTarget) {
      toast.error("נא לבחור יחידה לביצוע הפעולה");
      return;
    }
    if (!note.trim()) {
      toast.error("חובה להזין את תוכן האירוע לפני השמירה");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("נא לבחור תאריכי התחלה וסיום");
      return;
    }
    if (endDate < startDate) {
      toast.error("תאריך הסיום לא יכול להיות לפני תאריך ההתחלה");
      return;
    }

    const success = await logScopeStatus(
      activeTarget.scope,
      parseInt(activeTarget.targetId),
      unitDayStatus?.id || 1,
      startDate,
      endDate,
      note.trim(),
    );
    if (success) {
      toast.success(`אירוע יחידה עודכן בהצלחה ${activeTarget.toLabel}`);
      setNote("");
      onClose();
    } else {
      toast.error("שגיאה בעדכון אירוע היחידה");
    }
  };

  const handleResetSelection = () => {
    setSelectedDeptId("");
    setSelectedSectionId("");
    setSelectedTeamId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AppModalContent size="lg">
        {/* ── Header ── */}
        <AppModalHeader
          icon={Calendar}
          iconVariant="primary"
          title="הוספת אירוע יחידה"
          subtitle="קביעת יום מחלקה, מדור או חוליה"
        />

        {/* ── Body ── */}
        <AppModalBody className="p-5 sm:p-7 space-y-5 sm:space-y-6">
          {hasCommandPower ? (
            <>
              {/* ── Hierarchical Unit Selector ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    בחר רמת יחידה לאירוע
                  </span>
                  {activeTarget && (
                    <button
                      onClick={handleResetSelection}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      איפוס בחירה
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
                  {/* Department Card */}
                  <Select
                    value={selectedDeptId || undefined}
                    onValueChange={(val) => {
                      if (val === "__ALL__") {
                        setSelectedDeptId("");
                      } else {
                        setSelectedDeptId(val);
                      }
                      setSelectedSectionId("");
                      setSelectedTeamId("");
                    }}
                  >
                    <SelectPrimitive.Trigger
                      className={cn(
                        "group h-24 sm:h-28 w-full min-w-0 p-3 sm:p-4 flex flex-col justify-between rounded-2xl border text-right transition-all duration-200 cursor-pointer outline-none relative overflow-hidden",
                        selectedDeptId
                          ? "border-primary/80 bg-primary/[0.06] text-foreground shadow-xs ring-1 ring-primary/25"
                          : "border-border/60 bg-card/60 hover:bg-card hover:border-border text-foreground hover:shadow-xs"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors",
                          selectedDeptId
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        {selectedDeptId ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            נבחר
                          </span>
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                        )}
                      </div>

                      <div className="w-full text-right mt-1">
                        <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                          מחלקה
                        </h4>
                        {selectedDept ? (
                          <p className="text-xs sm:text-sm font-black text-primary truncate leading-tight mt-0.5">
                            {cleanUnitName(selectedDept.name)}
                          </p>
                        ) : (
                          <p className="text-[11px] sm:text-xs font-normal text-muted-foreground/75 leading-tight mt-0.5">
                            כלל המחלקות
                          </p>
                        )}
                      </div>
                    </SelectPrimitive.Trigger>

                    <SelectContent position="popper" className="rounded-xl border-border/40 max-h-56 custom-scrollbar z-[100]">
                      <SelectItem value="__ALL__" className="text-xs text-muted-foreground cursor-pointer font-medium">
                        כלל המחלקות (ללא סינון)
                      </SelectItem>
                      {departments.map((d: any) => (
                        <SelectItem key={d.id} value={d.id.toString()} className="font-bold cursor-pointer text-xs">
                          {cleanUnitName(d.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Section Card */}
                  <Select
                    value={selectedSectionId || undefined}
                    onValueChange={(val) => {
                      if (val === "__ALL__") {
                        setSelectedSectionId("");
                      } else {
                        setSelectedSectionId(val);
                        const s = allSections.find((x: any) => x.id.toString() === val);
                        if (s && !selectedDeptId) {
                          setSelectedDeptId(s.dept_id.toString());
                        }
                      }
                      setSelectedTeamId("");
                    }}
                    disabled={availableSections.length === 0}
                  >
                    <SelectPrimitive.Trigger
                      className={cn(
                        "group h-24 sm:h-28 w-full min-w-0 p-3 sm:p-4 flex flex-col justify-between rounded-2xl border text-right transition-all duration-200 cursor-pointer outline-none relative overflow-hidden",
                        selectedSectionId
                          ? "border-primary/80 bg-primary/[0.06] text-foreground shadow-xs ring-1 ring-primary/25"
                          : "border-border/60 bg-card/60 hover:bg-card hover:border-border text-foreground hover:shadow-xs",
                        availableSections.length === 0 && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors",
                          selectedSectionId
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <LayoutPanelLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        {selectedSectionId ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            נבחר
                          </span>
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                        )}
                      </div>

                      <div className="w-full text-right mt-1">
                        <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                          מדור
                        </h4>
                        {selectedSection ? (
                          <p className="text-xs sm:text-sm font-black text-primary truncate leading-tight mt-0.5">
                            {cleanUnitName(selectedSection.name)}
                          </p>
                        ) : (
                          <p className="text-[11px] sm:text-xs font-normal text-muted-foreground/75 leading-tight mt-0.5">
                            {availableSections.length === 0 ? "אין מדורים זמינים" : "כלל המדורים"}
                          </p>
                        )}
                      </div>
                    </SelectPrimitive.Trigger>

                    <SelectContent position="popper" className="rounded-xl border-border/40 max-h-56 custom-scrollbar z-[100]">
                      <SelectItem value="__ALL__" className="text-xs text-muted-foreground cursor-pointer font-medium">
                        כלל המדורים (ללא סינון)
                      </SelectItem>
                      {availableSections.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()} className="font-bold cursor-pointer text-xs">
                          <span>{cleanUnitName(s.name)}</span>
                          {!selectedDeptId && (
                            <span className="text-[10px] text-muted-foreground mr-1">({cleanUnitName(s.dept_name)})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Team Card */}
                  <Select
                    value={selectedTeamId || undefined}
                    onValueChange={(val) => {
                      if (val === "__ALL__") {
                        setSelectedTeamId("");
                      } else {
                        setSelectedTeamId(val);
                        const t = allTeams.find((x: any) => x.id.toString() === val);
                        if (t) {
                          if (!selectedSectionId) setSelectedSectionId(t.section_id.toString());
                          if (!selectedDeptId) setSelectedDeptId(t.dept_id.toString());
                        }
                      }
                    }}
                    disabled={availableTeams.length === 0}
                  >
                    <SelectPrimitive.Trigger
                      className={cn(
                        "group h-24 sm:h-28 w-full min-w-0 p-3 sm:p-4 flex flex-col justify-between rounded-2xl border text-right transition-all duration-200 cursor-pointer outline-none relative overflow-hidden",
                        selectedTeamId
                          ? "border-primary/80 bg-primary/[0.06] text-foreground shadow-xs ring-1 ring-primary/25"
                          : "border-border/60 bg-card/60 hover:bg-card hover:border-border text-foreground hover:shadow-xs",
                        availableTeams.length === 0 && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-colors",
                          selectedTeamId
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        {selectedTeamId ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            נבחר
                          </span>
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                        )}
                      </div>

                      <div className="w-full text-right mt-1">
                        <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                          חוליה
                        </h4>
                        {selectedTeam ? (
                          <p className="text-xs sm:text-sm font-black text-primary truncate leading-tight mt-0.5">
                            {cleanUnitName(selectedTeam.name)}
                          </p>
                        ) : (
                          <p className="text-[11px] sm:text-xs font-normal text-muted-foreground/75 leading-tight mt-0.5">
                            {availableTeams.length === 0 ? "אין חוליות זמינות" : "כלל החוליות"}
                          </p>
                        )}
                      </div>
                    </SelectPrimitive.Trigger>

                    <SelectContent position="popper" className="rounded-xl border-border/40 max-h-56 custom-scrollbar z-[100]">
                      <SelectItem value="__ALL__" className="text-xs text-muted-foreground cursor-pointer font-medium">
                        כלל החוליות (ללא סינון)
                      </SelectItem>
                      {availableTeams.map((t: any) => (
                        <SelectItem key={t.id} value={t.id.toString()} className="font-bold cursor-pointer text-xs">
                          <span>{cleanUnitName(t.name)}</span>
                          {!selectedSectionId && (
                            <span className="text-[10px] text-muted-foreground mr-1">({cleanUnitName(t.section_name)})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ── Active Target Breadcrumb / Feedback (RTL hierarchy) ── */}
                {activeTarget ? (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between gap-3 text-xs sm:text-sm" dir="rtl">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-muted-foreground font-medium shrink-0">יעד:</span>

                      {/* Department level (Root) */}
                      {activeTarget.deptName && (
                        <span className={cn(
                          "truncate",
                          activeTarget.scope === "department" ? "font-bold text-primary" : "text-muted-foreground"
                        )}>
                          {activeTarget.deptName}
                        </span>
                      )}

                      {/* Section level */}
                      {activeTarget.sectionName && (
                        <>
                          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          <span className={cn(
                            "truncate",
                            activeTarget.scope === "section" ? "font-bold text-primary" : "text-muted-foreground"
                          )}>
                            {activeTarget.sectionName}
                          </span>
                        </>
                      )}

                      {/* Team level */}
                      {activeTarget.teamName && (
                        <>
                          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-bold text-primary truncate">
                            {activeTarget.teamName}
                          </span>
                        </>
                      )}
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                      {activeTarget.scopeLabel}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-xs text-muted-foreground" dir="rtl">
                    <span>בחר יחידה מהכרטיסים למעלה כדי להחיל את האירוע</span>
                    <span className="text-[11px] font-medium text-muted-foreground/70">מחלקה / מדור / חוליה</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs font-bold">
                אין לך הרשאות פיקודיות לביצוע פעולה זו
              </p>
            </div>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">תאריך התחלה</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartDate(newStart);
                  if (newStart && (!endDate || endDate < newStart)) {
                    setEndDate(newStart);
                  }
                }}
                className="bg-background border-border/60 h-11 rounded-xl font-bold px-3 text-xs sm:text-sm w-full block text-center shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">תאריך סיום</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  if (startDate && newEnd && newEnd < startDate) {
                    setEndDate(startDate);
                  } else {
                    setEndDate(newEnd);
                  }
                }}
                className="bg-background border-border/60 h-11 rounded-xl font-bold px-3 text-xs sm:text-sm w-full block text-center shadow-xs"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>תוכן האירוע</span>
                <span className="text-destructive font-bold">*</span>
                <span className="text-xs text-muted-foreground/60 font-normal">
                  (יופיע ביומן)
                </span>
              </Label>
              {!isContentValid && (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  חובה להזין תוכן
                </span>
              )}
            </div>
            <Textarea
              placeholder="חובה להזין תוכן: יום מחלקה, גיבוש, תרגיל, כנס..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none min-h-[90px] bg-background border-border/60 rounded-xl p-3.5 text-sm leading-relaxed shadow-xs focus-visible:border-primary"
            />
          </div>
        </AppModalBody>

        {/* ── Footer ── */}
        <AppModalFooter className="flex-col gap-2">
          <Button
            className="w-full rounded-xl h-11 sm:h-12 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isUpdatingScope ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                מעדכן...
              </span>
            ) : (
              activeTarget ? `עדכן אירוע ${activeTarget.toLabel}` : "עדכן אירוע"
            )}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1 text-center cursor-pointer"
          >
            ביטול
          </button>
        </AppModalFooter>
      </AppModalContent>
    </Dialog>
  );
};
