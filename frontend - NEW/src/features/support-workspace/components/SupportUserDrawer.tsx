import React, { useState, useEffect } from "react";
import {
  AppModal,
  AppModalContent,
  AppModalHeader,
  AppModalBody,
  AppModalFooter,
} from "@/components/common/AppModal";
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
import { cn, extractErrorMessage } from "@/lib/utils";
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
  Clock,
  Laptop,
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
      toast.error(extractErrorMessage(err, "שגיאה בטעינת תיק המשתמש"));
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
      toast.error(extractErrorMessage(err, "הפעולה נכשלה"));
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

  const filteredPermissions =
    dossier?.permissions.filter((p) =>
      p.toLowerCase().includes(permSearch.toLowerCase())
    ) || [];

  return (
    <>
      <AppModal open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <AppModalContent size="lg" className="sm:max-w-2xl max-h-[90vh]">
          {loading || !user ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3.5 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">טוען תיק משתמש...</p>
            </div>
          ) : (
            <>
              {/* Profile Header using AppModalHeader standard */}
              <AppModalHeader
                icon={
                  <div className="w-full h-full rounded-2xl flex items-center justify-center font-black text-lg bg-primary/10 text-primary">
                    {user.first_name?.[0] || user.username[0] || "U"}
                  </div>
                }
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-foreground">
                      {user.display_name || `${user.first_name} ${user.last_name}`}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] py-0.5 px-2 font-bold rounded-lg border flex items-center gap-1",
                        user.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          user.is_active ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      />
                      <span>{user.is_active ? "פעיל" : "חסום"}</span>
                    </Badge>
                    {user.role_name && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0.5 px-2 font-bold font-mono rounded-lg border border-border/40"
                      >
                        {user.role_name}
                      </Badge>
                    )}
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
                }
                subtitle={
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span>שם משתמש:</span>
                      <code className="font-mono font-bold text-foreground bg-muted/80 px-1.5 py-0.5 rounded text-[11px]">
                        {user.username}
                      </code>
                    </span>
                    {user.department_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{user.department_name}</span>
                      </span>
                    )}
                    {user.section_name && (
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{user.section_name}</span>
                      </span>
                    )}
                  </div>
                }
                toolbar={
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8.5 text-xs font-semibold gap-1.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                      onClick={() =>
                        setConfirmAction({
                          type: "impersonate",
                          title: "התחזות מבוקרת למשתמש (Impersonation)",
                          description: `אתה עומד להיכנס למערכת בזהות של ${user.display_name}. כל הפעולות שייעשו יתועדו ביומן הביקורת. בסיום תוכל לחזור ישירות למרכז התמיכה דרך הסרגל העליון. להמשיך?`,
                        })
                      }
                    >
                      <LogIn className="w-3.5 h-3.5 text-primary" />
                      <span>התחזה למשתמש</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 text-xs font-semibold gap-1.5 rounded-xl border-border/60 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer"
                      onClick={() =>
                        setConfirmAction({
                          type: "reset_password_flag",
                          title: "דרישת החלפת סיסמה",
                          description: `פעולה זו תאלץ את ${user.display_name} לשנות סיסמה בהתחברות הבאה. להמשיך?`,
                        })
                      }
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      <span>חייב איפוס סיסמה</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 text-xs font-semibold gap-1.5 rounded-xl border-border/60 hover:bg-muted transition-all cursor-pointer"
                      onClick={() =>
                        setConfirmAction({
                          type: "clear_sessions",
                          title: "ניתוק כל החיבורים הפעילים",
                          description: `האם לנתק את כל החיבורים הפעילים של ${user.display_name}?`,
                        })
                      }
                    >
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>נתק חיבורים ({dossier.active_sessions_count})</span>
                    </Button>

                    <Button
                      size="sm"
                      variant={user.is_active ? "outline" : "default"}
                      className={cn(
                        "h-8.5 text-xs font-semibold gap-1.5 rounded-xl transition-all cursor-pointer ms-auto",
                        user.is_active
                          ? "border-border/60 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
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
                  </div>
                }
              />

              {/* Main Content Body */}
              <AppModalBody className="p-5 sm:p-6 space-y-5">
                <Tabs defaultValue="overview" className="w-full" dir="rtl">
                  <TabsList className="w-full grid grid-cols-4 p-1 bg-muted/60 rounded-xl mb-5">
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
                    {/* Identity & Contact Details */}
                    <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden text-xs shadow-2xs">
                      {/* Email */}
                      <div className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <span className="font-semibold text-muted-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>כתובת אימייל</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-foreground dir-ltr">
                            {user.email || "לא הוזן"}
                          </span>
                          {user.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary cursor-pointer"
                              onClick={() => handleCopyEmail(user.email!)}
                              title="העתק אימייל"
                            >
                              {copiedEmail ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <span className="font-semibold text-muted-foreground flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>מספר טלפון</span>
                        </span>
                        <span className="font-mono font-medium text-foreground dir-ltr">
                          {user.phone_number || "לא הוזן"}
                        </span>
                      </div>

                      {/* Department & Section */}
                      <div className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <span className="font-semibold text-muted-foreground flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span>שיוך ארגוני</span>
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <span>{user.department_name || "ללא מחלקה"}</span>
                          {user.section_name && (
                            <span className="text-muted-foreground">/ {user.section_name}</span>
                          )}
                        </div>
                      </div>

                      {/* Created At */}
                      <div className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                        <span className="font-semibold text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>תאריך יצירת חשבון</span>
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString("he-IL", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Account Security & Activity Box */}
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-xs font-bold text-foreground">סטטוס אבטחה וחיבורים</h4>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-background/60"
                        >
                          {dossier.active_sessions_count > 0
                            ? `${dossier.active_sessions_count} חיבורים פעילים`
                            : "אין חיבורים פעילים"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="bg-card p-3 rounded-xl border border-border/40 space-y-1">
                          <span className="text-[11px] text-muted-foreground block font-medium">
                            סטטוס חשבון
                          </span>
                          <span
                            className={cn(
                              "font-bold flex items-center gap-1.5",
                              user.is_active
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                user.is_active ? "bg-emerald-500" : "bg-rose-500"
                              )}
                            />
                            {user.is_active ? "חשבון פעיל" : "חשבון חסום"}
                          </span>
                        </div>

                        <div className="bg-card p-3 rounded-xl border border-border/40 space-y-1">
                          <span className="text-[11px] text-muted-foreground block font-medium">
                            התחברות אחרונה
                          </span>
                          <span className="font-mono font-bold text-foreground block truncate">
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleString("he-IL", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "טרם התחבר"}
                          </span>
                        </div>

                        <div className="bg-card p-3 rounded-xl border border-border/40 space-y-1 col-span-2 sm:col-span-1">
                          <span className="text-[11px] text-muted-foreground block font-medium">
                            איפוס סיסמה
                          </span>
                          <span
                            className={cn(
                              "font-bold flex items-center gap-1.5",
                              user.must_change_password
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {user.must_change_password ? "נדרש בהתחברות" : "תקין"}
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
                      {permSearch && (
                        <button
                          type="button"
                          onClick={() => setPermSearch("")}
                          className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto custom-scrollbar p-1">
                      {filteredPermissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant="secondary"
                          className="font-mono text-[11px] py-1 px-2.5 rounded-lg border border-border/40 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-all cursor-default select-all"
                        >
                          {perm}
                        </Badge>
                      ))}
                      {filteredPermissions.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center w-full space-y-2">
                          <Shield className="w-8 h-8 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">
                            {permSearch
                              ? "לא נמצאו הרשאות תואמות לחיפוש."
                              : "לא נמצאו הרשאות מפורשות למשתמש זה."}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 3: Recent Logins */}
                  <TabsContent value="logins" className="space-y-3 focus-visible:outline-none">
                    <div className="divide-y divide-border/40 border border-border/50 rounded-2xl overflow-hidden bg-card">
                      {dossier.recent_logins.map((login) => (
                        <div
                          key={login.id}
                          className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/20 transition-all"
                        >
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
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground block">
                                {login.action}
                              </span>
                              <span className="text-[11px] text-muted-foreground sm:hidden">
                                {new Date(login.created_at).toLocaleString("he-IL")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                            <span className="bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Laptop className="w-3 h-3 text-muted-foreground/70" />
                              <span>{login.ip_address}</span>
                            </span>
                            <span className="hidden sm:inline">
                              {new Date(login.created_at).toLocaleString("he-IL")}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dossier.recent_logins.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                          <History className="w-8 h-8 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">
                            אין רישומי התחברות ביומן הביקורת.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 4: Tickets */}
                  <TabsContent value="tickets" className="space-y-3 focus-visible:outline-none">
                    <div className="divide-y divide-border/40 border border-border/50 rounded-2xl overflow-hidden bg-card">
                      {dossier.tickets.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/20 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Ticket className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-foreground truncate">
                              {t.subject}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                          <Ticket className="w-8 h-8 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">
                            אין קריאות שירות פתוחות למשתמש זה.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </AppModalBody>

              {/* Standard Footer */}
              <AppModalFooter className="flex items-center justify-between border-t border-border/40 px-6 py-3.5 bg-muted/10">
                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">ID: {user.id}</code>
                  {user.uuid && (
                    <span className="hidden sm:inline text-muted-foreground/60">
                      • UUID: {user.uuid.slice(0, 8)}...
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8.5 px-5 text-xs font-semibold rounded-xl cursor-pointer"
                  onClick={onClose}
                >
                  סגור
                </Button>
              </AppModalFooter>
            </>
          )}
        </AppModalContent>
      </AppModal>

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
