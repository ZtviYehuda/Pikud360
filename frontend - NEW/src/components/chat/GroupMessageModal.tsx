import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  Building2,
  Layers,
  Users2,
  AlertCircle,
  Search,
  UserCheck,
  Minus,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DepartmentNode, SectionNode, TeamNode, Employee } from "@/types/employee.types";

interface GroupMessageModalProps {
  open: boolean;
  onClose: () => void;
}

type OrgLevel = "department" | "section" | "team";

interface OrgTarget {
  level: OrgLevel;
  id: number;
  name: string;
}

export const GroupMessageModal: React.FC<GroupMessageModalProps> = ({ open, onClose }) => {
  const { structure, employees } = useEmployeeContext();
  const { user } = useAuthContext();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [selectedTargets, setSelectedTargets] = useState<OrgTarget[]>([]);
  const [selectedIndividuals, setSelectedIndividuals] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStructure = useMemo(() => {
    if (!searchQuery.trim()) return structure;
    const q = searchQuery.toLowerCase();
    return structure
      .map((dept) => ({
        ...dept,
        sections: dept.sections
          .map((sec) => ({
            ...sec,
            teams: sec.teams.filter((team) => team.name.toLowerCase().includes(q)),
          }))
          .filter(
            (sec) =>
              sec.name.toLowerCase().includes(q) ||
              sec.teams.length > 0
          ),
      }))
      .filter(
        (dept) =>
          dept.name.toLowerCase().includes(q) ||
          dept.sections.length > 0
      );
  }, [structure, searchQuery]);

  // Resolve all recipient IDs — from org-unit selections AND individual selections
  const resolvedRecipients = useMemo(() => {
    const ids = new Set<number>();

    // 1. From org-unit targets
    for (const target of selectedTargets) {
      const matchingEmployees = employees.filter((emp) => {
        if (!emp.is_active) return false;
        if (Number(emp.id) === Number(user?.id)) return false;
        if (target.level === "department") return emp.department_id === target.id;
        if (target.level === "section") return emp.section_id === target.id;
        if (target.level === "team") return emp.team_id === target.id;
        return false;
      });
      matchingEmployees.forEach((e) => ids.add(e.id));
    }

    // 2. From individually selected employees
    selectedIndividuals.forEach((id) => {
      const emp = employees.find((e) => e.id === id);
      if (emp && emp.is_active && Number(emp.id) !== Number(user?.id)) {
        ids.add(id);
      }
    });

    return Array.from(ids);
  }, [selectedTargets, selectedIndividuals, employees, user]);

  const recipientEmployees = useMemo(
    () => employees.filter((e) => resolvedRecipients.includes(e.id)),
    [employees, resolvedRecipients]
  );

  const isTargetSelected = (level: OrgLevel, id: number) =>
    selectedTargets.some((t) => t.level === level && t.id === id);

  const isIndividualSelected = (id: number) => selectedIndividuals.has(id);

  const findParentSectionOfTeam = (teamId: number) => {
    for (const dept of structure) {
      for (const sec of dept.sections) {
        if (sec.teams.some((team) => team.id === teamId)) {
          return { dept, sec };
        }
      }
    }
    return null;
  };

  const toggleTarget = (target: OrgTarget) => {
    setSelectedTargets((prev) => {
      const exists = prev.some((t) => t.level === target.level && t.id === target.id);

      if (exists) {
        // --- DESELECT CASCADE ---
        let toRemove: { level: OrgLevel; id: number }[] = [target];

        if (target.level === "department") {
          const dept = structure.find((d) => d.id === target.id);
          if (dept) {
            dept.sections.forEach((sec) => {
              toRemove.push({ level: "section", id: sec.id });
              sec.teams.forEach((team) => {
                toRemove.push({ level: "team", id: team.id });
              });
            });
          }
        } else if (target.level === "section") {
          let foundSec: SectionNode | undefined;
          let parentDept: DepartmentNode | undefined;
          for (const d of structure) {
            const s = d.sections.find((s) => s.id === target.id);
            if (s) {
              foundSec = s;
              parentDept = d;
              break;
            }
          }
          if (foundSec) {
            foundSec.teams.forEach((team) => {
              toRemove.push({ level: "team", id: team.id });
            });
          }
          if (parentDept) {
            toRemove.push({ level: "department", id: parentDept.id });
          }
        } else if (target.level === "team") {
          const parents = findParentSectionOfTeam(target.id);
          if (parents) {
            toRemove.push({ level: "section", id: parents.sec.id });
            toRemove.push({ level: "department", id: parents.dept.id });
          }
        }

        return prev.filter(
          (t) => !toRemove.some((r) => r.level === t.level && r.id === t.id)
        );
      } else {
        // --- SELECT CASCADE ---
        let toAdd: OrgTarget[] = [target];

        if (target.level === "department") {
          const dept = structure.find((d) => d.id === target.id);
          if (dept) {
            dept.sections.forEach((sec) => {
              toAdd.push({ level: "section", id: sec.id, name: sec.name });
              sec.teams.forEach((team) => {
                toAdd.push({ level: "team", id: team.id, name: team.name });
              });
            });
          }
        } else if (target.level === "section") {
          let foundSec: SectionNode | undefined;
          let parentDept: DepartmentNode | undefined;
          for (const d of structure) {
            const s = d.sections.find((s) => s.id === target.id);
            if (s) {
              foundSec = s;
              parentDept = d;
              break;
            }
          }
          if (foundSec) {
            foundSec.teams.forEach((team) => {
              toAdd.push({ level: "team", id: team.id, name: team.name });
            });
          }
          if (parentDept && foundSec) {
            const siblingSections = parentDept.sections.filter((s) => s.id !== target.id);
            const allSiblingsSelected = siblingSections.every((s) =>
              prev.some((t) => t.level === "section" && t.id === s.id)
            );
            if (allSiblingsSelected) {
              toAdd.push({ level: "department", id: parentDept.id, name: parentDept.name });
            }
          }
        } else if (target.level === "team") {
          const parents = findParentSectionOfTeam(target.id);
          if (parents) {
            const siblingTeams = parents.sec.teams.filter((t) => t.id !== target.id);
            const allSiblingTeamsSelected = siblingTeams.every((t) =>
              prev.some((target) => target.level === "team" && target.id === t.id)
            );
            if (allSiblingTeamsSelected) {
              toAdd.push({ level: "section", id: parents.sec.id, name: parents.sec.name });
              
              const siblingSections = parents.dept.sections.filter((s) => s.id !== parents.sec.id);
              const allSiblingSectionsSelected = siblingSections.every((s) =>
                prev.some((t) => t.level === "section" && t.id === s.id)
              );
              if (allSiblingSectionsSelected) {
                toAdd.push({ level: "department", id: parents.dept.id, name: parents.dept.name });
              }
            }
          }
        }

        const updated = [...prev];
        toAdd.forEach((item) => {
          if (!updated.some((t) => t.level === item.level && t.id === item.id)) {
            updated.push(item);
          }
        });
        return updated;
      }
    });
  };

  const toggleIndividual = (empId: number) => {
    setSelectedIndividuals((prev) => {
      const next = new Set(prev);
      next.has(empId) ? next.delete(empId) : next.add(empId);
      return next;
    });
  };

  const removeRecipient = (empId: number) => {
    setSelectedIndividuals((prev) => {
      const next = new Set(prev);
      next.delete(empId);
      return next;
    });
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setSelectedTargets((prev) => {
        let toRemove: { level: OrgLevel; id: number }[] = [];
        
        if (emp.team_id) {
          toRemove.push({ level: "team", id: emp.team_id });
          const parents = findParentSectionOfTeam(emp.team_id);
          if (parents) {
            toRemove.push({ level: "section", id: parents.sec.id });
            toRemove.push({ level: "department", id: parents.dept.id });
          }
        }
        if (emp.section_id) {
          toRemove.push({ level: "section", id: emp.section_id });
          const parentDept = structure.find((d) => d.sections.some((s) => s.id === emp.section_id));
          if (parentDept) {
            toRemove.push({ level: "department", id: parentDept.id });
          }
        }
        if (emp.department_id) {
          toRemove.push({ level: "department", id: emp.department_id });
        }
        
        return prev.filter(
          (t) => !toRemove.some((r) => r.level === t.level && r.id === t.id)
        );
      });
    }
  };

  const toggleDept = (id: number) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSection = (id: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTeam = (id: number) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasAnySelection = selectedTargets.length > 0 || selectedIndividuals.size > 0;

  const handleSend = async () => {
    if (!message.trim() || resolvedRecipients.length === 0 || sending) return;
    setSending(true);
    try {
      await apiClient.post("/notifications/send", {
        recipient_ids: resolvedRecipients,
        title: "הודעה קבוצתית",
        description: message.trim(),
      });
      toast.success(`ההודעה נשלחה בהצלחה ל-${resolvedRecipients.length} נמענים`);
      setMessage("");
      setSelectedTargets([]);
      setSelectedIndividuals(new Set());
      onClose();
    } catch (err) {
      toast.error("שגיאה בשליחת ההודעה הקבוצתית");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage("");
    setSelectedTargets([]);
    setSelectedIndividuals(new Set());
    setSearchQuery("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[400]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 top-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-[95vw] md:w-[950px] lg:w-[1000px] max-h-[90vh] bg-card border-none rounded-3xl shadow-2xl z-[500] flex flex-col overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="relative p-4 sm:p-8 pb-3 sm:pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
              <div className="flex flex-row items-center gap-3 sm:gap-6">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0 rotate-3">
                  <Users className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5 text-right">
                  <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight mb-0.5 sm:mb-1">
                    שליחת הודעה קבוצתית
                  </h3>
                  <p className="text-[10px] sm:text-sm font-bold text-muted-foreground italic leading-tight">
                    בחר יחידות או אנשים ספציפיים לשליחה מרוכזת בזמן אמת בלוח הבקרה
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="absolute top-4 left-4 p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-all"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 bg-background/50">
              {/* Left: Org Tree Picker */}
              <div className="flex flex-col w-full md:w-1/2 h-[42vh] md:h-auto border-b md:border-b-0 md:border-l border-border/50 overflow-hidden bg-muted/10 shrink-0">
                {/* Search + hint */}
                <div className="p-3 border-b border-border/40 shrink-0 space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      placeholder="חיפוש יחידה..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-9 h-9 text-xs font-bold bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                    <UserCheck className="w-3 h-3 shrink-0" />
                    <span>לחץ על ✓ ליחידה שלמה, או פתח חוליה ובחר אנשים ספציפיים</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {filteredStructure.length === 0 && (
                    <div className="flex items-center justify-center h-24 opacity-40">
                      <p className="text-xs font-bold text-muted-foreground">לא נמצאו יחידות</p>
                    </div>
                  )}
                  {filteredStructure.map((dept) => (
                    <DepartmentRow
                      key={dept.id}
                      dept={dept}
                      expanded={expandedDepts.has(dept.id)}
                      expandedSections={expandedSections}
                      expandedTeams={expandedTeams}
                      onToggleDept={() => toggleDept(dept.id)}
                      onToggleSection={toggleSection}
                      onToggleTeam={toggleTeam}
                      isTargetSelected={isTargetSelected}
                      onToggleTarget={toggleTarget}
                      employees={employees}
                      currentUserId={Number(user?.id)}
                      isIndividualSelected={isIndividualSelected}
                      onToggleIndividual={toggleIndividual}
                    />
                  ))}
                </div>
              </div>

              {/* Right: Selected Targets & Message */}
              <div className="flex flex-col w-full md:w-1/2 p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                {/* Recipients Preview */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      נמענים
                    </span>
                    {resolvedRecipients.length > 0 && (
                      <span className="text-[10px] font-black bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-2 py-0.5 rounded-full">
                        {resolvedRecipients.length} נמענים
                      </span>
                    )}
                  </div>

                  {resolvedRecipients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-28 opacity-30 gap-2 bg-muted/20 rounded-2xl border border-dashed border-border p-4">
                      <Users2 className="w-8 h-8 text-muted-foreground" />
                      <p className="text-[10px] font-bold text-muted-foreground text-center">
                        בחר יחידה או אנשים ספציפיים מהרשימה
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {recipientEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-background border border-border/50 group hover:border-primary/30 transition-all"
                        >
                          <div className="w-8 h-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center font-black text-[11px] shrink-0">
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] font-black text-foreground truncate">
                              {emp.first_name} {emp.last_name}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium truncate">
                              {emp.team_name || emp.section_name || emp.department_name || "—"}
                            </span>
                          </div>
                          {/* Remove button */}
                          <button
                            onClick={() => removeRecipient(emp.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-destructive/10 text-destructive flex items-center justify-center transition-all hover:bg-destructive/20 shrink-0"
                            title="הסר מהרשימה"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="shrink-0 space-y-4">
                  {!hasAnySelection && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-[10px] font-bold">יש לבחור לפחות יחידה או אדם אחד</p>
                    </div>
                  )}
                  <textarea
                    placeholder="כתוב כאן את ההודעה הקבוצתית..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full min-h-[70px] md:min-h-[120px] resize-none bg-muted/30 border-border/50 rounded-2xl p-3.5 sm:p-5 text-xs sm:text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all custom-scrollbar leading-relaxed"
                    dir="rtl"
                  />

                  {/* Security Warning */}
                  <div className="hidden md:flex items-start gap-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 mt-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-normal font-black tracking-tight opacity-70 text-right">
                      הודעה זו תישלח בתוך המערכת בלבד ותוצג לנמענים בכניסתם הבאה.
                      מומלץ להימנע משליחת פרטים רגישים ביותר שאינם תואמים את רמת
                      הסיווג של עמדת המחשב.
                    </p>
                  </div>

                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || resolvedRecipients.length === 0 || sending}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-30 text-base gap-3 mt-4"
                  >
                    {sending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        שלח ל-{resolvedRecipients.length > 0 ? resolvedRecipients.length : "..."} נמענים
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ---- Sub-components ----

interface DeptRowProps {
  dept: DepartmentNode;
  expanded: boolean;
  expandedSections: Set<number>;
  expandedTeams: Set<number>;
  onToggleDept: () => void;
  onToggleSection: (id: number) => void;
  onToggleTeam: (id: number) => void;
  isTargetSelected: (level: OrgLevel, id: number) => boolean;
  onToggleTarget: (t: OrgTarget) => void;
  employees: Employee[];
  currentUserId: number;
  isIndividualSelected: (id: number) => boolean;
  onToggleIndividual: (id: number) => void;
}

const DepartmentRow: React.FC<DeptRowProps> = ({
  dept,
  expanded,
  expandedSections,
  expandedTeams,
  onToggleDept,
  onToggleSection,
  onToggleTeam,
  isTargetSelected,
  onToggleTarget,
  employees,
  currentUserId,
  isIndividualSelected,
  onToggleIndividual,
}) => {
  const selected = isTargetSelected("department", dept.id);

  // Get active members of this department who don't belong to any section
  const directMembers = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.department_id === dept.id &&
          !e.section_id &&
          e.is_active &&
          Number(e.id) !== currentUserId
      ),
    [employees, dept.id, currentUserId]
  );

  return (
    <div>
      <div className="flex items-center gap-1.5 group">
        {/* Checkbox */}
        <button
          onClick={() => onToggleTarget({ level: "department", id: dept.id, name: dept.name })}
          className={cn(
            "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border/60 hover:border-primary"
          )}
        >
          {selected && <Check className="w-3 h-3" />}
        </button>
        {/* Expand button */}
        <button
          onClick={onToggleDept}
          className="flex-1 flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors text-right"
        >
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-black text-foreground flex-1 truncate">{dept.name}</span>
          <span className="text-[9px] font-bold text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-full shrink-0">
            מחלקה
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pr-4 pl-1 mt-0.5 space-y-0.5"
          >
            {dept.sections.map((sec) => (
              <SectionRow
                key={sec.id}
                sec={sec}
                expanded={expandedSections.has(sec.id)}
                expandedTeams={expandedTeams}
                onToggleSection={() => onToggleSection(sec.id)}
                onToggleTeam={onToggleTeam}
                isTargetSelected={isTargetSelected}
                onToggleTarget={onToggleTarget}
                employees={employees}
                currentUserId={currentUserId}
                isIndividualSelected={isIndividualSelected}
                onToggleIndividual={onToggleIndividual}
              />
            ))}
            
            {/* Direct Department Members */}
            {directMembers.map((emp) => {
              const indivSelected = isIndividualSelected(emp.id);
              const coveredByUnit = selected;
              return (
                <button
                  key={emp.id}
                  onClick={() => {
                    if (!coveredByUnit) onToggleIndividual(emp.id);
                  }}
                  disabled={coveredByUnit}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all text-right border",
                    coveredByUnit
                      ? "opacity-50 cursor-default border-transparent"
                      : indivSelected
                        ? "bg-primary/5 border-primary/20"
                        : "border-transparent hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                      coveredByUnit
                        ? "bg-primary/30 border-primary/30"
                        : indivSelected
                          ? "bg-primary border-primary text-white"
                          : "border-border/60"
                    )}
                  >
                    {(indivSelected || coveredByUnit) && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[9px] shrink-0">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <span className="text-[11px] font-bold text-foreground flex-1 truncate">
                    {emp.first_name} {emp.last_name}
                  </span>
                  {coveredByUnit && (
                    <span className="text-[9px] text-primary/60 font-bold shrink-0">כלול ביחידה</span>
                  )}
                </button>
              );
            })}

            {dept.sections.length === 0 && directMembers.length === 0 && (
              <p className="text-[10px] text-muted-foreground font-bold py-1 px-2 opacity-50">אין מדורים או עובדים ישירים</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SectionRowProps {
  sec: SectionNode;
  expanded: boolean;
  expandedTeams: Set<number>;
  onToggleSection: () => void;
  onToggleTeam: (id: number) => void;
  isTargetSelected: (level: OrgLevel, id: number) => boolean;
  onToggleTarget: (t: OrgTarget) => void;
  employees: Employee[];
  currentUserId: number;
  isIndividualSelected: (id: number) => boolean;
  onToggleIndividual: (id: number) => void;
}

const SectionRow: React.FC<SectionRowProps> = ({
  sec,
  expanded,
  expandedTeams,
  onToggleSection,
  onToggleTeam,
  isTargetSelected,
  onToggleTarget,
  employees,
  currentUserId,
  isIndividualSelected,
  onToggleIndividual,
}) => {
  const selected = isTargetSelected("section", sec.id);

  // Get active members of this section who don't belong to any team
  const directMembers = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.section_id === sec.id &&
          !e.team_id &&
          e.is_active &&
          Number(e.id) !== currentUserId
      ),
    [employees, sec.id, currentUserId]
  );

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggleTarget({ level: "section", id: sec.id, name: sec.name })}
          className={cn(
            "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            selected
              ? "bg-primary/80 border-primary/80 text-white"
              : "border-border/60 hover:border-primary/80"
          )}
        >
          {selected && <Check className="w-3 h-3" />}
        </button>
        <button
          onClick={onToggleSection}
          className="flex-1 flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/40 transition-colors text-right"
        >
          <Layers className="w-3.5 h-3.5 text-primary/80 shrink-0" />
          <span className="text-xs font-bold text-foreground flex-1 truncate">{sec.name}</span>
          <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded-full shrink-0">
            מדור
          </span>
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pr-4 pl-1 mt-0.5 space-y-0.5"
          >
            {sec.teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                expanded={expandedTeams.has(team.id)}
                onToggleExpand={() => onToggleTeam(team.id)}
                isTargetSelected={isTargetSelected}
                onToggleTarget={onToggleTarget}
                employees={employees}
                currentUserId={currentUserId}
                isIndividualSelected={isIndividualSelected}
                onToggleIndividual={onToggleIndividual}
              />
            ))}

            {/* Direct Section Members */}
            {directMembers.map((emp) => {
              const indivSelected = isIndividualSelected(emp.id);
              const coveredByUnit = selected;
              return (
                <button
                  key={emp.id}
                  onClick={() => {
                    if (!coveredByUnit) onToggleIndividual(emp.id);
                  }}
                  disabled={coveredByUnit}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all text-right border",
                    coveredByUnit
                      ? "opacity-50 cursor-default border-transparent"
                      : indivSelected
                        ? "bg-primary/5 border-primary/20"
                        : "border-transparent hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                      coveredByUnit
                        ? "bg-primary/30 border-primary/30"
                        : indivSelected
                          ? "bg-primary border-primary text-white"
                          : "border-border/60"
                    )}
                  >
                    {(indivSelected || coveredByUnit) && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[9px] shrink-0">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <span className="text-[11px] font-bold text-foreground flex-1 truncate">
                    {emp.first_name} {emp.last_name}
                  </span>
                  {coveredByUnit && (
                    <span className="text-[9px] text-primary/60 font-bold shrink-0">כלול ביחידה</span>
                  )}
                </button>
              );
            })}

            {sec.teams.length === 0 && directMembers.length === 0 && (
              <p className="text-[10px] text-muted-foreground font-bold py-1 px-2 opacity-50">אין חוליות או עובדים ישירים</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TeamRowProps {
  team: TeamNode;
  expanded: boolean;
  onToggleExpand: () => void;
  isTargetSelected: (level: OrgLevel, id: number) => boolean;
  onToggleTarget: (t: OrgTarget) => void;
  employees: Employee[];
  currentUserId: number;
  isIndividualSelected: (id: number) => boolean;
  onToggleIndividual: (id: number) => void;
}

const TeamRow: React.FC<TeamRowProps> = ({
  team,
  expanded,
  onToggleExpand,
  isTargetSelected,
  onToggleTarget,
  employees,
  currentUserId,
  isIndividualSelected,
  onToggleIndividual,
}) => {
  const selected = isTargetSelected("team", team.id);

  // Get active members of this team (excluding current user)
  const teamMembers = useMemo(
    () =>
      employees.filter(
        (e) => e.team_id === team.id && e.is_active && Number(e.id) !== currentUserId
      ),
    [employees, team.id, currentUserId]
  );

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-xl transition-all border",
          selected
            ? "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30"
            : "border-transparent"
        )}
      >
        {/* Whole-team checkbox */}
        <button
          onClick={() => onToggleTarget({ level: "team", id: team.id, name: team.name })}
          className={cn(
            "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ml-1",
            selected
              ? "bg-primary/65 border-primary/65 text-white"
              : "border-border/60 hover:border-primary/60"
          )}
        >
          {selected && <Check className="w-3 h-3" />}
        </button>

        {/* Expand to see individuals */}
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 transition-colors text-right"
        >
          <Users2 className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          <span className="text-xs font-bold text-foreground flex-1 truncate">{team.name}</span>
          <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded-full shrink-0">
            {teamMembers.length} חברים
          </span>
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          )}
        </button>
      </div>

      {/* Individual team members */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pr-6 pl-1 mt-0.5 space-y-0.5"
          >
            {teamMembers.length === 0 && (
              <p className="text-[10px] text-muted-foreground font-bold py-1 px-2 opacity-50">אין חברים</p>
            )}
            {teamMembers.map((emp) => {
              const indivSelected = isIndividualSelected(emp.id);
              // If the whole team is already selected, show them as "included" (indeterminate style)
              const coveredByUnit = selected;
              return (
                <button
                  key={emp.id}
                  onClick={() => {
                    if (!coveredByUnit) onToggleIndividual(emp.id);
                  }}
                  disabled={coveredByUnit}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all text-right border",
                    coveredByUnit
                      ? "opacity-50 cursor-default border-transparent"
                      : indivSelected
                        ? "bg-primary/5 border-primary/20"
                        : "border-transparent hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                      coveredByUnit
                        ? "bg-primary/30 border-primary/30"
                        : indivSelected
                          ? "bg-primary border-primary text-white"
                          : "border-border/60"
                    )}
                  >
                    {(indivSelected || coveredByUnit) && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[9px] shrink-0">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <span className="text-[11px] font-bold text-foreground flex-1 truncate">
                    {emp.first_name} {emp.last_name}
                  </span>
                  {coveredByUnit && (
                    <span className="text-[9px] text-primary/60 font-bold shrink-0">כלול ביחידה</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
