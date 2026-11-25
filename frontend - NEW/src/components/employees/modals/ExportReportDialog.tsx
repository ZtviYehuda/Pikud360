import { useState, useEffect } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Download,
  FileSpreadsheet,
  Filter,
  Info,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import apiClient from "@/config/api.client";
import { EMPLOYEES_EXPORT_ENDPOINT } from "@/config/employees.endpoints";
import { useDateContext } from "@/context/DateContext";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";
import { cn, extractErrorMessage } from "@/lib/utils";

import { FilterModal, type EmployeeFilters } from "./FilterModal";

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportReportDialog({
  open,
  onOpenChange,
}: ExportReportDialogProps) {
  const { selectedDate } = useDateContext();
  const [mode, setMode] = useState<"daily" | "range">("daily");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<EmployeeFilters>({});

  // Daily State - Initialize with selectedDate
  const [dailyDate, setDailyDate] = useState<Date | undefined>(selectedDate);

  // Range State - Initialize with current date
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: selectedDate,
    to: selectedDate,
  });

  const { employees, fetchEmployees } = useEmployees();

  // Fetch employees when filter modal opens
  useEffect(() => {
    if (filterModalOpen && employees.length === 0) {
      fetchEmployees();
    }
  }, [filterModalOpen]);

  // Update dailyDate when selectedDate changes
  useEffect(() => {
    setDailyDate(selectedDate);
  }, [selectedDate]);

  const handleDownload = async (forWhatsApp = false) => {
    try {
      console.log("Starting download...", { mode, dailyDate, dateRange });
      
      const params = new URLSearchParams();

      if (mode === "daily") {
        if (!dailyDate) {
          toast.error("נא לבחור תאריך");
          return;
        }
        params.append("date", format(dailyDate, "yyyy-MM-dd"));
      } else if (mode === "range") {
        if (!dateRange?.from || !dateRange?.to) {
          toast.error("נא לבחור טווח תאריכים");
          return;
        }
        params.append("start_date", format(dateRange.from, "yyyy-MM-dd"));
        params.append("end_date", format(dateRange.to, "yyyy-MM-dd"));
      } else {
        toast.error("נא לבחור תאריך או טווח תאריכים");
        return;
      }

      if (activeFilters.departments?.length)
        params.append("depts", activeFilters.departments.join(","));
      if (activeFilters.sections?.length)
        params.append("sects", activeFilters.sections.join(","));
      if (activeFilters.teams?.length)
        params.append("tms", activeFilters.teams.join(","));
      if (activeFilters.serviceTypes?.length)
        params.append("serviceTypes", activeFilters.serviceTypes.join(","));
      if (activeFilters.statuses?.length)
        params.append("statuses", activeFilters.statuses.join(","));

      const url = `${EMPLOYEES_EXPORT_ENDPOINT}?${params.toString()}`;
      console.log("Fetching from URL:", url);

      toast.loading("מוריד דוח...");
      
      const response = await apiClient.get(url, { responseType: "blob" });
      
      console.log("Response received:", response);
      
      // Check if response is actually a blob and not an error
      if (!response.data || response.data.size === 0) {
        toast.dismiss();
        toast.error("הדוח ריק או לא נמצא");
        return;
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const fileName =
        mode === "daily" && dailyDate
          ? `דו״ח_נוכחות_${format(dailyDate, "dd-MM-yyyy")}.xlsx`
          : `דו״ח_נוכחות_${format(dateRange!.from!, "dd-MM")}_עד_${format(dateRange!.to!, "dd-MM")}.xlsx`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.dismiss();
      toast.success(
        forWhatsApp ? "הדו״ח הורד ומוכן לשיתוף" : "הדו״ח הורד בהצלחה",
      );
      if (!forWhatsApp) onOpenChange(false);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.dismiss();
      
      if (error?.response?.status === 404) {
        toast.error("לא נמצאו נתונים לתאריך שנבחר");
      } else if (error?.response?.status === 403) {
        toast.error("אין הרשאה לייצא דוחות");
      } else {
        toast.error(extractErrorMessage(error, "שגיאה ביצירת הדו״ח"));
      }
    }
  };

  const handleWhatsAppText = () => {
    if (!dailyDate) {
      toast.error("נא לבחור תאריך");
      return;
    }
    const dateStr = format(dailyDate, "dd/MM/yyyy");
    const msg = encodeURIComponent(
      `*דו״ח מצבת כוחות - ${dateStr}*\nסך הכל רשומים במערכת: ${employees.length}\nסטטוס: מעודכן לרגע זה.\nהדו״ח המלא מצורף כקובץ אקסל.`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[700px] p-0 border border-border/40 bg-background rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden !gap-0"
          dir="rtl"
        >
          <DialogDragHandle />
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-border/30 bg-background shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-0.5 text-right">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  מרכז ייצוא נתונים
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-medium">
                  ייצוא דוחות נוכחות וסידור עבודה לאקסל ולתפוצה
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-background">
            {/* Section 1: Settings */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-muted-foreground block px-0.5 uppercase tracking-wider">
                01. הגדרות וסינון
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <Tabs
                  value={mode}
                  onValueChange={(v: any) => {
                    setMode(v as any);
                  }}
                  className="flex-1 pointer-events-auto"
                >
                  <TabsList className="bg-muted/20 border border-border/20 p-1 h-10 rounded-xl w-full grid grid-cols-2">
                    <TabsTrigger
                      value="daily"
                      className="font-bold rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer pointer-events-auto"
                    >
                      יומי
                    </TabsTrigger>
                    <TabsTrigger
                      value="range"
                      className="font-bold rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer pointer-events-auto"
                    >
                      טווח
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFilterModalOpen(true);
                  }}
                  className={cn(
                    "h-10 px-4 rounded-xl font-bold border transition-all gap-2 text-xs shrink-0 w-full sm:w-auto cursor-pointer pointer-events-auto shadow-none",
                    Object.keys(activeFilters).length > 0
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "border-border/40 bg-background hover:bg-muted/30 text-foreground",
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {Object.keys(activeFilters).length > 0
                      ? `סינון (${Object.keys(activeFilters).length})`
                      : "סינון"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Section 2: Calendar */}
            <div className="space-y-2.5 pointer-events-auto">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  02. בחירת מועד
                </span>
                {mode === "range" && dateRange?.from && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                    {format(dateRange.from, "dd/MM")} -{" "}
                    {dateRange.to ? format(dateRange.to, "dd/MM") : "..."}
                  </span>
                )}
              </div>
              <div className="flex justify-center w-full py-2 pointer-events-auto">
                <Calendar
                  mode={mode === "daily" ? "single" : "range"}
                  selected={(mode === "daily" ? dailyDate : dateRange) as any}
                  onSelect={(v: any) =>
                    mode === "daily" ? setDailyDate(v) : setDateRange(v)
                  }
                  required={mode === "daily"}
                  locale={he}
                  className="p-0 w-full flex justify-center pointer-events-auto cursor-pointer [--cell-size:2.75rem] sm:[--cell-size:3.25rem]"
                  classNames={{
                    root: "w-full flex justify-center",
                    months: "w-full max-w-[500px] sm:max-w-[540px] relative flex flex-col items-center",
                    month: "w-full flex flex-col gap-3.5 items-center",
                    month_caption: "flex items-center justify-center relative w-full h-10 px-12 mb-1",
                    caption_label: "text-base sm:text-lg font-bold text-foreground tracking-tight select-none",
                    nav: "flex items-center justify-between w-full absolute top-0 inset-x-0 h-10 px-1 pointer-events-none",
                    button_previous: "h-8 w-8 p-0 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center pointer-events-auto transition-colors cursor-pointer",
                    button_next: "h-8 w-8 p-0 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center pointer-events-auto transition-colors cursor-pointer",
                    table: "w-full border-collapse",
                    weekdays: "flex w-full mb-1",
                    weekday: "text-muted-foreground/80 font-bold text-xs text-center flex-1 py-1 select-none",
                    week: "flex w-full mt-1.5 justify-between gap-1",
                    day: "flex-1 flex justify-center items-center",
                  }}
                />
              </div>
            </div>

            {/* Section 3: Actions */}
            <div className="space-y-3 pt-2 pointer-events-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload(false);
                  }}
                  className="col-span-1 sm:col-span-2 h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs sm:text-sm gap-2 cursor-pointer pointer-events-auto shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  הורדת קובץ אקסל
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload(true);
                  }}
                  className="h-10 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-1.5 cursor-pointer pointer-events-auto transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>אקסל לוואטסאפ</span>
                </Button>

                {mode === "daily" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleWhatsAppText();
                    }}
                    className="h-10 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-1.5 cursor-pointer pointer-events-auto transition-all"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>סיכום טקסט</span>
                  </Button>
                ) : (
                  <div className="hidden" />
                )}
              </div>

              {/* Minimal Note */}
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                <span>
                  הנתונים משקפים את המצב הנוכחי במערכת. מומלץ לוודא שכל הדיווחים הושלמו לפני הייצוא.
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        onApply={setActiveFilters}
        employees={employees}
      />
    </>
  );
}
