import * as React from "react";
import { 
  Bell, 
  Search, 
  Check, 
  Archive, 
  Trash2, 
  ExternalLink, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  ShieldAlert
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: "system" | "workforce" | "operations" | "access";
  priority: "critical" | "high" | "normal" | "info";
  isRead: boolean;
  isArchived: boolean;
  link?: string;
}

export interface NotificationCenterProps extends React.HTMLAttributes<HTMLDivElement> {
  initialNotifications?: NotificationItem[];
  onNotificationClick?: (notif: NotificationItem) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
  initialNotifications,
  onNotificationClick,
  ...props
}) => {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    initialNotifications || [
      {
        id: "1",
        title: "חוסר בכוח אדם במשמרת ערב",
        message: "משמרת ערב בתאריך 20/07 חסרה 2 עובדים לאיוש מלא.",
        timestamp: "היום, 10:30",
        category: "workforce",
        priority: "critical",
        isRead: false,
        isArchived: false,
        link: "/workforce/scheduling",
      },
      {
        id: "2",
        title: "בקשת חופשה ממתינה לאישור",
        message: "הוגשה בקשת חופשה חדשה על ידי יוסי כהן.",
        timestamp: "היום, 09:15",
        category: "operations",
        priority: "high",
        isRead: false,
        isArchived: false,
        link: "/statuses",
      },
      {
        id: "3",
        title: "גיבוי מערכת הושלם",
        message: "גיבוי הנתונים היומי הסתיים בהצלחה ללא שגיאות.",
        timestamp: "אתמול, 23:00",
        category: "system",
        priority: "info",
        isRead: true,
        isArchived: false,
      },
      {
        id: "4",
        title: "ניסיון התחברות חסום",
        message: "זוהה ניסיון התחברות לא מורשה מכתובת IP חיצונית.",
        timestamp: "לפני יומיים",
        category: "access",
        priority: "critical",
        isRead: false,
        isArchived: false,
      },
    ]
  );

  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [viewFilter, setViewFilter] = React.useState<"active" | "archived">("active");
  const [hasMore, setHasMore] = React.useState(true);

  // Mark single as read
  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  // Archive single
  const archiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isArchived: true } : n))
    );
  };

  // Delete single
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Mark all read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Load more mock notifications (Infinite Scroll Simulation)
  const loadMore = () => {
    const additional: NotificationItem[] = [
      {
        id: String(Date.now() + 1),
        title: "עדכון גרסת תוכנה",
        message: "מערכת Pikud360 עודכנה לגרסה 2.4.0 בהצלחה.",
        timestamp: "לפני 3 ימים",
        category: "system",
        priority: "normal",
        isRead: true,
        isArchived: false,
      },
      {
        id: String(Date.now() + 2),
        title: "חריגת שעות שבועית",
        message: "זוהו 3 עובדים עם חריגה ממכסת השעות השבועית.",
        timestamp: "לפני 4 ימים",
        category: "workforce",
        priority: "warning" as any,
        isRead: true,
        isArchived: false,
        link: "/employees",
      },
    ];
    setNotifications((prev) => [...prev, ...additional]);
    setHasMore(false);
  };

  // Priority icon renderer
  const renderPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "info":
        return <Info className="h-4 w-4 text-sky-500 shrink-0" />;
      default:
        return <CheckCircle className="h-4 w-4 text-slate-400 shrink-0" />;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
      case "info":
        return "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const categoryLabels: Record<string, string> = {
    system: "תשתית",
    workforce: "כוח אדם",
    operations: "מבצעים",
    access: "אבטחה",
  };

  const filtered = notifications.filter((n) => {
    const matchesSearch =
      n.title.includes(searchQuery) || n.message.includes(searchQuery);
    const matchesCategory =
      categoryFilter === "ALL" || n.category === categoryFilter;
    const matchesPriority =
      priorityFilter === "ALL" || n.priority === priorityFilter;
    const matchesArchive =
      viewFilter === "active" ? !n.isArchived : n.isArchived;

    return matchesSearch && matchesCategory && matchesPriority && matchesArchive;
  });

  return (
    <div
      {...props}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-4 text-right select-none transition-all duration-300 shadow-2xs w-full max-w-2xl mx-auto",
        className
      )}
    >
      {/* 1. Header controls panel */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-400" />
          <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
            מרכז התראות שלישות
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewFilter(viewFilter === "active" ? "archived" : "active")}
            className="text-[10px] text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
          >
            {viewFilter === "active" ? "הצג ארכיון" : "הצג פעילים"}
          </button>
          <span className="text-slate-200">|</span>
          <button
            onClick={markAllAsRead}
            className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            סמן הכל כנקרא
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="חיפוש התראות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 rounded-lg border border-slate-200 dark:border-slate-800 pr-9 pl-3 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Category selector */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="ALL">כל הקטגוריות</option>
          <option value="system">תשתית</option>
          <option value="workforce">כוח אדם</option>
          <option value="operations">מבצעים</option>
          <option value="access">אבטחה</option>
        </select>

        {/* Priority selector */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-8.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="ALL">כל רמות הדחיפות</option>
          <option value="critical">קריטי</option>
          <option value="high">גבוה</option>
          <option value="normal">רגיל</option>
          <option value="info">מידע</option>
        </select>
      </div>

      {/* 3. Feed List Wrapper */}
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px] flex flex-col gap-2.5 pr-1 -mr-1 py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-3 border border-slate-100 dark:border-slate-800 rounded-xl my-auto">
            <ShieldAlert className="h-8 w-8 text-slate-350 dark:text-slate-650 shrink-0" />
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 leading-snug">
              אין התראות חדשות התואמות לחיפוש
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onNotificationClick?.(item)}
              className={cn(
                "p-3 border rounded-xl flex items-start justify-between gap-4 transition-all text-right cursor-pointer bg-slate-50/20 dark:bg-slate-950/10 border-slate-200/50 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-850/20",
                !item.isRead && "bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-500/20 dark:border-cyan-500/30"
              )}
            >
              {/* Left indicator & icon */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={cn("p-1.5 rounded-lg shrink-0", getPriorityStyle(item.priority))}>
                  {renderPriorityIcon(item.priority)}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-500 shrink-0">
                      {categoryLabels[item.category]}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed font-medium">
                    {item.message}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {item.timestamp}
                  </p>
                </div>
              </div>

              {/* Action Buttons right side */}
              <div className="flex items-center gap-1.5 shrink-0">
                {item.link && (
                  <a
                    href={item.link}
                    className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                    title="מעבר לעמוד הקשור"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(item.id);
                  }}
                  className={cn(
                    "p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer",
                    item.isRead ? "text-slate-400" : "text-emerald-500"
                  )}
                  title={item.isRead ? "סמן כלא נקרא" : "סמן כנקרא"}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                {!item.isArchived && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveNotification(item.id);
                    }}
                    className="p-1 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                    title="ארכיון"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(item.id);
                  }}
                  className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                  title="מחק"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Load more button (Infinite Scroll indicator) */}
        {hasMore && filtered.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            className="w-full mt-2 h-8.5 text-xs font-bold shrink-0 cursor-pointer"
          >
            טען התראות נוספות
          </Button>
        )}
      </div>
    </div>
  );
};
NotificationCenter.displayName = "NotificationCenter";
