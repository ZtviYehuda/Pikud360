import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  User,
  AlertCircle,
  ArrowLeft,
  Filter,
  Check,
  CheckCircle2,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/employee.types";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BulkStatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSuccess?: () => void;
  initialSelectedIds?: number[];
  alertContext?: any;
  selectedDate?: Date;
  isReportedCheck?: (emp: Employee, date: Date) => boolean;
}

interface UpdateState {
  status_id: number;
  status_name: string;
  color: string;
  isChanged: boolean;
  touched: boolean;
  start_date?: string | null;
  end_date?: string | null;
  note?: string;
}

export const BulkStatusUpdateModal: React.FC<BulkStatusUpdateModalProps> = ({
  open,
  onOpenChange,
  employees,
  onSuccess,
  initialSelectedIds = [],
  alertContext,
  selectedDate = new Date(),
  isReportedCheck,
}) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { getStatusTypes, logBulkStatus, getServiceTypes } = useEmployees();
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  const [filterTeamId, setFilterTeamId] = useState<string>("all");
  const [filterSectionId, setFilterSectionId] = useState<string>("all");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchStatusId, setBatchStatusId] = useState<string>("");
  const [batchNote, setBatchNote] = useState<string>("");

  // Local state for temporary changes before submission
  const [bulkUpdates, setBulkUpdates] = useState<Record<number, UpdateState>>(
    {},
  );
  const [showWarning, setShowWarning] = useState(false);

  const isWeekend = selectedDate.getDay() === 5 || selectedDate.getDay() === 6;

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setFetching(true);
        const [sTypes, servTypes] = await Promise.all([
          getStatusTypes(),
          getServiceTypes(),
        ]);
        setStatusTypes(sTypes);
        setServiceTypes(servTypes || []);
        setFetching(false);
      };
      fetchData();

      // Initialize bulkUpdates with current statuses
      const initial: Record<number, UpdateState> = {};
      employees.forEach((emp) => {
        initial[emp.id] = {
          status_id: emp.status_id || 0,
          status_name: emp.status_name || "ללא סטטוס",
          color: emp.status_color || "#e2e8f0",
          isChanged: false,
          touched: false,
          start_date: emp.start_date
            ? emp.start_date.split("T")[0]
            : new Date().toISOString().split("T")[0],
          end_date: emp.end_date ? emp.end_date.split("T")[0] : null,
          note: "",
        };
      });
      setBulkUpdates(initial);

      // Handle Initial Selection
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
        setShowSelectedOnly(true);
      } else {
        setSelectedIds([]);
        setShowSelectedOnly(false);
      }

      setFilterSectionId("all");
      setFilterTeamId("all");
      setBatchStatusId("");
      setBatchNote("");

      // If we have missing ids from alert, pre-select them all
      if (alertContext?.missing_ids) {
        setSelectedIds(alertContext.missing_ids);
      }
    }
  }, [
    open,
    getStatusTypes,
    getServiceTypes,
    employees,
    initialSelectedIds,
    alertContext,
  ]);

  const uniqueSections = useMemo(() => {
    const sectionsMap = new Map();
    employees.forEach((e) => {
      if (e.section_id && e.section_name) {
        sectionsMap.set(e.section_id, e.section_name);
      }
    });
    return Array.from(sectionsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const uniqueTeams = useMemo(() => {
    const teamsMap = new Map();
    employees.forEach((e) => {
      if (e.team_id && e.team_name) {
        teamsMap.set(e.team_id, e.team_name);
      }
    });
    return Array.from(teamsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const filteredList = useMemo(() => {
    return employees.filter((emp) => {
      // If we have alertContext (missing ids), strictly hide anyone not in that list
      if (
        alertContext?.missing_ids &&
        !alertContext.missing_ids.includes(emp.id)
      ) {
        return false;
      }

      if (showSelectedOnly && !selectedIds.includes(emp.id)) return false;

      const matchesSearch =
        `${emp.first_name} ${emp.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(emp.username).includes(searchTerm);

      const matchesService =
        filterServiceType === "all" ||
        emp.service_type_id?.toString() === filterServiceType;

      const matchesSection =
        filterSectionId === "all" ||
        emp.section_id?.toString() === filterSectionId;

      const matchesTeam =
        filterTeamId === "all" || emp.team_id?.toString() === filterTeamId;

      return matchesSearch && matchesService && matchesSection && matchesTeam;
    });
  }, [
    employees,
    searchTerm,
    filterServiceType,
    filterSectionId,
    filterTeamId,
    showSelectedOnly,
    selectedIds,
    alertContext,
  ]);

  const handleSubmit = async () => {
    setLoading(true);

    const updates: any[] = [];
    const hasSelectionOrMod =
      selectedIds.length > 0 ||
      Object.values(bulkUpdates).some((u) => u.touched || u.isChanged);

    employees.forEach((emp) => {
      const data = bulkUpdates[emp.id];
      if (!data) return;

      const isSelected = selectedIds.includes(emp.id);
      const isVisible = filteredList.some((e) => e.id === emp.id);
      const isModified = data.touched || data.isChanged;
      // Skip updates for unselected/unmodified if they have no valid status (id 0)
      if (data.status_id === 0 && !isModified) return;

      const shouldUpdate =
        isSelected || isModified || (!hasSelectionOrMod && isVisible);

      if (shouldUpdate && data.status_id !== 0) {
        updates.push({
          employee_id: emp.id,
          status_type_id: data.status_id,
          start_date: data.start_date,
          end_date: data.end_date,
          note: data.note,
        });
      }
    });

    if (updates.length === 0) {
      toast.error("אין עדכונים לביצוע");
      setLoading(false);
      return;
    }

    const success = await logBulkStatus(updates);

    if (success) {
      const updatedCount = updates.length;
      if (updatedCount === 1) {
        toast.success("הסטטוס עודכן בהצלחה");
      } else if (updatedCount === employees.length) {
        toast.success(`כלל הסטטוסים עודכנו בהצלחה (${updatedCount} שוטרים)`);
      } else {
        toast.success(`${updatedCount} סטטוסים עודכנו בהצלחה`);
      }
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleUpdateIndividual = (empId: number, statusId: string) => {
    const type = statusTypes.find((t) => t.id.toString() === statusId);
    const original = employees.find((e) => e.id === empId);

    if (type) {
      setBulkUpdates((prev) => ({
        ...prev,
        [empId]: {
          ...prev[empId],
          status_id: type.id,
          status_name: type.name,
          color: type.color,
          isChanged: type.id !== original?.status_id,
          touched: true,
        },
      }));
    }
  };

  const handleDateChange = (
    empId: number,
    field: "start_date" | "end_date",
    value: string,
  ) => {
    setBulkUpdates((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value, touched: true },
    }));
  };

  const handleNoteChange = (empId: number, note: string) => {
    setBulkUpdates((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], note, touched: true },
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredList.map((e) => e.id);
      const newSelection = Array.from(new Set([...selectedIds, ...visibleIds]));
      setSelectedIds(newSelection);
    } else {
      const visibleIds = filteredList.map((e) => e.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleBatchStatusChange = (val: string) => {
    setBatchStatusId(val);
    if (!val || selectedIds.length === 0) return;

    const type = statusTypes.find((t) => t.id.toString() === val);
    if (!type) return;

    setBulkUpdates((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        const original = employees.find((e) => e.id === id);
        next[id] = {
          ...next[id],
          status_id: type.id,
          status_name: type.name,
          color: type.color,
          isChanged: type.id !== original?.status_id,
          touched: true,
          note: type.name === "אחר" ? batchNote : next[id].note,
          start_date:
            next[id]?.start_date || new Date().toISOString().split("T")[0],
        };
      });
      return next;
    });
  };

  const handleBatchDateChange = (
    field: "start_date" | "end_date",
    value: string,
  ) => {
    if (selectedIds.length === 0) return;

    setBulkUpdates((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = {
          ...next[id],
          [field]: value,
          touched: true,
        };
      });
      return next;
    });
  };

  const handleBatchNoteChange = (note: string) => {
    setBatchNote(note);
    if (!batchStatusId || selectedIds.length === 0) return;
    setBulkUpdates((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id].status_id.toString() === batchStatusId) {
          next[id] = { ...next[id], note, touched: true };
        }
      });
      return next;
    });
  };

  const handleRevert = (empId: number) => {
    const original = employees.find((e) => e.id === empId);
    if (!original) return;

    // Strict parsing of original status
    const originalStatusId = original.status_id
      ? Number(original.status_id)
      : 0;

    setBulkUpdates((prev) => ({
      ...prev,
      [empId]: {
        status_id: originalStatusId,
        status_name: originalStatusId === 0 ? "" : original.status_name || "",
        color: originalStatusId === 0 ? "" : original.status_color || "",
        start_date: original.start_date
          ? original.start_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        end_date: original.end_date ? original.end_date.split("T")[0] : null,
        note: "",
        isChanged: false,
        touched: false,
      },
    }));

    if (selectedIds.includes(empId)) {
      handleSelectOne(empId, false);
    }
  };

  const handleCloseAttempt = () => {
    const hasChanges = Object.values(bulkUpdates).some(
      (u) => u.touched || u.isChanged,
    );
    if (hasChanges) {
      setShowWarning(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => (!v ? handleCloseAttempt() : onOpenChange(v))}
      >
        <DialogContent
          className="sm:h-[85vh] sm:w-[95vw] sm:max-w-7xl sm:rounded-3xl"
          dir="rtl"
        >
          <DialogDragHandle />
          {/* Sticky Header */}
          <div className="flex-none p-4 sm:p-6 border-b border-border/40 bg-background/80 backdrop-blur-xl z-20">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                    ניהול ועדכון נוכחות
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm font-bold text-muted-foreground mt-0.5">
                    {filteredList.length} מתוך {employees.length} שוטרים מופיעים
                    {selectedIds.length > 0 && ` • ${selectedIds.length} נבחרו`}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 dark:text-white/50 group-focus-within:text-primary dark:group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    placeholder="חיפוש שם או מ''א..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 bg-muted/20 border border-border/40 rounded-xl pr-10 pl-4 text-sm font-bold focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/40 outline-none transition-all dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/40 dark:focus:bg-white/10 dark:focus:border-white/20"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 px-3 rounded-xl border-dashed flex items-center gap-2 font-bold text-xs transition-all",
                        "dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:border-white/30",
                        (filterServiceType !== "all" ||
                          filterSectionId !== "all" ||
                          filterTeamId !== "all") &&
                          "bg-primary/5 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/50 dark:text-primary-foreground",
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      סינון
                      {(filterServiceType !== "all" ||
                        filterSectionId !== "all" ||
                        filterTeamId !== "all") && (
                        <div className="w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                          {
                            [
                              filterServiceType !== "all",
                              filterSectionId !== "all",
                              filterTeamId !== "all",
                            ].filter(Boolean).length
                          }
                        </div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 p-4 rounded-2xl  border-border/40"
                    align="end"
                    dir="rtl"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                          פילטרים
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] font-bold"
                          onClick={() => {
                            setFilterServiceType("all");
                            setFilterSectionId("all");
                            setFilterTeamId("all");
                          }}
                        >
                          נקה הכל
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {/* Service Type Filter */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black mr-1 text-muted-foreground/60 uppercase">
                            מעמד
                          </Label>
                          <Select
                            value={filterServiceType}
                            onValueChange={setFilterServiceType}
                          >
                            <SelectTrigger className="h-9 bg-muted/30 border-border/40 rounded-xl font-bold text-xs group-focus:ring-2 text-right">
                              <SelectValue placeholder="כל המעמדות" />
                            </SelectTrigger>
                            <SelectContent
                              dir="rtl"
                              className="max-h-[250px] rounded-xl"
                            >
                              <SelectItem
                                value="all"
                                className="text-xs font-bold"
                              >
                                כל המעמדות
                              </SelectItem>
                              {serviceTypes.map((t) => (
                                <SelectItem
                                  key={t.id}
                                  value={t.id.toString()}
                                  className="text-xs font-bold"
                                >
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Section Filter - Visible for Admin and Dept Commanders */}
                        {(user?.is_admin ||
                          (user?.is_commander && !user?.section_id)) &&
                          uniqueSections.length > 0 && (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black mr-1 text-muted-foreground/60 uppercase">
                                מדור
                              </Label>
                              <Select
                                value={filterSectionId}
                                onValueChange={setFilterSectionId}
                              >
                                <SelectTrigger className="h-9 bg-muted/30 border-border/40 rounded-xl font-bold text-xs text-right">
                                  <SelectValue placeholder="כל המדורים" />
                                </SelectTrigger>
                                <SelectContent
                                  dir="rtl"
                                  className="max-h-[250px] rounded-xl"
                                >
                                  <SelectItem
                                    value="all"
                                    className="text-xs font-bold"
                                  >
                                    כל המדורים
                                  </SelectItem>
                                  {uniqueSections.map((s) => (
                                    <SelectItem
                                      key={s.id}
                                      value={s.id.toString()}
                                      className="text-xs font-bold"
                                    >
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                        {/* Team Filter - Visible if not locked to one team */}
                        {(user?.is_admin ||
                          (user?.is_commander && !user?.team_id)) &&
                          uniqueTeams.length > 0 && (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black mr-1 text-muted-foreground/60 uppercase">
                                חוליה
                              </Label>
                              <Select
                                value={filterTeamId}
                                onValueChange={setFilterTeamId}
                              >
                                <SelectTrigger className="h-9 bg-muted/30 border-border/40 rounded-xl font-bold text-xs text-right">
                                  <SelectValue placeholder="כל החוליות" />
                                </SelectTrigger>
                                <SelectContent
                                  dir="rtl"
                                  className="max-h-[250px] rounded-xl"
                                >
                                  <SelectItem
                                    value="all"
                                    className="text-xs font-bold"
                                  >
                                    כל החוליות
                                  </SelectItem>
                                  {uniqueTeams.map((t) => (
                                    <SelectItem
                                      key={t.id}
                                      value={t.id.toString()}
                                      className="text-xs font-bold"
                                    >
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <button
                  onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                  className={cn(
                    "px-3 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0",
                    showSelectedOnly
                      ? "bg-primary text-primary-foreground  "
                      : "bg-muted/30 text-muted-foreground border border-border/40 hover:bg-muted/50",
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {showSelectedOnly ? "נבחרים" : "הכל"}
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/5">
            {fetching ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  טוען...
                </span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 py-20">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 opacity-20" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">
                  לא נמצאו תוצאות
                </span>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden lg:block w-full overflow-hidden rounded-2xl border border-border/40  bg-background/50">
                  <Table className="table-fixed w-full">
                    <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[25%] text-right font-black text-[11px] text-muted-foreground uppercase tracking-wider px-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              className="w-5 h-5 rounded-[6px] border-muted-foreground/40"
                              checked={
                                filteredList.length > 0 &&
                                selectedIds.length === filteredList.length
                              }
                              onCheckedChange={(checked) =>
                                handleSelectAll(checked as boolean)
                              }
                            />
                            <span>שוטר</span>
                          </div>
                        </TableHead>
                        <TableHead className="w-[30%] text-right font-black text-[11px] text-muted-foreground uppercase tracking-wider px-4">
                          סטטוס
                        </TableHead>
                        <TableHead className="w-[45%] text-right font-black text-[11px] text-muted-foreground uppercase tracking-wider px-4">
                          תאריכים
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredList.map((emp) => {
                        const current = bulkUpdates[emp.id];
                        const isSelected = selectedIds.includes(emp.id);

                        // Safe guard for desktop as well
                        if (!current) return null;

                        const hasStatus = current.status_id !== 0;

                        return (
                          <TableRow
                            key={emp.id}
                            className={cn(
                              "group transition-all border-b border-border/[0.06] last:border-0 relative",
                              isSelected
                                ? "bg-primary/[0.02] hover:bg-primary/[0.04] "
                                : "hover:bg-muted/40",
                              !hasStatus && !isSelected && "bg-amber-[50]/10",
                            )}
                          >
                            <TableCell className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectOne(emp.id, !isSelected);
                                  }}
                                  className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[11px] shrink-0 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm",
                                    isSelected
                                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                      : "bg-primary/5 text-primary border border-primary/10 hover:border-primary/40 hover:bg-primary/10 dark:bg-primary/10 dark:text-primary-foreground dark:border-primary/20",
                                  )}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    emp.is_admin ? "💬" : `${emp.first_name[0]}${emp.last_name[0]}`
                                  )}
                                </div>
                                <div className="flex flex-col justify-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/employees/${emp.id}`);
                                    }}
                                    className={cn(
                                      "font-bold text-sm leading-tight transition-colors hover:underline text-right hover:text-primary",
                                      isSelected
                                        ? "text-primary"
                                        : "text-foreground",
                                    )}
                                  >
                                    {emp.dominant_name
                                      ? `${emp.dominant_name} ${emp.last_name}`
                                      : `${emp.first_name} ${emp.last_name}`}
                                  </button>
                                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                    {(emp.is_commander || emp.is_admin) && (
                                      <span className="bg-muted/50 px-1.5 py-0.5 rounded-md tracking-wider font-mono">
                                        {emp.username}
                                      </span>
                                    )}
                                    {emp.service_type_name && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span>{emp.service_type_name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 align-middle">
                              <Select
                                value={
                                  current.status_id !== 0
                                    ? current.status_id.toString()
                                    : undefined
                                }
                                onValueChange={(val) =>
                                  handleUpdateIndividual(emp.id, val)
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-10 w-full bg-background border border-border/60 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-bold transition-all text-right dark:bg-white/5 dark:border-white/10 dark:text-white",
                                    current.status_id !== 0 &&
                                      "border-primary/30 bg-primary/5 dark:bg-primary/20 dark:border-primary/50",
                                  )}
                                >
                                  <div className="flex items-center justify-start gap-2.5 w-full truncate">
                                    <SelectValue placeholder="בחר סטטוס" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent
                                  dir="rtl"
                                  className="max-h-[250px]"
                                >
                                  {statusTypes.map((type) => (
                                    <SelectItem
                                      key={type.id}
                                      value={type.id.toString()}
                                      className="text-xs font-bold"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{
                                            backgroundColor: type.color,
                                          }}
                                        />
                                        {type.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="py-3 px-4 align-middle min-w-[320px]">
                              {hasStatus &&
                              (current.isChanged || current.touched) ? (
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRevert(emp.id)}
                                    className="h-10 px-3 flex items-center gap-2 rounded-xl bg-destructive/[0.06] text-destructive border border-destructive/10 hover:bg-destructive/10 hover:border-destructive/20 transition-all active:scale-95 group/rev"
                                    title="בטל שינויים לשורה זו"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="group-hover/rev:-rotate-90 transition-transform"
                                    >
                                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                                      <path d="M3 3v9h9" />
                                    </svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">
                                      ביטול
                                    </span>
                                  </button>

                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div className="relative group/input">
                                      <span className="absolute -top-2 right-3 px-1.5 text-[9px] font-black text-muted-foreground/60 bg-background z-10 scale-90 group-focus-within/input:text-primary transition-colors">
                                        התחלה
                                      </span>
                                      <input
                                        type="date"
                                        value={current.start_date || ""}
                                        onChange={(e) =>
                                          handleDateChange(
                                            emp.id,
                                            "start_date",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full h-10 rounded-xl border border-border/60 bg-background/50 hover:bg-background hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-[11px] font-black px-3 outline-none transition-all "
                                      />
                                    </div>
                                    <div className="relative group/input">
                                      <span className="absolute -top-2 right-3 px-1.5 text-[9px] font-black text-muted-foreground/60 bg-background z-10 scale-90 group-focus-within/input:text-primary transition-colors">
                                        סיום
                                      </span>
                                      <input
                                        type="date"
                                        value={current.end_date || ""}
                                        onChange={(e) =>
                                          handleDateChange(
                                            emp.id,
                                            "end_date",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full h-10 rounded-xl border border-border/60 bg-background/50 hover:bg-background hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-[11px] font-black px-3 outline-none transition-all "
                                      />
                                    </div>
                                    {current.status_name === "אחר" && (
                                      <div className="relative group/input col-span-2 mt-1">
                                        <span className="absolute -top-2 right-3 px-1.5 text-[9px] font-black text-muted-foreground/60 bg-background z-10 scale-90 group-focus-within/input:text-primary transition-colors">
                                          הערה
                                        </span>
                                        <input
                                          type="text"
                                          placeholder="הזן הערה (חובה)"
                                          value={current.note || ""}
                                          onChange={(e) =>
                                            handleNoteChange(
                                              emp.id,
                                              e.target.value,
                                            )
                                          }
                                          className="w-full h-10 rounded-xl border border-border/60 bg-background/50 hover:bg-background hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-[11px] font-black px-3 outline-none transition-all "
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                  isReportedCheck
                                    ? isReportedCheck(emp, selectedDate)
                                    : hasStatus
                                ) ? (
                                <div className="flex items-center justify-start h-10">
                                  <div className="group/badge px-4 py-2 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-default  hover:-100/50">
                                    <div className="flex items-center gap-2.5">
                                      <div className="relative">
                                        <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur-sm group-hover/badge:opacity-100 opacity-0 transition-opacity" />
                                        <div className="relative w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-emerald-600"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                                          דווח בהצלחה
                                        </span>
                                        <span className="text-[9px] font-bold text-emerald-600/60 mt-0.5 leading-none">
                                          הנתונים מסונכרנים
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {emp.status_id ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 gap-2 font-black px-4 transition-all active:scale-95 group/confirm"
                                      onClick={() =>
                                        handleUpdateIndividual(
                                          emp.id,
                                          emp.status_id!.toString(),
                                        )
                                      }
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 group-hover/confirm:scale-110 transition-transform" />
                                      <span className="text-[10px] whitespace-nowrap">
                                        המשך ב{emp.status_name}
                                      </span>
                                    </Button>
                                  ) : (
                                    <div className="flex items-center gap-2 text-amber-500/50 px-2 group/empty">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover/empty:animate-ping" />
                                      <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/empty:opacity-100 transition-opacity">
                                        טרם דווח
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card List View - Compact & Clean - FIXED LAYOUT */}
                {/* Mobile Card List View - High-End Redesign */}
                <div className="lg:hidden flex flex-col p-4 gap-4 pb-32">
                  <div className="flex items-center justify-between px-1">
                    <div
                      className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-primary/[0.04] border border-primary/20 active:scale-95 transition-all cursor-pointer "
                      onClick={() =>
                        handleSelectAll(
                          selectedIds.length !== filteredList.length,
                        )
                      }
                    >
                      <Checkbox
                        checked={
                          filteredList.length > 0 &&
                          selectedIds.length === filteredList.length
                        }
                        onCheckedChange={(c) => handleSelectAll(!!c)}
                        className="w-5 h-5 rounded-lg"
                      />
                      <span className="text-xs font-black text-primary uppercase tracking-widest">
                        בחר הכל ({filteredList.length})
                      </span>
                    </div>

                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] pr-2">
                      רשימת שוטרים
                    </span>
                  </div>

                  {filteredList.map((emp) => {
                    const current = bulkUpdates[emp.id];
                    const isSelected = selectedIds.includes(emp.id);
                    if (!current) return null;

                    const statusColor = current.color || "#e2e8f0";
                    const hasStatus = current.status_id !== 0;

                    return (
                      <div
                        key={emp.id}
                        className={cn(
                          "group rounded-[2rem] border transition-all relative bg-background overflow-hidden",
                          isSelected
                            ? "border-primary/40   ring-1 ring-primary/20 -translate-y-1"
                            : "border-border/40 ",
                        )}
                      >
                        {/* Compact Header */}
                        <div className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOne(emp.id, !isSelected);
                              }}
                              className={cn(
                                "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm",
                                isSelected
                                  ? "bg-primary text-primary-foreground rotate-3 shadow-md shadow-primary/20"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80",
                              )}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                emp.is_admin ? "💬" : `${emp.first_name[0]}${emp.last_name[0]}`
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/employees/${emp.id}`);
                                }}
                                className={cn(
                                  "font-black text-[15px] leading-tight truncate px-0.5 hover:underline text-right hover:text-primary",
                                  isSelected
                                    ? "text-primary"
                                    : "text-foreground",
                                )}
                              >
                                {emp.dominant_name
                                  ? `${emp.dominant_name} ${emp.last_name}`
                                  : `${emp.first_name} ${emp.last_name}`}
                              </button>
                              <div className="flex items-center gap-2 mt-0.5">
                                {(emp.is_commander || emp.is_admin) && (
                                  <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tighter">
                                    {emp.username}
                                  </span>
                                )}
                                {hasStatus && (
                                  <div
                                    className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                                    style={{
                                      backgroundColor: `${statusColor}15`,
                                      color: statusColor,
                                      border: `1px solid ${statusColor}30`,
                                    }}
                                  >
                                    {current.status_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>


                        </div>

                        {/* Editor Content */}
                        <div
                          className={cn(
                            "px-4 pb-4 space-y-3 transition-all",
                            isSelected
                              ? "bg-primary/5 border-t border-primary/10 pt-4"
                              : "bg-muted/[0.03] pt-0 border-none",
                          )}
                        >
                          <div className="relative">
                            <Select
                              value={
                                current.status_id !== 0
                                  ? current.status_id.toString()
                                  : undefined
                              }
                              onValueChange={(val) =>
                                handleUpdateIndividual(emp.id, val)
                              }
                            >
                              <SelectTrigger className="h-12 w-full bg-background border-border/60 rounded-2xl text-xs font-black  text-right">
                                <SelectValue placeholder="עדכן סטטוס..." />
                              </SelectTrigger>
                              <SelectContent dir="rtl" className="rounded-2xl ">
                                {statusTypes
                                  .filter((t) => {
                                    if (isWeekend)
                                      return (
                                        t.name.includes("תגבור") ||
                                        t.name.includes("אחר")
                                      );
                                    return true;
                                  })
                                  .map((t) => (
                                    <SelectItem
                                      key={t.id}
                                      value={t.id.toString()}
                                      className="text-xs font-bold py-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{ backgroundColor: t.color }}
                                        />
                                        {t.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-muted-foreground/60 uppercase mr-1">
                                התחלה
                              </label>
                              <input
                                type="date"
                                value={current.start_date || ""}
                                onChange={(e) =>
                                  handleDateChange(
                                    emp.id,
                                    "start_date",
                                    e.target.value,
                                  )
                                }
                                className="w-full h-10 bg-background border border-border/40 rounded-xl px-3 text-[11px] font-black outline-none focus:border-primary/50 dark:bg-white/5 dark:border-white/10 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-muted-foreground/60 uppercase mr-1">
                                סיום
                              </label>
                              <input
                                type="date"
                                value={current.end_date || ""}
                                onChange={(e) =>
                                  handleDateChange(
                                    emp.id,
                                    "end_date",
                                    e.target.value,
                                  )
                                }
                                className="w-full h-10 bg-background border border-border/40 rounded-xl px-3 text-[11px] font-black outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                              />
                            </div>
                          </div>

                          {current.status_name === "אחר" && (
                            <div className="space-y-1 mt-3">
                              <label className="text-[9px] font-black text-muted-foreground/60 uppercase mr-1">
                                הערה
                              </label>
                              <input
                                type="text"
                                placeholder="הזן הערה (חובה)"
                                value={current.note || ""}
                                onChange={(e) =>
                                  handleNoteChange(emp.id, e.target.value)
                                }
                                className="w-full h-10 bg-background border border-border/40 rounded-xl px-3 text-[11px] font-black outline-none focus:border-primary/50 dark:bg-white/5 dark:border-white/10 dark:text-white"
                              />
                            </div>
                          )}

                          {current.isChanged && (
                            <button
                              onClick={() => handleRevert(emp.id)}
                              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-destructive/[0.05] text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/10 active:scale-95 transition-all mt-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                                <path d="M3 3v9h9" />
                              </svg>
                              אפס שינויים
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Floating Action Bar (Sticky Footer) */}
          <div className="flex-none p-4 sm:p-6 border-t border-border/40 bg-background/91 backdrop-blur-xl z-20  focus-within: transition-all">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              {/* Batch Selection Controls */}
              {selectedIds.length > 0 ? (
                <div className="flex items-center gap-4 bg-primary/[0.04] px-4 py-2.5 rounded-2xl border border-primary/20 ">
                  <div className="relative group/num">
                    <div className="absolute -inset-1.5 bg-primary/20 rounded-full blur-md opacity-0 group-hover/num:opacity-100 transition-opacity" />
                    <div className="relative flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground text-xs font-black rounded-full   ring-4 ring-primary/10 transition-transform group-hover/num:rotate-12">
                      {selectedIds.length}
                    </div>
                  </div>

                  <div className="w-px h-6 bg-primary/10 mx-0.5 hidden sm:block" />

                  <div className="flex-1 sm:flex-none flex items-center gap-3">
                    <Select
                      value={batchStatusId}
                      onValueChange={handleBatchStatusChange}
                    >
                      <SelectTrigger className="h-10 min-w-[170px] bg-background border-primary/20 text-xs font-black rounded-xl hover:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all pr-4 text-right dark:bg-white/5 dark:border-white/10 dark:text-white">
                        <SelectValue placeholder="עדכון סטטוס מרוכז..." />
                      </SelectTrigger>
                      <SelectContent
                        dir="rtl"
                        className="max-h-[300px] rounded-2xl  border-primary/10"
                      >
                        {statusTypes
                          .filter((t) => {
                            if (isWeekend)
                              return (
                                t.name.includes("תגבור") ||
                                t.name.includes("אחר")
                              );
                            return true;
                          })
                          .map((t) => (
                            <SelectItem
                              key={t.id}
                              value={t.id.toString()}
                              className="text-xs font-bold py-2.5"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-2.5 h-2.5 rounded-full "
                                  style={{ backgroundColor: t.color }}
                                />
                                {t.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <div className="hidden lg:flex items-center gap-2">
                      <div className="w-px h-6 bg-border/60 mx-1" />
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        תאריכים:
                      </span>
                      <input
                        type="date"
                        className="h-10 w-[140px] bg-background border border-border/40 rounded-xl px-3 text-xs font-black outline-none focus:border-primary/40 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
                        onChange={(e) =>
                          handleBatchDateChange("start_date", e.target.value)
                        }
                      />
                      <span className="text-muted-foreground/30 font-light">
                        -
                      </span>
                      <input
                        type="date"
                        className="h-10 w-[140px] bg-background border border-border/40 rounded-xl px-3 text-xs font-black outline-none focus:border-primary/40 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
                        placeholder="סיום"
                        onChange={(e) =>
                          handleBatchDateChange("end_date", e.target.value)
                        }
                      />
                    </div>

                    {statusTypes.find((t) => t.id.toString() === batchStatusId)
                      ?.name === "אחר" && (
                      <div className="hidden lg:flex items-center gap-2">
                        <div className="w-px h-6 bg-border/60 mx-1" />
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          הערה:
                        </span>
                        <input
                          type="text"
                          value={batchNote}
                          placeholder="הזן הערה"
                          onChange={(e) =>
                            handleBatchNoteChange(e.target.value)
                          }
                          className="h-10 w-[140px] bg-background border border-border/40 rounded-xl px-3 text-xs font-black outline-none focus:border-primary/40 transition-all dark:bg-white/5 dark:border-white/10 dark:text-white"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        selectedIds.forEach((id) => handleRevert(id))
                      }
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/[0.06] text-destructive border border-destructive/10 hover:bg-destructive/10 hover:border-destructive/20 transition-all hover:rotate-12 active:scale-90"
                      title="אפס בחירה"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                        <path d="M3 3v9h9" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3 py-2 px-4 rounded-full bg-muted/30 border border-border/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    לא נבחרו שוטרים לעדכון
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-2 sm:mt-0">
                {selectedIds.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleSelectAll(true)}
                    className="flex-1 sm:flex-none border-dashed border-primary/30 text-primary hover:bg-primary/5 h-11 sm:h-10 rounded-xl text-xs font-black group transition-all"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5 group-hover:scale-125 transition-transform" />
                    בחר הכל
                  </Button>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    (!Object.values(bulkUpdates).some(
                      (u) => u.touched || u.isChanged,
                    ) &&
                      batchStatusId === "")
                  }
                  className="flex-1 sm:flex-none h-11 sm:h-10 px-8 rounded-xl font-black text-sm   hover: active:scale-95 transition-all order-last sm:order-none bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      מעדכן...
                    </div>
                  ) : (
                    "שמור שינויים"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCloseAttempt}
                  className="flex-1 sm:flex-none sm:hidden h-11 rounded-xl font-black text-xs border-border/60 hover:bg-muted/50 transition-all"
                >
                  ביטול
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-destructive/20  z-[100] gap-0">
          <div className="bg-destructive/5 p-6 flex flex-col items-center justify-center text-center gap-2 border-b border-destructive/10">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-black text-destructive">
              יש שינויים שלא נשמרו!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              אם תצא עכשיו, כל השינויים שביצעת יאבדו.
              <br />
              האם אתה בטוח שברצונך לצאת ללא שמירה?
            </DialogDescription>
          </div>
          <div className="p-4 bg-background flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowWarning(false)}
              className="font-bold flex-1 sm:flex-none"
            >
              המשך עריכה
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowWarning(false);
                onOpenChange(false);
              }}
              className="font-bold gap-2 flex-1 sm:flex-none"
            >
              צא ללא שמירה
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
