import { useRef, forwardRef, useImperativeHandle } from "react";
import { useEmployeeContext } from "@/context/EmployeeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Download, Filter, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ComparisonStat {
  unit_id: number;
  unit_name: string;
  total_count: number;
  present_count: number;
  absent_count: number;
  unknown_count: number;
  level: string;
}

interface StatsComparisonCardProps {
  data: ComparisonStat[];
  loading?: boolean;
  days: number;
  className?: string;
  onShare?: () => void;
  unitName?: string;
  subtitle?: string;
  selectedDate?: Date;
  selectedUnitId?: number | null;
  onUnitClick?: (unitId: number, level: string) => void;
  filterTags?: string[];
  hideHeader?: boolean;
  compact?: boolean;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const StatsComparisonCard = forwardRef(
  function StatsComparisonCard(
    {
      data,
      loading,
      days,
      className,
      unitName = "כלל היחידה",
      subtitle,
      selectedDate = new Date(),
      selectedUnitId = null,
      onUnitClick,
      filterTags = [],
      hideHeader = false,
      compact = false,
      onGoBack,
      canGoBack = false,
    }: StatsComparisonCardProps,
    ref: any
  ) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { openProfile } = useEmployeeContext();

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    const handleDownload = async () => {
      if (cardRef.current === null) return;

      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "absolute";
              dateEl.style.top = "20px";
              dateEl.style.left = "20px";
              dateEl.style.opacity = "1";
              dateEl.style.zIndex = "50";
              dateEl.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
              dateEl.style.padding = "4px 12px";
              dateEl.style.borderRadius = "8px";
              dateEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              dateEl.style.border = "1px solid #e2e8f0";
              dateEl.style.color = "#0f172a";
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);
        const link = document.createElement("a");
        link.download = `unit-comparison-${days}-days.png`;
        link.href = dataUrl;
        link.click();
        toast.success("הגרף יוצא כתמונה בהצלחה");
      } catch (err) {
        console.error("Failed to download image", err);
        toast.error("שגיאה בייצוא הגרף");
      }
    };

    const handleWhatsAppShare = async () => {
      if (cardRef.current === null) return;

      try {
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "absolute";
              dateEl.style.top = "20px";
              dateEl.style.left = "20px";
              dateEl.style.opacity = "1";
              dateEl.style.zIndex = "50";
              dateEl.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
              dateEl.style.padding = "4px 12px";
              dateEl.style.borderRadius = "8px";
              dateEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              dateEl.style.border = "1px solid #e2e8f0";
              dateEl.style.color = "#0f172a";
              dateEl.innerText = `תאריך: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);

        if (!blob) throw new Error("Failed to capture image");

        const rangeText =
          days === 1 ? "יומית" : days === 7 ? "שבועית" : "חודשית";
        const statsSummary =
          data && data.length > 0
            ? `\n*סיכום:* ${data.length} יחידות מוצגות.`
            : "";
        const filterText = subtitle ? `\n*סינון:* ${subtitle}` : "";
        const title = `דוח השוואת כוח אדם (${rangeText}) - ${unitName}`;
        const message = `*${title}*\nתאריך הפקה: ${format(new Date(), "dd/MM/yyyy")}\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}${filterText}${statsSummary}`;

        const file = new File([blob], `comparison-${days}.png`, {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: title,
              text: message,
            });
            toast.success("הדוח שותף בהצלחה");
            return;
          } catch (shareErr) {
            if ((shareErr as Error).name !== "AbortError") {
              console.warn("Web Share failed:", shareErr);
            } else {
              return;
            }
          }
        }

        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.warn("Clipboard copy failed", clipErr);
        }

        const dataUrl = await toPng(cardRef.current, {
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "absolute";
              dateEl.style.top = "20px";
              dateEl.style.left = "20px";
              dateEl.style.opacity = "1";
              dateEl.style.zIndex = "50";
              dateEl.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
              dateEl.style.padding = "4px 12px";
              dateEl.style.borderRadius = "8px";
              dateEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              dateEl.style.border = "1px solid #e2e8f0";
              dateEl.style.color = "#0f172a";
              dateEl.innerText = `תאריך: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);
        const link = document.createElement("a");
        link.download = `השוואת_כוחות_${format(selectedDate, "yyyy-MM-dd")}.png`;
        link.href = dataUrl;
        link.click();

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

        toast.success("התמונה הועתקה! נא לבצע 'הדבק' (Ctrl+V) בווצאפ");
      } catch (err) {
        console.error("WhatsApp share failed", err);
        toast.error("שגיאה בהכנת הדוח ל-WhatsApp");
      }
    };

    if (loading && (!data || data.length === 0)) {
      return (
        <Card className={cn("h-full min-h-[300px]", className)}>
          <CardHeader>
            <CardTitle className="text-lg animate-pulse bg-muted h-6 w-32 rounded"></CardTitle>
            <CardDescription className="animate-pulse bg-muted h-4 w-48 rounded mt-2"></CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card
        ref={cardRef}
        id="stats-comparison-card"
        className={cn(
          compact
            ? "bg-transparent border-0 shadow-none p-0 flex flex-col h-auto w-full relative"
            : "bg-card text-card-foreground gap-2 rounded-2xl border border-border/40 py-3 flex flex-col overflow-hidden h-full relative transition-all shadow-none",
          className
        )}
      >
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/60 animate-pulse z-50 rounded-t-[1.5rem]" />
        )}
        {!hideHeader && (
          <CardHeader className="px-3 sm:px-6 py-1.5 sm:py-2 flex flex-row items-center justify-between space-y-0 min-w-0 gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-[11px] sm:text-base font-black text-foreground tracking-tight flex items-center flex-wrap gap-1.5 sm:gap-3 truncate">
                  <span>השוואת כוח אדם</span>
                </CardTitle>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent
                      className="max-w-[250px] text-right"
                      dir="rtl"
                    >
                    <p className="font-bold mb-1">כיצד מחושב?</p>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>
                          <span className="font-semibold">נוכחים:</span> משרד, תגבור, קורס
                        </li>
                        <li>
                          <span className="font-semibold">לא נוכחים:</span> חופשה, מחלה, חו"ל
                        </li>
                        <li>
                          <span className="font-semibold">תקן:</span> ממוצע שוטרים פעילים בתקופה
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription className="flex flex-col gap-0.5 w-full">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-bold text-[11px] sm:text-xs text-foreground truncate">{unitName}</span>
                  {subtitle && (
                    <span className="hidden sm:inline text-xs text-muted-foreground">
                      {" "}
                      | <span className="">{subtitle}</span>
                    </span>
                  )}
                </div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">
                  {days === 1
                    ? `תמונת מצב יומית להיום`
                    : `ממוצע נוכחים - ${days === 7 ? "שבועית" : days === 30 ? "חודשית" : "שנתית"}`} • {format(selectedDate, "dd/MM/yyyy")}
                </div>
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 no-export shrink-0">
              {canGoBack && onGoBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGoBack}
                  className="h-8 px-2.5 sm:px-3 text-[11px] sm:text-xs font-black text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary border-primary/30 dark:border-primary/50 transition-all flex items-center gap-1.5 no-export rounded-xl shadow-xs active:scale-95 group/back"
                  title={
                    data && data.length > 0 && data[0]?.level === "team"
                      ? "חזרה למדורים"
                      : "חזרה למחלקות"
                  }
                >
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/back:translate-x-0.5" />
                  <span>
                    {data && data.length > 0 && data[0]?.level === "team"
                      ? "חזרה למדורים"
                      : "חזרה למחלקות"}
                  </span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg transition-all hidden sm:flex"
                onClick={handleDownload}
                title="הורדה כתמונה"
              >
                <Download className="h-4 w-4" />
              </Button>

              <WhatsAppButton
                onClick={handleWhatsAppShare}
                variant="outline"
                className="h-8 w-8 p-0 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 hidden sm:flex"
                skipDirectLink={true}
              />
            </div>
          </CardHeader>
        )}

        <CardContent className={cn("flex-1 overflow-y-auto no-scrollbar p-0", !hideHeader && "px-4 sm:px-6", compact && "max-h-[420px] sm:max-h-none")}>
          {(() => {
            const safeData = Array.isArray(data)
              ? data
              : (data && Array.isArray((data as any).comparison)
                  ? (data as any).comparison
                  : (data && Array.isArray((data as any).data)
                      ? (data as any).data
                      : []));

            if ((!safeData || safeData.length === 0) && loading) {
              return (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm font-bold text-muted-foreground">טוען נתונים...</p>
                </div>
              );
            }

            if (!safeData || safeData.length === 0) {
              return (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center">
                  <p className="text-sm font-bold text-muted-foreground">אין נתונים להצגה בתקופה זו</p>
                </div>
              );
            }

            return (
              <div className={cn(compact ? "flex flex-col gap-3 max-w-xl mx-auto w-full py-2" : "space-y-5 sm:space-y-7 py-4", loading && safeData.length === 0 && "opacity-60 pointer-events-none transition-opacity duration-200")}>
                {safeData.map((item: ComparisonStat) => {
                  const availability =
                    item.total_count > 0
                      ? Math.round((item.present_count / item.total_count) * 100)
                      : 0;

                  const barColor =
                    availability >= 85
                      ? "#10b981"
                      : availability >= 70
                        ? "#f59e0b"
                        : "#ef4444";

                  const trackBg =
                    availability >= 85
                      ? "rgba(16, 185, 129, 0.15)"
                      : availability >= 70
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(239, 68, 68, 0.15)";

                  const isClickable = !!onUnitClick && item.level !== "employee";
                  const isSelected = selectedUnitId === item.unit_id;

                  return (
                    <div
                      key={item.unit_id}
                      onClick={(e) => {
                        e.preventDefault();
                        if (isClickable) {
                          onUnitClick(item.unit_id, item.level);
                        } else if (item.level === "employee") {
                          openProfile(item.unit_id);
                        }
                      }}
                      className={cn(
                        "space-y-2 group p-2.5 rounded-xl transition-all duration-200",
                        isClickable && "cursor-pointer hover:bg-muted/40 active:scale-[0.99]",
                        isSelected && "bg-primary/10 border border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate group-hover:text-primary transition-colors">
                            {item.unit_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          <span className="text-muted-foreground font-medium">
                            {item.present_count} / {item.total_count}
                          </span>
                          <span
                            className="font-black w-10 text-left"
                            style={{ color: barColor }}
                          >
                            {item.level === "employee"
                              ? (item.present_count > 0 ? "נוכח" : "נעדר")
                              : `${availability}%`}
                          </span>
                        </div>
                      </div>

                      {item.level !== "employee" && (
                        <div
                          className="w-full rounded-full overflow-hidden"
                          style={{
                            height: compact ? "4px" : "9px",
                            backgroundColor: trackBg,
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.max(availability, availability > 0 ? 3 : 0)}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div className="export-date-hidden absolute opacity-0 -z-50 text-center mt-4 pt-2 border-t border-border/50 text-sm font-bold text-muted-foreground">
            תאריך הפקה: {format(selectedDate, "dd/MM/yyyy")}
          </div>
        </CardContent>
      </Card>
    );
  },
);
