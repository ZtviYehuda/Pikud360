import { useEffect, useState, useMemo } from "react";
import api from "@/config/api.client";
import {
  Clock,
  User,
  MessageSquare,
  Calendar as CalendarIcon,
  Download,
  List,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import type { DayButtonProps } from "react-day-picker";
import { ChevronDown } from "lucide-react";

interface StatusLog {
  id: number;
  status_name: string;
  status_color: string;
  start_datetime: string;
  end_datetime: string | null;
  note: string | null;
  reported_by_name: string | null;
}

interface StatusHistoryListProps {
  employeeId: number;
  className?: string;
  limit?: number;
  showControls?: boolean;
  initialDate?: Date;
}

export default function StatusHistoryList({
  employeeId,
  className,
  limit,
  showControls,
  initialDate,
}: StatusHistoryListProps) {
  const [history, setHistory] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">(
    initialDate ? "calendar" : "list",
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate || new Date(),
  );

  useEffect(() => {
    if (employeeId) {
      fetchHistory();
    }
  }, [employeeId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/history/${employeeId}`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yy HH:mm", { locale: he });
  };

  const [displayCount, setDisplayCount] = useState(limit || 3);

  // List View Logic
  const displayHistory = history.slice(0, displayCount);

  // Calendar View Logic
  const selectedDayLogs = useMemo(() => {
    if (!selectedDate) return [];
    return history.filter((log) =>
      isSameDay(new Date(log.start_datetime), selectedDate),
    );
  }, [history, selectedDate]);

  const CustomDayButton = useMemo(() => {
    // eslint-disable-next-line react/display-name
    return (props: DayButtonProps) => {
      const { day } = props;
      // Check for status log on this day
      // We look for the *latest* status started on this day, or just any status
      // Let's just dot any status occurrence
      const dayLog = history.find((h) =>
        isSameDay(new Date(h.start_datetime), day.date),
      );

      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <CalendarDayButton {...(props as any)} />
          {dayLog && (
            <div
              className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-20 "
              style={{ backgroundColor: dayLog.status_color }}
            />
          )}
        </div>
      );
    };
  }, [history]);

  // Handle export
  const handleExport = () => {
    if (!employeeId) return;
    window.open(
      `${api.defaults.baseURL}/attendance/history/${employeeId}/export`,
      "_blank",
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-50">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-bold">טוען היסטוריה...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-bold">לא נמצאה היסטוריית דיווחים</p>
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-4", className)}>
      {/* Controls / View Toggle */}
      {showControls && (
        <div className="flex justify-end border-b pb-2 mb-2">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-background  text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="רשימה"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "calendar"
                  ? "bg-background  text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="לוח שנה"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="relative space-y-4">
          {/* Timeline Connector */}
          <div className="absolute top-0 bottom-0 right-[21px] w-0.5 bg-border/50" />

          {displayHistory.map((log, idx) => (
            <div key={log.id} className="relative pr-12 group">
              {/* Timeline Dot */}
              <div
                className={cn(
                  "absolute right-4 top-4 w-3 h-3 rounded-full border-2 border-card z-10 transition-transform group-hover:scale-125",
                  idx === 0
                    ? "bg-primary "
                    : "bg-muted-foreground/30",
                )}
                style={idx === 0 ? {} : { backgroundColor: log.status_color }}
              />

              <div className="bg-card border border-border rounded-xl p-4  group-hover: transition-all group-hover:border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: log.status_color }}
                    />
                    <span className="text-sm font-black text-foreground">
                      {log.status_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      <CalendarIcon className="w-3 h-3" />
                      {formatDate(log.start_datetime)}
                    </div>
                    {log.end_datetime && (
                      <div className="text-[10px] font-bold text-muted-foreground/60">
                        עד {formatDate(log.end_datetime)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {log.reported_by_name && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
                      <User className="w-3.5 h-3.5" />
                      <span>דווח ע"י: {log.reported_by_name}</span>
                    </div>
                  )}
                  {log.note && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="truncate">הערה: {log.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex justify-center bg-card rounded-2xl border border-border/50 p-4 ">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0"
              classNames={{
                month: "space-y-4 w-full",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full justify-between",
                row: "flex w-full mt-2 justify-between",
                cell: "text-center text-sm p-0 flex-1 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              }}
              components={{
                DayButton: CustomDayButton as any, // Cast to any to avoid strict type mismatch with DayPicker types
              }}
            />
          </div>

          {/* Selected Day Logs */}
          <div className="space-y-3">
            <h4 className="text-sm font-black flex items-center gap-2 px-1">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {selectedDate
                ? `דיווחים ל-${format(selectedDate, "dd/MM/yyyy")}`
                : "בחר תאריך"}
            </h4>

            {selectedDayLogs.length > 0 ? (
              <div className="space-y-3">
                {selectedDayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-muted/30 border border-border/50 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: log.status_color }}
                      />
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {log.status_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(log.start_datetime)}
                        </div>
                      </div>
                    </div>
                    {log.note && (
                      <div
                        className="text-xs text-muted-foreground max-w-[150px] truncate"
                        title={log.note}
                      >
                        {log.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm bg-muted/10 rounded-xl border border-dashed border-border">
                אין דיווחים לתאריך זה
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions (Only show in List mode or if forced?) -> Let's show in both but contextually */}
      {viewMode === "list" && (
        <div className="flex flex-col items-center justify-center gap-4 pt-4 border-t border-border/50">
          {/* Show More Button */}
          {history.length > displayCount && (
            <button
              onClick={() => setDisplayCount((prev) => prev + 10)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all group"
            >
              הצג 10 דיווחים נוספים
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            הורד דוח אקסל
          </button>
        </div>
      )}
    </div>
  );
}

