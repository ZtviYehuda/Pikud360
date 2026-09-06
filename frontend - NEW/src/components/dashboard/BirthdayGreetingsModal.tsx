import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDragHandle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Send, Edit2, RotateCcw, Save, PartyPopper } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { cn, getWhatsAppUrl } from "@/lib/utils";

interface BirthdayEmployee {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  phone_number?: string;
  day: number;
  month: number;
}

interface BirthdayGreetingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeklyBirthdays?: BirthdayEmployee[];
  targetEmployee?: BirthdayEmployee;
}

interface Preset {
  id: number;
  label: string;
  text: string;
}

const INITIAL_PRESETS: Preset[] = [
  {
    id: 1,
    label: "ברכה 1",
    text: "מזל טוב [שם] יקר! מאחלים לך יום הולדת שמח, המון בריאות, אושר והצלחה מהיחידה!\n\nבברכה, [שם_המפקד]",
  },
  {
    id: 2,
    label: "ברכה 2",
    text: "יום הולדת שמח [שם]! מאחלים לך שנה מלאה בחוויות טובות, חיוכים והמון כיף. מזל טוב!\n\nממני, [שם_המפקד]",
  },
  {
    id: 3,
    label: "ברכה 3",
    text: "מזל טוב [שם]! מאחלים לך יום הולדת שמח ומכל הלב!\n\n[שם_המפקד]",
  },
];

export const BirthdayGreetingsModal: React.FC<BirthdayGreetingsModalProps> = ({
  open,
  onOpenChange,
  weeklyBirthdays = [],
  targetEmployee,
}) => {
  const { user } = useAuthContext();
  const { markBirthdaySent } = useEmployees();
  const [presets, setPresets] = useState<Preset[]>(INITIAL_PRESETS);
  const [activePresetId, setActivePresetId] = useState<number>(1);
  const [template, setTemplate] = useState(INITIAL_PRESETS[0].text);
  const [sentList, setSentList] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"today" | "week">("today");

  useEffect(() => {
    if (open && weeklyBirthdays && weeklyBirthdays.length > 0 && !targetEmployee) {
      const today = new Date();
      const hasToday = weeklyBirthdays.some(
        (emp) => emp.day === today.getDate() && emp.month === today.getMonth() + 1
      );
      setViewMode(hasToday ? "today" : "week");
    }
  }, [open, weeklyBirthdays, targetEmployee]);

  // Determine employees to display
  let employeesToday: BirthdayEmployee[] = [];
  let displayedEmployees: BirthdayEmployee[] = [];

  if (targetEmployee) {
    employeesToday = [targetEmployee];
    displayedEmployees = [targetEmployee];
  } else {
    employeesToday = (weeklyBirthdays || []).filter((emp: any) => {
      const today = new Date();
      return emp.day === today.getDate() && emp.month === today.getMonth() + 1;
    });
    displayedEmployees =
      viewMode === "today" ? employeesToday : weeklyBirthdays;
  }

  const commanderName = user ? `${user.first_name} ${user.last_name}` : "המפקד";
  const storageKey = user?.id
    ? `birthday_presets_${user.id}`
    : "birthday_presets_guest";

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPresets(parsed);
        setTemplate(parsed[0].text);
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    } else {
      setPresets(INITIAL_PRESETS);
      setTemplate(INITIAL_PRESETS[0].text);
      setActivePresetId(1);
    }
  }, [storageKey]);

  const handleSend = (emp: BirthdayEmployee) => {
    if (!emp.phone_number) return;

    let message = template.replace("[שם]", emp.first_name);
    message = message.replace("[שם_המפקד]", commanderName);

    const whatsappUrl = getWhatsAppUrl(emp.phone_number, message);
    window.open(whatsappUrl, "_blank");

    if (!sentList.includes(emp.id)) {
      setSentList([...sentList, emp.id]);
      markBirthdaySent(emp.id);
    }
  };

  const handleSavePreset = () => {
    const updatedPresets = presets.map((p) =>
      p.id === activePresetId ? { ...p, text: template } : p,
    );
    setPresets(updatedPresets);
    localStorage.setItem(storageKey, JSON.stringify(updatedPresets));
    setIsEditing(false);
  };

  const handleSelectPreset = (p: Preset) => {
    setActivePresetId(p.id);
    setTemplate(p.text);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (window.confirm("האם לאפס את רשימת השליחה?")) {
      setSentList([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl lg:max-w-4xl p-0 border border-border/80 bg-card rounded-2xl sm:rounded-3xl shadow-xl flex flex-col max-h-[88vh] overflow-hidden"
        dir="rtl"
      >
        <DialogDragHandle />
        <DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl text-primary flex items-center justify-center shrink-0">
                <PartyPopper className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  שליחת ברכות יום הולדת
                </DialogTitle>
                {!targetEmployee && (
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    היום חוגגים {employeesToday.length} שוטרים • השבוע{" "}
                    {weeklyBirthdays.length} שוטרים
                  </p>
                )}
              </div>
            </div>

            {/* Quick action: Reset sent list if any */}
            {sentList.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">איפוס רשימת שליחה</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Right Column (in RTL): Celebrants List (7 cols on md) */}
            <div className="md:col-span-7 space-y-4">
              {/* View Mode Selection (Tabs) */}
              {!targetEmployee && (
                <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50">
                  <button
                    type="button"
                    onClick={() => setViewMode("today")}
                    className={cn(
                      "flex-1 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      viewMode === "today"
                        ? "bg-background text-foreground shadow-2xs border border-border/60 font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    חוגגים היום ({employeesToday.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("week")}
                    className={cn(
                      "flex-1 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      viewMode === "week"
                        ? "bg-background text-foreground shadow-2xs border border-border/60 font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    חוגגים השבוע ({weeklyBirthdays.length})
                  </button>
                </div>
              )}

              {/* Celebrants list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    רשימת חוגגים ({displayedEmployees.length})
                  </span>
                  {sentList.length > 0 && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      נשלחו ברכות ל-{sentList.length} שוטרים
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-0.5">
                  {displayedEmployees.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                      <PartyPopper className="w-8 h-8 opacity-30 mx-auto mb-2" />
                      <p className="text-xs font-semibold">
                        {viewMode === "today"
                          ? "אין שוטרים שחוגגים יום הולדת היום"
                          : "אין שוטרים שחוגגים יום הולדת השבוע"}
                      </p>
                    </div>
                  ) : (
                    displayedEmployees.map((emp) => {
                      const isSent = sentList.includes(emp.id);
                      const today = new Date();
                      const isToday =
                        emp.day === today.getDate() &&
                        emp.month === today.getMonth() + 1;

                      return (
                        <div
                          key={emp.id}
                          className={cn(
                            "flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all bg-card/80 hover:bg-card shadow-2xs",
                            isSent
                              ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                              : isToday
                                ? "border-primary/40 ring-1 ring-primary/20 bg-primary/[0.02]"
                                : "border-border/60 hover:border-border",
                          )}
                        >
                          {/* Right: Avatar + Name + Birthday */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border",
                                isToday
                                  ? "bg-primary/10 border-primary/20 text-primary"
                                  : "bg-muted border-border/60 text-muted-foreground",
                              )}
                            >
                              {emp.first_name[0]}
                              {emp.last_name[0]}
                            </div>
                            <div className="flex flex-col min-w-0 text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground truncate">
                                  {emp.first_name} {emp.last_name}
                                </span>
                                {isToday && (
                                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold shrink-0 animate-pulse">
                                    היום! 🎉
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-xs text-muted-foreground"
                                dir="ltr"
                              >
                                {emp.phone_number
                                  ? emp.phone_number
                                  : "ללא טלפון"}
                              </span>
                            </div>
                          </div>

                          {/* Left: Send Button */}
                          <Button
                            size="sm"
                            onClick={() => handleSend(emp)}
                            disabled={!emp.phone_number}
                            className={cn(
                              "h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs",
                              isSent
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/15"
                                : "bg-primary text-primary-foreground hover:bg-primary/90",
                            )}
                            variant={isSent ? "outline" : "default"}
                          >
                            {isSent ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>נשלח</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>שלח בוואטסאפ</span>
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Left Column (in RTL): Presets & Template Editor (5 cols on md) */}
            <div className="md:col-span-5 space-y-4">
              {/* Presets Segmented Control */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground block text-right">
                  בחר נוסח ברכה
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={cn(
                        "h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center",
                        activePresetId === p.id
                          ? "bg-background text-foreground shadow-2xs border border-border/60 font-bold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Editor Box */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-primary" />
                    <span>תוכן הברכה</span>
                  </span>

                  {isEditing ? (
                    <Button
                      size="sm"
                      onClick={handleSavePreset}
                      className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold gap-1 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>שמור</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-7 px-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>ערוך</span>
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-primary/20 outline-none transition-all h-36 custom-scrollbar resize-none font-medium"
                    placeholder="הכנס את נוסח הברכה... השתמש ב-[שם] וב-[שם_המפקד]"
                  />
                ) : (
                  <div
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-muted/20 border border-border/50 rounded-xl p-3 text-xs leading-relaxed text-foreground cursor-text min-h-[140px] hover:border-primary/40 transition-colors whitespace-pre-wrap font-medium"
                  >
                    {template}
                  </div>
                )}

                {/* Template Variables Legend */}
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] text-muted-foreground leading-normal">
                  <span>תגיות דינמיות: </span>
                  <span className="font-semibold text-primary">[שם]</span> = שם
                  השוטר |{" "}
                  <span className="font-semibold text-primary">[שם_המפקד]</span>{" "}
                  = {commanderName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

