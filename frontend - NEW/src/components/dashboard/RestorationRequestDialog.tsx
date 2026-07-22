import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";

interface RestorationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDate: Date;
}

export function RestorationRequestDialog({
  open,
  onOpenChange,
  targetDate,
}: RestorationRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { createRestoreRequest } = useEmployees();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("נא להזין סיבת בקשה");
      return;
    }

    setLoading(true);
    try {
      const formattedDate = format(targetDate, "yyyy-MM-dd");
      await createRestoreRequest(formattedDate, reason);
      toast.success("בקשת השחזור הוגשה בהצלחה וממתינה לאישור");
      onOpenChange(false);
      setReason("");
    } catch (err) {
      console.error("Failed to submit restore request", err);
      toast.error("שגיאה בהגשת בקשת השחזור");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg p-0 border-none sm:border sm:border-border/40 bg-background flex flex-col" 
        dir="rtl"
      >
        <DialogDragHandle />
        {/* Header */}
        <div className="p-6 border-b border-border/40 bg-muted/20 relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0 text-right">
              <DialogTitle className="text-xl font-black tracking-tight truncate">
                בקשת שחזור מהארכיון
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground/60 truncate">
                שחזור נתונים לתאריך {format(targetDate, "dd/MM/yyyy")}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-2">
            <p className="text-sm font-medium leading-relaxed text-right">
              הנתונים לתאריך <strong>{format(targetDate, "dd/MM/yyyy")}</strong> הועברו לארכיון.
              על מנת לצפות בהם, עליך להגיש בקשת שחזור שתאושר על ידי המפקד הרלוונטי.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="reason" className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 pr-1">
              סיבת הבקשה
            </Label>
            <Textarea
              id="reason"
              placeholder="לדוגמה: צורך בבירור משמעתי, השלמת דוחות חודשיים..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none min-h-[140px] bg-muted/30 border-border/50 rounded-2xl focus:ring-primary/20 p-4 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/40 bg-muted/10 shrink-0 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 rounded-2xl h-12 font-bold text-muted-foreground hover:bg-muted transition-all"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] rounded-2xl h-12 font-black text-base hover: hover:-translate-y-0.5 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                שולח בקשה...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                הגש בקשת שחזור
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

