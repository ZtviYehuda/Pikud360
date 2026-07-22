import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertCircle, TrendingUp, Search, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceStatCardsProps {
  reported: number;
  total: number;
  available: number;
  unavailable: number;
}

export const AttendanceStatCards = ({ reported, total, available, unavailable }: AttendanceStatCardsProps) => {
  const missing = total - reported;

  const cards = [
    {
      label: "דיווחו",
      value: reported,
      subValue: `${total} סה"כ`,
      icon: ClipboardCheck,
      color: "blue",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-500",
    },
    {
      label: "זמינים",
      value: available,
      icon: TrendingUp,
      color: "emerald",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-500",
    },
    {
      label: "לא זמינים",
      value: unavailable,
      icon: AlertCircle,
      color: "amber",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-500",
    },
    {
      label: "טרם דווחו",
      value: missing,
      icon: Search,
      color: "indigo",
      iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-500",
    },
  ];

  return (
    <div 
      className="grid grid-cols-4 lg:hidden gap-1.5 mb-4"
    >
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={cn(
            "group relative overflow-hidden border-0 transition-all rounded-xl shadow-sm hover:shadow-md",
            card.color === "blue" && "bg-blue-50/40 dark:bg-blue-900/10",
            card.color === "emerald" && "bg-emerald-50/40 dark:bg-emerald-900/10",
            card.color === "amber" && "bg-amber-50/40 dark:bg-amber-900/10",
            card.color === "indigo" && "bg-indigo-50/40 dark:bg-indigo-900/10"
          )}
        >
          <CardContent className="p-1.5 flex flex-col items-center text-center">
            <div className="flex flex-col items-center z-10 min-w-0 w-full">
              {/* Icon - Restored & Compact */}
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center mb-1",
                card.iconBg,
                card.iconColor
              )}>
                <card.icon className="w-3.5 h-3.5" />
              </div>

              <div className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight mb-0.5 truncate w-full">
                {card.value}
              </div>
              <div className="text-[8px] font-bold text-slate-500 truncate uppercase tracking-tighter w-full">
                {card.label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
