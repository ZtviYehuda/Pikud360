import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RefreshCw,
  Check,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Copy,
  Sparkles,
  AlertCircle,
  CalendarDays,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { format, addDays, nextSunday } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AiMessageGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyMessage: (title: string, body: string) => void;
}

export interface AiMessageGeneratorContentProps {
  onApplyMessage: (title: string, body: string) => void;
  onCancel?: () => void;
  showBackButton?: boolean;
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
  { id: "reminder", label: "תזכורת דיווח", topic: "תזכורת להשלמת דיווחי נוכחות", suggestedTone: "short" },
  { id: "toast", label: "הרמת כוסית / אירוע", topic: "הרמת כוסית ואירוע יחידתי", suggestedTone: "event" },
  { id: "training", label: "יום הדרכה / אימון", topic: "יום הדרכה ותרגול יחידתי", suggestedTone: "official" },
];

const COMMON_TIMES = ["07:30", "08:00", "08:30", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

export function parseAndFormatHebrewDateInput(input: string): string {
  if (!input || !input.trim()) return "";
  const cleaned = input.trim().toLowerCase();

  const now = new Date();
  const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  if (cleaned === "היום") {
    return format(now, "eeee, dd/MM/yyyy", { locale: he });
  }
  if (cleaned === "מחר") {
    const tomorrow = addDays(now, 1);
    return format(tomorrow, "eeee, dd/MM/yyyy", { locale: he });
  }
  if (cleaned === "מחרתיים") {
    const afterTomorrow = addDays(now, 2);
    return format(afterTomorrow, "eeee, dd/MM/yyyy", { locale: he });
  }

  for (let i = 0; i < daysOfWeek.length; i++) {
    if (cleaned.includes(daysOfWeek[i])) {
      const currentDay = now.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      const targetDate = addDays(now, diff);
      return format(targetDate, "eeee, dd/MM/yyyy", { locale: he });
    }
  }

  const dateMatch = cleaned.match(/^(\d{1,2})[\/\.](\d{1,2})(?:[\/\.](\d{2,4}))?$/);
  if (dateMatch) {
    const dayNum = parseInt(dateMatch[1], 10);
    const monthNum = parseInt(dateMatch[2], 10) - 1;
    let yearNum = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();
    if (yearNum < 100) yearNum += 2000;

    const parsedDate = new Date(yearNum, monthNum, dayNum);
    if (!isNaN(parsedDate.getTime())) {
      return format(parsedDate, "eeee, dd/MM/yyyy", { locale: he });
    }
  }

  return input;
}

export const AiMessageGeneratorContent: React.FC<AiMessageGeneratorContentProps> = ({
  onApplyMessage,
  onCancel,
  showBackButton = false,
}) => {
  const [topic, setTopic] = useState("");
  const [day, setDay] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [tone, setTone] = useState<MessageTone>("official");

  const [variationIndex, setVariationIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live Editable Generated Result States
  const [editedTitle, setEditedTitle] = useState("");
  const [editedBody, setEditedBody] = useState("");

  const handleTimeBlur = () => {
    const clean = time.trim().replace(/\D/g, "");
    if (!clean) return;

    if (clean.length === 1 || clean.length === 2) {
      const h = parseInt(clean, 10);
      if (h >= 0 && h <= 23) {
        setTime(`${clean.padStart(2, "0")}:00`);
      }
    } else if (clean.length === 3) {
      const h = parseInt(clean.slice(0, 1), 10);
      const m = parseInt(clean.slice(1), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        setTime(`0${h}:${clean.slice(1)}`);
      }
    } else if (clean.length === 4) {
      const h = parseInt(clean.slice(0, 2), 10);
      const m = parseInt(clean.slice(2), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        setTime(`${clean.slice(0, 2)}:${clean.slice(2)}`);
      }
    }
  };

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
    if (d) {
      setDay(format(d, "eeee, dd/MM/yyyy", { locale: he }));
      setIsCalendarOpen(false);
    }
  };

  const handleDateBlur = () => {
    if (day) {
      const parsed = parseAndFormatHebrewDateInput(day);
      setDay(parsed);
    }
  };

  const setQuickDate = (type: "today" | "tomorrow" | "sunday") => {
    let targetDate = new Date();
    if (type === "tomorrow") targetDate = addDays(new Date(), 1);
    else if (type === "sunday") targetDate = nextSunday(new Date());

    handleDateSelect(targetDate);
  };

  const allHighlights = useMemo(() => {
    const list = [...highlights];
    if (extraNotes.trim()) list.push(extraNotes.trim());
    return list;
  }, [highlights, extraNotes]);

  const generatedResult = useMemo(() => {
    if (!topic.trim() && !day.trim() && !time.trim() && !location.trim()) {
      return null;
    }

    const cleanTopic = topic.trim() || "עדכון יחידתי";
    const cleanDay = day.trim() || "בקרוב";
    const cleanTime = time.trim();
    const cleanLocation = location.trim();

    const detailsList: string[] = [];
    if (cleanDay) detailsList.push(`מועד: ${cleanDay}`);
    if (cleanTime) detailsList.push(`שעה: ${cleanTime}`);
    if (cleanLocation) detailsList.push(`מיקום: ${cleanLocation}`);

    const detailsBlock = detailsList.map((d) => `• ${d}`).join("\n");

    const highlightsBlock =
      allHighlights.length > 0
        ? `\n\nדגשים והנחיות:\n${allHighlights.map((h) => `• ${h}`).join("\n")}`
        : "";

    const templatesByTone: Record<
      MessageTone,
      Array<{ title: string; body: string }>
    > = {
      official: [
        {
          title: `עדכון יחידתי: ${cleanTopic}`,
          body: `שלום לכולם,\n\nבהמשך להנחיות, להלן פרטי ה${cleanTopic}:\n\n${detailsBlock}${highlightsBlock}\n\nנא לאשר קבלת ההודעה.\nבברכה, פיקוד היחידה.`,
        },
        {
          title: `הודעת פיקוד | ${cleanTopic}`,
          body: `צוות יקר,\n\nלהלן הפרטים עבור ${cleanTopic}:\n\n${detailsBlock}${highlightsBlock}\n\nהקפידו על הגעה מדויקת. מי שנבצר ממנו להגיע מתבקש לעדכן את המפקד הישיר מראש.\n\nהמשך יום שקט ומוצלח.`,
        },
        {
          title: `זימון ל${cleanTopic}`,
          body: `שוטרים ומפקדים,\n\nנא לשריין ביומנים: ${cleanTopic}.\n\n${detailsBlock}${highlightsBlock}\n\nחובת התייצבות מלאה. נא לאשר קריאה בקבוצה.\n\nבברכה, פיקוד היחידה.`,
        },
      ],
      short: [
        {
          title: `תזכורת: ${cleanTopic}`,
          body: `שלום לכולם,\nתזכורת לגבי ${cleanTopic}:\n${detailsBlock}${highlightsBlock}\n\nנא לדייק בהגעה. תודה.`,
        },
        {
          title: `עדכון קצר | ${cleanTopic}`,
          body: `צוות,\nשימו לב למועד ה${cleanTopic}:\n${detailsBlock}${highlightsBlock}\n\nהמשך עבודה פורייה.`,
        },
        {
          title: `ריכוז פרטים: ${cleanTopic}`,
          body: `לידיעת כולם - ${cleanTopic}:\n${detailsBlock}${highlightsBlock}\n\nנא לאשר הגעה.`,
        },
      ],
      urgent: [
        {
          title: `דחוף | ${cleanTopic}`,
          body: `הודעה מבצעית דחופה לכלל הצוות:\n\n${cleanTopic}\n${detailsBlock}${highlightsBlock}\n\nחובת נוכחות מלאה ללא חריגים. נא לאשר קבלה באופן מיידי.`,
        },
        {
          title: `תדריך דחוף: ${cleanTopic}`,
          body: `תדריך מיידי - ${cleanTopic}:\n${detailsBlock}${highlightsBlock}\n\nהתייצבות בזמן היא קריטית.\n\nפיקוד היחידה.`,
        },
      ],
      event: [
        {
          title: `הזמנה: ${cleanTopic}`,
          body: `חברים וצוות יקר,\nשמחים להזמין אתכם ל${cleanTopic}!\n\n${detailsBlock}${highlightsBlock}\n\nמחכים לראות את כולכם!\nצוות ההווי והיחידה.`,
        },
        {
          title: `אירוע יחידתי | ${cleanTopic}`,
          body: `צוות יקר,\nמפגש ${cleanTopic} יתקיים במועד הבא:\n${detailsBlock}${highlightsBlock}\n\nנשמח לראותכם.`,
        },
      ],
    };

    const options = templatesByTone[tone] || templatesByTone.official;
    const selected = options[variationIndex % options.length];
    return {
      title: selected.title,
      body: selected.body,
    };
  }, [topic, day, time, location, allHighlights, tone, variationIndex]);

  // Keep live edited title and body in sync when AI computes new result
  useEffect(() => {
    if (generatedResult) {
      setEditedTitle(generatedResult.title);
      setEditedBody(generatedResult.body);
    } else {
      setEditedTitle("");
      setEditedBody("");
    }
  }, [generatedResult]);

  const handleNextVariation = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setVariationIndex((prev) => prev + 1);
      setIsGenerating(false);
    }, 150);
  };

  const handlePresetClick = (p: QuickPreset) => {
    setTopic(p.topic);
    setTone(p.suggestedTone);
    setVariationIndex(0);
    if (!day) {
      const today = new Date();
      setDay(format(today, "eeee, dd/MM/yyyy", { locale: he }));
      setSelectedDate(today);
    }
    if (!time) {
      setTime("08:30");
    }
  };

  const handleApply = () => {
    if (!editedTitle.trim() && !editedBody.trim()) {
      toast.error("אנא הזן או נווט לניסוח הודעה לפני השליחה");
      return;
    }
    onApplyMessage(editedTitle, editedBody);
    toast.success("ההודעה שובצה בהצלחה");
  };

  const handleCopyPreview = async () => {
    if (!editedTitle.trim() && !editedBody.trim()) return;
    try {
      const fullText = editedTitle.trim() ? `${editedTitle}\n\n${editedBody}` : editedBody;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("נוסח ההודעה הועתק ללוח בהצלחה");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("שגיאה בהעתקת הטקסט");
    }
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col justify-between h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          {showBackButton && onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 border-border/60 hover:bg-muted text-foreground cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>חזור לניסוח</span>
            </Button>
          )}
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground">
              מחולל הודעות AI חכם
            </h3>
            <p className="text-xs text-muted-foreground hidden sm:block">
              הזן פרטים בסיסיים, והמערכת תייצר עבורך נוסח הודעה מסודר ומדויק
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch flex-1">
        {/* Controls & Form */}
        <div className="md:col-span-7 space-y-3.5 flex flex-col justify-between">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground">
                נושאים מהירים לבחירה:
              </label>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer",
                    topic === p.topic
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/40 hover:border-border"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 bg-muted/10 p-4 sm:p-4.5 rounded-2xl border border-border/40 flex-1 flex flex-col justify-between">
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" /> נושא ההודעה <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="תדריך בוקר / ישיבת צוות..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-10 text-xs sm:text-sm font-bold bg-background border-border/40 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Date Input with Free Typing + Smart Parsing & Popover Picker */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">יום / תאריך</label>
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="מחר / 30.08 / יום שני..."
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    onBlur={handleDateBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleDateBlur();
                      }
                    }}
                    className="h-9.5 text-xs font-bold bg-background border-border/40 rounded-xl flex-1"
                  />
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9.5 w-9.5 bg-background border-border/40 rounded-xl shrink-0 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="flex gap-1 mb-2">
                        <Button size="sm" variant="ghost" onClick={() => setQuickDate("today")} className="h-7 text-xs flex-1">היום</Button>
                        <Button size="sm" variant="ghost" onClick={() => setQuickDate("tomorrow")} className="h-7 text-xs flex-1">מחר</Button>
                        <Button size="sm" variant="ghost" onClick={() => setQuickDate("sunday")} className="h-7 text-xs flex-1">יום א'</Button>
                      </div>
                      <CalendarPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={he}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Time Input with Free Typing & Popover Suggestions */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">שעה</label>
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="08:30"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    onBlur={handleTimeBlur}
                    className="h-9.5 text-xs font-bold bg-background border-border/40 rounded-xl flex-1 dir-ltr text-right"
                  />
                  <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9.5 w-9.5 bg-background border-border/40 rounded-xl shrink-0 cursor-pointer"
                      >
                        <Clock className="w-4 h-4 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="start">
                      <div className="grid grid-cols-2 gap-1">
                        {COMMON_TIMES.map((t) => (
                          <Button
                            key={t}
                            size="sm"
                            variant="ghost"
                            onClick={() => { setTime(t); setIsTimeOpen(false); }}
                            className="h-7 text-xs font-bold"
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">מיקום</label>
              <Input
                placeholder="חדר ישיבות / זום / מגרש במסדר"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-9.5 text-xs sm:text-sm font-bold bg-background border-border/40 rounded-xl"
              />
            </div>

            {/* Tone selector */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block">סגנון ניסוח:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["official", "short", "urgent", "event"] as MessageTone[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTone(t); setVariationIndex(0); }}
                    className={cn(
                      "py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer",
                      tone === t
                        ? "bg-amber-500 text-amber-950 font-black border-amber-500 shadow-xs"
                        : "bg-background text-muted-foreground border-border/40 hover:border-border"
                    )}
                  >
                    {t === "official" ? "רשמי ומלא" : t === "short" ? "קצר וממוקד" : t === "urgent" ? "דחוף ומבצעי" : "אירוע / מפגש"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview & Editable Card Column */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-3 min-h-0 h-full">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> תצוגת הנוסח שנוצר:
            </label>
            {generatedResult && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleNextVariation}
                  disabled={isGenerating}
                  className="h-7.5 px-2.5 text-xs font-bold gap-1 rounded-lg text-primary cursor-pointer"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                  נוסח אחר
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPreview}
                  className="h-7.5 px-2.5 text-xs font-bold gap-1 rounded-lg text-muted-foreground cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "הועתק!" : "העתק"}
                </Button>
              </div>
            )}
          </div>

          {/* Live Editable Preview Card */}
          {generatedResult ? (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-right space-y-3 flex-1 min-h-[260px] flex flex-col justify-between transition-all">
              <div className="flex items-center justify-between border-b border-border/30 pb-2 gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-black text-sm sm:text-base text-foreground bg-transparent border-none outline-none w-full focus:bg-amber-500/10 rounded px-1"
                  placeholder="כותרת ההודעה..."
                />
                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> עריכה בלייב
                </span>
              </div>
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="text-xs sm:text-sm font-medium text-foreground/90 bg-transparent border-none outline-none resize-none flex-1 w-full leading-relaxed custom-scrollbar p-1 focus:bg-amber-500/10 rounded min-h-[160px]"
                placeholder="ערוך את תוכן ההודעה כאן בלייב..."
              />
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-muted/10 border border-dashed border-border/60 text-center text-xs sm:text-sm text-muted-foreground flex items-center justify-center flex-1 min-h-[260px]">
              בחר נושא או הזן פרטים כדי לצפות בניסוח החכם
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/30">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-xs font-bold rounded-xl h-10 px-4 cursor-pointer"
              >
                ביטול
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!editedTitle.trim() && !editedBody.trim()}
              className="flex-1 text-xs sm:text-sm px-4 font-black gap-2 shadow-sm rounded-xl h-11 bg-amber-500 text-amber-950 hover:bg-amber-600 cursor-pointer"
            >
              <Check className="w-4.5 h-4.5" />
              השתמש בנוסח זה
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AiMessageGeneratorModal: React.FC<AiMessageGeneratorModalProps> = ({
  open,
  onOpenChange,
  onApplyMessage,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl lg:max-w-6xl w-full sm:w-auto sm:h-[80vh] sm:max-h-[760px] p-4 sm:p-7 rounded-t-[2.2rem] rounded-b-none sm:rounded-3xl overflow-y-auto custom-scrollbar shadow-2xl flex flex-col justify-between" dir="rtl">
        <DialogHeader className="sr-only">
          <DialogTitle>מחולל הודעות AI</DialogTitle>
          <DialogDescription>חולל וניסוח הודעה</DialogDescription>
        </DialogHeader>

        <AiMessageGeneratorContent
          onApplyMessage={(title, body) => {
            onApplyMessage(title, body);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
