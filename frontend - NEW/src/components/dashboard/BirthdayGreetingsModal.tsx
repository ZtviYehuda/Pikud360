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
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";

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


const getEmpDay = (emp: any): number | null => {
  if (emp?.day) return Number(emp.day);
  if (emp?.raw_date) {
    const d = new Date(emp.raw_date);
    if (!isNaN(d.getTime())) return d.getDate();
  }
  if (emp?.date && typeof emp.date === "string" && emp.date.includes("/")) {
    const d = Number(emp.date.split("/")[0]);
    if (!isNaN(d)) return d;
  }
  return null;
};

const getEmpMonth = (emp: any): number | null => {
  if (emp?.month) return Number(emp.month);
  if (emp?.raw_date) {
    const d = new Date(emp.raw_date);
    if (!isNaN(d.getTime())) return d.getMonth() + 1;
  }
  if (emp?.date && typeof emp.date === "string" && emp.date.includes("/")) {
    const m = Number(emp.date.split("/")[1]);
    if (!isNaN(m)) return m;
  }
  return null;
};

export const BirthdayGreetingsModal: React.FC<BirthdayGreetingsModalProps> = ({
  open,
  onOpenChange,
  weeklyBirthdays = [],
  targetEmployee,
}) => {
  if (!open) return null;
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
      const hasToday = weeklyBirthdays.some((emp) => {
        const d = getEmpDay(emp);
        const m = getEmpMonth(emp);
        return d === today.getDate() && m === today.getMonth() + 1;
      });
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
    const todayDate = new Date();
    employeesToday = (weeklyBirthdays || []).filter((emp: any) => {
      const d = getEmpDay(emp);
      const m = getEmpMonth(emp);
      return d === todayDate.getDate() && m === todayDate.getMonth() + 1;
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

  const handleSend = (emp: any) => {
    const phone = emp.phone_number || emp.phone;
    if (!phone) return;

    const firstName = emp.first_name || (emp.full_name ? emp.full_name.split(" ")[0] : "יקר");
    let message = template.replace("[שם]", firstName);
    message = message.replace("[שם_המפקד]", commanderName);

    const whatsappUrl = getWhatsAppUrl(phone, message);
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
        className="w-[95vw] sm:w-[840px] sm:max-w-4xl p-0 overflow-hidden rounded-3xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        <DialogDragHandle />
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 text-right shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-500/20 to-primary/10 border border-amber-500/25 rounded-2xl text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                <PartyPopper className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight">
                  שליחת ברכות יום הולדת
                </DialogTitle>
                {!targetEmployee && (
                  <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
                    <span>היום חוגגים:</span>
                    <span className="font-bold text-foreground">{employeesToday.length} שוטרים</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>השבוע:</span>
                    <span className="font-bold text-foreground">{weeklyBirthdays.length} שוטרים</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick action: Reset sent list if any */}
            {sentList.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 px-3 rounded-xl border-border/60 bg-card/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-xs font-bold text-muted-foreground gap-1.5 cursor-pointer shadow-2xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">איפוס רשימה</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
            {/* Right Column (in RTL): Celebrants List (7 cols on md) */}
            <div className="md:col-span-7 flex flex-col space-y-3">
              {/* Tier 1: View Mode Selection (Tabs) */}
              {!targetEmployee ? (
                <div className="flex p-1 bg-muted/50 dark:bg-muted/30 rounded-2xl gap-1 h-11 items-center">
                  <button
                    type="button"
                    onClick={() => setViewMode("today")}
                    className={cn(
                      "flex-1 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer select-none flex items-center justify-center gap-1.5",
                      viewMode === "today"
                        ? "bg-background text-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                    )}
                  >
                    <span>חוגגים היום</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        viewMode === "today"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {employeesToday.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("week")}
                    className={cn(
                      "flex-1 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer select-none flex items-center justify-center gap-1.5",
                      viewMode === "week"
                        ? "bg-background text-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                    )}
                  >
                    <span>חוגגים השבוע</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        viewMode === "week"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {weeklyBirthdays.length}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="h-11 flex items-center px-2 text-xs font-bold text-foreground">
                  שליחת ברכה אישית
                </div>
              )}

              {/* Tier 2: Celebrants Header */}
              <div className="flex items-center justify-between h-7 px-1">
                <span className="text-xs font-bold text-foreground/80">
                  רשימת חוגגים ({displayedEmployees.length})
                </span>
                {sentList.length > 0 && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shadow-2xs">
                    נשלחו ברכות ל-{sentList.length} שוטרים
                  </span>
                )}
              </div>

              {/* Tier 3: Celebrants List Container (fixed height 360px) */}
              <div className="h-[360px] space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
                {displayedEmployees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card/40 rounded-2xl border border-dashed border-border/60">
                    <PartyPopper className="w-8 h-8 opacity-30 mb-2 text-primary" />
                    <p className="text-sm font-bold">
                      {viewMode === "today"
                        ? "אין שוטרים שחוגגים יום הולדת היום"
                        : "אין שוטרים שחוגגים יום הולדת השבוע"}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground/80">
                      בדוק את הלשונית השנייה או חזור במועד מאוחר יותר
                    </p>
                  </div>
                ) : (
                  displayedEmployees.map((emp: any) => {
                    const isSent = sentList.includes(emp.id);
                    const todayNow = new Date();
                    const d = getEmpDay(emp);
                    const m = getEmpMonth(emp);
                    const isToday = d === todayNow.getDate() && m === todayNow.getMonth() + 1;
                    const fullName = emp.full_name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "שוטר";
                    const initials = `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}` || fullName.substring(0, 2) || "🎂";
                    const phone = emp.phone_number || emp.phone || "";

                    return (
                      <div
                        key={emp.id}
                        className={cn(
                          "flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all shadow-2xs backdrop-blur-xs",
                          isSent
                            ? "bg-muted/30 border-border/40 opacity-70"
                            : "bg-card/60 hover:bg-card border-border/50 hover:border-primary/30",
                        )}
                      >
                        {/* Right: Avatar & Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center shrink-0 border border-border/40 shadow-2xs">
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground truncate">
                                {fullName}
                              </span>
                              {isToday && (
                                <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold shrink-0 animate-pulse">
                                  היום! 🎉
                                </span>
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-xs font-mono mt-0.5",
                                phone ? "text-muted-foreground"
                                  : "text-amber-600/80 dark:text-amber-400/80 font-sans text-[11px]",
                              )}
                              dir={phone ? "ltr" : "rtl"}
                            >
                              {phone ? phone : "ללא מספר טלפון"}
                            </span>
                          </div>
                        </div>

                        {/* Left: WhatsApp Send Button */}
                        <Button
                          size="sm"
                          onClick={() => handleSend(emp)}
                          disabled={!phone}
                          className={cn(
                            "h-9 px-3.5 rounded-xl gap-2 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs",
                            isSent
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                              : !emp.phone_number
                                ? "bg-muted/60 text-muted-foreground/60 border border-border/40 cursor-not-allowed"
                                : "bg-[#25D366] hover:bg-[#20bd5a] text-white active:scale-95",
                          )}
                          variant={
                            isSent || !phone ? "outline" : "default"
                          }
                        >
                          {isSent ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>נשלח</span>
                            </>
                          ) : (
                            <>
                              <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
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

            {/* Left Column (in RTL): Presets & Template Editor (5 cols on md) */}
            <div className="md:col-span-5 flex flex-col space-y-3">
              {/* Tier 1: Presets Segmented Control (matches Tier 1 on right) */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 dark:bg-muted/30 rounded-2xl h-11 items-center">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={cn(
                      "h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none",
                      activePresetId === p.id
                        ? "bg-background text-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Tier 2: Template Header (matches Tier 2 on right) */}
              <div className="flex items-center justify-between h-7 px-1">
                <span className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                  <span>תוכן הברכה</span>
                </span>

                {isEditing ? (
                  <Button
                    size="sm"
                    onClick={handleSavePreset}
                    className="h-6.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold gap-1 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>שמור</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-6.5 px-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>ערוך</span>
                  </Button>
                )}
              </div>

              {/* Tier 3: Template Box Container (fixed height 360px, matches Tier 3 on right) */}
              <div className="h-[360px] p-3.5 rounded-2xl border border-border/60 bg-card/80 dark:bg-card/50 backdrop-blur-xs flex flex-col justify-between shadow-2xs">
                {/* Editor or Preview area */}
                {isEditing ? (
                  <textarea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full flex-1 bg-background border border-primary/40 rounded-xl p-3 text-xs leading-relaxed focus:ring-2 focus:ring-primary/20 outline-none transition-all custom-scrollbar resize-none font-medium mb-3"
                    placeholder="הכנס את נוסח הברכה... השתמש ב-[שם] וב-[שם_המפקד]"
                  />
                ) : (
                  <div
                    onClick={() => setIsEditing(true)}
                    className="w-full flex-1 bg-muted/20 hover:bg-muted/30 border border-border/40 rounded-xl p-3.5 text-xs leading-relaxed text-foreground cursor-text overflow-y-auto custom-scrollbar transition-colors whitespace-pre-wrap font-medium shadow-2xs mb-3"
                  >
                    {template}
                  </div>
                )}

                {/* Template Variables Legend */}
                <div className="p-2.5 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/40 text-xs text-muted-foreground shrink-0 space-y-1.5">
                  <span className="font-bold text-foreground block text-[11px]">
                    תגיות דינמיות בשימוש:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px] border border-primary/20">
                      [שם]
                    </span>
                    <span className="text-[11px]">= שם השוטר</span>
                    <span className="text-muted-foreground/40 mx-1">•</span>
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px] border border-primary/20">
                      [שם_המפקד]
                    </span>
                    <span className="text-[11px]">= {commanderName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

