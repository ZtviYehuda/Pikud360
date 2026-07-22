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
import { cn } from "@/lib/utils";

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

    const cleanPhone = emp.phone_number.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("972")
      ? cleanPhone
      : `972${cleanPhone.startsWith("0") ? cleanPhone.substring(1) : cleanPhone}`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
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
        className="sm:max-w-xl p-0 border-none sm:border sm:border-border bg-card flex flex-col"
        dir="rtl"
      >
        <DialogDragHandle />
        <DialogHeader className="p-6 border-b border-border/50 bg-muted/20 text-right">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground">
                שליחת ברכות יום הולדת
              </DialogTitle>
              {!targetEmployee && (
                <p className="text-xs text-muted-foreground font-bold mt-0.5 uppercase tracking-tight">
                  היום חוגגים {employeesToday.length} אנשים | השבוע{" "}
                  {weeklyBirthdays.length} אנשים
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* View Mode Selection */}
          {!targetEmployee && (
            <div className="flex p-1 bg-muted/50 rounded-2xl border border-border/50">
              <Button
                variant={viewMode === "today" ? "default" : "ghost"}
                onClick={() => setViewMode("today")}
                className={cn(
                  "flex-1 h-9 rounded-xl text-xs font-black  transition-all",
                  viewMode === "today"
                    ? "bg-background text-primary  hover:bg-background"
                    : "text-muted-foreground",
                )}
              >
                חוגגים היום ({employeesToday.length})
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                onClick={() => setViewMode("week")}
                className={cn(
                  "flex-1 h-9 rounded-xl text-xs font-black  transition-all",
                  viewMode === "week"
                    ? "bg-background text-primary  hover:bg-background"
                    : "text-muted-foreground",
                )}
              >
                חוגגים השבוע ({weeklyBirthdays.length})
              </Button>
            </div>
          )}

          {/* Presets Selection */}
          <div className="flex gap-2">
            {presets.map((p) => (
              <Button
                key={p.id}
                variant={activePresetId === p.id ? "default" : "secondary"}
                onClick={() => handleSelectPreset(p)}
                className={cn(
                  "flex-1 h-auto py-3 rounded-2xl text-[10px] font-black transition-all border flex flex-col items-center gap-1",
                  activePresetId === p.id
                    ? "bg-primary text-primary-foreground border-primary  "
                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50",
                )}
              >
                <span className="uppercase tracking-widest">{p.label}</span>
              </Button>
            ))}
          </div>

          {/* Template Editor */}
          <div className="bg-muted/30 p-5 rounded-[24px] border border-border/40 relative">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                <Edit2 className="w-3 h-3" />
                נוסח הברכה
              </span>
              {isEditing ? (
                <Button
                  size="sm"
                  onClick={handleSavePreset}
                  className="h-7 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[9px] font-black gap-1.5 "
                >
                  <Save className="w-3 h-3" />
                  שמור שינויים
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2 text-primary hover:bg-primary/5 rounded-full text-[9px] font-black uppercase tracking-widest"
                >
                  <Edit2 className="w-3 h-3 ml-1" />
                  ערוך
                </Button>
              )}
            </div>

            <div className="relative">
              {isEditing ? (
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-card border border-border rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all h-32 custom-scrollbar resize-none "
                  placeholder="הכנס את נוסח הברכה... השתמש ב-[שם] וב-[שם_המפקד]"
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  className="bg-card border border-border/50 rounded-2xl p-4 text-sm font-bold text-foreground leading-relaxed cursor-text min-h-[100px] hover:border-primary/30 transition-colors group relative whitespace-pre-wrap "
                >
                  {template}
                </div>
              )}
            </div>

            <div className="mt-3">
              <p className="text-[9px] text-muted-foreground font-bold leading-relaxed opacity-70">
                * <span className="text-primary">[שם]</span> = שם השוטר |
                <span className="text-primary mr-1">[שם_המפקד]</span> ={" "}
                {commanderName}
              </p>
            </div>
          </div>

          {/* Employees List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                רשימת חוגגים
              </span>
              {sentList.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-6 text-[9px] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" /> איפוס שליחה
                </Button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {displayedEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {viewMode === "today"
                      ? "אין ימי הולדת היום"
                      : "אין ימי הולדת השבוע"}
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
                        "flex items-center justify-between p-3.5 rounded-2xl border transition-all",
                        isSent
                          ? "bg-muted/10 border-border/10 opacity-60"
                          : "bg-card border-border  hover:border-primary/30 hover:",
                        isToday && viewMode === "week"
                          ? "border-primary/20 bg-primary/5"
                          : "",
                      )}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-foreground">
                            {emp.first_name} {emp.last_name}
                          </span>
                          {isToday && viewMode === "week" && (
                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">
                              היום!
                            </span>
                          )}
                        </div>
                        <a
                          href={`tel:${emp.phone_number}`}
                          className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors hover:underline"
                          dir="ltr"
                        >
                          {emp.phone_number || "---"}
                        </a>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleSend(emp)}
                        disabled={!emp.phone_number}
                        className={cn(
                          "h-9 px-4 rounded-xl gap-2 font-black text-[10px] transition-all",
                          isSent
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-primary text-primary-foreground hover:scale-105  ",
                        )}
                        variant={isSent ? "outline" : "default"}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            נשלח
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            שלח ברכה
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
      </DialogContent>
    </Dialog>
  );
};

