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
  AlertTriangle,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronDown,
  Edit,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";
import { supportApi } from "../api";
import type { Incident, IncidentSeverity, IncidentStatus } from "../types";

export const SupportIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Incident Modal State
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>("MAJOR");
  const [newAffected, setNewAffected] = useState<string>("כללי");

  // Update Incident Modal State
  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<IncidentStatus>("INVESTIGATING");
  const [updateNote, setUpdateNote] = useState<string>("");

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await supportApi.getIncidents();
      setIncidents(data);
    } catch (e) {
      console.error("Failed to load incidents", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("נא להזין כותרת לאירוע");
      return;
    }
    setCreating(true);
    try {
      await supportApi.createIncident({
        title: newTitle.trim(),
        description: newDesc.trim(),
        severity: newSeverity,
        affected_system: newAffected.trim(),
      });
      toast.success("האירוע נפתח ותועד בהצלחה");
      setCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      fetchIncidents();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "פתיחת האירוע נכשלה"));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editIncident) return;
    setUpdating(true);
    try {
      await supportApi.updateIncident(editIncident.id, {
        status: updateStatus,
        note: updateNote.trim() || undefined,
      });
      toast.success("סטטוס האירוע עודכן בהצלחה");
      setEditIncident(null);
      setUpdateNote("");
      fetchIncidents();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "עדכון האירוע נכשל"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            ניהול תקלות ואירועי שירות
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            מעקב אחר תקלות מבצעיות, ניהול שלבי חקירה ותיעוד ציר זמן (Incident Response Lifecycle)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIncidents}
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
            <span>דיווח על תקלה חדשה</span>
          </Button>
        </div>
      </div>

      {/* Incidents Table */}
      <Card className="border-border/40 shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-right text-xs font-semibold">כותרת האירוע</TableHead>
                <TableHead className="text-right text-xs font-semibold">מערכת מושפעת</TableHead>
                <TableHead className="text-right text-xs font-semibold">חומרה</TableHead>
                <TableHead className="text-right text-xs font-semibold">סטטוס</TableHead>
                <TableHead className="text-right text-xs font-semibold">נפתח בתאריך</TableHead>
                <TableHead className="text-left text-xs font-semibold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc) => (
                <TableRow key={inc.id} className="border-border/30 hover:bg-muted/10 text-xs">
                  <TableCell className="font-medium">
                    <div>
                      <span className="font-semibold block text-foreground">{inc.title}</span>
                      <span className="text-[11px] text-muted-foreground">{inc.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {inc.affected_system || "כללי"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inc.severity === "CRITICAL"
                          ? "destructive"
                          : inc.severity === "MAJOR"
                          ? "outline"
                          : "secondary"
                      }
                      className={`text-[10px] py-0 px-2 ${
                        inc.severity === "MAJOR" ? "text-amber-500 border-amber-500/30" : ""
                      }`}
                    >
                      {inc.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono">
                      {inc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {new Date(inc.created_at).toLocaleString("he-IL")}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 hover:text-primary"
                      onClick={() => {
                        setEditIncident(inc);
                        setUpdateStatus(inc.status);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                      <span>עדכן סטטוס</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {incidents.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                    אין אירועים פתוחים או היסטוריים במערכת.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Create Incident */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span>דיווח ותיעוד אירוע שירות / תקלה</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">כותרת האירוע</label>
              <Input
                placeholder="לדוגמה: איטיות במענה ממשק הנוכחות"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="h-9 text-xs bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">מערכת / רכיב מושפע</label>
              <Input
                placeholder="לדוגמה: PostgreSQL, Workforce API, SMS Gateway"
                value={newAffected}
                onChange={(e) => setNewAffected(e.target.value)}
                className="h-9 text-xs bg-muted/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">רמת חומרה</label>
              <div className="grid grid-cols-3 gap-2">
                {(["MINOR", "MAJOR", "CRITICAL"] as IncidentSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setNewSeverity(sev)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      newSeverity === sev
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block text-foreground">תיאור והשפעה מבצעית</label>
              <Textarea
                placeholder="פירוט תסמיני התקלה, משתמשים מושפעים וצעדים ראשוניים שננקטו..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="text-xs bg-muted/20 resize-none"
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
                <span>פתח אירוע</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Update Incident Status */}
      {editIncident && (
        <Dialog open={true} onOpenChange={() => setEditIncident(null)}>
          <DialogContent className="max-w-md p-6 rounded-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                עדכון סטטוס אירוע: {editIncident.title}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold block text-foreground">שלב בניהול התקלה</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      "OPEN",
                      "INVESTIGATING",
                      "IDENTIFIED",
                      "MONITORING",
                      "RESOLVED",
                      "CLOSED",
                    ] as IncidentStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setUpdateStatus(st)}
                      className={`py-1.5 rounded-lg border text-[11px] font-mono transition-colors ${
                        updateStatus === st
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "border-border/60 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block text-foreground">הערת ציר זמן (Timeline Note)</label>
                <Textarea
                  placeholder="עדכון מהשטח, ממצאי חקירה או פירוט הפתרון..."
                  value={updateNote}
                  onChange={(e) => setNewAffected(e.target.value)}
                  rows={3}
                  className="text-xs bg-muted/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditIncident(null)}
                  className="h-8 text-xs"
                >
                  ביטול
                </Button>
                <Button type="submit" size="sm" disabled={updating} className="h-8 text-xs gap-1.5">
                  {updating && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>שמור עדכון</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SupportIncidentsPage;
