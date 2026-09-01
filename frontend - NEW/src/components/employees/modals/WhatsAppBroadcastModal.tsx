import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDragHandle,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MessageSquare,
  Users,
  Search,
  Send,
  Copy,
  Sparkles,
  FileText,
  MessageCircle,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { cn, getWhatsAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import { AiMessageGeneratorContent } from "@/components/messaging/AiMessageGeneratorModal";

interface WhatsAppBroadcastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomGroup {
  id: string;
  name: string;
  link: string;
  createdAt?: string;
}

const getGatewayUrl = () => {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:3001";
  }
  return "/api";
};

const TEMPLATE_PRESETS = [
  {
    id: "morning",
    label: "מסדר בוקר",
    text: "בוקר טוב לכולם, נא להשלים דיווחי נוכחות למסדר בוקר בהקדם. יום מוצלח!",
  },
  {
    id: "reminder",
    label: "תזכורת דיווח",
    text: "תזכורת: מי שטרם עדכן סטטוס נוכחות להיום, מתבקש לעדכן במערכת כעת.",
  },
  {
    id: "briefing",
    label: "תדריך מבצעי",
    text: "שימו לב: תדריך יחידתי יתקיים בשעה 09:00. נוכחות חובה לכל בעלי התפקידים.",
  },
  {
    id: "event",
    label: "אירוע יחידתי",
    text: "שלום לכולם, תזכורת לגבי האירוע היחידתי שיתקיים היום. נשמח לראותכם!",
  },
];

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuthContext();
  const { employees: rawEmployees, structure, loading, fetchEmployees, getStructure } = useEmployees();
  const employees = useMemo(() => (Array.isArray(rawEmployees) ? rawEmployees : []), [rawEmployees]);
  
  const [targetType, setTargetType] = useState<"employees" | "groups">("employees");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"team" | "section" | "department">("team");
  
  // WhatsApp Gateway Status
  const [gatewayStatus, setGatewayStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [autoSendProgress, setAutoSendProgress] = useState({ sent: 0, total: 0 });

  // Inline AI Generator View State
  const [showAiView, setShowAiView] = useState(false);

  // Storage key matching WhatsAppBroadcastTab.tsx
  const customGroupsStorageKey = useMemo(() => {
    return `pikud360_custom_whatsapp_groups_${user?.id || user?.username || "default"}`;
  }, [user?.id, user?.username]);

  // Custom Groups & Unit Group Links
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [unitGroupLinks, setUnitGroupLinks] = useState<Record<string, string>>({});

  // Add/Edit Custom Group Modal State
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLink, setNewGroupLink] = useState("");

  // Wizard States: 1 = Target, 2 = Message, 3 = Sending
  const [step, setStep] = useState<1 | 2>(1);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [currentSendIndex, setCurrentSendIndex] = useState(0);

  // Check Gateway Connection Status
  const checkGatewayStatus = useCallback(async () => {
    try {
      const gwUrl = getGatewayUrl();
      const endpoint = gwUrl.endsWith("/api") ? `${gwUrl}/whatsapp/status` : `${gwUrl}/api/whatsapp/status`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data.status === "connected" ? "connected" : "disconnected");
      } else {
        setGatewayStatus("disconnected");
      }
    } catch {
      setGatewayStatus("disconnected");
    }
  }, []);

  // Load stored custom groups & gateway status when modal opens
  const loadStoredGroups = useCallback(() => {
    try {
      let savedCustom = localStorage.getItem(customGroupsStorageKey);
      if (!savedCustom) {
        savedCustom =
          localStorage.getItem("pikud360_custom_whatsapp_groups_default") ||
          localStorage.getItem("pikud360_whatsapp_custom_groups");
      }
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (Array.isArray(parsed)) {
          setCustomGroups(parsed);
        }
      } else {
        setCustomGroups([]);
      }

      const savedUnitLinks = localStorage.getItem("pikud360_whatsapp_group_links");
      if (savedUnitLinks) {
        setUnitGroupLinks(JSON.parse(savedUnitLinks));
      }
    } catch (e) {
      console.error("Failed to load whatsapp groups in modal", e);
    }
  }, [customGroupsStorageKey]);

  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (getStructure) getStructure();
      loadStoredGroups();
      checkGatewayStatus();
      setBroadcastMode(false);
      setShowAiView(false);
      setIsAutoSending(false);
      setCurrentSendIndex(0);
      setStep(1);
    }
  }, [open, fetchEmployees, getStructure, loadStoredGroups, checkGatewayStatus]);

  // Save/Persist Custom Groups to LocalStorage
  const saveCustomGroups = (groups: CustomGroup[]) => {
    setCustomGroups(groups);
    try {
      localStorage.setItem(customGroupsStorageKey, JSON.stringify(groups));
      localStorage.setItem("pikud360_whatsapp_custom_groups", JSON.stringify(groups));
    } catch (e) {
      console.error("Failed to save custom whatsapp groups", e);
    }
  };

  const handleSaveGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("יש להזין שם קבוצה");
      return;
    }

    if (editingGroup) {
      const updated = customGroups.map((g) =>
        g.id === editingGroup.id
          ? { ...g, name: newGroupName.trim(), link: newGroupLink.trim() }
          : g
      );
      saveCustomGroups(updated);
      toast.success("קבוצת הוואטסאפ עודכנה בהצלחה");
    } else {
      const newGrp: CustomGroup = {
        id: `custom_${Date.now()}`,
        name: newGroupName.trim(),
        link: newGroupLink.trim(),
        createdAt: new Date().toISOString(),
      };
      saveCustomGroups([...customGroups, newGrp]);
      toast.success("קבוצה חדשה נוצרה בהצלחה");
    }

    setShowAddGroupModal(false);
    setEditingGroup(null);
    setNewGroupName("");
    setNewGroupLink("");
  };

  const handleDeleteGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customGroups.filter((g) => g.id !== id);
    saveCustomGroups(updated);
    const nextSelected = new Set(selectedGroupIds);
    nextSelected.delete(id);
    setSelectedGroupIds(nextSelected);
    toast.success("הקבוצה הוסרה בהצלחה");
  };

  const handleOpenEditGroup = (group: CustomGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupLink(group.link || "");
    setShowAddGroupModal(true);
  };

  // Reset employee selection when loaded
  useEffect(() => {
    if (employees.length > 0) {
      const validIds = employees
        .filter((e) => !!e.phone_number)
        .map((e) => e.id);
      setSelectedIds(new Set(validIds));
    }
  }, [employees]);

  // Combine Unit Groups (Departments / Sections / Teams) with Custom Groups
  const allGroups = useMemo(() => {
    const list: Array<{ id: string; name: string; link: string; type: "custom" | "unit" }> = [];

    customGroups.forEach((cg) => {
      list.push({
        id: cg.id,
        name: cg.name,
        link: cg.link,
        type: "custom",
      });
    });

    if (Array.isArray(structure)) {
      structure.forEach((dept) => {
        const link = unitGroupLinks[`department_${dept.id}`] || "";
        list.push({
          id: `unit_dept_${dept.id}`,
          name: `מחלקת ${dept.name}`,
          link,
          type: "unit",
        });

        if (Array.isArray(dept.sections)) {
          dept.sections.forEach((sec) => {
            const secLink = unitGroupLinks[`section_${sec.id}`] || "";
            list.push({
              id: `unit_sec_${sec.id}`,
              name: `מדור ${sec.name}`,
              link: secLink,
              type: "unit",
            });

            if (Array.isArray(sec.teams)) {
              sec.teams.forEach((team) => {
                const teamLink = unitGroupLinks[`team_${team.id}`] || "";
                list.push({
                  id: `unit_team_${team.id}`,
                  name: `צוות ${team.name}`,
                  link: teamLink,
                  type: "unit",
                });
              });
            }
          });
        }
      });
    }

    return list;
  }, [customGroups, structure, unitGroupLinks]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.first_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(search.toLowerCase()) ||
        (emp.phone_number && emp.phone_number.includes(search));
      return matchesSearch;
    });
  }, [employees, search]);

  const filteredGroups = useMemo(() => {
    return allGroups.filter((grp) =>
      grp.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [allGroups, search]);

  const selectedEmployeesList = useMemo(() => {
    return employees.filter((e) => selectedIds.has(e.id) && !!e.phone_number);
  }, [employees, selectedIds]);

  const selectedGroupsList = useMemo(() => {
    return allGroups.filter((g) => selectedGroupIds.has(g.id));
  }, [allGroups, selectedGroupIds]);

  const toggleSelectEmployee = (id: number) => {
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

  const toggleSelectGroup = (id: string) => {
    const next = new Set(selectedGroupIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGroupIds(next);
  };

  const toggleSelectAllEmployees = () => {
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

  const toggleSelectAllGroups = () => {
    if (selectedGroupIds.size >= allGroups.length && allGroups.length > 0) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(allGroups.map((g) => g.id)));
    }
  };

  const handleCopyNumbers = () => {
    if (targetType === "employees") {
      const numbers = selectedEmployeesList.map((e) => e.phone_number).join(",");
      if (!numbers) {
        toast.error("לא נבחרו נמענים עם מספר טלפון");
        return;
      }
      navigator.clipboard.writeText(numbers);
      toast.success(`${selectedEmployeesList.length} מספרים הועתקו ללוח`);
    } else {
      const links = selectedGroupsList.map((g) => g.link).filter(Boolean).join("\n");
      if (!links) {
        toast.error("לא נבחרו קבוצות עם קישור תקין");
        return;
      }
      navigator.clipboard.writeText(links);
      toast.success(`${selectedGroupsList.length} קישורי קבוצות הועתקו ללוח`);
    }
  };

  // Start Sending (Automatic WhatsApp Gateway vs Manual Loop)
  const handleStartBroadcast = async () => {
    if (targetType === "employees" && selectedEmployeesList.length === 0) {
      toast.error("יש לבחור לפחות נמען אחד");
      return;
    }
    if (targetType === "groups" && selectedGroupsList.length === 0) {
      toast.error("יש לבחור לפחות קבוצה אחת");
      return;
    }

    if (!message.trim()) {
      toast.error("יש להקליד תוכן להודעה");
      return;
    }

    // 🌟 AUTOMATIC WHATSAPP GATEWAY SENDING (If WhatsApp service is connected!)
    if (gatewayStatus === "connected") {
      setIsAutoSending(true);

      try {
        if (targetType === "employees") {
          const targets = selectedEmployeesList.map((e) => e.phone_number!).filter(Boolean);
          setAutoSendProgress({ sent: 0, total: targets.length });

          const gwUrl = getGatewayUrl();
          const endpoint = gwUrl.endsWith("/api") ? `${gwUrl}/whatsapp/broadcast` : `${gwUrl}/api/whatsapp/broadcast`;

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targets, message: message.trim(), delayMs: 400 }),
          });
          const data = await res.json();

          if (data.success) {
            toast.success(`נשלחו בהצלחה ${data.results?.sent || targets.length} הודעות באופן אוטומטי! 🚀`);
            onOpenChange(false);
          } else {
            toast.error(`שגיאה בשידור האוטומטי: ${data.error || "נסה שנית"}`);
          }
        } else {
          // Automatic sending to WhatsApp Groups
          let sentCount = 0;
          const totalGroups = selectedGroupsList.length;
          setAutoSendProgress({ sent: 0, total: totalGroups });

          const gwUrl = getGatewayUrl();
          const endpoint = gwUrl.endsWith("/api") ? `${gwUrl}/whatsapp/send` : `${gwUrl}/api/whatsapp/send`;

          for (let i = 0; i < selectedGroupsList.length; i++) {
            const group = selectedGroupsList[i];
            if (group.link) {
              try {
                const res = await fetch(endpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ target: group.link, message: message.trim() }),
                });
                const data = await res.json();
                if (data.success) sentCount++;
              } catch (e) {
                console.error("Failed auto send to group", group.name, e);
              }
            }
            setAutoSendProgress({ sent: i + 1, total: totalGroups });
          }

          toast.success(`ההודעה נשלחה באופן אוטומטי ל-${sentCount} קבוצות וואטסאפ! 🚀`);
          onOpenChange(false);
        }
      } catch (err) {
        toast.error("שגיאה בתקשורת עם שרת הוואטסאפ האוטומטי");
      } finally {
        setIsAutoSending(false);
      }
      return;
    }

    // Fallback: If gateway is disconnected, perform direct group opening or interactive send
    if (targetType === "groups") {
      let openedCount = 0;
      selectedGroupsList.forEach((group, index) => {
        if (group.link) {
          if (index === 0) {
            const win = window.open(group.link, "_blank");
            if (!win || win.closed || typeof win.closed === "undefined") {
              window.location.href = group.link;
            }
          } else {
            setTimeout(() => {
              window.open(group.link, "_blank");
            }, index * 400);
          }
          openedCount++;
        }
      });

      if (openedCount > 0) {
        toast.info(`הוואטסאפ אינו מחובר בסריקת QR. נפתחו ${openedCount} קבוצות בדפדפן. לסריקת קוד QR ושליחה אוטומטית לחץ על כפתור ה-QR 📱`);
      } else {
        toast.warning("הקבוצות שנבחרו אינן כוללות קישור וואטסאפ מוגדר");
      }
      onOpenChange(false);
      return;
    }

    if (selectedEmployeesList.length === 1) {
      const emp = selectedEmployeesList[0];
      const waUrl = getWhatsAppUrl(emp.phone_number, message);
      toast.success("טוען צ'אט לוואטסאפ...", { duration: 1500 });
      const win = window.open(waUrl, "_blank");
      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = waUrl;
      }
      onOpenChange(false);
      return;
    }

    setBroadcastMode(true);
    setCurrentSendIndex(0);
  };

  const handleSendNext = () => {
    if (currentSendIndex >= selectedEmployeesList.length) return;

    const emp = selectedEmployeesList[currentSendIndex];
    if (emp && emp.phone_number) {
      const waUrl = getWhatsAppUrl(emp.phone_number, message);
      const win = window.open(waUrl, "_blank");
      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = waUrl;
      }
    }

    if (currentSendIndex < selectedEmployeesList.length - 1) {
      setCurrentSendIndex((prev) => prev + 1);
    } else {
      toast.success("כל ההודעות בסבב נשלחו בהצלחה!");
      setBroadcastMode(false);
      setStep(1);
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(val) => {
          if (!val) {
            setBroadcastMode(false);
            setShowAiView(false);
            setIsAutoSending(false);
            setStep(1);
          }
          onOpenChange(val);
        }}
      >
        <DialogContent
          className={cn(
            "p-0 border-none sm:border sm:border-border/40 bg-background flex flex-col overflow-hidden transition-all duration-300 w-full sm:w-auto rounded-t-[2.2rem] rounded-b-none sm:rounded-3xl max-h-[94dvh]",
            showAiView
              ? "sm:max-w-5xl lg:max-w-6xl sm:h-[80vh] sm:max-h-[760px] p-2 sm:p-3"
              : "sm:max-w-4xl lg:max-w-5xl sm:h-auto sm:max-h-[85vh]"
          )}
          dir="rtl"
        >
          <DialogDragHandle />
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border/40 bg-muted/20 relative shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                  <MessageSquare className="w-5.5 h-5.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg sm:text-xl font-black tracking-tight truncate">
                      רשימת תפוצה בוואטסאפ
                    </DialogTitle>
                    {/* Live Automatic Gateway Connection Badge */}
                    {gatewayStatus === "connected" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0">
                        <Zap className="w-3 h-3 fill-green-600 animate-pulse" />
                        שליחה אוטומטית פעילה
                      </span>
                    )}
                  </div>
                  <DialogDescription className="sr-only">
                    שליחת הודעות תפוצה בוואטסאפ לעובדים ולקבוצות
                  </DialogDescription>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          step === 1 && !showAiView ? "bg-primary w-4" : "bg-primary/20",
                          broadcastMode && "bg-green-500 w-4",
                        )}
                      />
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          (step === 2 || showAiView) && !broadcastMode
                            ? "bg-primary w-4"
                            : "bg-primary/20",
                        )}
                      />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground/80 truncate">
                      {broadcastMode
                        ? "שליחה רציפה"
                        : showAiView
                          ? "מחולל הודעות AI"
                          : step === 1
                            ? "בחירת נמענים / קבוצות"
                            : "ניסוח הודעה"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 pt-2 space-y-3.5 overflow-hidden overflow-y-auto custom-scrollbar relative">
            
            {/* Automatic Sending Progress Overlay */}
            {isAutoSending ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-muted/5 rounded-3xl border border-border/20">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto relative z-10">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                  </div>
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse z-0" />
                </div>

                <div>
                  <h3 className="text-xl font-black mb-1">שולח הודעות באופן אוטומטי...</h3>
                  <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                    שרת הוואטסאפ משדר כעת את ההודעה ישירות לנמענים שנבחרו ברקע.
                  </p>
                </div>

                {autoSendProgress.total > 0 && (
                  <div className="w-full max-w-xs bg-muted/30 border border-border/40 p-3 rounded-2xl text-center">
                    <p className="text-xs font-black text-primary tabular-nums">
                      מעבד {autoSendProgress.sent} מתוך {autoSendProgress.total} נמענים
                    </p>
                  </div>
                )}
              </div>
            ) : showAiView ? (
              /* INLINE AI GENERATOR VIEW */
              <AiMessageGeneratorContent
                onApplyMessage={(_title, body) => {
                  setMessage(body);
                  setShowAiView(false);
                  toast.success("תוכן ההודעה שנוצר ב-AI הועבר בהצלחה!");
                }}
                onCancel={() => setShowAiView(false)}
                showBackButton={true}
              />
            ) : (
              <>
                {/* STEP 1: Target Selection */}
                {step === 1 && !broadcastMode && (
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    
                    {/* Target Type Selector: Employees vs WhatsApp Groups */}
                    <div className="grid grid-cols-2 gap-1.5 bg-muted/30 p-1 rounded-2xl border border-border/40 shrink-0">
                      <button
                        type="button"
                        onClick={() => setTargetType("employees")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer",
                          targetType === "employees"
                            ? "bg-background text-primary shadow-xs border border-border/40"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Users className="w-4 h-4" />
                        <span>עובדים / אנשי קשר ({employees.filter((e) => !!e.phone_number).length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetType("groups")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer",
                          targetType === "groups"
                            ? "bg-background text-green-600 shadow-xs border border-border/40"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span>קבוצות וואטסאפ ({allGroups.length})</span>
                      </button>
                    </div>

                    {/* Subordinate Scope selection if multi-level */}
                    {targetType === "employees" &&
                      (user.commands_team_id ? 1 : 0) +
                        (user.commands_section_id ? 1 : 0) +
                        (user.commands_department_id ? 1 : 0) >
                        1 && (
                        <div className="flex gap-2 justify-center shrink-0 bg-muted/20 p-1.5 rounded-2xl border border-border/40">
                          {user.commands_team_id && (
                            <Button
                              variant={scope === "team" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setScope("team")}
                              className="rounded-xl h-8 font-black text-xs px-3 transition-all flex-1"
                            >
                              חוליה
                            </Button>
                          )}
                          {user.commands_section_id && (
                            <Button
                              variant={scope === "section" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setScope("section")}
                              className="rounded-xl h-8 font-black text-xs px-3 transition-all flex-1"
                            >
                              מדור
                            </Button>
                          )}
                          {user.commands_department_id && (
                            <Button
                              variant={scope === "department" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setScope("department")}
                              className="rounded-xl h-8 font-black text-xs px-3 transition-all flex-1"
                            >
                              מחלקה
                            </Button>
                          )}
                        </div>
                      )}

                    {/* Add Custom Group button when in groups mode */}
                    {targetType === "groups" && (
                      <div className="flex items-center justify-between shrink-0 bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-black text-foreground">קבוצות מותאמות אישית ({customGroups.length})</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingGroup(null);
                            setNewGroupName("");
                            setNewGroupLink("");
                            setShowAddGroupModal(true);
                          }}
                          className="h-8 px-3 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>קבוצה חדשה</span>
                        </Button>
                      </div>
                    )}

                    {/* Counter & Select All */}
                    <div className="flex items-center justify-between shrink-0 px-1">
                      <label className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        {targetType === "employees" ? (
                          <>
                            <Users className="w-3.5 h-3.5 text-primary" /> נבחרו{" "}
                            {selectedIds.size} מתוך{" "}
                            {employees.filter((e) => !!e.phone_number).length}
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3.5 h-3.5 text-green-600" /> נבחרו{" "}
                            {selectedGroupIds.size} מתוך {allGroups.length} קבוצות
                          </>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={
                          targetType === "employees"
                            ? toggleSelectAllEmployees
                            : toggleSelectAllGroups
                        }
                        className="text-[11px] font-black text-primary hover:underline transition-all bg-primary/10 px-3 py-1 rounded-full cursor-pointer"
                      >
                        {targetType === "employees"
                          ? selectedIds.size ===
                              employees.filter((e) => !!e.phone_number).length &&
                            employees.length > 0
                            ? "בטל הכל"
                            : "בחר הכל"
                          : selectedGroupIds.size === allGroups.length &&
                              allGroups.length > 0
                            ? "בטל הכל"
                            : "בחר הכל"}
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group shrink-0">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder={
                          targetType === "employees"
                            ? "חיפוש איש קשר..."
                            : "חיפוש קבוצת וואטסאפ..."
                        }
                        className="w-full bg-muted/30 border border-border/40 rounded-xl h-11 pr-10 pl-4 text-xs font-bold outline-none focus:border-primary/50 transition-all focus:ring-4 focus:ring-primary/5"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    {/* Scrollable Items List */}
                    <div className="flex-1 border border-border/40 rounded-2xl bg-muted/10 overflow-y-auto custom-scrollbar p-2 min-h-[220px]">
                      <div className="space-y-1.5">
                        {targetType === "employees" ? (
                          loading ? (
                            <div className="p-10 text-center">
                              <span className="text-xs font-bold animate-pulse text-muted-foreground">
                                טוען עובדים...
                              </span>
                            </div>
                          ) : filteredEmployees.length === 0 ? (
                            <div className="p-10 text-center">
                              <span className="text-xs font-bold text-muted-foreground/40 italic">
                                לא נמצאו תוצאות לחיפוש
                              </span>
                            </div>
                          ) : (
                            filteredEmployees.map((emp) => (
                              <div
                                key={emp.id}
                                onClick={() => emp.phone_number && toggleSelectEmployee(emp.id)}
                                className={cn(
                                  "p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                                  selectedIds.has(emp.id)
                                    ? "bg-primary/5 border-primary/30"
                                    : "bg-card border-transparent hover:border-primary/20",
                                  !emp.phone_number &&
                                    "opacity-50 grayscale cursor-not-allowed",
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Checkbox
                                    checked={selectedIds.has(emp.id)}
                                    onCheckedChange={() =>
                                      emp.phone_number && toggleSelectEmployee(emp.id)
                                    }
                                    disabled={!emp.phone_number}
                                    className="w-5 h-5 rounded-md border-primary/50"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-black truncate leading-tight">
                                      {emp.first_name} {emp.last_name}
                                    </p>
                                    <p className="text-[11px] font-bold text-muted-foreground tabular-nums opacity-80 mt-0.5">
                                      {emp.phone_number || "ללא מספר מוזן"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )
                        ) : filteredGroups.length === 0 ? (
                          <div className="p-8 text-center space-y-2">
                            <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                            <p className="text-xs font-bold text-muted-foreground">
                              טרם הוגדרו קבוצות וואטסאפ במערכת.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingGroup(null);
                                setNewGroupName("");
                                setNewGroupLink("");
                                setShowAddGroupModal(true);
                              }}
                              className="h-8 text-xs font-black gap-1 mt-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>צור קבוצה חדשה כעת</span>
                            </Button>
                          </div>
                        ) : (
                          filteredGroups.map((group) => (
                            <div
                              key={group.id}
                              onClick={() => toggleSelectGroup(group.id)}
                              className={cn(
                                "p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                                selectedGroupIds.has(group.id)
                                  ? "bg-green-500/10 border-green-500/30"
                                  : "bg-card border-transparent hover:border-green-500/20",
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Checkbox
                                  checked={selectedGroupIds.has(group.id)}
                                  onCheckedChange={() => toggleSelectGroup(group.id)}
                                  className="w-5 h-5 rounded-md border-green-600"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-black truncate leading-tight text-foreground">
                                      {group.name}
                                    </p>
                                    {group.type === "unit" && (
                                      <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                        יחידה
                                      </span>
                                    )}
                                    {group.type === "custom" && (
                                      <span className="text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                        אישית
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-bold text-muted-foreground dir-ltr truncate">
                                    {group.link || "ללא קישור מוגדר"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {group.type === "custom" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenEditGroup(group, e)}
                                      className="p-1 text-muted-foreground hover:text-primary transition-colors rounded-md"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteGroup(group.id, e)}
                                      className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-md"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <ExternalLink className="w-4 h-4 text-green-600 shrink-0" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Write Message & Inline AI Generator Trigger */}
                {step === 2 && !broadcastMode && (
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    {/* Selected Summary + AI Generator Trigger */}
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 shrink-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                          {targetType === "employees" ? (
                            <Users className="w-4.5 h-4.5" />
                          ) : (
                            <MessageCircle className="w-4.5 h-4.5 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs leading-tight text-foreground truncate">
                            {targetType === "employees"
                              ? `הודעה ל-${selectedEmployeesList.length} נמענים`
                              : `הפצה ל-${selectedGroupsList.length} קבוצות וואטסאפ`}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground truncate">
                            {gatewayStatus === "connected"
                              ? "שליחה אוטומטית ברקע בלחיצה אחת בלבד 🚀"
                              : "ההודעה תועבר לכל נמען באופן אישי"}
                          </p>
                        </div>
                      </div>

                      {/* AI Message Generator Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAiView(true)}
                        className="h-9 px-3 font-black text-xs gap-1.5 rounded-xl border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>מחולל AI</span>
                      </Button>
                    </div>

                    {/* Preset Templates bar */}
                    <div className="space-y-1 shrink-0">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-primary" /> תבניות הודעה מהירות:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {TEMPLATE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setMessage(preset.text)}
                            className="text-[11px] font-bold bg-muted/40 hover:bg-primary/10 border border-border/40 hover:border-primary/30 rounded-xl px-2.5 py-1 text-foreground transition-all cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <Textarea
                        placeholder="הקלידו כאן את תוכן ההודעה המלא..."
                        className="flex-1 min-h-[140px] resize-none bg-muted/10 border-border/40 focus:border-green-500/50 rounded-2xl p-4 font-bold text-sm leading-relaxed w-full custom-scrollbar"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Broadcast Mode (Sending) */}
                {broadcastMode && (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 bg-muted/5 rounded-3xl border border-border/20">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto relative z-10">
                        <Send className="w-10 h-10 text-green-500 translate-x-1" />
                      </div>
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse z-0" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black mb-1">מצב שיגור הופעל</h3>
                      <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                        הודעתכם נשלחת ברצף לכלל הנמענים שנבחרו.
                        <br />
                        לחצו על "שלח להבא" כדי להעביר את ההודעה לנמען הבא בתור.
                      </p>
                    </div>

                    <div className="w-full bg-background border border-border/40 p-3 rounded-2xl text-right">
                      <p className="text-[10px] font-black uppercase text-primary/60 mb-1">
                        תצוגה מקדימה
                      </p>
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-3 rounded-xl text-xs">
                        <p className="font-medium whitespace-pre-wrap leading-relaxed">
                          {message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer - Hidden when showAiView or isAutoSending is active */}
          {!showAiView && !isAutoSending && (
            <div className="p-4 border-t border-border/40 bg-card shrink-0 relative z-20">
              {step === 1 && !broadcastMode && (
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    onClick={handleCopyNumbers}
                    disabled={
                      targetType === "employees"
                        ? selectedIds.size === 0
                        : selectedGroupIds.size === 0
                    }
                    className="font-black h-11 rounded-xl gap-1.5 border-border/60 hover:bg-background text-xs px-4 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>העתק כתובות</span>
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={
                      targetType === "employees"
                        ? selectedIds.size === 0
                        : selectedGroupIds.size === 0
                    }
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black h-11 rounded-xl gap-2 text-xs sm:text-sm transition-all active:scale-[0.98]"
                  >
                    המשך לניסוח ההודעה
                  </Button>
                </div>
              )}

              {step === 2 && !broadcastMode && (
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="font-black h-11 rounded-xl border-border/60 hover:bg-muted text-xs px-4 transition-all"
                  >
                    חזור
                  </Button>
                  <Button
                    onClick={handleStartBroadcast}
                    disabled={
                      targetType === "employees"
                        ? selectedEmployeesList.length === 0
                        : selectedGroupsList.length === 0
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black h-11 rounded-xl gap-2 text-xs sm:text-sm transition-all active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4 -scale-x-100" />
                    {gatewayStatus === "connected" ? (
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 fill-white" />
                        {targetType === "groups"
                          ? `שליחה אוטומטית ל-${selectedGroupsList.length} קבוצות`
                          : `שליחה אוטומטית ל-${selectedEmployeesList.length} נמענים`}
                      </span>
                    ) : targetType === "groups" ? (
                      `פתיחת ${selectedGroupsList.length} קבוצות בוואטסאפ`
                    ) : selectedEmployeesList.length === 1 ? (
                      "שליחה בוואטסאפ אישי"
                    ) : (
                      `התחל לשלוח ל-${selectedEmployeesList.length} נמענים`
                    )}
                  </Button>
                </div>
              )}

              {broadcastMode && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-black text-muted-foreground flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      סטטוס סבב השליחה
                    </span>
                    <span className="text-xs font-black bg-primary/10 text-primary px-2.5 py-1 rounded-xl tabular-nums">
                      נמען {currentSendIndex + 1} מתוך{" "}
                      {selectedEmployeesList.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setBroadcastMode(false)}
                      variant="outline"
                      className="h-11 rounded-xl font-bold flex-[1] text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                    >
                      עצור
                    </Button>
                    <Button
                      onClick={handleSendNext}
                      className="bg-green-600 hover:bg-green-700 text-white font-black h-11 rounded-xl flex-[2] gap-1.5 text-xs transition-all active:scale-[0.98]"
                    >
                      <Send className="w-4 h-4 fill-white -scale-x-100" />
                      הבא: {selectedEmployeesList[currentSendIndex]?.first_name}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal for Adding / Editing Custom WhatsApp Group */}
      <Dialog open={showAddGroupModal} onOpenChange={setShowAddGroupModal}>
        <DialogContent className="sm:max-w-md p-5 rounded-2xl" dir="rtl">
          <DialogTitle className="text-lg font-black">
            {editingGroup ? "עריכת קבוצת וואטסאפ" : "יצירת קבוצת וואטסאפ חדשה"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            הזן שם קבוצה וקישור הצטרפות/צ'אט של קבוצת הוואטסאפ
          </DialogDescription>

          <div className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-bold mb-1 block text-foreground">שם הקבוצה</label>
              <Input
                placeholder="rehewy / קבוצת כוננות"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-10 text-xs font-bold rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-foreground">קישור וואטסאפ (אופציונלי)</label>
              <Input
                placeholder="https://chat.whatsapp.com/..."
                value={newGroupLink}
                onChange={(e) => setNewGroupLink(e.target.value)}
                className="h-10 text-xs font-bold rounded-xl dir-ltr"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddGroupModal(false)}
              className="h-9 px-4 text-xs font-bold rounded-xl"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveGroup}
              className="h-9 px-4 text-xs font-black rounded-xl bg-green-600 hover:bg-green-700 text-white"
            >
              שמור קבוצה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
