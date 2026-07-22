import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Send,
  Loader2,
  User,
  MessageSquare,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import apiClient from "@/config/api.client";
import { toast } from "sonner";

interface InternalMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: {
    id: number;
    name: string;
    role?: string;
  } | null;
  defaultTitle?: string;
  defaultDescription?: string;
}

export function InternalMessageDialog({
  open,
  onOpenChange,
  recipient,
  defaultTitle = "",
  defaultDescription = "",
}: InternalMessageDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
    }
  }, [open, defaultTitle, defaultDescription]);

  const handleSend = async () => {
    if (!recipient || !title) return;

    setLoading(true);
    try {
      await apiClient.post("/notifications/send", {
        recipient_id: recipient.id,
        title,
        description,
      });

      toast.success("הודעה נשלחה בהצלחה", {
        description: `ההודעה נשלחה למפקד ${recipient.name}`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("שגיאה בשליחת ההודעה", {
        description: "אירעה שגיאה. נא לנסות שנית.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl p-0 border-none sm:border sm:border-border bg-card flex flex-col"
        dir="rtl"
      >
        <DialogDragHandle />
        <DialogHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600  shrink-0 rotate-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0 pt-1 text-center sm:text-right">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight mb-1">
                שליחת התראה פנימית
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic">
                שלח הודעה ישירה למפקד שתופיע לו בזמן אמת בלוח הבקרה
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {recipient && (
            <>
              {/* Recipient Card */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-4 transition-all hover:bg-muted/40">
                <div className="w-12 h-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-muted-foreground ">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">
                    נמען ההודעה:
                  </span>
                  <span className="text-base font-black text-foreground">
                    {recipient.name}
                  </span>
                  {recipient.role && (
                    <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                      {recipient.role}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-3">
                  <Label
                    htmlFor="title"
                    className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1"
                  >
                    נושא ההודעה
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="הזן כותרת קצרה ועניינית..."
                    className="h-12 bg-muted/30 border-border/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 rounded-2xl text-right font-black text-sm transition-all"
                  />
                </div>

                <div className="grid gap-3">
                  <Label
                    htmlFor="message"
                    className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1"
                  >
                    תוכן ההודעה
                  </Label>
                  <Textarea
                    id="message"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="פרט כאן את תוכן ההתראה..."
                    className="min-h-[140px] bg-muted/30 border-border/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 rounded-2xl text-right font-bold text-sm leading-relaxed p-5 transition-all outline-none resize-none"
                  />
                </div>
              </div>

              {/* Security Warning */}
              <div className="flex items-start gap-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-indigo-800 leading-normal font-black tracking-tight opacity-70">
                  הודעה זו תישלח בתוך המערכת בלבד ותוצג למפקד בכניסתו הבאה.
                  מומלץ להימנע משליחת פרטים רגישים ביותר שאינם תואמים את רמת
                  הסיווג של עמדת המחשב.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-6 sm:p-8 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto px-8 h-12 font-black text-muted-foreground hover:text-foreground hover:bg-transparent rounded-2xl transition-all order-2 sm:order-1 text-xs uppercase tracking-widest gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            ביטול וחזרה
          </Button>

          <Button
            onClick={handleSend}
            disabled={loading || !title}
            className="w-full sm:flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl  -500/20 transition-all active:scale-[0.98] disabled:opacity-30 text-base gap-3 order-1 sm:order-2"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                שלח התראה כעת
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
