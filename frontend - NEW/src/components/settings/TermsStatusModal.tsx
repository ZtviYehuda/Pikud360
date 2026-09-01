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
import { cn } from "@/lib/utils";

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
      <DialogContent className="w-[96vw] sm:w-[92vw] sm:max-w-4xl lg:max-w-5xl h-[88vh] max-h-[840px] flex flex-col p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-2xl dir-rtl">
        {/* Header Section */}
        <div className="px-6 py-4 sm:px-8 sm:pt-6 sm:pb-4 border-b border-border/50 bg-card/95 backdrop-blur-md sticky top-0 z-10 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <DialogHeader className="text-right">
                <div className="flex items-center gap-2.5">
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground">
                    מעקב אישור תקנון ואבטחת מידע
                  </DialogTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black text-[11px] px-2 py-0.5">
                    צוות תמיכה בלבד 🛡️
                  </Badge>
                </div>
                <DialogDescription className="text-muted-foreground text-xs sm:text-sm mt-0.5 font-medium">
                  צפייה בזמן אמת ביוזרים שאישרו את תקנון המערכת ואלו שטרם אישרו
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Action buttons with clearance for Close (X) button on the left */}
            <div className="flex items-center gap-2 self-end sm:self-auto pl-12 sm:pl-14">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                disabled={isLoading}
                className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border/60 hover:bg-muted/50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>רענן</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 px-3.5 rounded-xl text-xs font-black gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ייצוא דוח</span>
              </Button>
            </div>
          </div>

          {/* Metrics Overview Bar - Interactive Filter Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
            {/* All Users Card */}
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-right transition-all cursor-pointer select-none",
                statusFilter === "all"
                  ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-xs"
                  : "bg-muted/40 border-border/50 hover:bg-muted/60 hover:border-border"
              )}
            >
              <div>
                <span className="text-[10.5px] sm:text-[11.5px] font-bold text-muted-foreground block mb-0.5">סה"כ משתמשים</span>
                <span className="text-lg sm:text-xl font-black text-foreground">{totalCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </button>

            {/* Accepted Card */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "accepted" ? "all" : "accepted")}
              className={cn(
                "border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-right transition-all cursor-pointer select-none",
                statusFilter === "accepted"
                  ? "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs"
                  : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/40"
              )}
            >
              <div>
                <span className="text-[10.5px] sm:text-[11.5px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">אישרו תנאים</span>
                <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">{acceptedCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </button>

            {/* Pending Card */}
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
              className={cn(
                "border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-right transition-all cursor-pointer select-none",
                statusFilter === "pending"
                  ? "bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30 shadow-xs"
                  : "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15 hover:border-rose-500/40"
              )}
            >
              <div>
                <span className="text-[10.5px] sm:text-[11.5px] font-bold text-rose-700 dark:text-rose-400 block mb-0.5">טרם אישרו</span>
                <span className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300">{pendingCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </button>

            {/* Percentage Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10.5px] sm:text-[11.5px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">אחוז אישור</span>
                <span className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300">{percentage}%</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 sm:px-8 bg-muted/20 border-b border-border/40 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש מהיר לפי שם, אימייל או שם משתמש..."
              className="pr-10 h-9 sm:h-10 rounded-xl bg-background text-xs font-bold border-border/50 shadow-2xs w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {statusFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-bold gap-1 rounded-lg cursor-pointer"
              >
                <span>הצג הכל</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {totalCount}
                </Badge>
              </Button>
            )}
            <span className="text-xs font-bold text-muted-foreground hidden sm:inline-block">
              מציג {filteredUsers.length} מתוך {totalCount} משתמשים
            </span>
          </div>
        </div>

        {/* Main Users Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 sm:px-8 min-h-0">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto opacity-70" />
              <p className="text-xs font-bold text-muted-foreground">טוען את נתוני אישור התקנון...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-muted/10 rounded-2xl border border-dashed border-border/60">
              <ShieldAlert className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-bold text-foreground">לא נמצאו משתמשים בהתאם לסינון</p>
              <p className="text-xs text-muted-foreground">נסה לשנות את מונחי החיפוש או את הפילטר הנבחר</p>
            </div>
          ) : (
            <div className="border border-border/50 rounded-2xl overflow-hidden shadow-2xs bg-card">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground font-black sticky top-0 backdrop-blur-xs z-10">
                    <th className="py-3 px-4">משתמש / שם מלא</th>
                    <th className="py-3 px-4">דוא"ל / תפקיד</th>
                    <th className="py-3 px-4 text-center">סטטוס אישור תקנון</th>
                    <th className="py-3 px-4 text-left">תאריך ושעת אישור</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredUsers.map((user) => {
                    const fullName =
                      `${user.first_name} ${user.last_name}`.trim() || user.username;
                    return (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground text-sm">{fullName}</div>
                          <div className="text-[11px] text-muted-foreground font-mono dir-ltr text-right">
                            @{user.username}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground dir-ltr text-right">
                            {user.email}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {user.position || "משתמש מערכת"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {user.terms_accepted ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 py-1 px-3 font-bold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              מאושר בתקנון
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 gap-1.5 py-1 px-3 font-bold text-xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              טרם אושר
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-left">
                          {user.terms_accepted_at ? (
                            <div className="flex items-center gap-1.5 justify-end text-foreground font-semibold dir-ltr text-xs">
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
