import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDragHandle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Users, Search, Send, Copy } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WhatsAppBroadcastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuthContext();
  const { employees, loading, fetchEmployees } = useEmployees();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"team" | "section" | "department">("team");

  // Wizard States: 1 = Users, 2 = Message
  const [step, setStep] = useState<1 | 2>(1);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [currentSendIndex, setCurrentSendIndex] = useState(0);

  // Fetch subordinates when modal opens
  useEffect(() => {
    if (open) {
      fetchEmployees();
      setBroadcastMode(false);
      setCurrentSendIndex(0);
      setStep(1);
    }
  }, [open, fetchEmployees]);

  // Reset selection when employees are loaded - ONLY those with phone numbers
  useEffect(() => {
    if (employees.length > 0) {
      const validIds = employees
        .filter((e) => !!e.phone_number)
        .map((e) => e.id);
      setSelectedIds(new Set(validIds));
    }
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.first_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(search.toLowerCase()) ||
        (emp.phone_number && emp.phone_number.includes(search));

      return matchesSearch;
    });
  }, [employees, search]);

  const selectedEmployeesList = useMemo(() => {
    return employees.filter((e) => selectedIds.has(e.id) && !!e.phone_number);
  }, [employees, selectedIds]);

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else {
      const emp = employees.find((e) => e.id === id);
      if (emp?.phone_number) {
        next.add(id);
      }
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    const employeesWithPhone = employees.filter((e) => !!e.phone_number);
    if (
      selectedIds.size >= employeesWithPhone.length &&
      employeesWithPhone.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employeesWithPhone.map((e) => e.id)));
    }
  };

  const handleCopyNumbers = () => {
    const numbers = selectedEmployeesList.map((e) => e.phone_number).join(",");

    if (!numbers) {
      toast.error("לא נבחרו נמענים עם מספר טלפון");
      return;
    }

    navigator.clipboard.writeText(numbers);
    toast.success(`${selectedEmployeesList.length} מספרים הועתקו ללוח`);
  };

  const handleStartBroadcast = () => {
    if (selectedEmployeesList.length === 0) {
      toast.error("יש לבחור לפחות נמען אחד");
      return;
    }

    if (!message.trim()) {
      toast.error("יש להקליד תוכן להודעה");
      return;
    }

    if (selectedEmployeesList.length === 1) {
      const emp = selectedEmployeesList[0];
      const waUrl = `https://api.whatsapp.com/send?phone=${emp.phone_number!.replace(/\D/g, "")}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
      toast.success("טוען צ'אט לוואטסאפ...");
      return;
    }

    setBroadcastMode(true);
    setCurrentSendIndex(0);
  };

  const handleSendNext = () => {
    if (currentSendIndex >= selectedEmployeesList.length) return;

    const emp = selectedEmployeesList[currentSendIndex];
    if (emp && emp.phone_number) {
      const waUrl = `https://api.whatsapp.com/send?phone=${emp.phone_number.replace(/\D/g, "")}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    }

    if (currentSendIndex < selectedEmployeesList.length - 1) {
      setCurrentSendIndex((prev) => prev + 1);
    } else {
      toast.success("כל ההודעות בסבב נשלחו בהצלחה!");
      setBroadcastMode(false);
      setStep(1);
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setBroadcastMode(false);
          setStep(1);
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-xl sm:h-[85vh] p-0 border-none sm:border sm:border-border/40 bg-background flex flex-col" dir="rtl">
        <DialogDragHandle />
        {/* Header - Fixed */}
        <div className="p-5 sm:p-6 border-b border-border/40 bg-muted/20 relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                רשימת תפוצה
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {/* Step indicators */}
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      step === 1 ? "bg-primary w-4" : "bg-primary/20",
                      broadcastMode && "bg-green-500 w-4",
                    )}
                  />
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      step === 2 && !broadcastMode
                        ? "bg-primary w-4"
                        : "bg-primary/20",
                    )}
                  />
                </div>
                <p className="text-xs font-bold text-muted-foreground/80 truncate">
                  {broadcastMode
                    ? "שליחה רציפה"
                    : step === 1
                      ? "בחירת נמענים"
                      : "ניסוח הודעה"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable depending on step */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 pt-2 space-y-4 overflow-hidden relative">
          {/* STEP 1: Select Recipients */}
          {step === 1 && !broadcastMode && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Scope Selection */}
              {(user.commands_team_id ? 1 : 0) +
                (user.commands_section_id ? 1 : 0) +
                (user.commands_department_id ? 1 : 0) >
                1 && (
                <div className="space-y-1 shrink-0 bg-muted/20 p-2 rounded-2xl border border-border/40">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {user.commands_team_id && (
                      <Button
                        variant={scope === "team" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScope("team")}
                        className={cn(
                          "rounded-xl h-9 font-black text-xs px-4 transition-all flex-1",
                          scope === "team" && "",
                        )}
                      >
                        חוליה
                      </Button>
                    )}
                    {user.commands_section_id && (
                      <Button
                        variant={scope === "section" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScope("section")}
                        className={cn(
                          "rounded-xl h-9 font-black text-xs px-4 transition-all flex-1",
                          scope === "section" && "",
                        )}
                      >
                        מדור
                      </Button>
                    )}
                    {user.commands_department_id && (
                      <Button
                        variant={scope === "department" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScope("department")}
                        className={cn(
                          "rounded-xl h-9 font-black text-xs px-4 transition-all flex-1",
                          scope === "department" &&
                            "",
                        )}
                      >
                        מחלקה
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between shrink-0">
                <label className="text-[11px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" /> נבחרו{" "}
                  {selectedIds.size} מתוך{" "}
                  {employees.filter((e) => !!e.phone_number).length}
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] sm:text-xs font-black text-primary hover:underline transition-all bg-primary/10 px-3 py-1 rounded-full"
                >
                  {selectedIds.size ===
                    employees.filter((e) => !!e.phone_number).length &&
                  employees.length > 0
                    ? "בטל הכל"
                    : "בחר הכל"}
                </button>
              </div>

              <div className="relative group shrink-0">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="חיפוש איש קשר או מאפיין..."
                  className="w-full bg-muted/30 border border-border/40 rounded-xl h-12 pr-10 pl-4 text-sm font-bold outline-none focus:border-primary/50 transition-all focus:ring-4 focus:ring-primary/5"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 border border-border/40 rounded-2xl bg-muted/10 overflow-y-auto custom-scrollbar p-2 min-h-0">
                <div className="space-y-1.5">
                  {loading ? (
                    <div className="p-10 text-center">
                      <span className="text-sm font-bold animate-pulse text-muted-foreground">
                        טוען נתונים...
                      </span>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="p-10 text-center">
                      <span className="text-sm font-bold text-muted-foreground/40 italic">
                        לא נמצאו תוצאות לחיפוש
                      </span>
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => emp.phone_number && toggleSelect(emp.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                          selectedIds.has(emp.id)
                            ? "bg-primary/5 border-primary/30"
                            : "bg-card border-transparent hover:border-primary/20",
                          !emp.phone_number &&
                            "opacity-50 grayscale cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <Checkbox
                            checked={selectedIds.has(emp.id)}
                            onCheckedChange={() =>
                              emp.phone_number && toggleSelect(emp.id)
                            }
                            disabled={!emp.phone_number}
                            className="w-5 h-5 rounded-md border-primary/50"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-black truncate leading-tight">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p className="text-[11px] font-bold text-muted-foreground tabular-nums opacity-80 mt-0.5">
                              {emp.phone_number || "ללא מספר מוזן"}
                            </p>
                          </div>
                        </div>
                        {emp.phone_number &&
                          selectedIds.has(emp.id) === false && (
                            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-muted-foreground/50 text-[10px] font-bold shrink-0">
                              +
                            </div>
                          )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Write Message */}
          {step === 2 && !broadcastMode && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-sm leading-tight text-foreground">
                    הודעה ל-{selectedIds.size} נמענים
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground">
                    כולם יקבלו את ההודעה באופן אישי לחלוטין
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <label className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" /> הפצת
                    ההודעה (ללא קבצים וסרטונים עדין)
                  </label>
                </div>
                <Textarea
                  placeholder="הקלידו כאן את תוכן ההודעה המלא..."
                  className="flex-1 min-h-[150px] resize-none bg-muted/10 border-border/40 focus:border-green-500/50 rounded-2xl p-4 sm:p-5 font-bold text-base sm:text-lg leading-relaxed w-full custom-scrollbar"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Broadcast Mode (Sending) */}
          {broadcastMode && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-muted/5 rounded-3xl border border-border/20">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto relative z-10">
                  <Send className="w-12 h-12 text-green-500 translate-x-1" />
                </div>
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse z-0" />
              </div>

              <div>
                <h3 className="text-2xl font-black mb-2">מצב שיגור הופעל</h3>
                <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                  הודעתכם נשלחת ברצף לכלל הנמענים שנבחרו.
                  <br />
                  לחצו על "שלח להבא" כדי להעביר את ההודעה לנמען הבא בתור.
                </p>
              </div>

              <div className="w-full bg-background border border-border/40 p-4 rounded-2xl text-right">
                <p className="text-[11px] font-black uppercase text-primary/60 mb-2">
                  תצוגה מקדימה
                </p>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-3 rounded-xl rounded-tr-sm text-sm">
                  <p className="font-medium whitespace-pre-wrap leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Dynamic based on step */}
        <div className="p-4 sm:p-5 border-t border-border/40 bg-card shrink-0 relative z-20">
          {/* Footer: Step 1 */}
          {step === 1 && !broadcastMode && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCopyNumbers}
                disabled={selectedIds.size === 0}
                className="font-black h-12 sm:h-14 rounded-xl gap-2 border-border/60 hover:bg-background text-xs sm:text-sm px-3 sm:px-6 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">העתקת כתובות</span>
                <span className="sm:hidden">העתק מספרים</span>
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={selectedIds.size === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 sm:h-14 rounded-xl gap-2 text-sm sm:text-base transition-all active:scale-[0.98]"
              >
                המשך לניסוח ההודעה
              </Button>
            </div>
          )}

          {/* Footer: Step 2 */}
          {step === 2 && !broadcastMode && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="font-black h-12 sm:h-14 rounded-xl border-border/60 hover:bg-muted text-sm px-4 sm:px-6 transition-all"
              >
                חזור
              </Button>
              <Button
                onClick={handleStartBroadcast}
                disabled={selectedIds.size === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black h-12 sm:h-14 rounded-xl gap-2-500/20 text-sm sm:text-base transition-all active:scale-[0.98]"
              >
                <Send className="w-5 h-5 -scale-x-100" />
                {selectedEmployeesList.length === 1
                  ? "שליחה בוואטסאפ אישי"
                  : `התחל לשלוח ל-${selectedEmployeesList.length} נמענים`}
              </Button>
            </div>
          )}

          {/* Footer: Step 3 (Broadcast Active) */}
          {broadcastMode && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs font-black text-muted-foreground flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  סטטוס סבב השליחה
                </span>
                <span className="text-sm font-black bg-primary/10 text-primary px-3 py-1.5 rounded-xl tabular-nums">
                  נמען {currentSendIndex + 1} מתוך{" "}
                  {selectedEmployeesList.length}
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setBroadcastMode(false)}
                  variant="outline"
                  className="h-14 rounded-xl font-bold flex-[1] border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.98]"
                >
                  עצור
                </Button>
                <Button
                  onClick={handleSendNext}
                  className="group bg-green-600 hover:bg-green-700 text-white font-black h-14 rounded-xl flex-[2] gap-2-500/30 text-base transition-all active:scale-[0.98] overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform pointer-events-none" />
                  <Send className="w-5 h-5 fill-white -scale-x-100 mr-1" />
                  הבא: {selectedEmployeesList[currentSendIndex]?.first_name}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

