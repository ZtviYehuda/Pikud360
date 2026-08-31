import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import apiClient from "@/config/api.client";
import { toast } from "sonner";

interface UserTermsRecord {
  id: string;
  username: string;
  email: string;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  created_at: string | null;
  first_name: string;
  last_name: string;
  position: string;
}

interface TermsStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsStatusModal: React.FC<TermsStatusModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [users, setUsers] = useState<UserTermsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "accepted" | "pending">("all");

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/security/terms-status");
      if (data?.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data?.error || "כשל בטעינת נתוני אישור התקנון");
      }
    } catch (err: any) {
      console.error("Error fetching terms status:", err);
      toast.error(err?.response?.data?.error || "שגיאה בתקשורת עם השרת");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchStatus();
    }
  }, [open, fetchStatus]);

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "accepted") return u.terms_accepted;
    if (statusFilter === "pending") return !u.terms_accepted;
    return true;
  });

  const totalCount = users.length;
  const acceptedCount = users.filter((u) => u.terms_accepted).length;
  const pendingCount = totalCount - acceptedCount;
  const percentage = totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0;

  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error("אין נתונים לייצוא");
      return;
    }

    const headers = ["שם משתמש", "אימייל", "שם מלא", "תפקיד", "סטטוס אישור תקנון", "תאריך אישור"];
    const rows = users.map((u) => [
      u.username,
      u.email,
      `${u.first_name} ${u.last_name}`,
      u.position,
      u.terms_accepted ? "אושר" : "טרם אושר",
      u.terms_accepted_at ? new Date(u.terms_accepted_at).toLocaleString("he-IL") : "-",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `דוח_אישור_תקנון_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("דוח CSV יוצא בהצלחה");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-t-[2.2rem] rounded-b-none sm:rounded-3xl border-border/40 bg-background shadow-2xl dir-rtl">
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black tracking-tight text-white">
                    מעקב אישור תקנון ואבטחת מידע
                  </DialogTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold text-xs">
                    צוות תמיכה בלבד 🛡️
                  </Badge>
                </div>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  צפייה בזמן אמת ביוזרים שאישרו את תקנון המערכת ואלו שטרם אישרו
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                disabled={isLoading}
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 h-9 rounded-xl text-xs font-bold gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                רענן
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCSV}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black h-9 rounded-xl text-xs gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                ייצוא דוח
              </Button>
            </div>
          </div>

          {/* Metrics Overview Bar */}
          <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">סה"כ משתמשים</span>
                <span className="text-lg font-black text-white">{totalCount}</span>
              </div>
              <Users className="w-5 h-5 text-slate-400" />
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 block">אישרו את התקנון</span>
                <span className="text-lg font-black text-emerald-300">{acceptedCount}</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-400 block">טרם אישרו</span>
                <span className="text-lg font-black text-rose-300">{pendingCount}</span>
              </div>
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 block">אחוז אישור תקנון</span>
                <span className="text-lg font-black text-amber-300">{percentage}%</span>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-muted/20 border-b border-border/40 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי שם, אימייל או שם משתמש..."
              className="pr-9 h-10 rounded-xl bg-background text-xs font-bold border-border/40"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-border/40 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              הכל ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "accepted"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-emerald-600"
              }`}
            >
              אישרו (🟢 {acceptedCount})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "pending"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-rose-600"
              }`}
            >
              טרם אישרו (🔴 {pendingCount})
            </button>
          </div>
        </div>

        {/* Main Users Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto opacity-70" />
              <p className="text-xs font-bold text-muted-foreground">טוען את נתוני אישור התקנון...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-muted/10 rounded-2xl border border-dashed border-border/60">
              <ShieldAlert className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-bold text-foreground">לא נמצאו משתמשים בהתאם לסנון</p>
              <p className="text-xs text-muted-foreground">נסה לשנות את מונחי החיפוש או את הפילטר הנבחר</p>
            </div>
          ) : (
            <div className="border border-border/40 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border/40 text-muted-foreground font-black">
                    <th className="p-3">משתמש / שם מלא</th>
                    <th className="p-3">דוא"ל / תפקיד</th>
                    <th className="p-3 text-center">סטטוס אישור תקנון</th>
                    <th className="p-3 text-left">תאריך ושעת אישור</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredUsers.map((user) => {
                    const fullName =
                      `${user.first_name} ${user.last_name}`.trim() || user.username;
                    return (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground">{fullName}</div>
                          <div className="text-[11px] text-muted-foreground font-mono dir-ltr text-right">
                            @{user.username}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-foreground dir-ltr text-right">
                            {user.email}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {user.position || "משתמש מערכת"}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {user.terms_accepted ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 py-1 px-2.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              מאושר בתקנון
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 gap-1.5 py-1 px-2.5 font-bold">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              טרם אושר
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-left">
                          {user.terms_accepted_at ? (
                            <div className="flex items-center gap-1.5 justify-end text-slate-700 dark:text-slate-300 font-semibold dir-ltr">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>{new Date(user.terms_accepted_at).toLocaleString("he-IL")}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
