import React, { useState, useMemo } from "react";
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

export const AiMessageGeneratorModal: React.FC<AiMessageGeneratorModalProps> = ({
  open,
  onOpenChange,
  onApplyMessage,
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

  const isTimeValid = useMemo(() => {
    const clean = time.trim();
    if (!clean) return true;
    const match = clean.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    return !!match;
  }, [time]);

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

  const setQuickDate = (type: "today" | "tomorrow" | "sunday") => {
    let targetDate = new Date();
    if (type === "tomorrow") targetDate = addDays(new Date(), 1);
    else if (type === "sunday") targetDate = nextSunday(new Date());

    handleDateSelect(targetDate);
  };

  const allHighlights = useMemo(() => {
    const list = [...highlights];
    if (extraNotes.trim() && !list.includes(extraNotes.trim())) {
      list.push(extraNotes.trim());
    }
    return list;
  }, [highlights, extraNotes]);

  const generatedResult = useMemo(() => {
    if (!topic.trim() && !day.trim() && !time.trim()) {
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
      totalVariations: options.length,
    };
  }, [topic, day, time, location, allHighlights, tone, variationIndex]);

  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [showExtraNotes, setShowExtraNotes] = useState(false);

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
    // On mobile screens, auto-collapse the input form so the preview is immediately visible
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsFormCollapsed(true);
    }
  };

  const handleApply = () => {
    if (!generatedResult) {
      toast.error("אנא מלא לפחות נושא, תאריך או שעה כדי לייצר הודעה");
      return;
    }
    onApplyMessage(generatedResult.title, generatedResult.body);
    toast.success("ההודעה שובצה בהצלחה בטופס הראשי");
    onOpenChange(false);
  };

  const handleCopyPreview = async () => {
    if (!generatedResult) return;
    try {
      const fullText = `${generatedResult.title}\n\n${generatedResult.body}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("נוסח ההודעה הועתק ללוח בהצלחה");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("שגיאה בהעתקת הטקסט");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-full sm:w-[95vw] sm:max-w-4xl lg:max-w-5xl text-right p-3.5 sm:p-6 space-y-2.5 max-h-[92svh] overflow-y-auto custom-scrollbar border-0 sm:border border-border/50 shadow-2xl bg-card rounded-t-3xl rounded-b-none sm:rounded-3xl"
        dir="rtl"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <DialogHeader className="text-right space-y-0.5 pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-black text-foreground">
                  ניסוח הודעה מהיר
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground hidden sm:block">
                  הזן פרטים בסיסיים, והמערכת תייצר עבורך נוסח הודעה מסודר ומדויק
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* 2-Column Responsive Layout: Inputs on Right, Live Preview on Left */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start pt-0.5">
          {/* Column 1: Controls & Form (7 cols on desktop) */}
          <div className="md:col-span-7 space-y-2.5">
            {/* Mobile Collapsed Summary Header */}
            {isFormCollapsed && (
              <div className="md:hidden flex items-center justify-between p-2 rounded-2xl bg-muted/40 border border-border/50 text-xs">
                <div className="flex flex-col min-w-0 pr-1 text-right">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-foreground truncate max-w-[160px]">
                      {topic || "נושא כללי"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary shrink-0">
                      {tone === "official" ? "רשמי" : tone === "short" ? "קצר" : tone === "urgent" ? "דחוף" : "אירוע"}
                    </span>
                  </div>
                  {(day || time || location) && (
                    <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {[day, time, location].filter(Boolean).join(" • ")}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormCollapsed(false)}
                  className="h-7 px-2.5 rounded-xl text-[11px] font-bold shrink-0 text-primary border-primary/30"
                >
                  ערוך פרטים ▾
                </Button>
              </div>
            )}

            {/* Form Fields: Always shown on desktop, collapsible on mobile */}
            <div className={cn("space-y-2.5", isFormCollapsed ? "hidden md:block" : "block")}>
              {/* Quick Presets - Horizontal Scrollable Row */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    נושאים מהירים לבחירה:
                  </label>
                  {generatedResult && (
                    <button
                      type="button"
                      onClick={() => setIsFormCollapsed(true)}
                      className="md:hidden text-[10px] font-bold text-primary hover:underline"
                    >
                      הצג נוסח ▴
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5">
                  {PRESETS.map((p) => {
                    const isSelected = topic === p.topic;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePresetClick(p)}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-xl border transition-all whitespace-nowrap shrink-0 cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                            : "bg-muted/30 border-border/50 text-foreground hover:bg-muted/60 font-medium"
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 1: Topic */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  נושא ההודעה <span className="text-primary">*</span>
                </label>
                <Input
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setVariationIndex(0);
                  }}
                  className="h-8.5 text-xs sm:text-sm font-medium rounded-xl"
                />
              </div>

              {/* Row 2: Day & Time & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Day / Date Picker Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary shrink-0" />
                      <span>יום / תאריך</span>
                    </span>
                    {selectedDate && <Check className="w-3 h-3 text-emerald-500" />}
                  </label>
                  
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <div className="relative flex items-center">
                      <Input
                        value={day}
                        onChange={(e) => {
                          setDay(e.target.value);
                          setSelectedDate(undefined);
                        }}
                        className="h-8.5 text-xs rounded-xl pl-8"
                      />
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="absolute left-1.5 p-1 text-muted-foreground hover:text-primary rounded-lg transition-colors cursor-pointer"
                          title="פתח לוח שנה"
                        >
                          <CalendarDays className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                    </div>

                    <PopoverContent
                      align="start"
                      dir="rtl"
                      className="w-auto p-3 rounded-2xl border-border/60 shadow-xl bg-card z-[250]"
                    >
                      {/* Quick day buttons */}
                      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-border/40 text-[11px]">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDate("today")}
                          className="h-7 px-2 text-[11px] rounded-lg"
                        >
                          היום
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDate("tomorrow")}
                          className="h-7 px-2 text-[11px] rounded-lg"
                        >
                          מחר
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDate("sunday")}
                          className="h-7 px-2 text-[11px] rounded-lg"
                        >
                          יום ראשון
                        </Button>
                      </div>

                      <CalendarPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={he}
                        className="rounded-xl border border-border/30"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Field with Validation & Quick Pick */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary shrink-0" />
                      <span>שעה</span>
                    </span>
                    {time && isTimeValid && <Check className="w-3 h-3 text-emerald-500" />}
                    {time && !isTimeValid && (
                      <span className="text-[10px] text-destructive flex items-center gap-0.5 font-bold">
                        <AlertCircle className="w-2.5 h-2.5" />
                        לא תקין
                      </span>
                    )}
                  </label>

                  <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
                    <div className="relative flex items-center">
                      <Input
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onBlur={handleTimeBlur}
                        maxLength={5}
                        className={cn(
                          "h-8.5 text-xs rounded-xl pl-8 font-mono",
                          !isTimeValid && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="absolute left-1.5 p-1 text-muted-foreground hover:text-primary rounded-lg transition-colors cursor-pointer"
                          title="בחר שעה"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                    </div>

                    <PopoverContent
                      align="center"
                      dir="rtl"
                      className="w-56 p-2.5 rounded-2xl border-border/60 shadow-xl bg-card space-y-1.5 z-[250]"
                    >
                      <span className="text-[10px] font-bold text-muted-foreground block px-1">
                        שעות שכיחות לבחירה מהירה:
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {COMMON_TIMES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setTime(t);
                              setIsTimeOpen(false);
                            }}
                            className={cn(
                              "px-2 py-1 text-xs font-mono rounded-lg border text-center transition-all cursor-pointer",
                              time === t
                                ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                                : "bg-muted/30 border-border/40 hover:bg-muted"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Location Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                    <span>מיקום</span>
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-8.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Row 3: Tone Selector - Compact Bar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  סגנון ניסוח:
                </label>
                <div className="grid grid-cols-4 gap-1">
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
                          "flex items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer truncate",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                            : "bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Multiple Highlights & Directives (דגשים והנחיות נוספות) */}
              <div className="space-y-1.5 pt-0.5 border-t border-border/20">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-bold text-foreground flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>דגשים והנחיות למפקד:</span>
                  </label>
                  {highlights.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHighlights([])}
                      className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer font-medium"
                    >
                      נקה הכל
                    </button>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    "הגעה 10 דקות מראש",
                    "מדים מלאים ותקניים",
                    "נשק אישי חובה",
                    "השתתפות חובה",
                    "לאשר קריאה בקבוצה",
                  ].map((chip) => {
                    const isAdded = highlights.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            setHighlights((prev) => prev.filter((h) => h !== chip));
                          } else {
                            setHighlights((prev) => [...prev, chip]);
                          }
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-semibold border shrink-0 transition-all cursor-pointer flex items-center gap-1 select-none",
                          isAdded
                            ? "bg-primary/15 text-primary border-primary/40 font-bold"
                            : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/40"
                        )}
                      >
                        <span>{isAdded ? "✓" : "+"}</span>
                        <span>{chip}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Highlight Input Bar with Plus Icon */}
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="הקלד דגש נוסף (ציוד, חנייה, מדים) ולחץ Enter או +..."
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newHighlight.trim()) {
                          setHighlights((prev) => [...prev, newHighlight.trim()]);
                          setNewHighlight("");
                        }
                      }
                    }}
                    className="h-8 text-xs rounded-xl flex-1 bg-background border-border/50"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (newHighlight.trim()) {
                        setHighlights((prev) => [...prev, newHighlight.trim()]);
                        setNewHighlight("");
                      }
                    }}
                    disabled={!newHighlight.trim()}
                    className="h-8 px-2.5 rounded-xl font-bold text-xs gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>הוסף</span>
                  </Button>
                </div>

                {/* Active Highlight Tags */}
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5 max-h-[70px] overflow-y-auto custom-scrollbar">
                    {highlights.map((h, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold"
                      >
                        <span>• {h}</span>
                        <button
                          type="button"
                          onClick={() => setHighlights((prev) => prev.filter((_, i) => i !== idx))}
                          className="hover:bg-primary/20 rounded p-0.5 cursor-pointer text-primary/80 hover:text-primary"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Live Preview & Main Actions (5 cols on desktop) */}
          <div className="md:col-span-5 flex flex-col h-full space-y-2 md:border-r md:border-border/40 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                תצוגת הנוסח שנוצר:
              </span>

              {generatedResult && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleNextVariation}
                    disabled={isGenerating}
                    className="h-7 text-xs px-2.5 gap-1 text-primary border-primary/30 hover:bg-primary/5 rounded-xl cursor-pointer"
                    title="קבל נוסח שונה"
                  >
                    <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
                    <span>נוסח אחר</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyPreview}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                    title="העתק טקסט"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Preview Card */}
            {generatedResult ? (
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-right space-y-1.5 flex-1 max-h-[220px] sm:max-h-[280px] md:max-h-[340px] overflow-y-auto custom-scrollbar">
                <div className="font-black text-xs sm:text-sm text-foreground border-b border-border/30 pb-1.5">
                  {generatedResult.title}
                </div>
                <div className="text-xs font-medium text-foreground/90 whitespace-pre-line leading-relaxed">
                  {generatedResult.body}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-muted/10 border border-dashed border-border/60 text-center text-xs text-muted-foreground flex items-center justify-center flex-1 min-h-[110px]">
                בחר נושא או הזן פרטים כדי לצפות בניסוח החכם
              </div>
            )}

            {/* Sticky Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30 sticky bottom-0 bg-card z-10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs rounded-xl h-9 cursor-pointer"
              >
                ביטול
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={!generatedResult}
                className="text-xs px-4 font-bold gap-1.5 shadow-sm rounded-xl h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                השתמש בנוסח זה
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
