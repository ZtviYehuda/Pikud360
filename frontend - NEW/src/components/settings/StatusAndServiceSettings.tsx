import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Layers,
  Edit2,
  Plus,
  RotateCcw,
  Save,
  Check,
  X,
  Trash2,
  AlertCircle,
  Tag,
  Palette,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ServiceType {
  id: string;
  name: string;
  is_custom?: boolean;
}

export interface SubStatus {
  id: string;
  name: string;
}

export interface AttendanceStatusType {
  id: string;
  name: string;
  category: "PRESENT" | "ABSENCE" | "EVENT" | "OTHER";
  color?: string;
  is_default?: boolean;
  sub_statuses?: SubStatus[];
  is_custom?: boolean;
}

const PRESET_COLORS = [
  "#10B981", // Green - Office / Present
  "#F59E0B", // Amber - Vacation
  "#6366F1", // Indigo - Sick
  "#8B5CF6", // Purple - Course
  "#3B82F6", // Blue - Reinforcement
  "#EC4899", // Pink - Abroad
  "#14B8A6", // Teal - Unit Day
  "#64748B", // Slate - Other
  "#EF4444", // Red - Emergency / Alert
  "#06B6D4", // Cyan - Special
  "#84CC16", // Lime
  "#F97316", // Orange
];

const CATEGORY_NAMES: Record<string, { label: string; color: string }> = {
  PRESENT: { label: "נוכחות פעילה", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  ABSENCE: { label: "היעדרות", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  EVENT: { label: "אירוע יחידתי", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  OTHER: { label: "אחר / כללי", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
};

export function StatusAndServiceSettings() {
  const [activeSubTab, setActiveSubTab] = useState<"statuses" | "serviceTypes">("statuses");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Statuses & Service Types State
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<AttendanceStatusType[]>([]);
  const [defaultServiceTypes, setDefaultServiceTypes] = useState<ServiceType[]>([]);
  const [defaultStatuses, setDefaultStatuses] = useState<AttendanceStatusType[]>([]);

  // Editing state for Attendance Status
  const [editingStatus, setEditingStatus] = useState<AttendanceStatusType | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newSubStatusName, setNewSubStatusName] = useState("");

  // Editing state for Service Type
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null);
  const [serviceTypeDialogOpen, setServiceTypeDialogOpen] = useState(false);

  // New item creators
  const [isAddingNewStatus, setIsAddingNewStatus] = useState(false);
  const [isAddingNewServiceType, setIsAddingNewServiceType] = useState(false);

  // Load configuration from server
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/settings/statuses-and-service-types");
      if (data.success) {
        setServiceTypes(data.service_types || []);
        setAttendanceStatuses(data.attendance_statuses || []);
        setDefaultServiceTypes(data.default_service_types || []);
        setDefaultStatuses(data.default_attendance_statuses || []);
      }
    } catch (err) {
      console.error("Failed to load statuses and service types settings:", err);
      toast.error("שגיאה בטעינת הגדרות סטטוסים ומעמד ארגוני");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save changes to server
  const handleSaveAll = async (
    customStatuses?: AttendanceStatusType[],
    customServices?: ServiceType[]
  ) => {
    setIsSaving(true);
    const statusesToSave = customStatuses || attendanceStatuses;
    const servicesToSave = customServices || serviceTypes;

    try {
      const { data } = await apiClient.post("/settings/statuses-and-service-types", {
        attendance_statuses: statusesToSave,
        service_types: servicesToSave,
      });

      if (data.success) {
        toast.success("ההגדרות נשמרו בהצלחה", {
          description: "שמות הסטטוסים והמעמד הארגוני עודכנו בכל המערכת",
        });
        setAttendanceStatuses(data.attendance_statuses);
        setServiceTypes(data.service_types);
      } else {
        toast.error(data.error || "שגיאה בשמירת הגדרות");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to system defaults
  const handleResetDefaults = async (target: "all" | "service_types" | "attendance_statuses") => {
    const label =
      target === "all"
        ? "כל הגדרות הסטטוסים והמעמד"
        : target === "service_types"
        ? "סוגי המעמד הארגוני"
        : "סטטוסי הנוכחות";

    if (!confirm(`האם אתה בטוח שברצונך לאפס את ${label} לברירת המחדל המקורית של המערכת?`)) {
      return;
    }

    setIsResetting(true);
    try {
      const { data } = await apiClient.post("/settings/reset-defaults", { target });
      if (data.success) {
        toast.success("ההגדרות אופסו לברירת המחדל בהצלחה");
        setAttendanceStatuses(data.attendance_statuses);
        setServiceTypes(data.service_types);
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה באיפוס ההגדרות");
    } finally {
      setIsResetting(false);
    }
  };

  // Edit / Save single Attendance Status
  const handleSaveStatusModal = () => {
    if (!editingStatus || !editingStatus.name.trim()) {
      toast.error("יש להזין שם תקין לסטטוס");
      return;
    }

    let updatedStatuses: AttendanceStatusType[];
    if (isAddingNewStatus) {
      const newId = `CUSTOM_${Date.now()}`;
      const newStatusItem: AttendanceStatusType = {
        ...editingStatus,
        id: newId,
        is_custom: true,
      };
      updatedStatuses = [...attendanceStatuses, newStatusItem];
    } else {
      updatedStatuses = attendanceStatuses.map((s) =>
        s.id === editingStatus.id ? editingStatus : s
      );
    }

    setAttendanceStatuses(updatedStatuses);
    setStatusDialogOpen(false);
    setEditingStatus(null);
    setIsAddingNewStatus(false);
    handleSaveAll(updatedStatuses, serviceTypes);
  };

  // Edit / Save single Service Type
  const handleSaveServiceTypeModal = () => {
    if (!editingServiceType || !editingServiceType.name.trim()) {
      toast.error("יש להזין שם תקין למעמד הארגוני");
      return;
    }

    let updatedServices: ServiceType[];
    if (isAddingNewServiceType) {
      const newId = `CUSTOM_${Date.now()}`;
      const newServiceItem: ServiceType = {
        id: newId,
        name: editingServiceType.name.trim(),
        is_custom: true,
      };
      updatedServices = [...serviceTypes, newServiceItem];
    } else {
      updatedServices = serviceTypes.map((s) =>
        s.id === editingServiceType.id ? { ...s, name: editingServiceType.name.trim() } : s
      );
    }

    setServiceTypes(updatedServices);
    setServiceTypeDialogOpen(false);
    setEditingServiceType(null);
    setIsAddingNewServiceType(false);
    handleSaveAll(attendanceStatuses, updatedServices);
  };

  // Delete / Remove custom item
  const handleDeleteStatus = (id: string) => {
    if (!confirm("האם למחוק סטטוס זה?")) return;
    const updated = attendanceStatuses.filter((s) => s.id !== id);
    setAttendanceStatuses(updated);
    handleSaveAll(updated, serviceTypes);
  };

  const handleDeleteServiceType = (id: string) => {
    if (!confirm("האם למחוק מעמד ארגוני זה?")) return;
    const updated = serviceTypes.filter((s) => s.id !== id);
    setServiceTypes(updated);
    handleSaveAll(attendanceStatuses, updated);
  };

  // Add sub-status to currently edited status
  const handleAddSubStatus = () => {
    if (!newSubStatusName.trim() || !editingStatus) return;
    const subList = editingStatus.sub_statuses || [];
    const newSub: SubStatus = {
      id: `SUB_${Date.now()}`,
      name: newSubStatusName.trim(),
    };
    setEditingStatus({
      ...editingStatus,
      sub_statuses: [...subList, newSub],
    });
    setNewSubStatusName("");
  };

  const handleRemoveSubStatus = (subId: string) => {
    if (!editingStatus) return;
    setEditingStatus({
      ...editingStatus,
      sub_statuses: (editingStatus.sub_statuses || []).filter((sub) => sub.id !== subId),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full animate-pulse">
        <div className="h-12 bg-muted/40 rounded-2xl w-full" />
        <div className="h-64 bg-muted/20 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full pb-12" dir="rtl">
      {/* Sleek Minimal Header */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
          סטטוסים ומעמד ארגוני
        </h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleResetDefaults(activeSubTab === "statuses" ? "attendance_statuses" : "service_types")
            }
            disabled={isResetting}
            className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-bold gap-1.5 rounded-xl border-border/40 hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            איפוס
          </Button>

          <Button
            size="sm"
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "שומר..." : "שמור שינויים"}
          </Button>
        </div>
      </div>

      {/* Segmented Sub-Tabs + Add Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
          <button
            onClick={() => setActiveSubTab("statuses")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeSubTab === "statuses"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            סטטוסי נוכחות ({attendanceStatuses.length})
          </button>

          <button
            onClick={() => setActiveSubTab("serviceTypes")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeSubTab === "serviceTypes"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            מעמד ארגוני ({serviceTypes.length})
          </button>
        </div>

        {activeSubTab === "statuses" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsAddingNewStatus(true);
              setEditingStatus({
                id: "",
                name: "",
                category: "PRESENT",
                color: "#10B981",
                sub_statuses: [],
              });
              setStatusDialogOpen(true);
            }}
            className="h-8 text-xs font-bold gap-1.5 rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            הוסף סטטוס
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsAddingNewServiceType(true);
              setEditingServiceType({
                id: "",
                name: "",
              });
              setServiceTypeDialogOpen(true);
            }}
            className="h-8 text-xs font-bold gap-1.5 rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            הוסף מעמד
          </Button>
        )}
      </div>

      {/* SUB-TAB 1: Attendance Statuses */}
      {activeSubTab === "statuses" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 pt-1">
          {attendanceStatuses.map((status) => {
            const defaultMatch = defaultStatuses.find((ds) => ds.id === status.id);
            const isRenamed = defaultMatch && defaultMatch.name !== status.name;
            const catInfo = CATEGORY_NAMES[status.category] || CATEGORY_NAMES.OTHER;

            return (
              <div
                key={status.id}
                className="p-3.5 rounded-2xl bg-card border border-border/40 hover:border-border/80 transition-all flex flex-col justify-between gap-2.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                      style={{ backgroundColor: status.color || "#64748B" }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-foreground truncate">{status.name}</span>
                        {isRenamed && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold text-primary border-primary/30 bg-primary/5">
                            מותאם
                          </Badge>
                        )}
                        {status.is_custom && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                            חדש
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingNewStatus(false);
                        setEditingStatus({ ...status, sub_statuses: status.sub_statuses || [] });
                        setStatusDialogOpen(true);
                      }}
                      className="h-7 w-7 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      title="ערוך"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>

                    {status.is_custom && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteStatus(status.id)}
                        className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="מחק"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Sub-statuses tags if any */}
                {status.sub_statuses && status.sub_statuses.length > 0 && (
                  <div className="pt-2 border-t border-border/20 flex flex-wrap items-center gap-1">
                    {status.sub_statuses.map((sub) => (
                      <span
                        key={sub.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-foreground/80 font-medium border border-border/30"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Category footer */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <Badge variant="outline" className={cn("text-[9px] font-bold py-0", catInfo.color)}>
                    {catInfo.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: Service Types */}
      {activeSubTab === "serviceTypes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 pt-1">
            {serviceTypes.map((st) => {
              const defaultMatch = defaultServiceTypes.find((ds) => ds.id === st.id);
              const isRenamed = defaultMatch && defaultMatch.name !== st.name;

              return (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-card border border-border/40 hover:border-border/80 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">{st.name}</span>
                        {isRenamed && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold text-primary border-primary/30 bg-primary/5">
                            מותאם
                          </Badge>
                        )}
                        {st.is_custom && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                            חדש
                          </Badge>
                        )}
                      </div>
                      {defaultMatch && defaultMatch.name !== st.name && (
                        <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                          במקור: {defaultMatch.name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingNewServiceType(false);
                          setEditingServiceType({ ...st });
                          setServiceTypeDialogOpen(true);
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                        title="ערוך שם"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      {st.is_custom && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteServiceType(st.id)}
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="מחק מעמד"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground/60 font-mono text-left" dir="ltr">
                    {st.id}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* DIALOG 1: Edit Attendance Status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              {isAddingNewStatus ? "הוספת סטטוס נוכחות חדש" : "עריכת סטטוס נוכחות"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              הגדר את שם הסטטוס, הצבע המזהה ותתי-הסטטוסים המשויכים אליו
            </DialogDescription>
          </DialogHeader>

          {editingStatus && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">שם הסטטוס</label>
                <Input
                  value={editingStatus.name}
                  onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                  placeholder="לדוגמה: משרד, חופשה, השתלמות..."
                  className="h-10 rounded-xl font-bold text-sm bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">קטגוריה</label>
                <select
                  value={editingStatus.category}
                  onChange={(e) =>
                    setEditingStatus({
                      ...editingStatus,
                      category: e.target.value as AttendanceStatusType["category"],
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-border/60 bg-background text-sm font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="PRESENT">נוכחות פעילה (Present)</option>
                  <option value="ABSENCE">היעדרות (Absence)</option>
                  <option value="EVENT">אירוע יחידתי (Event)</option>
                  <option value="OTHER">אחר / כללי (Other)</option>
                </select>
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>צבע מזהה</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{editingStatus.color}</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_COLORS.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setEditingStatus({ ...editingStatus, color: clr })}
                      className={cn(
                        "w-7 h-7 rounded-full transition-transform border border-black/10 flex items-center justify-center",
                        editingStatus.color?.toLowerCase() === clr.toLowerCase()
                          ? "scale-115 ring-2 ring-primary ring-offset-2"
                          : "hover:scale-105"
                      )}
                      style={{ backgroundColor: clr }}
                    >
                      {editingStatus.color?.toLowerCase() === clr.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-statuses manager */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>תתי-סטטוס (אופציונלי)</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {(editingStatus.sub_statuses || []).length} מוגדרים
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <Input
                    value={newSubStatusName}
                    onChange={(e) => setNewSubStatusName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubStatus();
                      }
                    }}
                    placeholder="שם תת-סטטוס"
                    className="h-9 rounded-xl text-xs font-bold bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSubStatus}
                    disabled={!newSubStatusName.trim()}
                    className="h-9 px-3 rounded-xl text-xs font-bold bg-muted hover:bg-primary hover:text-primary-foreground text-foreground shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    הוסף
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                  {(editingStatus.sub_statuses || []).map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-muted/80 text-foreground font-bold border border-border/40"
                    >
                      {sub.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubStatus(sub.id)}
                        className="text-muted-foreground hover:text-destructive p-0.5 rounded-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              className="h-10 rounded-xl font-bold text-xs"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveStatusModal}
              className="h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              אישור ושמירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Edit Service Type */}
      <Dialog open={serviceTypeDialogOpen} onOpenChange={setServiceTypeDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50 text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              {isAddingNewServiceType ? "הוספת מעמד ארגוני חדש" : "עריכת מעמד ארגוני"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              הגדר את שם המעמד כפי שיוצג בכרטיס העובד ובטבלאות המערכת
            </DialogDescription>
          </DialogHeader>

          {editingServiceType && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">שם המעמד הארגוני</label>
                <Input
                  value={editingServiceType.name}
                  onChange={(e) =>
                    setEditingServiceType({ ...editingServiceType, name: e.target.value })
                  }
                  placeholder='לדוגמה: קבע - קצין, שירות לאומי, שח"מ...'
                  className="h-10 rounded-xl font-bold text-sm bg-background"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => setServiceTypeDialogOpen(false)}
              className="h-10 rounded-xl font-bold text-xs"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveServiceTypeModal}
              className="h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              אישור ושמירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
