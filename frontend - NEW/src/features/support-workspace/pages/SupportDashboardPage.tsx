import React, { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LifeBuoy,
  Users,
  ShieldAlert,
  Archive,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Megaphone,
  User,
  Clock,
  Layers,
} from "lucide-react";
import apiClient from "@/config/api.client";
import { supportApi } from "../api";
import type { SupportDashboardStats, Announcement } from "../types";

interface Ticket {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  sender_name?: string;
  department_name?: string;
}

const categoryLabels: Record<string, string> = {
  archive_restore: "שחזור מארכיון",
  bug: "דיווח תקלה",
  feature: "הצעת ייעול",
  improvement: "שיפור מערכת",
  question: "שאלה / תמיכה",
  general: "פנייה כללית",
};

export const SupportDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{
    onSelectUser: (id: number | string) => void;
  }>();

  const [stats, setStats] = useState<SupportDashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [dashStats, ticketsRes, annRes] = await Promise.allSettled([
        supportApi.getDashboard(),
        apiClient.get<Ticket[]>("/support/tickets"),
        supportApi.getAnnouncements({ active_only: true }),
      ]);

      if (dashStats.status === "fulfilled") {
        setStats(dashStats.value);
      }
      if (ticketsRes.status === "fulfilled" && Array.isArray(ticketsRes.value.data)) {
        setRecentTickets(ticketsRes.value.data);
      }
      if (annRes.status === "fulfilled") {
        setActiveAnnouncements(annRes.value);
      }
    } catch (e) {
      console.error("Error loading support dashboard data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Pending tickets & archive restores
  const pendingTickets = recentTickets.filter((t) => ["received", "open", "pending"].includes(t.status));
  const pendingRestoreCount = recentTickets.filter(
    (t) => (t.category === "archive_restore" || t.title?.includes("שחזור")) && ["received", "open", "pending"].includes(t.status)
  ).length;

  const kpis = [
    {
      title: "פניות שירות פתוחות",
      value: pendingTickets.length || stats?.open_tickets_count || 0,
      subtext: "ממתינות למענה במערכת",
      icon: LifeBuoy,
      status: (pendingTickets.length || stats?.open_tickets_count || 0) > 0 ? "warning" : "neutral",
    },
    {
      title: "בקשות שחזור מארכיון",
      value: pendingRestoreCount,
      subtext: pendingRestoreCount > 0 ? "ממתינות לאישור מיידי" : "אין בקשות ממתינות",
      icon: Archive,
      status: pendingRestoreCount > 0 ? "critical" : "neutral",
    },
    {
      title: "משתמשים מחוברים כעת",
      value: stats?.active_sessions_count ?? 1,
      subtext: "סשנים פעילים כעת במערכת",
      icon: Users,
      status: "info",
    },
    {
      title: "נסיונות התחברות כושלים (24 שעות)",
      value: stats?.failed_logins_24h ?? 0,
      subtext: (stats?.failed_logins_24h ?? 0) > 5 ? "חריגה באבטחה" : "מאובטח | ללא חריגות",
      icon: ShieldAlert,
      status: (stats?.failed_logins_24h ?? 0) > 5 ? "warning" : "neutral",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            תמונת מצב תפעולית
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            לוח פיקוד ומעקב מרכזי של צוות התמיכה ומנהל המערכת
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>רענון נתונים</span>
          </Button>
        </div>
      </div>

      {/* 4 Clean Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-4 space-y-2 border-border/40 bg-card shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold leading-none">{kpi.title}</span>
                <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {kpi.value}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {kpi.subtext}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Pending Tickets & Operational Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Pending Tickets & Restores */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-xs">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-primary" />
                  <span>פניות ובקשות שחזור אחרונות</span>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  פניות מפקדים ובקשות שחזור מארכיון הממתינות לטיפול
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1 text-primary">
                <Link to="/support-workspace/tickets">
                  <span>לכל הפניות</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              {pendingTickets.length > 0 ? (
                <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden">
                  {pendingTickets.slice(0, 5).map((t) => {
                    const isArchive = t.category === "archive_restore" || t.title?.includes("שחזור");
                    return (
                      <Link
                        key={t.id}
                        to="/support-workspace/tickets"
                        className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors block"
                      >
                        <div className="space-y-1 flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate">{t.title}</span>
                            <Badge
                              variant={isArchive ? "destructive" : "secondary"}
                              className="text-[10px] py-0 px-1.5 shrink-0"
                            >
                              {categoryLabels[t.category] || t.category}
                            </Badge>
                            {t.department_name && (
                              <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm">
                                {t.department_name}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{t.description}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-left">
                          {t.sender_name && (
                            <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {t.sender_name}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(t.created_at).toLocaleDateString("he-IL")}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-border/60 rounded-xl space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">כל הפניות טופלו!</p>
                  <p className="text-[11px] text-muted-foreground">
                    אין כרגע פניות שירות או בקשות שחזור הממתינות למענה
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Actions & Broadcasts */}
        <div className="space-y-6">
          {/* Quick Support Actions */}
          <Card className="border-border/40 shadow-xs">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                פעולות תמיכה מהירות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start h-9 text-xs gap-2.5 font-medium"
              >
                <Link to="/support-workspace/users">
                  <Users className="w-4 h-4 text-primary" />
                  <span>איתור ואבחון משתמש</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start h-9 text-xs gap-2.5 font-medium"
              >
                <Link to="/support-workspace/tickets">
                  <LifeBuoy className="w-4 h-4 text-emerald-600" />
                  <span>ניהול פניות ושחזורים</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start h-9 text-xs gap-2.5 font-medium"
              >
                <Link to="/support-workspace/announcements">
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  <span>פרסום הודעת מערכת</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start h-9 text-xs gap-2.5 font-medium"
              >
                <Link to="/support-workspace/updates">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>יומן גרסאות ועדכונים</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Active System Announcements Card */}
          <Card className="border-border/40 shadow-xs">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>הודעות מערכת פעילות</span>
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="h-6 text-[11px] px-2">
                <Link to="/support-workspace/announcements">ניהול</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {activeAnnouncements.length > 0 ? (
                <div className="space-y-2">
                  {activeAnnouncements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs space-y-1"
                    >
                      <div className="font-semibold text-foreground flex items-center justify-between">
                        <span>{ann.title}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/40 text-amber-600">
                          משודר למשתמשים
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{ann.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-muted/20 text-xs text-muted-foreground">
                  אין כרגע הודעת מערכת משודרת למשתמשים.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboardPage;
