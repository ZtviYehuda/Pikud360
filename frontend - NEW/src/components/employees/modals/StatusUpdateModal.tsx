import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDragHandle,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Sun,
  Activity,
  GraduationCap,
  Shield,
  Car,
  Plane,
  UserCheck,
  Briefcase,
  CalendarDays,
  UserPlus,
  Home,
  Building2,
  MapPin,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/employee.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
  selectedDate?: Date;
}

const getStatusIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n === "מהבית" || n.includes("בית")) return Home;
  if (n === "מתקן חיצוני" || n.includes("מתקן") || n.includes("חיצוני"))
    return Building2;
  if (n === "שטח" || n.includes("שטח")) return MapPin;
  if (n.includes("נוכח") || n.includes("משרד") || n.includes("ביחידה"))
    return UserCheck;
  if (n.includes("חופשה") || n.includes("חופש")) return Sun;
  if (n.includes("מחלה") || n.includes("גימל") || n.includes("ביקור רופא"))
    return Activity;
  if (n.includes("קורס") || n.includes("הדרכה")) return GraduationCap;
  if (n.includes("אבטחה") || n.includes("תורנות") || n.includes("שמירה"))
    return Shield;
  if (n.includes("חוץ") || n.includes("נסיעה") || n.includes("בתפקיד"))
    return Car;
  if (n.includes('חו"ל') || n.includes("טיסה")) return Plane;
  return Briefcase;
};

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  open,
  onOpenChange,
  employee,
  onSuccess,
  selectedDate,
}) => {
  const { user, refreshUser } = useAuthContext();
  const {
    getStatusTypes,
    logStatus,
    getDelegationCandidates,
    cancelDelegation,
  } = useEmployees();
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Delegation State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegateId, setDelegateId] = useState("");

  const [formData, setFormData] = useState({
    status_type_id: "",
    start_date: "",
    end_date: "",
    note: "",
  });

  // Build parent/child hierarchy from flat status types list
  const parentStatuses = useMemo(
    () => statusTypes.filter((s: any) => !s.parent_status_id),
    [statusTypes],
  );

  const subStatusMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    statusTypes.forEach((s: any) => {
      if (s.parent_status_id) {
        const key = s.parent_status_id.toString();
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    });
    return map;
  }, [statusTypes]);

  const isWeekendDay = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 5 || day === 6; // 5=Fri, 6=Sat
  };

  const isWeekend = isWeekendDay(formData.start_date);

  const visibleParents = useMemo(() => {
    let list: any[] = [];
    const officeParent = parentStatuses.find(
      (p: any) => p.name === "משרד" && !p.parent_status_id,
    );
    if (officeParent) {
      list.push(officeParent);
    }
    parentStatuses.forEach((p: any) => {
      if (p.name !== "משרד") {
        list.push(p);
      }
    });

    if (isWeekend) {
      return list.filter(
        (t: any) => t.name.includes("תגבור") || t.name.includes("אחר"),
      );
    }
    return list;
  }, [parentStatuses, isWeekend]);

  const selectedType = useMemo(
    () =>
      statusTypes.find((s: any) => s.id.toString() === formData.status_type_id),
    [statusTypes, formData.status_type_id],
  );

  const activeParentId = useMemo(() => {
    if (!selectedType) return null;
    return selectedType.parent_status_id
      ? selectedType.parent_status_id.toString()
      : selectedType.id.toString();
  }, [selectedType]);

  const requiresDelegation = false;

  const [delegationResult, setDelegationResult] = useState<{
    delegateName: string;
    personalNumber: string;
    tempPassword: string;
    phoneNumber?: string;
  } | null>(null);

  useEffect(() => {
    if (open && !delegationResult) {
      const fetchTypes = async () => {
        setFetching(true);
        const types = await getStatusTypes();
        setStatusTypes(types);
        setFetching(false);
      };
      fetchTypes();

      const defaultDateObj = selectedDate || new Date();
      const localYear = defaultDateObj.getFullYear();
      const localMonth = String(defaultDateObj.getMonth() + 1).padStart(2, '0');
      const localDay = String(defaultDateObj.getDate()).padStart(2, '0');
      const defaultDateStr = `${localYear}-${localMonth}-${localDay}`;

      setFormData({
        status_type_id: "",
        start_date: defaultDateStr,
        end_date: "",
        note: "",
      });
      setIsDelegating(false);
      setDelegateId("");

      if (user?.is_commander && employee?.id === user.id) {
        getDelegationCandidates().then(setCandidates);
      }
    }
  }, [open, user?.id, employee?.id, selectedDate]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setDelegationResult(null), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleRevokeDelegation = async () => {
    setLoading(true);
    const ok = await cancelDelegation();
    if (ok) {
      toast.success("סמכויות הפיקוד הוחזרו אליך");
      await refreshUser();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } else {
      toast.error("ביטול ההאצלה נכשל");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!employee || !formData.status_type_id) {
      toast.error("אנא בחר סטטוס");
      return;
    }

    setLoading(true);
    const result = await logStatus({
      employee_id: employee.id,
      status_type_id: parseInt(formData.status_type_id),
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      note: formData.note || undefined,
      delegation:
        isDelegating && delegateId
          ? { delegate_id: parseInt(delegateId) }
          : undefined,
    });

    if (result && result.success) {
      if (result.delegation) {
        const delegate = candidates.find((c) => c.id.toString() === delegateId);
        setDelegationResult({
          delegateName: `${delegate?.first_name} ${delegate?.last_name}`,
          personalNumber: delegate?.username || "",
          tempPassword: result.delegation.temp_password,
          phoneNumber: delegate?.phone_number,
        });
        toast.success("המינוי בוצע בהצלחה");
      } else {
        toast.success("הסטטוס עודכן בהצלחה");
        onOpenChange(false);
      }

      if (isDelegating && delegateId) await refreshUser();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  if (!employee) return null;

  // Get the currently selected status for the footer button
  const selectedStatus = statusTypes.find(
    (s) => s.id.toString() === formData.status_type_id,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full h-auto max-h-[92svh] sm:h-auto sm:max-h-[85vh] sm:w-[95vw] sm:max-w-[760px] p-0 border-none sm:border border-border/40 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-none rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col"
        dir="rtl"
        showCloseButton={false}
      >
        <DialogDragHandle />
        {delegationResult ? (
          // View 2: Delegation Result
          <div className="p-8 space-y-8 text-center relative max-w-[480px] mx-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 border-2 border-emerald-500/20">
                <Shield className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground">
                  המפקד עודכן!
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  פרטי גישה זמניים נוצרו עבור המחליף
                </p>
              </div>
            </div>

            <div className="p-6 bg-muted/40 rounded-3xl border border-border/50 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="space-y-4 relative z-10">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center w-full">
                    שם המחליף
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {delegationResult.delegateName}
                  </span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                      שם משתמש
                    </span>
                    <span className="text-xl font-mono font-black text-primary">
                      {delegationResult.personalNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                      סיסמה זמנית
                    </span>
                    <span className="text-xl font-mono font-black text-primary tabular-nums tracking-widest bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                      {delegationResult.tempPassword}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-right">
              <div className="p-2 bg-amber-500/10 rounded-xl h-fit">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                שים לב: פרטי הגישה יהיו בתוקף אך ורק בטווח התאריכים שהגדרת. לאחר
                מכן, הגישה תיחסם אוטומטית.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  const text = `שלום ${delegationResult.delegateName}, מונית כממלא מקום מפקד החוליה.\n\nפרטי התחברות למערכת:\nשם משתמש: ${delegationResult.personalNumber}\nסיסמה זמנית: ${delegationResult.tempPassword}\n\nבהצלחה!`;
                  if (delegationResult.phoneNumber) {
                    const cleanPhone = delegationResult.phoneNumber.replace(
                      /\D/g,
                      "",
                    );
                    const finalPhone = cleanPhone.startsWith("0")
                      ? "972" + cleanPhone.slice(1)
                      : cleanPhone;
                    window.open(
                      `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`,
                      "_blank",
                    );
                    toast.success("פותח וואטסאפ...");
                  } else {
                    navigator.clipboard.writeText(text);
                    toast.success("אין מספר טלפון - הפרטים הועתקו ללוח");
                  }
                  onOpenChange(false);
                }}
                className="w-full h-14 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                שלח בוואטסאפ
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const text = `שלום ${delegationResult.delegateName}, מונית כממלא מקום מפקד החוליה.\n\nפרטי התחברות למערכת:\nשם משתמש: ${delegationResult.personalNumber}\nסיסמה זמנית: ${delegationResult.tempPassword}\n\nבהצלחה!`;
                  navigator.clipboard.writeText(text);
                  toast.success("הפרטים הועתקו ללוח");
                  onOpenChange(false);
                }}
                className="w-full h-14 rounded-2xl font-black text-sm border-2 gap-2 hover:bg-muted/50"
              >
                העתק וסגור
              </Button>
            </div>
          </div>
        ) : (
          // View 1: Status Update Form
          <>
            {/* ── Slim inline header ── */}
            <div className="px-4 pt-3 pb-3 sm:px-5 sm:pt-4 sm:pb-3 border-b border-border/30 text-right shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                  {employee.is_admin ? "💬" : `${employee.first_name[0]}${employee.last_name[0]}`}
                  {employee.status_color && (
                    <span
                      className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-card"
                      style={{ backgroundColor: employee.status_color }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-[14px] font-black text-foreground leading-none mb-0.5">
                    {employee.first_name} {employee.last_name}
                  </DialogTitle>
                  <div className="flex items-center gap-1.5">
                    {(employee.is_commander || employee.is_admin) && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {employee.username}
                      </span>
                    )}
                    {employee.status_name && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor:
                              (employee.status_color || "#94a3b8") + "22",
                            color: employee.status_color || "#94a3b8",
                          }}
                        >
                          {employee.status_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
                {/* Unified Status Picker Section */}
                {fetching ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                    <span className="text-xs text-muted-foreground font-bold italic">
                      טוען סטטוסים...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {isWeekend ? 'אפשרויות לסופ"ש' : "בחירת סטטוס דיווח"}
                      </p>
                      {user?.is_commander && (
                        <span className="text-[9px] font-bold text-primary/60 italic">
                          לבחירה מהירה
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {visibleParents.map((type: any) => {
                        const Icon = getStatusIcon(type.name);
                        const sel = activeParentId === type.id.toString();
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                status_type_id: type.id.toString(),
                              }))
                            }
                            className={cn(
                              "flex flex-col items-center justify-center gap-0.5 sm:gap-1.5 p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all text-center h-full min-h-[50px] sm:min-h-[80px] group relative overflow-visible shadow-[0_2px_8px_rgba(0,0,0,0.02)]",
                              sel
                                ? "border-transparent text-white scale-[1.01]"
                                : "bg-background/50 dark:bg-slate-900/40 border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30",
                            )}
                            style={
                              sel
                                ? {
                                    backgroundColor: type.color,
                                    boxShadow: `0 10px 25px -5px ${type.color}44`,
                                  }
                                : {}
                            }
                          >
                            <div
                              className={cn(
                                "w-6.5 h-6.5 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center shrink-0 transition-all",
                                sel
                                  ? "bg-white/20 rotate-12"
                                  : "bg-muted/70 group-hover:bg-primary/10 group-hover:scale-110",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "w-3 h-3 sm:w-4.5 sm:h-4.5 transition-colors",
                                  sel
                                    ? "text-white"
                                    : "text-muted-foreground group-hover:text-primary",
                                )}
                              />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span
                                className={cn(
                                  "text-[9.5px] sm:text-[11px] font-black leading-tight tracking-tight px-0.5",
                                  sel ? "text-white" : "text-foreground/80",
                                )}
                              >
                                {type.name === "חופשה חול" ||
                                type.name === 'חופשה חו"ל'
                                  ? "חו' חול"
                                  : type.name}
                              </span>
                            </div>
                            {sel &&
                              formData.status_type_id ===
                                type.id.toString() && (
                                <div className="absolute top-1 left-1 w-3.5 h-3.5 sm:top-2 sm:left-2 sm:w-4 sm:h-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                  <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                                </div>
                              )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sub Statuses - Minimalist Pills */}
                    {activeParentId &&
                      subStatusMap[activeParentId] &&
                      subStatusMap[activeParentId].length > 0 && (
                        <div
                          key={`sub-${activeParentId}`}
                          className="mt-2 flex flex-wrap items-center justify-center gap-1.5 py-1 px-1 bg-muted/20 dark:bg-slate-900/30 rounded-2xl border border-border/20"
                        >
                          {subStatusMap[activeParentId].map((sub: any) => {
                            const SubIcon = getStatusIcon(sub.name);
                            const isSubSel =
                              formData.status_type_id === sub.id.toString();
                            const activeParent = parentStatuses.find(
                              (p: any) => p.id.toString() === activeParentId,
                            );
                            const parentColor = activeParent?.color || "#3b82f6";
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() =>
                                  setFormData((p) => ({
                                    ...p,
                                    status_type_id: sub.id.toString(),
                                  }))
                                }
                                className={cn(
                                  "flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all text-[10px] font-bold",
                                  isSubSel
                                    ? "shadow-sm border-transparent"
                                    : "bg-background/60 border-border/40 text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
                                )}
                                style={
                                  isSubSel
                                    ? {
                                        backgroundColor: parentColor + "1a", // 10% opacity
                                        borderColor: parentColor,
                                        color: parentColor,
                                      }
                                    : {}
                                }
                              >
                                <SubIcon className="w-3 h-3" />
                                <span>
                                  {sub.name === "חופשה חול" ||
                                  sub.name === 'חופשה חו"ל'
                                    ? "חו' חול"
                                    : sub.name}
                                </span>
                                {isSubSel && (
                                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}

                <div className="h-px bg-border/40" />

                {/* ── Details & Delegation Section (Balanced Two Columns) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
                  {/* Column 1: Date Range */}
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground/80 mr-0.5 uppercase tracking-widest">
                          מתאריך
                        </Label>
                        <div className="relative group">
                          <CalendarDays className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none transition-colors group-focus-within:text-primary" />
                          <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                start_date: e.target.value,
                              }))
                            }
                            className="h-8 sm:h-9.5 bg-muted/20 border border-border/40 rounded-lg text-right pr-8 pl-2.5 text-[11px] sm:text-xs font-bold text-foreground focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/45 outline-none transition-all w-full dark:bg-white/5 dark:border-white/10 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground/80 mr-0.5 uppercase tracking-widest">
                          עד תאריך
                        </Label>
                        <div className="relative group">
                          <CalendarDays className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 pointer-events-none transition-colors group-focus-within:text-primary" />
                          <Input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                end_date: e.target.value,
                              }))
                            }
                            className="h-8 sm:h-9.5 bg-muted/20 border border-border/40 rounded-lg text-right pr-8 pl-2.5 text-[11px] sm:text-xs font-bold text-foreground focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/45 outline-none transition-all w-full dark:bg-white/5 dark:border-white/10 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div> {/* end Column 1 */}

                  {/* Column 2: Note & Delegation */}
                  <div className="space-y-3.5">
                    {/* Note */}
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground/80 mr-0.5 uppercase tracking-widest">
                        הערה
                      </Label>
                      <div className="relative group">
                        <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none transition-colors group-focus-within:text-primary" />
                        <Input
                          value={formData.note}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, note: e.target.value }))
                          }
                          placeholder="הוסף הערה אופציונלית..."
                          className="h-8 sm:h-9.5 bg-muted/20 border border-border/40 rounded-lg text-right pr-8 pl-2.5 text-[11px] sm:text-xs font-bold text-foreground focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/45 outline-none transition-all placeholder:text-muted-foreground/35 w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                        />
                      </div>
                    </div>

                    {/* Delegation Section */}
                    {user?.is_commander &&
                      !user?.is_temp_commander &&
                      employee?.id === user.id &&
                      selectedType &&
                      !selectedType.is_presence && (
                        <div className="pt-1.5 border-t border-border/40">
                          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl p-2.5 border border-primary/10 space-y-2.5">
                            {employee.active_delegate_id ? (
                              <div className="flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                  <Label className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                                    <div className="p-1 bg-amber-100 rounded-lg">
                                      <UserPlus className="w-3 h-3" />
                                    </div>
                                    פיקוד מואצל פעיל
                                  </Label>
                                  <p className="text-[9px] text-muted-foreground font-medium">
                                    האצלת ל:{" "}
                                    <span className="font-black text-foreground">
                                      {candidates.find(
                                        (c) =>
                                          c.id === employee.active_delegate_id,
                                      )?.first_name || "ממלא מקום"}
                                    </span>
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 rounded-lg border-amber-600/20 bg-amber-600/10 text-amber-700 hover:bg-amber-600 hover:text-white transition-all text-[10px] font-black whitespace-nowrap"
                                  onClick={handleRevokeDelegation}
                                  disabled={loading}
                                >
                                  ביטול
                                </Button>
                              </div>
                            ) : (
                              (() => {
                                if (candidates.length === 0) return null;

                                return (
                                  <>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="space-y-0.5">
                                        <Label className="text-[11px] font-black text-primary flex items-center gap-1.5 tracking-tight">
                                          <div className="p-1 bg-primary/10 rounded-lg">
                                            <UserPlus className="w-3 h-3" />
                                          </div>
                                          מינוי מפקד מחליף
                                        </Label>
                                        <p className="text-[9px] text-muted-foreground font-medium">
                                          {requiresDelegation
                                            ? "חובה למנות מחליף לסטטוס שאינו נוכח"
                                            : "מינוי נציג שיחליף אותך?"}
                                        </p>
                                      </div>
                                      <Switch
                                        checked={isDelegating}
                                        onCheckedChange={setIsDelegating}
                                        disabled={requiresDelegation}
                                        className="scale-75 data-[state=checked]:bg-primary shrink-0"
                                      />
                                    </div>
                                    {isDelegating && (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                            בחר מחליף
                                          </Label>
                                          {requiresDelegation && !delegateId && (
                                            <span className="text-[9px] font-black text-destructive animate-pulse">
                                              * חובה לבחור מחליף
                                            </span>
                                          )}
                                        </div>
                                        <Select
                                          value={delegateId}
                                          onValueChange={setDelegateId}
                                          dir="rtl"
                                        >
                                          <SelectTrigger className="h-8 rounded-lg bg-background border-primary/20 text-right dark:bg-slate-900 dark:text-white text-[11px]">
                                            <SelectValue placeholder="בחר ממלא מקום..." />
                                          </SelectTrigger>
                                          <SelectContent dir="rtl">
                                            {candidates.map((c) => (
                                              <SelectItem
                                                key={c.id}
                                                value={c.id.toString()}
                                              >
                                                <div className="flex items-center justify-between w-[250px] sm:w-[320px] text-xs">
                                                  <div className="flex items-center gap-1">
                                                    <span className="font-bold">
                                                      {c.first_name} {c.last_name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                      ({c.username})
                                                    </span>
                                                  </div>
                                                  <span className={cn(
                                                    "text-[9px] px-1.5 py-0.5 rounded-full font-black ml-6",
                                                    c.is_other_commander 
                                                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                  )}>
                                                    {c.is_other_commander ? "מפקד" : "חייל"}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      )}
                  </div> {/* end Column 2 */}
                </div> {/* end grid */}
              </div>
            </div>

            {/* ── Pinned Footer — safe area ── */}
            <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-4 sm:pt-3 border-t border-border/30 shrink-0 bg-background/50 backdrop-blur-md">
              <Button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !formData.status_type_id ||
                  (isDelegating && !delegateId)
                }
                className={cn(
                  "w-full h-10 sm:h-11 rounded-xl font-black text-xs sm:text-sm gap-2 transition-all active:scale-[0.98] disabled:opacity-30 shadow-none",
                  selectedStatus
                    ? "text-white"
                    : "bg-primary text-primary-foreground",
                )}
                style={
                  selectedStatus
                    ? { backgroundColor: selectedStatus.color }
                    : {}
                }
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {selectedStatus
                  ? `עדכן ל${selectedStatus.name}`
                  : "בחר סטטוס תחילה"}
              </Button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full text-[10px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1.5 text-center"
              >
                ביטול
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
