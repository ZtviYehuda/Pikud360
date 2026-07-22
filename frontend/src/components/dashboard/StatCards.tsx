import { Card } from "@/components/ui/card";
import { Users, AlertCircle, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  stats: any[];
  totalEmployees: number;
  selectedStatusId?: number | null;
  onCardSelect?: (statusId: number | null, statusName: string, statusColor: string) => void;
}

export const StatCards = ({ 
  stats, 
  totalEmployees, 
  selectedStatusId = null, 
  onCardSelect 
}: StatCardsProps) => {
  // Find specific stats
  const notReported = stats.find(s => s.status_name === "לא דווח")?.count || 0;
  
  // Use is_presence flag from database (with fallback to keywords for safety)
  const unavailableCount = stats
    .filter(s => {
      if (s.is_presence !== undefined && s.is_presence !== null) {
        return s.is_presence === false && s.status_name !== "לא דווח" && s.status_id !== null;
      }
      const unavailableKeywords = ["חופשה", "חולה", "מושעה", "גימל", "בלתי מורשה", "נפקד"];
      return unavailableKeywords.some(kw => s.status_name?.includes(kw));
    })
    .reduce((acc, curr) => acc + curr.count, 0);
  
  const presentCount = stats
    .filter(s => {
      if (s.is_presence !== undefined && s.is_presence !== null) {
        return s.is_presence === true;
      }
      const presentKeywords = ["נוכח", "משרד", "תגבור", "קורס"];
      return presentKeywords.some(kw => s.status_name?.includes(kw));
    })
    .reduce((acc, curr) => acc + curr.count, 0);

  const availabilityPct = totalEmployees > 0 
    ? Math.round((presentCount / totalEmployees) * 100) 
    : 0;

  const cards = [
    {
      id: -1,
      label: "לא דיווחו",
      value: notReported,
      icon: Search,
      color: "blue",
      colorHex: "#3b82f6",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-500",
    },
    {
      id: -2,
      label: "לא זמינים",
      value: unavailableCount,
      icon: AlertCircle,
      color: "amber",
      colorHex: "#f59e0b",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-500",
      hideOnMobile: true,
    },
    {
      id: -3,
      label: "זמינות מבצעית",
      value: `${availabilityPct}%`,
      subValue: `${presentCount} זמינים`,
      icon: TrendingUp,
      color: "emerald",
      colorHex: "#10b981",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-500",
    },
    {
      id: -4,
      label: "סה\"כ שוטרים",
      value: totalEmployees,
      icon: Users,
      color: "indigo",
      colorHex: "#6366f1",
      iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-500",
      hideOnMobile: true,
    },
  ];

  return (
    <div 
      id="stats-grid" 
      className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 pb-2 lg:pb-0"
    >
      {cards.map((card, idx) => {
        const isActive = selectedStatusId === card.id;
        return (
          <Card
            key={idx}
            onClick={() => onCardSelect?.(isActive ? null : card.id, card.label, card.colorHex)}
            className={cn(
              "group relative overflow-hidden p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all flex items-center justify-between cursor-pointer select-none",
              isActive 
                ? "bg-primary/[0.03] border-primary/50! shadow-inner!" 
                : "bg-card/80 border-border/40 hover:bg-accent/30 hover:border-primary/20",
              card.hideOnMobile ? "hidden md:flex" : "flex"
            )}
          >
            {/* Left color bar indicator for active state */}
            {isActive && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1" 
                style={{ backgroundColor: card.colorHex }}
              />
            )}
            
            <div className="flex items-center justify-between w-full gap-2">
              <div className="space-y-0.5 text-right min-w-0 flex-1">
                <p className="text-[9px] sm:text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wide leading-none truncate">
                  {card.label}
                </p>
                <p className="text-base sm:text-xl font-black tracking-tight text-foreground leading-none mt-1">
                  {card.value}
                </p>
                {card.subValue && (
                  <p className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground/50 leading-none mt-1">
                    {card.subValue}
                  </p>
                )}
              </div>
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 shadow-sm",
                isActive ? "bg-primary/10" : card.iconBg,
                isActive ? "text-primary" : card.iconColor
              )}>
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
