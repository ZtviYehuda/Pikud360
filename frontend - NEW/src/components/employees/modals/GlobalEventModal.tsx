import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDragHandle,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
        parent: `${selectedDept?.name || ""} > ${selectedSection?.name || ""}`,
        label: formatUnitName("team", selectedTeam.name),
        toLabel: formatUnitToName("team", selectedTeam.name),
      };
    }
    if (selectedSectionId && selectedSection) {
      return {
        scope: "section" as const,
        targetId: selectedSectionId,
        name: selectedSection.name,
        parent: selectedDept?.name || "",
        label: formatUnitName("section", selectedSection.name),
        toLabel: formatUnitToName("section", selectedSection.name),
      };
    }
    if (selectedDeptId && selectedDept) {
      return {
        scope: "department" as const,
        targetId: selectedDeptId,
        name: selectedDept.name,
        parent: "כלל המחלקה",
        label: formatUnitName("department", selectedDept.name),
        toLabel: formatUnitToName("department", selectedDept.name),
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

  const handleSubmit = async () => {
    if (!unitDayStatus) {
      toast.error("סטטוס יום יחידה לא נמצא במערכת");
      return;
    }
    if (!activeTarget) {
      toast.error("נא לבחור יחידה לביצוע הפעולה");
      return;
    }
    const success = await logScopeStatus(
      activeTarget.scope,
      parseInt(activeTarget.targetId),
      unitDayStatus.id,
      startDate,
      endDate,
      note,
    );
    if (success) {
      toast.success(`אירוע יחידה עודכן בהצלחה ${activeTarget.toLabel}`);
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

  const hasCommandPower =
    isAdmin ||
    user?.is_commander ||
    user?.commands_department_id ||
    user?.commands_section_id ||
    user?.commands_team_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border-border/40 flex flex-col">
        <DialogDragHandle />

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-border/40 bg-muted/20 text-right shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-0.5 text-right">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                הוספת אירוע יחידה
              </DialogTitle>
              <DialogDescription className="text-xs font-normal text-muted-foreground">
                קביעת יום מחלקה, מדור או חוליה
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col px-5 py-4 sm:px-6 sm:py-5 space-y-4 overflow-y-auto custom-scrollbar">
          {hasCommandPower ? (
            <>
              {/* ── Hierarchical Unit Selector ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">
                    בחר רמת יחידה לאירוע
                  </span>
                  {activeTarget && (
                    <button
                      onClick={handleResetSelection}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      איפוס בחירה
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 w-full min-w-0">
                  {/* Department Card */}
                  <Select
                    value={selectedDeptId || undefined}
                    onValueChange={(val) => {
                      setSelectedDeptId(val);
                      setSelectedSectionId("");
                      setSelectedTeamId("");
                    }}
                  >
                    <SelectPrimitive.Trigger
                      className={cn(
                        "h-20 w-full min-w-0 px-2 py-2 flex flex-col items-center justify-between rounded-xl border text-center transition-all duration-200 cursor-pointer outline-none",
                        "hover:shadow-xs",
                        selectedDeptId
                          ? "border-primary/80 bg-primary/[0.04] text-foreground shadow-xs ring-1 ring-primary/20"
                          : "border-border/60 bg-card/60 hover:bg-card hover:border-border text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center",
                          selectedDeptId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        {selectedDeptId && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>

                      <div className="w-full text-right">
                        <span className="text-[10px] font-medium text-muted-foreground block">
                          מחלקה
                        </span>
                        <p className={cn(
                          "text-xs font-bold truncate leading-tight",
                          selectedDeptId ? "text-primary" : "text-foreground"
                        )}>
                          {selectedDept ? cleanUnitName(selectedDept.name) : "בחר מחלקה"}
                        </p>
                      </div>
                    </SelectPrimitive.Trigger>

                    <SelectContent position="popper" className="rounded-xl border-border/40 max-h-56 custom-scrollbar z-[100]">
                      {departments.map((d: any) => (
                        <SelectItem key={d.id} value={d.id.toString()} className="font-bold cursor-pointer text-xs">
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Section Card */}
                  <Select
                    value={selectedSectionId || undefined}
                    onValueChange={(val) => {
                      setSelectedSectionId(val);
                      setSelectedTeamId("");
                      const s = allSections.find((x: any) => x.id.toString() === val);
                      if (s && !selectedDeptId) {
                        setSelectedDeptId(s.dept_id.toString());
                      }
                    }}
                    disabled={availableSections.length === 0}
                  >
                    <SelectPrimitive.Trigger
                      className={cn(
                        "h-20 w-full min-w-0 px-2 py-2 flex flex-col items-center justify-between rounded-xl border text-center transition-all duration-200 cursor-pointer outline-none",
                        "hover:shadow-xs",
                        selectedSectionId
                          ? "border-primary/80 bg-primary/[0.04] text-foreground shadow-xs ring-1 ring-primary/20"
                          : "border-border/60 bg-card/60 hover:bg-card hover:border-border text-muted-foreground",
                        availableSections.length === 0 && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center",
                          selectedSectionId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <LayoutPanelLeft className="w-3.5 h-3.5" />
                        </div>
                        {selectedSectionId && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>

                      <div className="w-full text-right">
                        <span className="text-[10px] font-medium text-muted-foreground block">
                          מדור
                        </span>
                        <p className={cn(
                          "text-xs font-bold truncate leading-tight",
                          selectedSectionId ? "text-primary" : "text-foreground"
                        )}>
                          {selectedSection ? cleanUnitName(selectedSection.name) : "בחר מדור"}
                        </p>
                      </div>
                    </SelectPrimitive.Trigger>

                    <SelectContent position="popper" className="rounded-xl border-border/40 max-h-56 custom-scrollbar z-[100]">
                      {availableSections.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()} className="font-bold cursor-pointer text-xs">
                          <span>{s.name}</span>
                          {!selectedDeptId && (
                            <span className="text-[10px] text-muted-foreground mr-1">({s.dept_name})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Team Card */}
                  <Select
                    value={selectedTeamId || undefined}
                    onValueChange={(val) => {
                      setSelectedTeamId(val);
                      const t = allTeams.find((x: any) => x.id.toString() === val);
                      if (t) {
                        if (!selectedSectionId) setSelectedSectionId(t.section_id.toString());
                        if (!selectedDeptId) setSelectedDeptId(t.dept_id.toString());
                      }
                    }}
                    disabled={availableTeams.length === 0}
                  >
                    <SelectPrimitive.Trigger
                      className={cn(
                        "h-20 w-full min-w-0 px-2 py-2 flex flex-col items-center justify-between rounded-xl border text-center transition-all duration-200 cursor-pointer outline-none",
                        "hover:shadow-xs",
                        selectedTeamId
                          ? "border-primary/80 bg-primary/[0.04] text-foreground shadow-xs ring-1 ring-primary/20"
                          : "border-border/60 bg-card/60 hover:bg-card hover:border-border text-muted-foreground",
                        availableTeams.length === 0 && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center",
                          selectedTeamId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        {selectedTeamId && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>

                      <div className="w-full text-right">
                        <span className="text-[10px] font-medium text-muted-foreground block">
                          חוליה
                        </span>
                        <p className={cn(
                          "text-xs font-bold truncate leading-tight",
                          selectedTeamId ? "text-primary" : "text-foreground"
                        )}>
                          {selectedTeam ? cleanUnitName(selectedTeam.name) : "בחר חוליה"}
                        </p>
                      </div>
                    </SelectPrimitive.Trigger>

                    <SelectContent position="popper" className="rounded-xl border-border/40 max-h-56 custom-scrollbar z-[100]">
                      {availableTeams.map((t: any) => (
                        <SelectItem key={t.id} value={t.id.toString()} className="font-bold cursor-pointer text-xs">
                          <span>{t.name}</span>
                          {!selectedSectionId && (
                            <span className="text-[10px] text-muted-foreground mr-1">({t.section_name})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ── Active Target Breadcrumb / Feedback ── */}
                {activeTarget ? (
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground shrink-0">האירוע יחול על:</span>
                      <span className="font-bold text-primary truncate">{activeTarget.label}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground text-right pr-1">
                    בחר מחלקה, מדור או חוליה לקביעת האירוע
                  </p>
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
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground">תאריך התחלה</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border-border/60 h-10 rounded-xl font-bold px-3 text-xs w-full block text-center shadow-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground">תאריך סיום</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border-border/60 h-10 rounded-xl font-bold px-3 text-xs w-full block text-center shadow-xs"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
              תוכן האירוע
              <span className="text-[10px] text-muted-foreground/60 font-normal">
                (יופיע ביומן)
              </span>
            </Label>
            <Textarea
              placeholder="יום מחלקה, גיבוש, תרגיל..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none min-h-[75px] bg-background border-border/60 rounded-xl p-3 text-sm leading-relaxed shadow-xs"
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 shrink-0 space-y-2">
          <Button
            className="w-full rounded-xl h-10 font-bold text-xs transition-all active:scale-[0.98] shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isUpdatingScope || !hasCommandPower || !activeTarget}
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
            className="w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
          >
            ביטול
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
