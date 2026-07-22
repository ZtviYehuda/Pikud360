import React, { useState, useEffect } from "react";
import apiClient, { API_URL } from "../../config/api.client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  CheckCircle2,
  Eye
} from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

const CHANGELOG = [
  {
    version: "v2.4.0",
    date: "29 באפריל 2026",
    features: [
      "מרכז משוב חדש - מעתה תוכלו לשלוח הצעות לשיפור בקלות!",
      "עיצוב מחודש ללוח הבקרה (ימי הולדת בפריסה אופקית).",
      "הוספת צלליות ואפקט רחיפה לכל כרטיסי הנתונים.",
    ],
  },
  {
    version: "v2.3.5",
    date: "15 באפריל 2026",
    features: [
      "מערכת התראות חכמה בזמן אמת.",
      "אפשרות להחלפת משמרות בקליק אחד.",
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  "received": "bg-slate-100 text-slate-500",
  "reviewing": "bg-blue-50 text-blue-600",
  "developing": "bg-amber-50 text-amber-600",
  "done": "bg-emerald-50 text-emerald-600",
};

const STATUS_LABELS: Record<string, string> = {
  "received": "התקבל",
  "reviewing": "בבחינה",
  "developing": "בפיתוח",
  "done": "בוצע",
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
  contextPage?: string;
}

export function FeedbackCenter({ isOpen, onClose, contextPage = "" }: FeedbackCenterProps) {
  const [activeTab, setActiveTab] = useState("send");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const [category, setCategory] = useState("הצעה לשיפור");
  const [description, setDescription] = useState("");
  const [pageContext, setPageContext] = useState(contextPage);

  const [systemUpdates, setSystemUpdates] = useState<any[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  const fetchSystemUpdates = async () => {
    setIsLoadingUpdates(true);
    try {
      const response = await apiClient.get("/feedback/updates");
      setSystemUpdates(response.data);
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setIsLoadingUpdates(false);
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

  const fetchMyTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await apiClient.get("/feedback/my");
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("אנא הזן תיאור");
      return;
    }

    console.log("Submitting to:", `${API_URL}/feedback`);
    try {
      await apiClient.post("/feedback", {
        category,
        description,
        context_page: pageContext,
      });
      toast.success("המשוב נשלח בהצלחה");
      setDescription("");
      setActiveTab("my-tickets");
      fetchMyTickets();
    } catch (error: any) {
      console.error("Feedback Submission Error:", error.response?.data || error.message);
      alert("שגיאה מפורטת: " + JSON.stringify(error.response?.data || error.message));
      toast.error("שגיאה בשליחת המשוב");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] flex flex-col p-0 border-none sm:border sm:border-border/50 bg-background" dir="rtl">
        <DialogDragHandle />
        <div className="p-6 sm:p-10 pb-6 flex flex-col items-center text-center">
          <DialogTitle className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">
            מרכז משוב
          </DialogTitle>
          <DialogDescription className="text-sm font-bold text-slate-400 leading-relaxed max-w-[340px]">
            אנחנו כאן כדי לשמוע אותך. הפידבק שלך בונה את המערכת.
          </DialogDescription>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden" dir="rtl">
          <div className="px-10 mb-8">
            <TabsList className="bg-slate-100/50 p-1 rounded-2xl w-full grid grid-cols-3 h-12">
              {[
                { id: "send", label: "שליחת משוב" },
                { id: "my-tickets", label: "הפניות שלי" },
                { id: "whats-new", label: "מה חדש?" }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className={cn(
                    "rounded-xl text-[13px] font-black transition-all duration-300",
                    "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-10 pb-10">
            {/* TAB: SEND FEEDBACK */}
            <TabsContent value="send" className="mt-0 space-y-8 animate-in fade-in duration-400">
              <div className="space-y-4">
                <label className="text-xs sm:text-sm font-black uppercase text-slate-700 dark:text-slate-300 block text-right tracking-wide">סוג הפנייה</label>
                <div className="flex gap-2">
                  {["באג", "הצעה לשיפור", "פיצ'ר חדש"].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex-1 py-3 px-2 rounded-2xl text-[12px] font-black transition-all duration-200 border-2",
                        category === cat
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                          : "bg-white border-slate-50 text-slate-500 hover:border-slate-100"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs sm:text-sm font-black uppercase text-slate-700 dark:text-slate-300 block text-right tracking-wide">תיאור הפנייה</label>
                <Textarea
                  placeholder="ספרו לנו מה אפשר לשפר..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[160px] resize-none rounded-3xl border-slate-50 bg-slate-50/30 text-sm text-right p-6 leading-relaxed focus:bg-white focus:border-blue-100 transition-all font-bold placeholder:text-slate-300"
                  required
                />
              </div>

              <div className="flex justify-center pt-2">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !description.trim()} 
                  className="rounded-full px-12 h-14 font-black text-base bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/20 w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 ml-3 scale-x-[-1]" />
                      שליחת פנייה לצוות
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* TAB: MY TICKETS */}
            <TabsContent value="my-tickets" className="mt-0 space-y-4 animate-in fade-in duration-400">
              {isLoadingTickets ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-20" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-20 text-slate-300 text-sm font-bold bg-slate-50/50 rounded-3xl">
                  טרם נשלחו פניות
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white border border-slate-50 rounded-[2rem] p-6 hover:shadow-lg hover:shadow-slate-100 transition-all text-right group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <h4 className="font-black text-base text-slate-900 leading-snug flex-1">{ticket.description}</h4>
                      <Badge className={cn("px-3 py-1 text-[10px] font-black rounded-full border-0", STATUS_COLORS[ticket.status] || STATUS_COLORS["received"])}>
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 justify-end">
                      <span>{new Date(ticket.created_at).toLocaleDateString('he-IL')}</span>
                      <span>•</span>
                      <span>{ticket.category}</span>
                    </div>
                    {ticket.screenshot_url && (
                      <div className="mt-3 flex items-center gap-3 justify-end">
                        <span className="text-[10px] font-bold text-slate-400">
                          צילום מסך מצורף (לחץ להגדלה)
                        </span>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getScreenshotUrl(ticket.screenshot_url), "_blank");
                          }}
                          className="relative w-16 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer hover:border-blue-300 transition-all group shrink-0"
                        >
                          <img
                            src={getScreenshotUrl(ticket.screenshot_url)}
                            alt="צילום מסך פנייה"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {ticket.admin_reply && (
                      <div className="mt-4 p-4 bg-blue-50/30 rounded-2xl border-r-4 border-blue-500 text-sm font-bold text-slate-700">
                        <div className="flex items-center gap-2 mb-1 justify-end text-[10px] text-blue-500 uppercase">
                          תשובת צוות הפיתוח <CheckCircle2 className="w-3 h-3" />
                        </div>
                        {ticket.admin_reply}
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* TAB: WHATS NEW */}
            <TabsContent value="whats-new" className="mt-0 space-y-6 animate-in fade-in duration-400">
              {isLoadingUpdates ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-20" />
                </div>
              ) : systemUpdates.length === 0 ? (
                <div className="text-center py-20 text-slate-300 text-sm font-bold bg-slate-50/50 rounded-3xl">
                  אין עדכונים חדשים
                </div>
              ) : (
                systemUpdates.map((log: any, idx: number) => {
                  let parsedFeatures: string[] = [];
                  try {
                    parsedFeatures = typeof log.features === "string" ? JSON.parse(log.features) : log.features;
                  } catch (e) {
                    parsedFeatures = Array.isArray(log.features) ? log.features : [];
                  }

                  return (
                    <div key={idx} className="bg-slate-50/30 p-6 rounded-[2rem] border border-slate-50 text-right space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-300">
                          {new Date(log.release_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <h3 className="text-xl font-black text-blue-600 tracking-tight">{log.version}</h3>
                      </div>
                      <ul className="space-y-3">
                        {parsedFeatures.map((f, i) => (
                          <li key={i} className="text-sm font-bold text-slate-600 flex items-start gap-3 justify-end leading-relaxed">
                            <span className="flex-1">{f}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
