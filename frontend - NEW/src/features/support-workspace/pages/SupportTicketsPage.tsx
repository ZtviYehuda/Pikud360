import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Archive,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  AlertTriangle,
  Send,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/config/api.client";

interface Ticket {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  resolution_comment?: string;
  admin_reply?: string;
  created_at: string;
  updated_at?: string;
  screenshot_url?: string;
  context_page?: string;
  sender_name?: string;
  department_name?: string;
  start_date?: string;
  end_date?: string;
  access_duration?: string;
  access_expires_at?: string;
  user_id?: string;
}

const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "default" }> = {
  received: { label: "חדש / ממתין", variant: "secondary" },
  open: { label: "פתוח", variant: "secondary" },
  in_progress: { label: "בטיפול", variant: "default" },
  done: { label: "טופל בהצלחה", variant: "outline" },
  resolved: { label: "טופל", variant: "outline" },
  approved: { label: "אושר", variant: "default" },
  rejected: { label: "נדחה", variant: "destructive" },
};

const categoryLabels: Record<string, string> = {
  archive_restore: "שחזור מארכיון",
  bug: "דיווח על תקלה",
  feature: "הצעת ייעול",
  improvement: "שיפור מערכת",
  question: "שאלה / תמיכה",
  general: "פנייה כללית",
};

export const SupportTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Selected ticket for modal / drawer
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [accessDuration, setAccessDuration] = useState<string>("24h");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Ticket[]>("/support/tickets");
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to load tickets", e);
      toast.error("שגיאה בטעינת פניות תמיכה");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Status filter
      if (statusFilter === "pending") {
        if (!["received", "open", "pending"].includes(t.status)) return false;
      } else if (statusFilter === "archive_restore") {
        const isArchive = t.category === "archive_restore" || t.title?.includes("שחזור");
        if (!isArchive) return false;
      } else if (statusFilter === "in_progress") {
        if (t.status !== "in_progress") return false;
      } else if (statusFilter === "resolved") {
        if (!["done", "resolved", "approved", "rejected"].includes(t.status)) return false;
      }

      // Category filter
      if (categoryFilter !== "ALL") {
        if (t.category !== categoryFilter) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesSender = t.sender_name?.toLowerCase().includes(q);
        const matchesDept = t.department_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSender && !matchesDept) return false;
      }

      return true;
    });
  }, [tickets, statusFilter, categoryFilter, search]);

  const handleDecision = async (decision: "approved" | "done" | "in_progress" | "rejected") => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const isArchive = selectedTicket.category === "archive_restore" || selectedTicket.title?.includes("שחזור");
      
      let finalComment = replyText.trim();
      if (!finalComment) {
        if (decision === "approved") {
          finalComment = isArchive ? "בקשת השחזור מהארכיון אושרה לצפייה." : "הבקשה אושרה.";
        } else if (decision === "done") {
          finalComment = "הפנייה טופלה בהצלחה ע״י צוות התמיכה.";
        } else if (decision === "in_progress") {
          finalComment = "הפנייה התקבלה ונמצאת בבדיקה ובטיפול.";
        } else if (decision === "rejected") {
          finalComment = "הבקשה נדחתה ע״י צוות הניהול.";
        }
      }

      await apiClient.put(`/feedback/admin/update/${selectedTicket.id}`, {
        status: decision,
        admin_reply: finalComment,
        resolution_comment: finalComment,
        access_duration: isArchive ? accessDuration : undefined,
      });

      toast.success("סטטוס הפנייה עודכן בהצלחה");
      setSelectedTicket(null);
      setReplyText("");
      fetchTickets();
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בעדכון הפנייה");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = tickets.filter((t) => ["received", "open", "pending"].includes(t.status)).length;
  const restoreCount = tickets.filter(
    (t) => (t.category === "archive_restore" || t.title?.includes("שחזור")) && ["received", "open", "pending"].includes(t.status)
  ).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <LifeBuoy className="w-5 h-5 text-primary" />
            <span>ניהול פניות ובקשות מפקדים</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            טיפול בפניות שירות, דיווחי תקלות ואישור בקשות שחזור מארכיון
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          disabled={loading}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>רענון נתונים</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("pending")}
          className="h-8 text-xs gap-1.5 rounded-lg"
        >
          <span>ממתינות למענה</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-background/30 text-foreground font-bold">
              {pendingCount}
            </Badge>
          )}
        </Button>

        <Button
          variant={statusFilter === "archive_restore" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("archive_restore")}
          className="h-8 text-xs gap-1.5 rounded-lg"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>בקשות שחזור ארכיון</span>
          {restoreCount > 0 && (
            <Badge variant="destructive" className="px-1.5 py-0 text-[10px] font-bold">
              {restoreCount}
            </Badge>
          )}
        </Button>

        <Button
          variant={statusFilter === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("in_progress")}
          className="h-8 text-xs rounded-lg"
        >
          בטיפול
        </Button>

        <Button
          variant={statusFilter === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("resolved")}
          className="h-8 text-xs rounded-lg"
        >
          טופלו / נסגרו
        </Button>

        <Button
          variant={statusFilter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("ALL")}
          className="h-8 text-xs rounded-lg"
        >
          כלל הפניות ({tickets.length})
        </Button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="חיפוש לפי כותרת, תיאור, שם מפקד או מחלקה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs pr-9 bg-card"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 text-xs px-3 rounded-lg border border-border/40 bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary w-full sm:w-44"
          >
            <option value="ALL">כל הקטגוריות</option>
            <option value="archive_restore">שחזור מארכיון</option>
            <option value="bug">דיווח על תקלה</option>
            <option value="feature">הצעת ייעול</option>
            <option value="question">שאלה / תמיכה</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border/40 animate-pulse p-4" />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-border/60">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-foreground">אין פניות להצגה</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter === "pending"
                ? "כל הפניות טופלו! אין פניות הממתינות למענה כעת."
                : "לא נמצאו פניות התואמות את הסינון המבוקש."}
            </p>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const isArchive = ticket.category === "archive_restore" || ticket.title?.includes("שחזור");
            const badge = statusBadges[ticket.status] || { label: ticket.status, variant: "outline" };
            const catLabel = categoryLabels[ticket.category] || ticket.category;

            return (
              <Card
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setReplyText(ticket.admin_reply || ticket.resolution_comment || "");
                }}
                className="p-4 border-border/40 hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {ticket.title || catLabel}
                    </span>
                    <Badge variant={isArchive ? "destructive" : "secondary"} className="text-[10px] py-0 px-2">
                      {catLabel}
                    </Badge>
                    {ticket.department_name && (
                      <span className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md font-medium">
                        {ticket.department_name}
                      </span>
                    )}
                    {ticket.sender_name && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.sender_name}
                      </span>
                    )}
                    {ticket.screenshot_url && (
                      <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                        <Eye className="w-3 h-3" />
                        צילום מסך
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  {(ticket.admin_reply || ticket.resolution_comment) && (
                    <div className="text-[11px] text-primary bg-primary/5 px-2.5 py-1 rounded-md font-medium mt-1">
                      מענה קיים: {ticket.admin_reply || ticket.resolution_comment}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(ticket.created_at).toLocaleDateString("he-IL")}
                  </span>
                  <Badge variant={badge.variant as any} className="text-[11px] py-0.5 px-2 font-semibold">
                    {badge.label}
                  </Badge>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Ticket Details & Decision Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg p-5 rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <LifeBuoy className="w-4 h-4 text-primary" />
              <span>{selectedTicket?.title || "פרטי פנייה"}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 text-xs mt-2">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/20">
                <div>
                  <span className="text-muted-foreground">מאת:</span>
                  <span className="font-semibold text-foreground mr-1.5">{selectedTicket.sender_name || "מפקד"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">מחלקה:</span>
                  <span className="font-semibold text-foreground mr-1.5">{selectedTicket.department_name || "כללי"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">תאריך:</span>
                  <span className="font-mono text-foreground mr-1.5">
                    {new Date(selectedTicket.created_at).toLocaleString("he-IL")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">קטגוריה:</span>
                  <span className="font-semibold text-foreground mr-1.5">
                    {categoryLabels[selectedTicket.category] || selectedTicket.category}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block">תוכן הפנייה:</label>
                <div className="p-3 rounded-xl bg-muted/15 border border-border/40 text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.screenshot_url && (
                <div>
                  <label className="font-semibold text-foreground mb-1 block">צילום מסך מצורף:</label>
                  <a
                    href={selectedTicket.screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>פתח צילום מסך בחלון חדש</span>
                  </a>
                </div>
              )}

              {/* Archive Duration if archive restore */}
              {(selectedTicket.category === "archive_restore" || selectedTicket.title?.includes("שחזור")) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block">
                    משך זמן גישה לשחזור מהארכיון:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "24h", label: "24 שעות" },
                      { id: "48h", label: "48 שעות" },
                      { id: "7d", label: "7 ימים" },
                      { id: "permanent", label: "קבוע" },
                    ].map((dur) => (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setAccessDuration(dur.id)}
                        className={`py-1.5 text-xs rounded-lg font-semibold border transition-all ${
                          accessDuration === dur.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border/50 text-foreground hover:bg-muted"
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-foreground mb-1 block">מענה ותשובת צוות התמיכה:</label>
                <Textarea
                  placeholder="הזן תשובה למפקד (התשובה תופיע אצלו בהתראה ובהיסטוריית הפניות)..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px] text-xs bg-card"
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
                {(selectedTicket.category === "archive_restore" || selectedTicket.title?.includes("שחזור")) ? (
                  <>
                    <Button
                      onClick={() => handleDecision("approved")}
                      disabled={submitting}
                      className="w-full sm:flex-1 h-9 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>אשר שחזור מארכיון</span>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDecision("rejected")}
                      disabled={submitting}
                      className="w-full sm:w-auto h-9 text-xs font-bold"
                    >
                      דחה בקשה
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleDecision("done")}
                      disabled={submitting}
                      className="w-full sm:flex-1 h-9 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>סמן כטופל ושלח מענה</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDecision("in_progress")}
                      disabled={submitting}
                      className="w-full sm:w-auto h-9 text-xs font-bold"
                    >
                      העבר לטיפול
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketsPage;
