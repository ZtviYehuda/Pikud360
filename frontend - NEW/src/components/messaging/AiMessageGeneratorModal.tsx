import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Check,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AiMessageGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyMessage: (title: string, body: string) => void;
}

type MessageTone = "official" | "short" | "urgent" | "event";

interface QuickPreset {
  id: string;
  label: string;
  topic: string;
  suggestedTone: MessageTone;
}

const PRESETS: QuickPreset[] = [
  { id: "morning_muster", label: "מסדר בוקר", topic: "מסדר בוקר ונוכחות יחידתית", suggestedTone: "official" },
  { id: "team_meeting", label: "ישיבת צוות", topic: "ישיבת צוות וסנכרון משימות", suggestedTone: "official" },
  { id: "briefing", label: "תדריך מבצעי", topic: "תדריך מבצעי והיערכות לפעילות", suggestedTone: "urgent" },
  { id: "reminder", label: "תזכורת דיווח", topic: "תזכורת להשלמת דיווחי נוכחות ומשימות", suggestedTone: "short" },
  { id: "toast", label: "הרמת כוסית / אירוע", topic: "הרמת כוסית ואירוע יחידתי", suggestedTone: "event" },
  { id: "training", label: "יום הדרכה / אימון", topic: "יום הדרכה ותרגול יחידתי", suggestedTone: "official" },
];

export const AiMessageGeneratorModal: React.FC<AiMessageGeneratorModalProps> = ({
  open,
  onOpenChange,
  onApplyMessage,
}) => {
  // Input parameters
  const [topic, setTopic] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [tone, setTone] = useState<MessageTone>("official");

  // Output generated state
  const [variationIndex, setVariationIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Template generation engine with clean, professional text (Zero emojis)
  const generatedResult = useMemo(() => {
    if (!topic.trim() && !day.trim() && !time.trim()) {
      return null;
    }

    const cleanTopic = topic.trim() || "עדכון יחידתי";
    const cleanDay = day.trim() || "בקרוב";
    const cleanTime = time.trim();
    const cleanLocation = location.trim();
    const cleanNotes = extraNotes.trim();

    // Time & Location string
    const detailsList: string[] = [];
    if (cleanDay) detailsList.push(`מועד: ${cleanDay}`);
    if (cleanTime) detailsList.push(`שעה: ${cleanTime}`);
    if (cleanLocation) detailsList.push(`מיקום: ${cleanLocation}`);

    const detailsBlock = detailsList.map((d) => `• ${d}`).join("\n");

    // Variations per tone without any emojis
    const templatesByTone: Record<
      MessageTone,
      Array<{ title: string; body: string }>
    > = {
      official: [
        {
          title: `עדכון יחידתי: ${cleanTopic}`,
          body: `שלום לכולם,\n\nבהמשך להנחיות, להלן פרטי ה${cleanTopic}:\n\n${detailsBlock}\n\n${cleanNotes ? `דגשים והנחיות:\n• ${cleanNotes}\n• חובת נוכחות מלאה ובזמן.\n• נא להגיע בהופעה תקנית ומסודרת.\n` : "דגשים:\n• חובת נוכחות מלאה ובזמן.\n• נא להגיע בהופעה תקנית ומסודרת.\n"}\nנא לאשר קבלת ההודעה.\nבברכה, פיקוד היחידה.`,
        },
        {
          title: `הודעת פיקוד | ${cleanTopic}`,
          body: `צוות יקר,\n\nלהלן הפרטים עבור ${cleanTopic}:\n\n${detailsBlock}\n\n${cleanNotes ? `שימו לב: ${cleanNotes}\n\n` : ""}הקפידו על הגעה מדויקת. מי שנבצר ממנו להגיע מתבקש לעדכן את המפקד הישיר מראש.\n\nהמשך יום שקט ומוצלח.`,
        },
        {
          title: `זימון ל${cleanTopic}`,
          body: `שוטרים ומפקדים,\n\nנא לשריין ביומנים: ${cleanTopic}.\n\n${detailsBlock}\n\n${cleanNotes ? `דגשים נוספים: ${cleanNotes}\n` : ""}חובת התייצבות מלאה. נא לאשר קריאה בקבוצה.\n\nבברכה, פיקוד היחידה.`,
        },
      ],
      short: [
        {
          title: `תזכורת: ${cleanTopic}`,
          body: `שלום לכולם,\nתזכורת לגבי ${cleanTopic}:\n${detailsBlock}${cleanNotes ? `\nדגש: ${cleanNotes}` : ""}\n\nנא לדייק בהגעה. תודה.`,
        },
        {
          title: `עדכון קצר | ${cleanTopic}`,
          body: `צוות,\nשימו לב למועד ה${cleanTopic}:\n${detailsBlock}${cleanNotes ? `\nהערות: ${cleanNotes}` : ""}\n\nהמשך עבודה פורייה.`,
        },
        {
          title: `ריכוז פרטים: ${cleanTopic}`,
          body: `לידיעת כולם - ${cleanTopic}:\n${detailsBlock}${cleanNotes ? `\nדגשים: ${cleanNotes}` : ""}\n\nנא לאשר הגעה.`,
        },
      ],
      urgent: [
        {
          title: `דחוף: ${cleanTopic}`,
          body: `הודעה מיידית לכלל הצוות:\n\nהנכם נדרשים להיערך ל${cleanTopic}.\n\n${detailsBlock}\n\n${cleanNotes ? `דגש מבצעי: ${cleanNotes}\n\n` : ""}נוכחות חובה ללא חריגים. נא לאשר קבלת הודעה מידית!`,
        },
        {
          title: `הנחיה מבצעית | ${cleanTopic}`,
          body: `לתשומת לב כולם,\nבהנחיית הפיקוד נקבע ${cleanTopic}:\n\n${detailsBlock}\n\n${cleanNotes ? `דגשים קריטיים:\n• ${cleanNotes}\n• ` : "דגשים:\n• "}התייצבות מלאה בזמן.\n• מוכנות מיידית.\n\nנא לאשר קריאה בהקדם.`,
        },
      ],
      event: [
        {
          title: `הזמנה ל${cleanTopic}`,
          body: `צוות יקר,\n\nשמחים להזמין את כולכם ל${cleanTopic}.\n\n${detailsBlock}\n\n${cleanNotes ? `בתוכנית: ${cleanNotes}\n\n` : ""}נוכחות כולם חשובה ורצויה.\nנשמח לראותכם.`,
        },
        {
          title: `מפגש יחידתי: ${cleanTopic}`,
          body: `שלום לכולם,\n\nנפגשים ל${cleanTopic} במועד הבא:\n\n${detailsBlock}\n\n${cleanNotes ? `דגשים: ${cleanNotes}\n\n` : ""}מצפים לראות את כולם.`,
        },
      ],
    };

    const options = templatesByTone[tone] || templatesByTone.official;
    const selected = options[variationIndex % options.length];
    return selected;
  }, [topic, day, time, location, extraNotes, tone, variationIndex]);

  const handlePresetClick = (preset: QuickPreset) => {
    setTopic(preset.topic);
    setTone(preset.suggestedTone);
    if (!day) setDay("מחר");
    if (!time) setTime("08:30");
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setVariationIndex((prev) => prev + 1);
      setIsGenerating(false);
      toast.info("חולל נוסח חלופי");
    }, 200);
  };

  const handleApply = () => {
    if (!generatedResult) {
      toast.error("נא להזין לפחות נושא או מועד ליצירת הודעה");
      return;
    }
    onApplyMessage(generatedResult.title, generatedResult.body);
    toast.success("ההודעה הועברה לתיבת הניסוח");
    onOpenChange(false);
  };

  const handleCopyDraft = async () => {
    if (!generatedResult) return;
    const fullText = `${generatedResult.title}\n\n${generatedResult.body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("הטקסט הועתק ללוח");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("שגיאה בהעתקת הטקסט");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl text-right rounded-2xl p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar"
        dir="rtl"
      >
        {/* Header */}
        <DialogHeader className="text-right space-y-1 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <FileText className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-black text-foreground">
              ניסוח הודעה מהיר
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            הזן פרטים בסיסיים (נושא, יום, שעה), והמערכת תייצר עבורך נוסח הודעה מסודר ומדויק
          </DialogDescription>
        </DialogHeader>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground">
            נושאים מהירים לבחירה:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-xl border transition-all font-medium",
                  topic === p.topic
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/30 border-border/50 text-foreground hover:bg-muted/60"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="space-y-3 pt-1">
          {/* Row 1: Topic */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              נושא ההודעה <span className="text-primary">*</span>
            </label>
            <Input
              placeholder="למשל: מסדר בוקר, הרמת כוסית, תדריך, תזכורת..."
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setVariationIndex(0);
              }}
              className="h-9 text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Row 2: Day & Time & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                יום / תאריך
              </label>
              <Input
                placeholder="למשל: מחר / יום ראשון"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                שעה
              </label>
              <Input
                placeholder="למשל: 08:30 / 14:00"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                מיקום
              </label>
              <Input
                placeholder="למשל: רחבת הדגלים / חדר תדריכים"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Row 3: Tone Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              סגנון ניסוח:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "official", label: "רשמי ומלא" },
                { id: "short", label: "קצר וממוקד" },
                { id: "urgent", label: "דחוף ומבצעי" },
                { id: "event", label: "אירוע / מפגש" },
              ].map((t) => {
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTone(t.id as MessageTone);
                      setVariationIndex(0);
                    }}
                    className={cn(
                      "flex items-center justify-center py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary shadow-2xs font-bold"
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Extra notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              דגשים או הנחיות נוספות (אופציונלי):
            </label>
            <Input
              placeholder="למשל: להגיע עם נשק ואפוד, אישור הגעה עד 10:00..."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Generated Preview Box */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              תצוגת הנוסח שנוצר:
            </span>

            {generatedResult && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="h-7 text-xs px-2.5 gap-1 text-primary border-primary/30 hover:bg-primary/5"
                  title="קבל נוסח שונה"
                >
                  <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
                  <span>נוסח אחר</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyDraft}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="העתק טקסט"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            )}
          </div>

          {generatedResult ? (
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 text-right space-y-2 relative group">
              <div className="font-black text-xs sm:text-sm text-foreground border-b border-border/30 pb-1.5">
                {generatedResult.title}
              </div>
              <div className="text-xs font-medium text-foreground/90 whitespace-pre-line leading-relaxed">
                {generatedResult.body}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-muted/10 border border-dashed border-border/60 text-center text-xs text-muted-foreground">
              הזן נושא או בחר אחד מהנושאים המהירים למעלה כדי לחולל הודעה
            </div>
          )}
        </div>

        {/* Dialog Actions */}
        <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-border/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            ביטול
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!generatedResult}
            className="text-xs px-5 font-bold gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            השתמש בנוסח זה להפצה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
