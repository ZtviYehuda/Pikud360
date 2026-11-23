import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { supportApi } from "../api";
import type { Announcement, AnnouncementPriority } from "../types";

export const SupportAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Modal
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newPriority, setNewPriority] = useState<AnnouncementPriority>("NORMAL");
  const [newDismissible, setNewDismissible] = useState<boolean>(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await supportApi.getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error("Failed to load announcements", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("נא למלא כותרת ותוכן להודעה");
      return;
    }

    setCreating(true);
    try {
      await supportApi.createAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
        priority: newPriority,
        is_dismissible: newDismissible,
      });
      toast.success("הודעת המערכת פורסמה בהצלחה לכלל המשתמשים");
      setCreateOpen(false);
      setNewTitle("");
      setNewContent("");
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "פרסום ההודעה נכשל");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("האם למחוק הודעת מערכת זו לצמיתות?")) return;
    try {
      await supportApi.deleteAnnouncement(id);
      toast.success("ההודעה הוסרה");
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "מחיקת ההודעה נכשלה");
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            הודעות מערכת ופופ-אפים
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            פרסום באנרים, התראות תחזוקה והודעות מתפרצות ישירות למסכי המפקדים והעובדים
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnnouncements}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>רענון</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>פרסם הודעה חדשה</span>
          </Button>
        </div>
      </div>

      {/* Announcements Table */}
      <Card className="border-border/40 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-right text-xs font-semibold">כותרת ההודעה</TableHead>
                <TableHead className="text-right text-xs font-semibold">תוכן</TableHead>
                <TableHead className="text-right text-xs font-semibold">עדיפות</TableHead>
                <TableHead className="text-right text-xs font-semibold">סטטוס</TableHead>
                <TableHead className="text-right text-xs font-semibold">תאריך יצירה</TableHead>
                <TableHead className="text-left text-xs font-semibold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((ann) => (
                <TableRow key={ann.id} className="border-border/30 hover:bg-muted/10 text-xs">
                  <TableCell className="font-semibold text-foreground">{ann.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {ann.content}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ann.priority === "CRITICAL"
                          ? "destructive"
                          : ann.priority === "HIGH"
                          ? "outline"
                          : "secondary"
                      }
                      className={`text-[10px] py-0 px-2 ${
                        ann.priority === "HIGH" ? "text-amber-500 border-amber-500/30" : ""
                      }`}
                    >
                      {ann.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ann.is_active ? "default" : "secondary"}
                      className="text-[10px] py-0 px-2"
                    >
                      {ann.is_active ? "פעילה" : "מושהית"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {new Date(ann.created_at).toLocaleDateString("he-IL")}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                      onClick={() => handleDelete(ann.id)}
                      title="מחק הודעה"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {announcements.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                    אין הודעות מערכת פעילות כעת.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Create Announcement */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <span>יצירה ופרסום של הודעת מערכת</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">כותרת ההודעה</label>
              <Input
                placeholder="לדוגמה: עבודות תחזוקה מתוכננות הלילה"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="h-9 text-xs bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">תוכן ההודעה למשתמש</label>
              <Textarea
                placeholder="פירוט ההודעה שתוצג בבאנר העליון..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
                rows={3}
                className="text-xs bg-muted/20 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">רמת דחיפות (Priority)</label>
              <div className="grid grid-cols-4 gap-2">
                {(["LOW", "NORMAL", "HIGH", "CRITICAL"] as AnnouncementPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      newPriority === p
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <span className="font-semibold text-foreground">ניתנת לסגירה ע״י המשתמש (Dismissible)</span>
              <input
                type="checkbox"
                checked={newDismissible}
                onChange={(e) => setNewDismissible(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                className="h-8 text-xs"
              >
                ביטול
              </Button>
              <Button type="submit" size="sm" disabled={creating} className="h-8 text-xs gap-1.5">
                {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>פרסם לכולם</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportAnnouncementsPage;
