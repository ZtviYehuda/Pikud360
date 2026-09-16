import React, { useState, useEffect, useRef } from "react";
import apiClient from "@/config/api.client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  CheckCircle2,
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquarePlus,
  ArrowRight,
  ChevronDown,
  Inbox,
  Clock,
  Link2,
  X,
  Image as ImageIcon,
  Eye,
  Trash2,
  Layers,
  Calendar,
  Check,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHANGELOG = [
  {
    version: "1.1.3",
    date: "14 בספטמבר 2026",
    isLatest: true,
    features: [
      "מרכז משוב והצעות חדש ומעוצב לדיווח מהיר על באגים והצעות ייעול ישירות מהמערכת.",
      "תצוגת ימי הולדת משודרגת עם אפשרות הורדה נקייה ומסודרת של כרטיסי ברכה.",
      "כפתור איפוס מהיר ומדויק של מסננים בטבלת העובדים.",
      "שדרוג סרגל הדוחות ומעבר נוח בין יומי, שבועי, חודשי וטווח תאריכים.",
      "שיפורי יציבות, ביצועים והתאמת עיצוב אחידה בכלל המודאלים.",
    ],
  },
  {
    version: "1.1.2",
    date: "2 בספטמבר 2026",
    features: [
      "עיצוב חדש ומודרני לטופס הגשת בקשות ניוד ושיבוץ.",
      "תמיכה בהעלאת תמונות וצילומי מסך במוקד הפניות והמשוב.",
      "שיפור ביצועי מערכת וסנכרון נתונים שוטף.",
    ],
  },
  {
    version: "1.1.0",
    date: "25 באוגוסט 2026",
    features: [
      "מערכת התראות מבצעיות מתקדמת עם צ'אט פיקודי ישיר.",
      "דשבורד מגמות נוכחות וניהול שיבוצים אינטראקטיבי.",
      "שמירה אוטומטית של טפסים ומניעת אובדן נתונים.",
    ],
  },
];

const CATEGORIES = [
  {
    id: "באג במערכת",
    label: "באג במערכת",
    sublabel: "דיווח על שגיאה או תקלה",
    icon: Bug,
    activeColor: "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/30",
    hoverColor: "hover:border-red-500/30",
    placeholder: "תארו את הבאג שנתקלתם בו, היכן הוא קרה ומה היתה התוצאה הצפויה...",
  },
  {
    id: "הצעה לשיפור",
    label: "הצעה לשיפור",
    sublabel: "ייעול תהליך קיים",
    icon: Lightbulb,
    activeColor: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30",
    hoverColor: "hover:border-amber-500/30",
    placeholder: "ספרו לנו מה אפשר לשפר, לייעל או לקצר בתהליך העבודה...",
  },
  {
    id: "פיצ'ר חדש",
    label: "פיצ'ר חדש",
    sublabel: "יכולת חדשה למערכת",
    icon: Sparkles,
    activeColor: "border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/30",
    hoverColor: "hover:border-primary/30",
    placeholder: "איזו יכולת או כלי חדש הייתם רוצים לראות במערכת?...",
  },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any }
> = {
  received: {
    label: "התקבל",
    badgeClass: "bg-muted text-muted-foreground border-border/60",
    icon: Clock,
  },
  reviewing: {
    label: "בבחינה",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Layers,
  },
  developing: {
    label: "בפיתוח",
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  done: {
    label: "בוצע בהצלחה",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
};

const getScreenshotUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseURL = apiClient.defaults.baseURL || "";
  if (baseURL.startsWith("http://") || baseURL.startsWith("https://")) {
    const origin = baseURL.replace(/\/api$/, "");
    return `${origin}${url}`;
  }
  return url;
};

interface FeedbackCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  contextPage?: string;
}

export function FeedbackCenter({
  isOpen,
  onClose,
  onBack,
  contextPage = "",
}: FeedbackCenterProps) {
  const [activeTab, setActiveTab] = useState("send");
  const [expandedVersion, setExpandedVersion] = useState<number | string>(1);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const [category, setCategory] = useState("הצעה לשיפור");
  const [description, setDescription] = useState("");
  const [pageContext, setPageContext] = useState(contextPage);

  const [systemUpdates, setSystemUpdates] = useState<any[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      openTimestampRef.current = Date.now();
    }
  }, [isOpen]);

  const fetchSystemUpdates = async () => {
    setIsLoadingUpdates(true);
    try {
      const response = await apiClient.get("/feedback/updates");
      if (Array.isArray(response.data) && response.data.length > 0) {
        setSystemUpdates(response.data);
      } else {
        setSystemUpdates(CHANGELOG);
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
      setSystemUpdates(CHANGELOG);
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  const fetchMyTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await apiClient.get("/feedback/my");
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "whats-new") {
      fetchSystemUpdates();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (contextPage) {
      setPageContext(contextPage);
      setActiveTab("send");
    }
  }, [contextPage, isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "my-tickets") {
      fetchMyTickets();
    }
  }, [isOpen, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("גודל התמונה מוגבל ל-5MB");
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("נא להזין פירוט לפנייה");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedScreenshotUrl = "";

      if (screenshotFile) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("file", screenshotFile);
        try {
          const uploadRes = await apiClient.post("/feedback/upload-screenshot", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploadedScreenshotUrl = uploadRes.data?.screenshot_url || "";
        } catch (uploadErr) {
          console.warn("Screenshot upload failed, proceeding with text only", uploadErr);
        } finally {
          setIsUploadingImage(false);
        }
      }

      await apiClient.post("/feedback", {
        category,
        description: description.trim(),
        context_page: pageContext,
        screenshot_url: uploadedScreenshotUrl || undefined,
      });

      toast.success("הפנייה נשלחה בהצלחה לצוות המערכת! תודה רבה.");
      setDescription("");
      removeScreenshot();
      setActiveTab("my-tickets");
      fetchMyTickets();
    } catch (error: any) {
      console.error("Feedback Submission Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "שגיאה בשליחת המשוב, נסה שנית");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategory = CATEGORIES.find((c) => c.id === category) || CATEGORIES[1];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onPointerDownOutside={(e) => {
          if (Date.now() - openTimestampRef.current < 400) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (Date.now() - openTimestampRef.current < 400) {
            e.preventDefault();
          }
        }}
        onCloseAutoFocus={(e) => {
          if (onBack) {
            e.preventDefault();
          }
        }}
        className="w-[95vw] sm:w-[720px] sm:max-w-2xl p-0 overflow-hidden rounded-3xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col"
        style={{
          maxWidth: "720px",
          width: "min(95vw, 720px)",
          height: "min(88vh, 560px)",
          minHeight: "min(88vh, 560px)",
        }}
        dir="rtl"
      >
        <DialogDragHandle />

        {/* ── Modal Header: Clean & Seamless with Back Action ── */}
        <div className="pt-5 px-6 sm:px-8 pb-2 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack || onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer select-none"
              title="חזרה למקום הקודם"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>חזרה</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <MessageSquarePlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight">
                  מרכז משוב ורעיונות
                </DialogTitle>
                <DialogDescription className="text-[11px] font-medium text-muted-foreground leading-tight">
                  אנחנו קוראים כל פנייה ומשפרים את המערכת כל הזמן
                </DialogDescription>
              </div>
            </div>
          </div>

          <Badge
            variant="outline"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border-primary/25 bg-primary/5 text-primary"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>גרסה 1.1.3</span>
          </Badge>
        </div>

        {/* ── Tabs Navigation Bar: Borderless & Clean ── */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
          dir="rtl"
        >
          <div className="px-6 sm:px-8 pt-2 pb-2 shrink-0">
            <TabsList className="bg-muted/50 p-1 rounded-2xl w-full grid grid-cols-3 h-10 border-0 shadow-none">
              <TabsTrigger
                value="send"
                className="rounded-xl text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <Send className="w-3.5 h-3.5 scale-x-[-1]" />
                <span>שליחת פנייה</span>
              </TabsTrigger>

              <TabsTrigger
                value="my-tickets"
                className="rounded-xl text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>הפניות שלי</span>
                {tickets.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold flex items-center justify-center">
                    {tickets.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="whats-new"
                className="rounded-xl text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>מה חדש?</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Modal Content Body ── */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-3 pb-6 custom-scrollbar">
            {/* ─────────── TAB 1: SEND FEEDBACK ─────────── */}
            <TabsContent value="send" className="mt-0 space-y-3.5 pb-2">
              {/* Context Pill Banner (if triggered from specific entity/page) */}
              {pageContext && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground font-semibold shrink-0">שיוך:</span>
                    <span className="font-bold text-primary truncate">{pageContext}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPageContext("")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                    title="הסר שיוך"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block text-right">
                  סוג הפנייה
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          "p-3 rounded-xl text-right transition-all border flex flex-col items-start gap-1.5 cursor-pointer select-none",
                          isSelected
                            ? cat.activeColor
                            : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30",
                          cat.hoverColor
                        )}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform",
                            isSelected
                              ? "bg-current/15 text-current"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground leading-tight">
                            {cat.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-normal mt-0.5 hidden sm:block">
                            {cat.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block text-right">
                  פירוט ותיאור הפנייה
                </label>
                <Textarea
                  placeholder={currentCategory.placeholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[105px] resize-none rounded-xl border border-border/60 bg-muted/15 text-xs sm:text-sm text-foreground p-3.5 leading-relaxed placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary transition-all font-normal"
                />
              </div>

              {/* Attachment / Screenshot & Submit Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-2 shrink-0">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {screenshotPreview ? (
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 p-1.5 px-3 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img
                          src={screenshotPreview}
                          alt="צילום מסך"
                          className="w-7 h-7 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div className="text-right min-w-0 max-w-[160px]">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {screenshotFile?.name || "צילום מסך מצורף"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(screenshotFile?.size ? (screenshotFile.size / 1024).toFixed(1) : "0")} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeScreenshot}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl border border-dashed border-border/70 hover:border-primary/50 bg-muted/10 hover:bg-muted/30 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      <span>צירוף צילום מסך (אופציונלי)</span>
                    </button>
                  )}
                </div>

                {/* Submit Action */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploadingImage || !description.trim()}
                  className="sm:w-auto px-7 h-10 rounded-xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {isSubmitting || isUploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>שולח פנייה...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 scale-x-[-1]" />
                      <span>שליחת הפנייה לצוות</span>
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* ─────────── TAB 2: MY TICKETS ─────────── */}
            <TabsContent value="my-tickets" className="mt-0 space-y-3">
              {isLoadingTickets ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-primary opacity-60" />
                  <span className="text-xs font-medium text-muted-foreground">
                    טוען פניות...
                  </span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 px-4 bg-muted/20 border border-border/40 rounded-2xl flex flex-col items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      טרם נשלחו פניות
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      כל פנייה, דיווח על באג או הצעה שתשלחו תופיע כאן עם סטטוס טיפול
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("send")}
                    className="rounded-xl font-bold text-xs mt-1"
                  >
                    שלח פנייה ראשונה
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const statusInfo =
                      STATUS_CONFIG[ticket.status] || STATUS_CONFIG.received;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div
                        key={ticket.id}
                        className="bg-card border border-border/60 rounded-xl p-4 text-right space-y-2.5 shadow-2xs hover:border-border transition-all"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2 py-0.5 text-[11px] font-bold rounded-lg border gap-1",
                                statusInfo.badgeClass
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusInfo.label}</span>
                            </Badge>

                            <span className="text-xs font-bold text-foreground">
                              {ticket.category || "פנייה"}
                            </span>

                            {ticket.context_page && (
                              <span className="text-[10px] text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-md truncate max-w-[180px]">
                                {ticket.context_page}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-muted-foreground font-medium">
                            {ticket.created_at
                              ? new Date(ticket.created_at).toLocaleDateString("he-IL", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-normal">
                          {ticket.description}
                        </p>

                        {(ticket.screenshot_url || ticket.admin_reply) && (
                          <div className="space-y-2 pt-1 border-t border-border/40">
                            {ticket.screenshot_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(getScreenshotUrl(ticket.screenshot_url), "_blank")
                                }
                                className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline font-semibold bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>צפה בצילום מסך שצורף</span>
                              </button>
                            )}

                            {ticket.admin_reply && (
                              <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl border-r-3 border-primary text-xs text-foreground space-y-1">
                                <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>תשובת צוות הפיתוח</span>
                                </div>
                                <p className="leading-relaxed font-normal text-[11px]">
                                  {ticket.admin_reply}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ─────────── TAB 3: WHATS NEW (COMPACT NO-SCROLL VERSION PICKER) ─────────── */}
            <TabsContent value="whats-new" className="mt-0 space-y-2.5">
              {isLoadingUpdates ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-primary opacity-60" />
                  <span className="text-xs font-medium text-muted-foreground">
                    טוען עדכוני מערכת...
                  </span>
                </div>
              ) : systemUpdates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs font-medium bg-muted/20 rounded-2xl">
                  אין עדכונים חדשים כרגע
                </div>
              ) : (
                <div className="space-y-2">
                  {systemUpdates.map((log: any, idx: number) => {
                    let parsedFeatures: string[] = [];
                    try {
                      parsedFeatures =
                        typeof log.features === "string"
                          ? JSON.parse(log.features)
                          : log.features;
                    } catch (e) {
                      parsedFeatures = Array.isArray(log.features) ? log.features : [];
                    }

                    const formattedDate = log.release_date || log.date
                      ? new Date(log.release_date || log.date).toLocaleDateString("he-IL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : log.date;

                    const rawVersion = log.version || "1.1.3";
                    const versionLabel = rawVersion.startsWith("v")
                      ? rawVersion
                      : `v${rawVersion}`;
                    const isLatest = idx === 0;
                    const logId = log.id !== undefined ? log.id : idx;
                    const isExpanded = expandedVersion === logId || (expandedVersion === 1 && idx === 0);

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-2xl transition-all border overflow-hidden",
                          isLatest
                            ? "bg-card border-primary/30 shadow-2xs ring-1 ring-primary/10"
                            : "bg-card/60 border-border/50 hover:border-border"
                        )}
                      >
                        {/* Accordion Header / Click to Expand */}
                        <button
                          type="button"
                          onClick={() => setExpandedVersion(isExpanded ? "" : logId)}
                          className="w-full p-3.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-right cursor-pointer hover:bg-muted/20 transition-colors select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "font-black text-xs px-2.5 py-0.5 rounded-lg shrink-0",
                                isLatest
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-foreground border-border/60"
                              )}
                            >
                              <span>{versionLabel}</span>
                            </Badge>

                            {isLatest && (
                              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                <Sparkles className="w-3 h-3" />
                                <span>הגרסה העדכנית</span>
                              </span>
                            )}

                            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline truncate">
                              ({parsedFeatures.length} שינויים)
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                              <span>{formattedDate}</span>
                            </div>

                            <div
                              className={cn(
                                "w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground transition-transform duration-200 shrink-0",
                                isExpanded ? "rotate-180 bg-primary/10 text-primary" : ""
                              )}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </button>

                        {/* Collapsible Features Body */}
                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1 border-t border-border/30 bg-muted/5 animate-in fade-in-50 duration-200">
                            <ul className="space-y-2 pt-2">
                              {parsedFeatures.map((f, i) => (
                                <li
                                  key={i}
                                  className="text-xs sm:text-[13px] text-foreground flex items-start gap-2.5 leading-relaxed"
                                >
                                  <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                  </div>
                                  <span className="font-normal">{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
