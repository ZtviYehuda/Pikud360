import { useState, useEffect } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Download,
  MessageCircle,
  FileSpreadsheet,
  Filter,
  Info,
} from "lucide-react";
import apiClient from "@/config/api.client";
import { EMPLOYEES_EXPORT_ENDPOINT } from "@/config/employees.endpoints";
import { useDateContext } from "@/context/DateContext";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";

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
        const errorMessage = error?.response?.data?.error || error?.message || "שגיאה ביצירת הדו״ח";
        toast.error(errorMessage);
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
          className="sm:max-w-[650px] bg-[#F8FAFC] dark:bg-slate-950"
          dir="rtl"
        >
          <DialogDragHandle />
          {/* Header - Premium Minimalist */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-8 py-4 sm:py-6 shrink-0">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-primary flex items-center justify-center text-white">
                <FileSpreadsheet className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  מרכז ייצוא נתונים
                </DialogTitle>
              </div>
            </div>
          </div>

          <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Section 1: Settings */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                01. הגדרות וסינון
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Tabs
                  value={mode}
                  onValueChange={(v: any) => {
                    setMode(v as any);
                  }}
                  className="flex-1 pointer-events-auto"
                >
                  <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 h-10 rounded-xl w-full grid grid-cols-2">
                    <TabsTrigger
                      value="daily"
                      className="font-bold rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 transition-all cursor-pointer pointer-events-auto"
                    >
                      יומי
                    </TabsTrigger>
                    <TabsTrigger
                      value="range"
                      className="font-bold rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 transition-all cursor-pointer pointer-events-auto"
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
                    "h-10 px-4 rounded-xl font-bold border-2 transition-all gap-2 text-xs shrink-0 w-full sm:w-auto cursor-pointer pointer-events-auto",
                    Object.keys(activeFilters).length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "border-slate-200 dark:border-slate-800 hover:border-primary/20",
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
            <div className="space-y-3 pointer-events-auto">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  02. בחירת מועד
                </h3>
                {mode === "range" && dateRange?.from && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {format(dateRange.from, "dd/MM")} -{" "}
                    {dateRange.to ? format(dateRange.to, "dd/MM") : "..."}
                  </span>
                )}
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex justify-center w-full mx-auto pointer-events-auto cursor-pointer relative">
                <Calendar
                  mode={mode === "daily" ? "single" : "range"}
                  selected={(mode === "daily" ? dailyDate : dateRange) as any}
                  onSelect={(v: any) =>
                    mode === "daily" ? setDailyDate(v) : setDateRange(v)
                  }
                  required={mode === "daily"}
                  locale={he}
                  className="p-0 w-full flex justify-center pointer-events-auto cursor-pointer"
                  classNames={{
                    months:
                      "flex flex-col text-center w-full items-center",
                    month: "space-y-4 w-full max-w-[280px] flex flex-col items-center",
                    caption:
                      "flex justify-center pt-2 pb-6 relative items-center w-full",
                    caption_label:
                      "text-base sm:text-lg font-black text-slate-900 dark:text-white",
                    nav: "absolute top-0 left-0 right-0 flex items-center justify-between px-3 h-10",
                    nav_button:
                      "h-9 w-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700 hover: cursor-pointer pointer-events-auto",
                    nav_button_previous: "order-1",
                    nav_button_next: "order-2",
                    table: "w-full border-collapse",
                    head_row: "grid grid-cols-7 gap-1 mb-4 w-full",
                    head_cell:
                      "text-slate-500 dark:text-slate-400 font-black text-xs uppercase text-center py-2 flex items-center justify-center",
                    row: "grid grid-cols-7 gap-1 mb-2 w-full",
                    cell: "flex items-center justify-center cursor-pointer pointer-events-auto",
                    day: "h-10 w-10 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm text-slate-900 dark:text-slate-100 transition-all hover:scale-105 border border-transparent cursor-pointer pointer-events-auto",
                    day_selected:
                      "bg-primary text-white hover:bg-primary hover:text-white scale-105 border-primary/20",
                    day_today:
                      "bg-slate-100 dark:bg-slate-800 text-primary font-black border-2 border-primary/40",
                    day_outside: "text-slate-300 dark:text-slate-600 opacity-40",
                    day_disabled: "text-slate-300 dark:text-slate-600 opacity-30",
                    day_range_middle:
                      "aria-selected:bg-primary/10 aria-selected:text-primary rounded-none border-y border-primary/20",
                    day_range_start: "rounded-l-xl rounded-r-none bg-primary text-white",
                    day_range_end: "rounded-r-xl rounded-l-none bg-primary text-white",
                  }}
                />
              </div>
            </div>

            {/* Section 3: Actions */}
            <div className="space-y-4 pt-2 pointer-events-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload(false);
                  }}
                  className="col-span-1 sm:col-span-2 h-12 rounded-xl bg-primary text-white hover:bg-primary/90 font-black text-sm gap-2 cursor-pointer pointer-events-auto transition-all"
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
                  className="h-10 rounded-xl border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs gap-2 cursor-pointer pointer-events-auto transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">אקסל לוואטסאפ</span>
                  <span className="sm:hidden">אקסל לוואטסאפ</span>
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
                    className="h-10 rounded-xl border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs gap-2 cursor-pointer pointer-events-auto transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">סיכום טקסט</span>
                    <span className="sm:hidden">סיכום טקסט</span>
                  </Button>
                ) : (
                  <div className="hidden" />
                )}
              </div>

              {/* Alert */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed">
                  הנתונים משקפים את המצב הנוכחי במערכת. וודא שכל הדיווחים הושלמו
                  לפני הייצוא.
                </p>
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
