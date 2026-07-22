import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDragHandle,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const [scope, setScope] = useState<"team" | "section" | "department">(() => {
    if (user?.commands_department_id || isAdmin) return "department";
    if (user?.commands_section_id) return "section";
    return "team";
  });

  const [targetId, setTargetId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // --- Accessible lists per scope (flat, no cascading UI needed) ---
  const departments = useMemo(() => {
    if (isAdmin) return structure;
    if (user?.commands_department_id)
      return structure.filter((d: any) => d.id === user.commands_department_id);
    return [];
  }, [structure, isAdmin, user]);

  // All accessible sections (flat list with parent dept name for grouping display)
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
          !commandsAnyTeamInSection
        )
          continue;

        result.push({ ...s, dept_id: d.id, dept_name: d.name });
      }
    }
    return result;
  }, [structure, isAdmin, user]);

  // All accessible teams (flat list with parent section name)
  const allTeams = useMemo(() => {
    const result: any[] = [];
    for (const d of structure) {
      for (const s of d.sections || []) {
        for (const t of s.teams || []) {
          const commandsDept = user?.commands_department_id === d.id;
          const commandsSec = user?.commands_section_id === s.id;
          const commandsTeam = user?.commands_team_id === t.id;
          if (!isAdmin && !commandsDept && !commandsSec && !commandsTeam)
            continue;
          result.push({ ...t, section_id: s.id, section_name: s.name });
        }
      }
    }
    return result;
  }, [structure, isAdmin, user]);



  // Smart filtering for cascading behavior
  const availableSections = useMemo(() => {
    if (selectedDeptId) {
      return allSections.filter((s: any) => s.dept_id.toString() === selectedDeptId);
    }
    return allSections;
  }, [allSections, selectedDeptId]);

  const availableTeams = useMemo(() => {
    if (selectedSectionId) {
      return allTeams.filter((t: any) => t.section_id.toString() === selectedSectionId);
    }
    if (selectedDeptId) {
      const validSections = allSections
        .filter((s: any) => s.dept_id.toString() === selectedDeptId)
        .map((s: any) => s.id);
      return allTeams.filter((t: any) => validSections.includes(t.section_id));
    }
    return allTeams;
  }, [allTeams, selectedSectionId, selectedDeptId, allSections]);

  // Auto-select when only one option in active filtered list
  useEffect(() => {
    if (scope === "department" && departments.length === 1) {
      setTargetId(departments[0].id.toString());
      setSelectedDeptId(departments[0].id.toString());
    } else if (scope === "section" && availableSections.length === 1) {
      setTargetId(availableSections[0].id.toString());
      setSelectedSectionId(availableSections[0].id.toString());
      if (!selectedDeptId) setSelectedDeptId(availableSections[0].dept_id.toString());
    } else if (scope === "team" && availableTeams.length === 1) {
      setTargetId(availableTeams[0].id.toString());
    }
  }, [scope, departments, availableSections, availableTeams]);

  const isScopeDisabled = (scopeType: "team" | "section" | "department") => {
    if (isAdmin) return false;
    if (scopeType === "department") return !user?.commands_department_id;
    if (scopeType === "section")
      return !user?.commands_department_id && !user?.commands_section_id;
    return (
      !user?.commands_department_id &&
      !user?.commands_section_id &&
      !user?.commands_team_id
    );
  };

  const handleSubmit = async () => {
    if (!unitDayStatus) {
      toast.error("סטטוס יום יחידה לא נמצא במערכת");
      return;
    }
    if (!targetId) {
      toast.error("נא לבחור יחידה לביצוע הפעולה");
      return;
    }
    const success = await logScopeStatus(
      scope,
      parseInt(targetId),
      unitDayStatus.id,
      startDate,
      endDate,
      note,
    );
    if (success) {
      toast.success("אירוע היחידה עודכן בהצלחה לכלל השוטרים ביחידה שנבחרה");
      onClose();
    } else {
      toast.error("שגיאה בעדכון אירוע היחידה");
    }
  };

  const hasCommandPower =
    isAdmin ||
    user?.is_commander ||
    user?.commands_department_id ||
    user?.commands_section_id ||
    user?.commands_team_id;

  // Shared card base styles
  const cardBase =
    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all w-full text-right";
  const cardActive =
    "border-primary bg-primary/10 text-primary scale-[1.02]";
  const cardInactive =
    "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground";
  const cardDisabled =
    "opacity-40 cursor-not-allowed border-dashed grayscale pointer-events-none";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border-border/40 flex flex-col">
        <DialogDragHandle />

        {/* ── Slim inline header ── */}
        <div className="px-5 pt-3 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-border/30 text-right shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-[18px] h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[15px] sm:text-lg font-black tracking-tight leading-none mb-0.5">
                הוספת אירוע יחידה
              </DialogTitle>
              <DialogDescription className="text-[11px] font-medium text-muted-foreground/70 leading-none">
                קביעת יום מחלקה, מדור או חוליה
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 flex flex-col px-5 py-4 sm:px-6 sm:py-5 space-y-4 overflow-y-auto custom-scrollbar">
          {hasCommandPower ? (
            <>
              {/* Scope selection — compact inline dropdowns */}
              {(isAdmin ||
                user?.commands_department_id ||
                user?.commands_section_id) && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest pr-0.5">
                    בחר יחידה
                  </span>
                  <div className="grid grid-cols-3 gap-2.5 w-full min-w-0">
                    {/* Department */}
                    <Select
                      value={scope === "department" && targetId ? targetId : undefined}
                      onValueChange={(val) => {
                        setScope("department");
                        setTargetId(val);
                        setSelectedDeptId(val);
                        setSelectedSectionId("");
                      }}
                      disabled={isScopeDisabled("department") || departments.length === 0}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-24 w-full min-w-0 overflow-hidden flex flex-col items-center justify-center gap-2 rounded-2xl border text-center font-bold text-xs transition-all duration-300",
                          "hover:scale-[1.02] hover:shadow-md cursor-pointer",
                          scope === "department" && targetId
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border/50 bg-background/50 hover:bg-background hover:border-border",
                          (isScopeDisabled("department") || departments.length === 0) && "opacity-40 pointer-events-none",
                        )}
                      >
                        <Building2 className={cn("w-6 h-6 shrink-0", scope === "department" && targetId ? "text-primary" : "text-muted-foreground")} />
                        <div className="w-full truncate text-center px-1 font-black leading-tight text-[11px]">
                          <div className="hidden"><SelectValue /></div>
                          {scope === "department" && targetId 
                            ? (departments.find((d: any) => d.id.toString() === targetId)?.name || "מחלקה") 
                            : "מחלקה"}
                        </div>
                      </SelectTrigger>
                      <SelectContent position="popper" className="rounded-xl border-border/40 max-h-48 custom-scrollbar relative z-[100]">
                        {departments.map((d: any) => (
                          <SelectItem key={d.id} value={d.id.toString()} className="font-bold cursor-pointer">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Section */}
                    <Select
                      value={scope === "section" && targetId ? targetId : undefined}
                      onValueChange={(val) => {
                        setScope("section");
                        setTargetId(val);
                        setSelectedSectionId(val);
                        const s = allSections.find((x: any) => x.id.toString() === val);
                        if (s) setSelectedDeptId(s.dept_id.toString());
                      }}
                      disabled={isScopeDisabled("section") || availableSections.length === 0}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-24 w-full min-w-0 overflow-hidden flex flex-col items-center justify-center gap-2 rounded-2xl border text-center font-bold text-xs transition-all duration-300",
                          "hover:scale-[1.02] hover:shadow-md cursor-pointer",
                          scope === "section" && targetId
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border/50 bg-background/50 hover:bg-background hover:border-border",
                          (isScopeDisabled("section") || availableSections.length === 0) && "opacity-40 pointer-events-none",
                        )}
                      >
                        <LayoutPanelLeft className={cn("w-6 h-6 shrink-0", scope === "section" && targetId ? "text-primary" : "text-muted-foreground")} />
                        <div className="w-full truncate text-center px-1 font-black leading-tight text-[11px]">
                          <div className="hidden"><SelectValue /></div>
                          {scope === "section" && targetId 
                            ? (allSections.find((s: any) => s.id.toString() === targetId)?.name || "מדור") 
                            : "מדור"}
                        </div>
                      </SelectTrigger>
                      <SelectContent position="popper" className="rounded-xl border-border/40 max-h-48 custom-scrollbar relative z-[100]">
                        {availableSections.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()} className="font-bold cursor-pointer">
                            {s.name} <span className="text-[9px] text-muted-foreground mr-1">({s.dept_name})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Team */}
                    <Select
                      value={scope === "team" && targetId ? targetId : undefined}
                      onValueChange={(val) => {
                        setScope("team");
                        setTargetId(val);
                        const t = allTeams.find((x: any) => x.id.toString() === val);
                        if (t) {
                          setSelectedSectionId(t.section_id.toString());
                          const s = allSections.find((x: any) => x.id === t.section_id);
                          if (s) setSelectedDeptId(s.dept_id.toString());
                        }
                      }}
                      disabled={isScopeDisabled("team") || availableTeams.length === 0}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-24 w-full min-w-0 overflow-hidden flex flex-col items-center justify-center gap-2 rounded-2xl border text-center font-bold text-xs transition-all duration-300",
                          "hover:scale-[1.02] hover:shadow-md cursor-pointer",
                          scope === "team" && targetId
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border/50 bg-background/50 hover:bg-background hover:border-border",
                          (isScopeDisabled("team") || availableTeams.length === 0) && "opacity-40 pointer-events-none",
                        )}
                      >
                        <Users className={cn("w-6 h-6 shrink-0", scope === "team" && targetId ? "text-primary" : "text-muted-foreground")} />
                        <div className="w-full truncate text-center px-1 font-black leading-tight text-[11px]">
                          <div className="hidden"><SelectValue /></div>
                          {scope === "team" && targetId 
                            ? (allTeams.find((t: any) => t.id.toString() === targetId)?.name || "חוליה") 
                            : "חוליה"}
                        </div>
                      </SelectTrigger>
                      <SelectContent position="popper" className="rounded-xl border-border/40 max-h-48 custom-scrollbar relative z-[100]">
                        {availableTeams.map((t: any) => (
                          <SelectItem key={t.id} value={t.id.toString()} className="font-bold cursor-pointer">
                            {t.name} <span className="text-[9px] text-muted-foreground mr-1">({t.section_name})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs font-bold">
                אין לך הרשאות פיקודיות לביצוע פעולה זו
              </p>
            </div>
          )}

          {/* Date Selection — compact */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest">תאריך התחלה</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border-border/50 h-10 rounded-xl font-bold px-2 text-xs w-full block text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest">תאריך סיום</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border-border/50 h-10 rounded-xl font-bold px-2 text-xs w-full block text-center"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1.5">
              תוכן האירוע
              <span className="text-[9px] text-muted-foreground/40 font-normal normal-case tracking-normal">
                (יופיע ביומן)
              </span>
            </Label>
            <Textarea
              placeholder="לדוגמה: יום מחלקה..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none min-h-[80px] bg-background border-border/50 rounded-xl p-3 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* ── Pinned footer — safe area ── */}
        <div className="px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 border-t border-border/30 shrink-0">
          <Button
            className="w-full rounded-xl h-12 font-black text-sm transition-all active:scale-[0.98]"
            onClick={handleSubmit}
            disabled={isUpdatingScope || !hasCommandPower || !targetId}
          >
            {isUpdatingScope ? (
              <span className="flex items-center gap-2.5">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                מעדכן...
              </span>
            ) : (
              "עדכן אירוע לכולם"
            )}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-[11px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2 text-center"
          >
            ביטול
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

