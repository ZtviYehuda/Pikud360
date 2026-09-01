import { Card } from "@/components/ui/card";
import { Users, AlertCircle, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  stats: any[];
  totalEmployees: number;
  selectedStatusId?: number | null;
  onCardSelect?: (statusId: number | null, statusName: string, statusColor: string) => void;
}

export const StatCards = ({ 
  stats = [], 
  totalEmployees = 0, 
  selectedStatusId = null, 
  onCardSelect 
}: StatCardsProps) => {
  // Find specific stats
  const notReported = stats.find(s => s.status_name === "לא דווח" || s.status_name === "לא דיווח")?.count || 0;
  
  // Use is_presence flag from database (with fallback to keywords for safety)
  const unavailableCount = stats
    .filter(s => {
      if (s.is_presence !== undefined && s.is_presence !== null) {
        return s.is_presence === false && s.status_name !== "לא דווח" && s.status_id !== null;
      }
      const unavailableKeywords = ["חופשה", "מחלה", "חולה", "מושעה", "גימל", "בלתי מורשה", "נפקד", "לא זמין"];
      return unavailableKeywords.some(kw => s.status_name?.includes(kw));
    })
    .reduce((acc, curr) => acc + (curr.count || 0), 0);
  
  const presentCount = stats
    .filter(s => {
      if (s.is_presence !== undefined && s.is_presence !== null) {
        return s.is_presence === true;
      }
      const presentKeywords = ["נוכח", "משרד", "תגבור", "קורס", "הדרכה", "משימה", "פעיל"];
      return presentKeywords.some(kw => s.status_name?.includes(kw));
    })
    .reduce((acc, curr) => acc + (curr.count || 0), 0);

  const availabilityPct = totalEmployees > 0 
    ? Math.round((presentCount / totalEmployees) * 100) 
    : (totalEmployees === 0 ? 0 : 55);

  const cards = [
    {
      id: -4,
      label: "סה\"כ שוטרים",
      value: totalEmployees,
      icon: Users,
      colorHex: "#6366f1",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    },
    {
      id: -3,
      label: "זמינות מבצעית",
      value: `${availabilityPct}%`,
      icon: TrendingUp,
      colorHex: "#10b981",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      id: -2,
      label: "לא זמינים",
      value: unavailableCount,
      icon: AlertCircle,
      colorHex: "#f59e0b",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      id: -1,
      label: "טרם דיווחו",
      value: notReported,
      icon: notReported === 0 ? CheckCircle2 : Clock,
      colorHex: notReported === 0 ? "#10b981" : "#3b82f6",
      iconBg: notReported === 0 
        ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        : "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
  ];

  return (
    <div 
      id="stats-grid" 
      className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5"
    >
      {cards.map((card) => {
        const isActive = selectedStatusId === card.id;
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            onClick={() => onCardSelect?.(isActive ? null : card.id, card.label, card.colorHex)}
            className={cn(
              "group relative overflow-hidden p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer select-none",
              "bg-card/70 dark:bg-card/50 backdrop-blur-md shadow-xs hover:shadow-sm",
              isActive 
                ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03]" 
                : "border-border/60 hover:border-border hover:bg-card/90"
            )}
          >
            {/* Top Accent Indicator */}
            <div 
              className={cn(
                "absolute top-0 inset-x-0 h-1 transition-opacity",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
              )}
              style={{ backgroundColor: card.colorHex }}
            />

            <div className="flex items-center justify-between gap-2.5">
              <div className="space-y-0.5 text-right min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-tight truncate">
                  {card.label}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-none pt-1">
                  {card.value}
                </p>
              </div>

              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shrink-0",
                card.iconBg
              )}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
