import { useRef, forwardRef, useImperativeHandle } from "react";
import { useEmployeeContext } from "@/context/EmployeeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Download, ArrowRight, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
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

export const StatsComparisonCard = forwardRef(function StatsComparisonCard(
  {
    data = [],
    loading,
    days,
    className,
    onShare,
    unitName = "כלל היחידה",
    subtitle,
    selectedDate = new Date(),
    selectedUnitId,
    onUnitClick,
    filterTags = [],
    hideHeader = false,
    compact = false,
    onGoBack,
    canGoBack = false,
  }: StatsComparisonCardProps,
  ref: any,
) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { openProfile } = useEmployeeContext();

  useImperativeHandle(ref, () => ({
    share: handleWhatsAppShare,
    download: handleDownload,
  }));

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        quality: 0.95,
        filter: (node) => {
          if (node.classList && node.classList.contains("no-export")) {
            return false;
          }
          return true;
        },
      });
      const link = document.createElement("a");
      link.download = `השוואת_כוחות_${format(selectedDate, "yyyy-MM-dd")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("התמונה הורדה בהצלחה!");
    } catch (err) {
      console.error("Failed to download image", err);
      toast.error("שגיאה בהורדת התמונה");
    }
  };

  const handleWhatsAppShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    if (!cardRef.current) return;

    const safeData = Array.isArray(data) ? data : [];
    let message = `*דו״ח השוואת כוח אדם - ${unitName}*\n`;
    message += `תאריך: ${format(selectedDate, "dd/MM/yyyy")}\n\n`;

    safeData.forEach((item) => {
      const pct =
        item.total_count > 0
          ? Math.round((item.present_count / item.total_count) * 100)
          : 0;
      message += `• *${item.unit_name}*: ${pct}% (${item.present_count}/${item.total_count})\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const safeData = Array.isArray(data)
    ? data
    : data && Array.isArray((data as any).comparison)
      ? (data as any).comparison
      : data && Array.isArray((data as any).data)
        ? (data as any).data
        : [];

  return (
    <Card
      ref={cardRef}
      id="stats-comparison-card"
      className={cn(
        "bg-card/70 dark:bg-card/50 backdrop-blur-md text-card-foreground rounded-2xl border border-border/60 shadow-xs flex flex-col overflow-hidden h-full relative transition-all",
        className,
      )}
    >
      {!hideHeader && (
        <CardHeader className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between space-y-0 border-b border-border/40 gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                השוואת כוח אדם
              </CardTitle>
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent
                    className="max-w-[240px] text-right text-xs"
                    dir="rtl"
                  >
                    מציג את יחסי הנוכחות והזמינות המבצעית בכל מחלקה ומדור. ניתן
                    ללחוץ על יחידה לקידוח פנימה.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <CardDescription className="text-xs text-muted-foreground truncate">
              {unitName} • {format(selectedDate, "dd/MM/yyyy")}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 no-export shrink-0">
            {canGoBack && onGoBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGoBack}
                className="h-8 px-2.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border-primary/20 rounded-lg transition-all flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>חזרה</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg transition-all hidden sm:flex"
              onClick={handleDownload}
              title="הורדה כתמונה"
            >
              <Download className="h-4 w-4" />
            </Button>

            <WhatsAppButton
              onClick={handleWhatsAppShare}
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 hidden sm:flex"
              skipDirectLink={true}
            />
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4">
        {loading && safeData.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">
              טוען נתונים ארגוניים...
            </p>
          </div>
        ) : safeData.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center text-muted-foreground">
            <p className="text-xs font-semibold">אין נתוני השוואה להצגה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeData.map((item: ComparisonStat) => {
              const availability =
                item.total_count > 0
                  ? Math.round((item.present_count / item.total_count) * 100)
                  : 0;

              const isClickable = !!onUnitClick && item.level !== "employee";
              const isSelected = selectedUnitId === item.unit_id;

              const getStatusColor = (pct: number) => {
                if (pct >= 70) {
                  return {
                    bar: "bg-emerald-500",
                    badge:
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                  };
                }
                if (pct >= 50) {
                  return {
                    bar: "bg-amber-500",
                    badge:
                      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                  };
                }
                return {
                  bar: "bg-red-500",
                  badge:
                    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                };
              };

              const statusStyle = getStatusColor(availability);

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
                    "group p-3 rounded-xl border transition-all duration-200",
                    "bg-card/50 hover:bg-accent/40 border-border/40 hover:border-border/80",
                    isClickable && "cursor-pointer active:scale-[0.99]",
                    isSelected &&
                      "bg-primary/[0.04] border-primary/40 ring-1 ring-primary/20",
                  )}
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate group-hover:text-primary transition-colors">
                        {item.unit_name}
                      </span>
                      {item.level && item.level !== "department" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground"
                        >
                          {item.level === "section" ? "מדור" : "חוליה"}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums font-medium">
                        {item.present_count} / {item.total_count}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px] font-black px-2 py-0.5 rounded-md tabular-nums border",
                          statusStyle.badge,
                        )}
                      >
                        {availability}%
                      </Badge>
                    </div>
                  </div>

                  {/* Clean Modern Progress Track */}
                  <div className="w-full h-2 bg-muted/60 dark:bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        statusStyle.bar,
                      )}
                      style={{
                        width: `${Math.max(availability, availability > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
