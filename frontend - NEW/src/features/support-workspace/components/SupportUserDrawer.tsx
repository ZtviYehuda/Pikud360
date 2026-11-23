import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  KeyRound,
  History,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  LogIn,
  Ticket,
  Ban,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Building2,
  GitBranch,
  Calendar,
  ShieldCheck,
  Copy,
  Check,
  Search,
  X,
} from "lucide-react";
import { supportApi } from "../api";
import type { SupportUserDossier } from "../types";

interface SupportUserDrawerProps {
  userId: number | string | null;
  open: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export const SupportUserDrawer: React.FC<SupportUserDrawerProps> = ({
  userId,
  open,
  onClose,
  onUserUpdated,
}) => {
  const [dossier, setDossier] = useState<SupportUserDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [permSearch, setPermSearch] = useState<string>("");

  // Confirmation modal state for sensitive actions
  const [confirmAction, setConfirmAction] = useState<{
    type: "toggle_active" | "reset_password_flag" | "clear_sessions" | "impersonate";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadDossier(userId);
    } else {
      setDossier(null);
      setPermSearch("");
    }
  }, [open, userId]);

  const loadDossier = async (id: number | string) => {
    setLoading(true);
    try {
      const data = await supportApi.getUserDetails(id);
      setDossier(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "שגיאה בטעינת תיק המשתמש");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!confirmAction || !userId) return;
    const actionType = confirmAction.type;
    setActionLoading(actionType);

    try {
      const res = await supportApi.executeUserAction(userId, actionType);

      if (actionType === "impersonate") {
        const impersonationToken = res.data?.token || (res as any).token;
        if (impersonationToken) {
          const currentToken = localStorage.getItem("token");
          if (currentToken) {
            localStorage.setItem("admin_token", currentToken);
          }
          localStorage.setItem("token", impersonationToken);
          toast.success("התחזות הופעלה בהצלחה, מעביר לתצוגת מפקד...");
          window.location.href = "/";
          return;
        }
      }

      toast.success(res.message || "הפעולה בוצעה בהצלחה");
      setConfirmAction(null);
      await loadDossier(userId);
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "הפעולה נכשלה");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success("כתובת האימייל הועתקה ללוח");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const user = dossier?.user;

  const filteredPermissions = dossier?.permissions.filter((p) =>
    p.toLowerCase().includes(permSearch.toLowerCase())
  ) || [];

  return (
    <>
      {/* Main User Dossier Modal (Standard Centered Modal) */}
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent
          className="max-w-2xl w-[95vw] max-h-[88vh] p-0 overflow-hidden rounded-2xl flex flex-col border border-border/80 shadow-2xl bg-card"
          dir="rtl"
        >
          {loading || !user ? (
            <div className="flex flex-col items-center justify-center p-14 space-y-4 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">טוען תיק משתמש...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Profile Header Bar */}
              <div className="p-6 border-b border-border/60 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md relative shrink-0">
                <div className="flex items-start gap-4">
                  {/* Avatar Circle */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary border border-primary/20 flex items-center justify-center text-xl font-black shrink-0 shadow-inner">
                    {user.first_name?.[0] || user.username[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <DialogTitle className="text-lg font-bold tracking-tight text-foreground truncate">
                        {user.display_name || `${user.first_name} ${user.last_name}`}
                      </DialogTitle>

                      {/* Active Status Badge */}
                      <Badge
                        variant={user.is_active ? "default" : "destructive"}
                        className={cn(
                          "text-[10px] py-0.5 px-2 font-bold rounded-lg border flex items-center gap-1",
                          user.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        )}
                      >
                        {user.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>פעיל</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>חסום</span>
                          </>
                        )}
                      </Badge>

                      {/* Password Reset Needed Badge */}
                      {user.must_change_password && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0.5 px-2 font-bold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>חייב איפוס סיסמה</span>
                        </Badge>
                      )}
                    </div>

                    {/* Subtitle Details */}
                    <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <span>שם משתמש:</span>
                        <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[11px]">
                          {user.username}
                        </code>
                      </span>
                      {user.department_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span>{user.department_name}</span>
                        </span>
                      )}
                      {user.role_name && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-primary/70" />
                          <span className="font-semibold text-primary">{user.role_name}</span>
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 text-xs font-bold gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all cursor-pointer"
                    onClick={() =>
                      setConfirmAction({
                        type: "impersonate",
                        title: "התחזות מבוקרת למשתמש (Impersonation)",
                        description: `אתה עומד להיכנס למערכת בזהות של ${user.display_name}. כל הפעולות שייעשו יתועדו ביומן הביקורת. בסיום תוכל לחזור ישירות למרכז התמיכה דרך הסרגל העליון. להמשיך?`,
                      })
                    }
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>התחזה למשתמש</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={user.is_active ? "outline" : "default"}
                    className={cn(
                      "h-9 text-xs font-bold gap-1.5 rounded-xl transition-all cursor-pointer",
                      user.is_active
                        ? "border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                    onClick={() =>
                      setConfirmAction({
                        type: "toggle_active",
                        title: user.is_active ? "חסימת משתמש" : "ביטול חסימת משתמש",
                        description: user.is_active
                          ? `האם אתה בטוח שברצונך לחסום את המשתמש ${user.display_name}? המשתמש לא יוכל להתחבר למערכת.`
                          : `האם ברצונך לבטל את חסימת המשתמש ${user.display_name}?`,
                      })
                    }
                  >
                    {user.is_active ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{user.is_active ? "חסום משתמש" : "שחרר חסימה"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold gap-1.5 rounded-xl border-border/60 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer"
                    onClick={() =>
                      setConfirmAction({
                        type: "reset_password_flag",
                        title: "דרישת החלפת סיסמה",
                        description: `פעולה זו תאלץ את ${user.display_name} לשנות סיסמה בהתחברות הבאה. להמשיך?`,
                      })
                    }
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span>חייב איפוס</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold gap-1.5 rounded-xl border-border/60 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
                    onClick={() =>
                      setConfirmAction({
                        type: "clear_sessions",
                        title: "ניתוק כל החיבורים הפעילים",
                        description: `האם לנתק את כל החיבורים הפעילים של ${user.display_name}?`,
                      })
                    }
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>נתק חיבורים ({dossier.active_sessions_count})</span>
                  </Button>
                </div>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 p-1 bg-muted/60 rounded-xl mb-6">
                    <TabsTrigger
                      value="overview"
                      className="text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>פרטים</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="permissions"
                      className="text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>הרשאות ({dossier.permissions.length})</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="logins"
                      className="text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>התחברויות</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="tickets"
                      className="text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>קריאות ({dossier.tickets.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Overview */}
                  <TabsContent value="overview" className="space-y-4 focus-visible:outline-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email Card */}
                      <div className="p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all flex items-start justify-between group">
                        <div className="space-y-1 min-w-0 pr-1">
                          <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-primary" />
                            <span>כתובת אימייל</span>
                          </span>
                          <p className="text-xs font-semibold text-foreground truncate dir-ltr text-right">
                            {user.email || "לא הוזן"}
                          </p>
                        </div>
                        {user.email && (
                          <button
                            onClick={() => handleCopyEmail(user.email!)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shrink-0 cursor-pointer"
                            title="העתק אימייל"
                          >
                            {copiedEmail ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Phone Card */}
                      <div className="p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          <span>מספר טלפון</span>
                        </span>
                        <p className="text-xs font-semibold text-foreground dir-ltr text-right">
                          {user.phone_number || "לא הוזן"}
                        </p>
                      </div>

                      {/* Section Card */}
                      <div className="p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-primary" />
                          <span>מדור</span>
                        </span>
                        <p className="text-xs font-semibold text-foreground">
                          {user.section_name || "ללא"}
                        </p>
                      </div>

                      {/* Account Creation Date */}
                      <div className="p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all space-y-1">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>תאריך יצירת חשבון</span>
                        </span>
                        <p className="text-xs font-semibold font-mono text-foreground">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString("he-IL", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Account Security Overview Box */}
                    <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold text-foreground">סיכום אבטחת חשבון</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                        <div>
                          <span>חיבורים פעילים:</span>{" "}
                          <span className="font-bold text-foreground">{dossier.active_sessions_count}</span>
                        </div>
                        <div>
                          <span>התחברות אחרונה:</span>{" "}
                          <span className="font-mono text-foreground">
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleDateString("he-IL")
                              : "טרם"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Permissions */}
                  <TabsContent value="permissions" className="space-y-4 focus-visible:outline-none">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="חפש הרשאה..."
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="pr-9 h-9 text-xs rounded-xl bg-card border-border/60"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
                      {filteredPermissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant="secondary"
                          className="font-mono text-[11px] py-1 px-2.5 rounded-lg border border-border/40 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-all cursor-default"
                        >
                          {perm}
                        </Badge>
                      ))}
                      {filteredPermissions.length === 0 && (
                        <p className="text-xs text-muted-foreground py-4 text-center w-full">
                          {permSearch ? "לא נמצאו הרשאות תואמות לחיפוש." : "לא נמצאו הרשאות מפורשות."}
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 3: Recent Logins */}
                  <TabsContent value="logins" className="space-y-3 focus-visible:outline-none">
                    <div className="divide-y divide-border/40 border border-border/50 rounded-2xl overflow-hidden bg-card">
                      {dossier.recent_logins.map((login) => (
                        <div key={login.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/20 transition-all">
                          <div className="flex items-center gap-2.5">
                            {login.status === "SUCCESS" ? (
                              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                <XCircle className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span className="font-bold text-foreground">{login.action}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                            <span className="bg-muted px-2 py-0.5 rounded-md">IP: {login.ip_address}</span>
                            <span>{new Date(login.created_at).toLocaleString("he-IL")}</span>
                          </div>
                        </div>
                      ))}
                      {dossier.recent_logins.length === 0 && (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                          אין רישומי התחברות ביומן הביקורת.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 4: Tickets */}
                  <TabsContent value="tickets" className="space-y-3 focus-visible:outline-none">
                    <div className="divide-y divide-border/40 border border-border/50 rounded-2xl overflow-hidden bg-card">
                      {dossier.tickets.map((t) => (
                        <div key={t.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/20 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Ticket className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-foreground">{t.subject}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold rounded-md">
                              {t.status}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {new Date(t.created_at).toLocaleDateString("he-IL")}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dossier.tickets.length === 0 && (
                        <div className="p-6 text-center text-xs text-muted-foreground">
                          אין קריאות שירות פתוחות למשתמש זה.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Sub-Modal */}
      {confirmAction && (
        <Dialog open={true} onOpenChange={() => setConfirmAction(null)}>
          <DialogContent className="max-w-md p-6 rounded-2xl shadow-2xl border-border" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                <span>{confirmAction.title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-2 leading-relaxed">
                {confirmAction.description}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold rounded-xl cursor-pointer"
                onClick={() => setConfirmAction(null)}
                disabled={Boolean(actionLoading)}
              >
                ביטול
              </Button>
              <Button
                variant={confirmAction.type === "impersonate" ? "default" : "destructive"}
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
                onClick={handleExecuteAction}
                disabled={Boolean(actionLoading)}
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>אישור וביצוע</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
