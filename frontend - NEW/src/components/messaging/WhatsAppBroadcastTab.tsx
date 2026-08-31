import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Users,
  Copy,
  Check,
  Building2,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  ExternalLink,
  Link2,
  AlertCircle,
  X,
  User,
  QrCode,
  Wifi,
  LogOut,
  Loader2,
  Bell,
  Plus,
  Save,
  Trash2,
  Edit2,
  RotateCcw,
  Send,
  ChevronLeft,
  FileText,
} from "lucide-react";
import { AiMessageGeneratorModal } from "./AiMessageGeneratorModal";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  DepartmentNode,
  SectionNode,
  TeamNode,
  Employee,
} from "@/types/employee.types";

const getGatewayUrl = () => {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:3001";
  }
  return "/api";
};

const getEndpoint = (path: string) => {
  const base = getGatewayUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api")) {
    return cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;
  }
  return `${base}${cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`}`;
};



type OrgLevel = "department" | "section" | "team";

interface OrgTarget {
  level: OrgLevel;
  id: number;
  name: string;
}

interface GatewayStatus {
  status: "connected" | "connecting" | "disconnected";
  qr: string | null;
  user: { id: string; name: string } | null;
}

export interface CustomWhatsAppGroup {
  id: string;
  name: string;
  link: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  label: string;
  title: string;
  content: string;
  isCustom?: boolean;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "attendance_reminder",
    label: "תזכורת נוכחות",
    title: "תזכורת: דיווח נוכחות יומי",
    content:
      "שלום לכולם,\nנא לדווח נוכחות במערכת בהקדם האפשרי. שוטר שלא דיווח מתבקש לעדכן את המפקד הישיר.\nתודה והמשך יום מוצלח!",
  },
  {
    id: "operational_briefing",
    label: "עדכון מבצעי",
    title: "עדכון מבצעי והנחיות",
    content:
      "צוות יקר,\nלהלן דגשים מבצעיים חשובים לפעילות הקרובה:\n1. שמירה על ערנות וקשר רציף.\n2. וידוא ציוד ותקינות קשר.\nבהצלחה לכולם!",
  },
  {
    id: "team_meeting",
    label: "זימון לתדריך",
    title: "זימון לתדריך / פגישת יחידה",
    content:
      "שלום לכולם,\nהנכם מזומנים לתדריך יחידתי שיתקיים היום.\nנא להגיע בזמן ובמוכנות מלאה.",
  },
  {
    id: "urgent_notice",
    label: "הודעה דחופה",
    title: "הודעה דחופה ליחידה",
    content:
      "שימו לב: הנחיה מיידית לכלל השוטרים.\nנא לאשר קבלת הודעה זו מול המפקד בהקדם.",
  },
];

const cleanUnitName = (name: string): string => {
  if (!name) return "";
  return name.replace(/^(\d+\s*[-–.]\s*)/, "").trim();
};

const canCommanderEditUnit = (
  user: any,
  target: OrgTarget,
  structure: DepartmentNode[],
): boolean => {
  if (!user) return false;
  if (user.is_admin) return true;

  if (user.commands_department_id) {
    if (target.level === "department") {
      return target.id === user.commands_department_id;
    }
    const dept = structure.find((d) => d.id === user.commands_department_id);
    if (!dept) return false;
    if (target.level === "section") {
      return dept.sections?.some((s) => s.id === target.id) ?? false;
    }
    if (target.level === "team") {
      return (
        dept.sections?.some((s) => s.teams?.some((t) => t.id === target.id)) ??
        false
      );
    }
  }

  if (user.commands_section_id) {
    if (target.level === "department") return false;
    if (target.level === "section") {
      return target.id === user.commands_section_id;
    }
    if (target.level === "team") {
      for (const d of structure) {
        const sec = d.sections?.find((s) => s.id === user.commands_section_id);
        if (sec) {
          return sec.teams?.some((t) => t.id === target.id) ?? false;
        }
      }
    }
  }

  if (user.commands_team_id) {
    return target.level === "team" && target.id === user.commands_team_id;
  }

  return false;
};

export const WhatsAppBroadcastTab: React.FC = () => {
  const { structure, employees } = useEmployeeContext();
  const { user } = useAuthContext();

  // Mobile Picker Modal
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);

  // WhatsApp Server Gateway state
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({
    status: "disconnected",
    qr: null,
    user: null,
  });
  const [showQrModal, setShowQrModal] = useState(false);
  const [autoSending, setAutoSending] = useState(false);

  // Commander Templates Storage
  const templateStorageKey = useMemo(() => {
    return `pikud360_custom_templates_${user?.id || user?.username || "commander"}`;
  }, [user?.id, user?.username]);

  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    try {
      const key = `pikud360_custom_templates_${user?.id || user?.username || "commander"}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TEMPLATES;
  });

  // Reload user-specific templates whenever user changes/loads
  useEffect(() => {
    if (templateStorageKey) {
      try {
        const saved = localStorage.getItem(templateStorageKey);
        if (saved) {
          setTemplates(JSON.parse(saved));
        } else {
          setTemplates(DEFAULT_TEMPLATES);
        }
      } catch {}
    }
  }, [templateStorageKey]);

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState("");
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  // Edit Template State
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplate | null>(null);
  const [editTemplateLabel, setEditTemplateLabel] = useState("");
  const [editTemplateTitle, setEditTemplateTitle] = useState("");
  const [editTemplateContent, setEditTemplateContent] = useState("");

  const persistTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(templateStorageKey, JSON.stringify(newTemplates));
  };

  // Tree Expansion state
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(),
  );
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());

  // Target Selections
  const [selectedTargets, setSelectedTargets] = useState<OrgTarget[]>([]);
  const [selectedIndividuals, setSelectedIndividuals] = useState<Set<number>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Message Content
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // WhatsApp Group Links storage
  const [groupLinks, setGroupLinks] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("pikud360_whatsapp_group_links");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingGroupTarget, setEditingGroupTarget] =
    useState<OrgTarget | null>(null);
  const [tempGroupLink, setTempGroupLink] = useState("");

  // Custom WhatsApp Groups state
  const customGroupsStorageKey = useMemo(() => {
    return `pikud360_custom_whatsapp_groups_${user?.id || user?.username || "default"}`;
  }, [user?.id, user?.username]);

  const [customGroups, setCustomGroups] = useState<CustomWhatsAppGroup[]>(
    () => {
      try {
        const key = `pikud360_custom_whatsapp_groups_${user?.id || user?.username || "default"}`;
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
      } catch {}
      return [];
    },
  );

  useEffect(() => {
    if (customGroupsStorageKey) {
      try {
        const saved = localStorage.getItem(customGroupsStorageKey);
        if (saved) setCustomGroups(JSON.parse(saved));
        else setCustomGroups([]);
      } catch {}
    }
  }, [customGroupsStorageKey]);

  const persistCustomGroups = (groups: CustomWhatsAppGroup[]) => {
    setCustomGroups(groups);
    localStorage.setItem(customGroupsStorageKey, JSON.stringify(groups));
  };

  const [selectedCustomGroupIds, setSelectedCustomGroupIds] = useState<
    Set<string>
  >(new Set());
  const [showCustomGroupModal, setShowCustomGroupModal] = useState(false);
  const [editingCustomGroup, setEditingCustomGroup] =
    useState<CustomWhatsAppGroup | null>(null);
  const [customGroupName, setCustomGroupName] = useState("");
  const [customGroupLink, setCustomGroupLink] = useState("");

  // Individual Sent tracking
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});
  const [sendingInternal, setSendingInternal] = useState(false);

  // Active Sending Mode
  const [sendMode, setSendMode] = useState<"group" | "individual">("group");

  // Fetch Gateway Status
  const fetchGatewayStatus = useCallback(async () => {
    try {
      const res = await fetch(getEndpoint("/api/whatsapp/status"));
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus((prev) => {
          if (prev.status !== "connected" && data.status === "connected") {
            toast.success(`וואטסאפ חובר בהצלחה (${data.user?.id || ""})`);
            setShowQrModal(false);
          }
          return data;
        });
      }
    } catch {
      setGatewayStatus({ status: "disconnected", qr: null, user: null });
    }
  }, []);

  useEffect(() => {
    fetchGatewayStatus();
    const interval = setInterval(fetchGatewayStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchGatewayStatus]);

  const handleGatewayLogout = async () => {
    try {
      await fetch(getEndpoint("/api/whatsapp/logout"), { method: "POST" });
      toast.info("הוואטסאפ נותק מהשרת");
      fetchGatewayStatus();
    } catch {
      toast.error("שגיאה בניתוק וואטסאפ");
    }
  };

  useEffect(() => {
    if (structure && structure.length > 0 && expandedDepts.size === 0) {
      setExpandedDepts(new Set(structure.map((d) => d.id)));
    }
  }, [structure]);

  const saveGroupLink = (key: string, link: string) => {
    const updated = { ...groupLinks, [key]: link.trim() };
    setGroupLinks(updated);
    localStorage.setItem(
      "pikud360_whatsapp_group_links",
      JSON.stringify(updated),
    );
    setEditingGroupTarget(null);
    toast.success("קישור קבוצת הוואטסאפ עודכן ונשמר בהצלחה");
  };

  const handleOpenEditGroupLink = (target: OrgTarget) => {
    const canEdit = canCommanderEditUnit(user, target, structure);
    if (!canEdit) {
      toast.error("אין לך הרשאת פיקוד לעריכת קישור קבוצה זו");
      return;
    }
    const key = `${target.level}_${target.id}`;
    setEditingGroupTarget(target);
    setTempGroupLink(groupLinks[key] || "");
  };

  const filteredStructure = useMemo(() => {
    if (!searchQuery.trim()) return structure;
    const q = searchQuery.toLowerCase().trim();
    return structure
      .map((dept) => ({
        ...dept,
        sections: (dept.sections || [])
          .map((sec) => ({
            ...sec,
            teams: (sec.teams || []).filter((team) =>
              cleanUnitName(team.name).toLowerCase().includes(q),
            ),
          }))
          .filter(
            (sec) =>
              cleanUnitName(sec.name).toLowerCase().includes(q) ||
              sec.teams.length > 0,
          ),
      }))
      .filter(
        (dept) =>
          cleanUnitName(dept.name).toLowerCase().includes(q) ||
          dept.sections.length > 0,
      );
  }, [structure, searchQuery]);

  const safeEmployees = useMemo(
    () => (Array.isArray(employees) ? employees : []),
    [employees],
  );

  const resolvedRecipients = useMemo(() => {
    const ids = new Set<number>();

    for (const target of selectedTargets) {
      const matching = safeEmployees.filter((emp) => {
        if (!emp.is_active) return false;
        if (target.level === "department")
          return emp.department_id === target.id;
        if (target.level === "section") return emp.section_id === target.id;
        if (target.level === "team") return emp.team_id === target.id;
        return false;
      });
      matching.forEach((e) => ids.add(e.id));
    }

    selectedIndividuals.forEach((id) => {
      const emp = safeEmployees.find((e) => e.id === id);
      if (emp && emp.is_active) {
        ids.add(id);
      }
    });

    return Array.from(ids);
  }, [selectedTargets, selectedIndividuals, safeEmployees]);

  const recipientEmployees = useMemo(
    () => safeEmployees.filter((e) => resolvedRecipients.includes(e.id)),
    [safeEmployees, resolvedRecipients],
  );

  const isTargetSelected = (level: OrgLevel, id: number) =>
    selectedTargets.some((t) => t.level === level && t.id === id);

  const isIndividualSelected = (id: number) => selectedIndividuals.has(id);

  const toggleDeptExpand = (id: number) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSectionExpand = (id: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTeamExpand = (id: number) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTarget = (target: OrgTarget) => {
    setSelectedTargets((prev) => {
      const exists = prev.some(
        (t) => t.level === target.level && t.id === target.id,
      );

      if (exists) {
        let toRemove: { level: OrgLevel; id: number }[] = [target];
        if (target.level === "department") {
          const dept = structure.find((d) => d.id === target.id);
          if (dept) {
            dept.sections?.forEach((sec) => {
              toRemove.push({ level: "section", id: sec.id });
              sec.teams?.forEach((team) => {
                toRemove.push({ level: "team", id: team.id });
              });
            });
          }
        } else if (target.level === "section") {
          for (const d of structure) {
            const s = d.sections?.find((sec) => sec.id === target.id);
            if (s) {
              s.teams?.forEach((team) =>
                toRemove.push({ level: "team", id: team.id }),
              );
              toRemove.push({ level: "department", id: d.id });
              break;
            }
          }
        }
        return prev.filter(
          (t) => !toRemove.some((r) => r.level === t.level && r.id === t.id),
        );
      } else {
        let toAdd: OrgTarget[] = [target];
        if (target.level === "department") {
          const dept = structure.find((d) => d.id === target.id);
          if (dept) {
            dept.sections?.forEach((sec) => {
              toAdd.push({ level: "section", id: sec.id, name: sec.name });
              sec.teams?.forEach((team) => {
                toAdd.push({ level: "team", id: team.id, name: team.name });
              });
            });
          }
        } else if (target.level === "section") {
          for (const d of structure) {
            const s = d.sections?.find((sec) => sec.id === target.id);
            if (s) {
              s.teams?.forEach((team) =>
                toAdd.push({ level: "team", id: team.id, name: team.name }),
              );
              break;
            }
          }
        }
        const updated = [...prev];
        toAdd.forEach((item) => {
          if (
            !updated.some((t) => t.level === item.level && t.id === item.id)
          ) {
            updated.push(item);
          }
        });
        return updated;
      }
    });
  };

  const toggleIndividual = (id: number) => {
    setSelectedIndividuals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOrganization = () => {
    const allTargets: OrgTarget[] = [];
    structure.forEach((d) => {
      allTargets.push({ level: "department", id: d.id, name: d.name });
      d.sections?.forEach((s) => {
        allTargets.push({ level: "section", id: s.id, name: s.name });
        s.teams?.forEach((t) => {
          allTargets.push({ level: "team", id: t.id, name: t.name });
        });
      });
    });
    setSelectedTargets(allTargets);
  };

  const clearSelection = () => {
    setSelectedTargets([]);
    setSelectedIndividuals(new Set());
    setSelectedCustomGroupIds(new Set());
  };

  const handleOpenCreateCustomGroupModal = () => {
    setEditingCustomGroup(null);
    setCustomGroupName("");
    setCustomGroupLink("");
    setShowCustomGroupModal(true);
  };

  const handleOpenEditCustomGroupModal = (group: CustomWhatsAppGroup) => {
    setEditingCustomGroup(group);
    setCustomGroupName(group.name);
    setCustomGroupLink(group.link || "");
    setShowCustomGroupModal(true);
  };

  const handleSaveCustomGroup = () => {
    if (!customGroupName.trim()) {
      toast.error("נא להזין שם לקבוצה");
      return;
    }
    if (!customGroupLink.trim()) {
      toast.error("נא להזין קישור לקבוצת הוואטסאפ");
      return;
    }

    if (editingCustomGroup) {
      const updated = customGroups.map((g) => {
        if (g.id === editingCustomGroup.id) {
          return {
            ...g,
            name: customGroupName.trim(),
            link: customGroupLink.trim(),
          };
        }
        return g;
      });
      persistCustomGroups(updated);
      toast.success(`הקבוצה '${customGroupName.trim()}' עודכנה בהצלחה`);
    } else {
      const newGroup: CustomWhatsAppGroup = {
        id: `custom_grp_${Date.now()}`,
        name: customGroupName.trim(),
        link: customGroupLink.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...customGroups, newGroup];
      persistCustomGroups(updated);
      setSelectedCustomGroupIds((prev) => new Set(prev).add(newGroup.id));
      toast.success(`הקבוצה '${newGroup.name}' נוצרה ונבחרה בהצלחה`);
    }

    setShowCustomGroupModal(false);
  };

  const handleDeleteCustomGroup = (id: string, name: string) => {
    const updated = customGroups.filter((g) => g.id !== id);
    persistCustomGroups(updated);
    setSelectedCustomGroupIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success(`הקבוצה '${name}' נמחקה`);
  };

  const toggleCustomGroup = (id: string) => {
    setSelectedCustomGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAutoSendToCustomGroup = async (group: CustomWhatsAppGroup) => {
    if (!messageBody.trim()) {
      toast.error("יש להזין תוכן להודעה");
      return;
    }

    if (!group.link) {
      handleOpenEditCustomGroupModal(group);
      toast.info(`אנא הגדר קישור לקבוצת ${group.name}`);
      return;
    }

    const fullText = getFullFormattedMessage();

    if (gatewayStatus.status === "connected") {
      setAutoSending(true);
      try {
        const res = await fetch(getEndpoint("/api/whatsapp/send"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: group.link, message: fullText }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`ההודעה נשלחה בהצלחה לקבוצת ${group.name}`);
          return;
        }
      } catch (err) {
        console.error("Gateway group send error:", err);
      } finally {
        setAutoSending(false);
      }
    }

    await copyToClipboardSafe(fullText);
    toast.info(`וואטסאפ אינו מחובר בסריקת QR. פותח את קבוצת ${group.name} בדפדפן...`, {
      duration: 4000,
    });
    const win = window.open(group.link, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = group.link;
    }
  };

  const formatIsraeliPhone = (phone: string | null | undefined): string => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (!clean) return "";
    if (clean.startsWith("972")) return clean;
    if (clean.startsWith("0")) return "972" + clean.substring(1);
    return "972" + clean;
  };

  const getFullFormattedMessage = (employeeName?: string) => {
    let msg = "";
    if (employeeName) {
      msg += `שלום ${employeeName},\n\n`;
    }
    if (messageTitle.trim()) {
      msg += `*${messageTitle.trim()}*\n\n`;
    }
    msg += messageBody.trim();
    return msg;
  };

  const copyToClipboardSafe = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      textArea.remove();
      return successful;
    } catch {
      return false;
    }
  };

  const handleSendBroadcastToGroup = async (
    target: OrgTarget,
    link: string,
  ) => {
    if (!messageBody.trim()) {
      toast.error("יש להזין תוכן להודעה");
      return;
    }

    if (gatewayStatus.status !== "connected") {
      setShowQrModal(true);
      toast.info("יש לחבר את הוואטסאפ בסריקת QR לשליחה ישירה");
      return;
    }

    setAutoSending(true);
    try {
      const fullText = getFullFormattedMessage();
      const res = await fetch(getEndpoint("/api/whatsapp/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: link, message: fullText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`ההודעה נשלחה בהצלחה לקבוצת ${target.name}`);
      } else {
        toast.error(`שגיאה בשליחה: ${data.error || "נסה שנית"}`);
      }
    } catch {
      toast.error("שגיאה בהתקשרות עם שרת הוואטסאפ");
    } finally {
      setAutoSending(false);
    }
  };

  const handleAutoBroadcastToAll = async () => {
    if (!messageBody.trim()) {
      toast.error("יש להזין תוכן להודעה");
      return;
    }

    const validOfficers = recipientEmployees.filter((e) =>
      Boolean(e.phone_number),
    );
    if (validOfficers.length === 0) {
      toast.error("לא נמצאו שוטרים עם מספרי טלפון תקינים");
      return;
    }

    if (gatewayStatus.status !== "connected") {
      setShowQrModal(true);
      toast.info("יש לחבר את הוואטסאפ בסריקת QR לשליחה ישירה");
      return;
    }

    setAutoSending(true);
    try {
      const fullText = getFullFormattedMessage();
      const targets = validOfficers.map((e) => e.phone_number!);

      const res = await fetch(getEndpoint("/api/whatsapp/broadcast"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets, message: fullText, delayMs: 400 }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(
          `נשלחו בהצלחה ${data.results.sent} מתוך ${data.results.total} הודעות`,
        );
        const newSentMap: Record<number, boolean> = {};
        validOfficers.forEach((e) => {
          newSentMap[e.id] = true;
        });
        setSentMap((prev) => ({ ...prev, ...newSentMap }));
      } else {
        toast.error(data.error || "שגיאה בשידור ההודעות");
      }
    } catch {
      toast.error("שגיאה בהתקשרות עם שרת הוואטסאפ");
    } finally {
      setAutoSending(false);
    }
  };

  const handleOpenGroupWhatsApp = async (target: OrgTarget) => {
    if (!messageBody.trim()) {
      toast.error("יש להזין תוכן להודעה");
      return;
    }
    const key = `${target.level}_${target.id}`;
    const link = groupLinks[key];

    if (!link) {
      handleOpenEditGroupLink(target);
      toast.info(`אנא הגדר קישור לקבוצת הוואטסאפ של ${target.name}`);
      return;
    }

    const fullText = getFullFormattedMessage();

    if (gatewayStatus.status === "connected") {
      setAutoSending(true);
      try {
        const res = await fetch(getEndpoint("/api/whatsapp/send"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: link, message: fullText }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`ההודעה נשלחה בהצלחה לקבוצת ${target.name}`);
          return;
        }
      } catch (err) {
        console.error("Gateway group send error:", err);
      } finally {
        setAutoSending(false);
      }
    }

    await copyToClipboardSafe(fullText);

    toast.info(`וואטסאפ אינו מחובר בסריקת QR. פותח את קבוצת ${target.name} בדפדפן...`, {
      duration: 4000,
    });

    const win = window.open(link, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = link;
    }
  };

  const handleDirectWhatsAppShare = () => {
    if (!messageBody.trim()) {
      toast.error("אין תוכן הודעה לשיתוף");
      return;
    }
    const fullText = getFullFormattedMessage();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    const win = window.open(url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = url;
    }
  };

  const handleOpenIndividualWhatsApp = async (emp: Employee) => {
    if (!messageBody.trim()) {
      toast.error("יש להזין תוכן להודעה");
      return;
    }
    const phone = formatIsraeliPhone(emp.phone_number);
    if (!phone) {
      toast.error(
        `לשוטר ${emp.first_name} ${emp.last_name} לא מוגדר מספר טלפון`,
      );
      return;
    }

    const empName = emp.dominant_name || `${emp.first_name} ${emp.last_name}`;
    const fullText = getFullFormattedMessage(empName);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(fullText)}`;

    const win = window.open(url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = url;
    }
    setSentMap((prev) => ({ ...prev, [emp.id]: true }));
  };

  const handleCopyMessage = async () => {
    if (!messageBody.trim()) {
      toast.error("אין תוכן הודעה להעתקה");
      return;
    }
    const fullText = getFullFormattedMessage();
    await copyToClipboardSafe(fullText);
    setCopiedType("message");
    setTimeout(() => setCopiedType(null), 2000);
    toast.success("ההודעה הועתקה ללוח");
  };

  const handleCopyPhones = () => {
    const validPhones = recipientEmployees
      .map((e) => e.phone_number?.trim())
      .filter((p): p is string => Boolean(p));

    if (validPhones.length === 0) {
      toast.error("לא נמצאו מספרי טלפון תקינים");
      return;
    }

    navigator.clipboard.writeText(validPhones.join(", "));
    setCopiedType("phones");
    setTimeout(() => setCopiedType(null), 2000);
    toast.success(`הועתקו ${validPhones.length} מספרי טלפון`);
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    setActiveTemplateId(template.id);
    setMessageTitle(template.title);
    setMessageBody(template.content);
    toast.info(`נטענה תבנית: ${template.label}`);
  };

  const handleSaveActiveTemplateChanges = () => {
    if (!activeTemplateId) return;
    if (!messageBody.trim()) {
      toast.error("לא ניתן לשמור תבנית ריקה");
      return;
    }

    const updated = templates.map((tmpl) => {
      if (tmpl.id === activeTemplateId) {
        return {
          ...tmpl,
          title: messageTitle.trim(),
          content: messageBody.trim(),
        };
      }
      return tmpl;
    });

    persistTemplates(updated);
    toast.success("ניסוח התבנית נשמר בהצלחה לפעמים הבאות");
  };

  const handleOpenNewTemplateModal = () => {
    setNewTemplateLabel("");
    setNewTemplateTitle(messageTitle);
    setNewTemplateContent(messageBody);
    setShowNewTemplateModal(true);
  };

  const handleCreateNewTemplate = () => {
    if (!newTemplateLabel.trim()) {
      toast.error("נא להזין שם לתבנית החדשה");
      return;
    }
    if (!newTemplateContent.trim()) {
      toast.error("נא להזין תוכן להודעה לפני שמירתה כתבנית");
      return;
    }

    const newTemplate: MessageTemplate = {
      id: `custom_${Date.now()}`,
      label: newTemplateLabel.trim(),
      title: newTemplateTitle.trim(),
      content: newTemplateContent.trim(),
      isCustom: true,
    };

    const updated = [...templates, newTemplate];
    persistTemplates(updated);
    setActiveTemplateId(newTemplate.id);
    setMessageTitle(newTemplate.title);
    setMessageBody(newTemplate.content);
    setNewTemplateLabel("");
    setNewTemplateTitle("");
    setNewTemplateContent("");
    setShowNewTemplateModal(false);
    toast.success(`התבנית '${newTemplate.label}' נוצרה ונשמרה בהצלחה`);
  };

  const handleDeleteTemplate = (id: string, label: string) => {
    const updated = templates.filter((t) => t.id !== id);
    persistTemplates(updated);
    if (activeTemplateId === id) {
      setActiveTemplateId(null);
    }
    toast.success(`התבנית '${label}' נמחקה`);
  };

  const handleResetTemplates = () => {
    persistTemplates(DEFAULT_TEMPLATES);
    setActiveTemplateId(null);
    toast.info("התבניות אופסו לברירת המחדל של המערכת");
  };

  const handleOpenEditTemplate = (tmpl: MessageTemplate) => {
    setEditingTemplate(tmpl);
    setEditTemplateLabel(tmpl.label);
    setEditTemplateTitle(tmpl.title);
    setEditTemplateContent(tmpl.content);
  };

  const handleSaveEditedTemplate = () => {
    if (!editingTemplate) return;
    if (!editTemplateLabel.trim()) {
      toast.error("נא להזין שם לתבנית");
      return;
    }
    if (!editTemplateContent.trim()) {
      toast.error("נא להזין תוכן לתבנית");
      return;
    }

    const updated = templates.map((t) => {
      if (t.id === editingTemplate.id) {
        return {
          ...t,
          label: editTemplateLabel.trim(),
          title: editTemplateTitle.trim(),
          content: editTemplateContent.trim(),
        };
      }
      return t;
    });

    persistTemplates(updated);

    // If this template is active right now in the composer, update the form too
    if (activeTemplateId === editingTemplate.id) {
      setMessageTitle(editTemplateTitle.trim());
      setMessageBody(editTemplateContent.trim());
    }

    setEditingTemplate(null);
    toast.success(
      `התבנית '${editTemplateLabel.trim()}' עודכנה ונשמרה לצמיתות בחשבונך`,
    );
  };

  const handleSendInternalAlert = async () => {
    if (!messageBody.trim()) {
      toast.error("יש להזין תוכן להודעה");
      return;
    }
    if (resolvedRecipients.length === 0) {
      toast.error("יש לבחור לפחות יחידה או שוטר אחד");
      return;
    }

    setSendingInternal(true);
    try {
      await apiClient.post("/messages/broadcast", {
        recipient_ids: resolvedRecipients,
        title: messageTitle.trim() || "הודעה יחידתית",
        description: messageBody.trim(),
      });
      toast.success(
        `ההודעה שודרה במערכת ל-${resolvedRecipients.length} שוטרים`,
      );
    } catch {
      toast.error("שגיאה בשליחה במערכת");
    } finally {
      setSendingInternal(false);
    }
  };

  const validPhoneCount = recipientEmployees.filter((e) =>
    Boolean(e.phone_number),
  ).length;
  const activeTemplate = templates.find((t) => t.id === activeTemplateId);
  const isTemplateModified =
    activeTemplate &&
    (activeTemplate.title !== messageTitle ||
      activeTemplate.content !== messageBody);

  // Render Tree Component
  const renderTreeContent = () => (
    <div className="space-y-3">
      {/* Custom WhatsApp Groups Card */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>קבוצות מותאמות אישית ({customGroups.length})</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenCreateCustomGroupModal}
            className="h-6 px-2 text-[11px] font-bold text-primary hover:bg-primary/10 gap-1 rounded-lg border-primary/20"
          >
            <Plus className="w-3 h-3" />
            <span>קבוצה חדשה</span>
          </Button>
        </div>

        {customGroups.length === 0 ? (
          <div className="text-[11px] text-muted-foreground/75 py-2 text-center bg-background/60 rounded-lg border border-dashed border-border/60">
            לא נוצרו עדיין קבוצות מותאמות. לחץ על{" "}
            <strong className="text-foreground">"קבוצה חדשה"</strong> כדי ליצור
            קבוצה בשם לבחירתך.
          </div>
        ) : (
          <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
            {customGroups.map((group) => {
              const isSel = selectedCustomGroupIds.has(group.id);
              return (
                <div
                  key={group.id}
                  className={cn(
                    "flex items-center justify-between p-1.5 px-2 rounded-lg text-xs transition-colors select-none",
                    isSel
                      ? "bg-primary/10 text-foreground border border-primary/20 font-medium"
                      : "hover:bg-muted/60 bg-background/70 border border-border/40 text-foreground",
                  )}
                >
                  <div
                    onClick={() => toggleCustomGroup(group.id)}
                    className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        isSel
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-background",
                      )}
                    >
                      {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate font-semibold">{group.name}</span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {group.link && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(group.link, "_blank")}
                        className="h-6 w-6 p-0 text-[#25D366] hover:text-[#1faa53]"
                        title="פתח קישור לקבוצת הוואטסאפ"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditCustomGroupModal(group)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      title="ערוך קבוצה"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteCustomGroup(group.id, group.name)
                      }
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      title="מחק קבוצה"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
        <span className="font-semibold text-foreground">עץ יחידות ושוטרים</span>
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            size="sm"
            onClick={selectAllOrganization}
            className="p-0 h-auto text-xs"
          >
            בחר הכל
          </Button>
          {(selectedTargets.length > 0 ||
            selectedIndividuals.size > 0 ||
            selectedCustomGroupIds.size > 0) && (
            <>
              <span className="text-muted-foreground">•</span>
              <Button
                variant="link"
                size="sm"
                onClick={clearSelection}
                className="p-0 h-auto text-xs text-destructive hover:text-destructive"
              >
                נקה
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="חיפוש מחלקה, מדור, צוות..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-9 h-9 text-xs"
        />
      </div>

      <div className="border rounded-lg p-2 max-h-[380px] overflow-y-auto space-y-1">
        {filteredStructure.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            לא נמצאו יחידות התואמות לחיפוש
          </div>
        ) : (
          filteredStructure.map((dept) => {
            const isDeptExpanded = expandedDepts.has(dept.id);
            const isDeptSel = isTargetSelected("department", dept.id);
            const deptKey = `department_${dept.id}`;
            const deptGroupLink = groupLinks[deptKey];
            const canEditDept = canCommanderEditUnit(
              user,
              { level: "department", id: dept.id, name: dept.name },
              structure,
            );

            return (
              <div key={dept.id} className="space-y-1">
                <div
                  className={cn(
                    "flex items-center justify-between p-1.5 px-2 rounded-md text-xs transition-colors select-none",
                    isDeptSel
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDeptExpand(dept.id)}
                      className="p-0 h-5 w-5 shrink-0"
                    >
                      {isDeptExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      )}
                    </Button>
                    <div
                      onClick={() =>
                        toggleTarget({
                          level: "department",
                          id: dept.id,
                          name: cleanUnitName(dept.name),
                        })
                      }
                      className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          isDeptSel
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-background",
                        )}
                      >
                        {isDeptSel && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">
                        {cleanUnitName(dept.name)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canEditDept ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleOpenEditGroupLink({
                            level: "department",
                            id: dept.id,
                            name: cleanUnitName(dept.name),
                          })
                        }
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        title={
                          deptGroupLink
                            ? "ערוך קישור קבוצה"
                            : "הגדר קישור קבוצה"
                        }
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </Button>
                    ) : deptGroupLink ? (
                      <span
                        title="קישור קבוצה מוגדר"
                        className="text-muted-foreground p-1 opacity-50"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </span>
                    ) : null}
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1 font-normal"
                    >
                      מחלקה
                    </Badge>
                  </div>
                </div>

                {isDeptExpanded && (
                  <div className="pr-4 space-y-0.5 border-r mr-2 my-0.5">
                    {dept.sections?.map((sec) => {
                      const isSecExpanded = expandedSections.has(sec.id);
                      const isSecSel = isTargetSelected("section", sec.id);
                      const secKey = `section_${sec.id}`;
                      const secGroupLink = groupLinks[secKey];
                      const canEditSec = canCommanderEditUnit(
                        user,
                        { level: "section", id: sec.id, name: sec.name },
                        structure,
                      );

                      return (
                        <div key={sec.id} className="space-y-0.5">
                          <div
                            className={cn(
                              "flex items-center justify-between p-1.5 px-2 rounded-md text-xs transition-colors select-none",
                              isSecSel
                                ? "bg-accent text-accent-foreground font-medium"
                                : "hover:bg-muted text-foreground",
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSectionExpand(sec.id)}
                                className="p-0 h-5 w-5 shrink-0"
                              >
                                {isSecExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                                )}
                              </Button>
                              <div
                                onClick={() =>
                                  toggleTarget({
                                    level: "section",
                                    id: sec.id,
                                    name: cleanUnitName(sec.name),
                                  })
                                }
                                className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                              >
                                <div
                                  className={cn(
                                    "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                    isSecSel
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-input bg-background",
                                  )}
                                >
                                  {isSecSel && (
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  )}
                                </div>
                                <span className="truncate">
                                  {cleanUnitName(sec.name)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {canEditSec ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenEditGroupLink({
                                      level: "section",
                                      id: sec.id,
                                      name: cleanUnitName(sec.name),
                                    })
                                  }
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  title={
                                    secGroupLink
                                      ? "ערוך קישור קבוצה"
                                      : "הגדר קישור קבוצה"
                                  }
                                >
                                  <Link2 className="w-3 h-3" />
                                </Button>
                              ) : secGroupLink ? (
                                <span
                                  title="קישור קבוצה מוגדר"
                                  className="text-muted-foreground p-1 opacity-50"
                                >
                                  <Link2 className="w-3 h-3" />
                                </span>
                              ) : null}
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1 font-normal"
                              >
                                מדור
                              </Badge>
                            </div>
                          </div>

                          {isSecExpanded && (
                            <div className="pr-4 space-y-0.5 border-r mr-2 my-0.5">
                              {sec.teams?.map((team) => {
                                const isTeamSel = isTargetSelected(
                                  "team",
                                  team.id,
                                );
                                const isTeamExp = expandedTeams.has(team.id);
                                const teamKey = `team_${team.id}`;
                                const teamGroupLink = groupLinks[teamKey];
                                const canEditTeam = canCommanderEditUnit(
                                  user,
                                  {
                                    level: "team",
                                    id: team.id,
                                    name: team.name,
                                  },
                                  structure,
                                );

                                const teamOfficers = safeEmployees.filter(
                                  (e) => e.team_id === team.id && e.is_active,
                                );

                                return (
                                  <div key={team.id} className="space-y-0.5">
                                    <div
                                      className={cn(
                                        "flex items-center justify-between p-1 px-2 rounded-md text-xs transition-colors select-none",
                                        isTeamSel
                                          ? "bg-accent text-accent-foreground font-medium"
                                          : "hover:bg-muted text-foreground",
                                      )}
                                    >
                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            toggleTeamExpand(team.id)
                                          }
                                          className="p-0 h-5 w-5 shrink-0"
                                        >
                                          {isTeamExp ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                                          )}
                                        </Button>
                                        <div
                                          onClick={() =>
                                            toggleTarget({
                                              level: "team",
                                              id: team.id,
                                              name: cleanUnitName(team.name),
                                            })
                                          }
                                          className="flex items-center gap-1.5 min-w-0 cursor-pointer flex-1"
                                        >
                                          <div
                                            className={cn(
                                              "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                              isTeamSel
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-input bg-background",
                                            )}
                                          >
                                            {isTeamSel && (
                                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            )}
                                          </div>
                                          <span className="truncate">
                                            {cleanUnitName(team.name)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {canEditTeam && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleOpenEditGroupLink({
                                                level: "team",
                                                id: team.id,
                                                name: cleanUnitName(team.name),
                                              })
                                            }
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                            title={
                                              teamGroupLink
                                                ? "ערוך קישור קבוצה"
                                                : "הגדר קישור קבוצה"
                                            }
                                          >
                                            <Link2 className="w-3 h-3" />
                                          </Button>
                                        )}
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          ({teamOfficers.length})
                                        </span>
                                      </div>
                                    </div>

                                    {isTeamExp && (
                                      <div className="pr-4 space-y-0.5 my-0.5">
                                        {teamOfficers.map((emp) => {
                                          const isIndSel =
                                            isIndividualSelected(emp.id) ||
                                            isTeamSel;
                                          return (
                                            <div
                                              key={emp.id}
                                              onClick={() =>
                                                toggleIndividual(emp.id)
                                              }
                                              className={cn(
                                                "flex items-center justify-between p-1.5 px-2 rounded-md text-xs cursor-pointer select-none transition-colors",
                                                isIndSel
                                                  ? "bg-primary/10 text-primary font-medium"
                                                  : "hover:bg-muted text-muted-foreground",
                                              )}
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                  className={cn(
                                                    "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                                    isIndSel
                                                      ? "bg-primary border-primary text-primary-foreground"
                                                      : "border-input bg-background",
                                                  )}
                                                >
                                                  {isIndSel && (
                                                    <Check className="w-2 h-2 stroke-[3]" />
                                                  )}
                                                </div>
                                                <span className="truncate">
                                                  {emp.dominant_name ||
                                                    `${emp.first_name} ${emp.last_name}`}
                                                </span>
                                              </div>
                                              <span className="font-mono text-[10px] opacity-60">
                                                {emp.phone_number ||
                                                  "ללא טלפון"}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-6 px-1 sm:px-0">
      {/* ── Main Layout: 2 Columns on Desktop, Native Seamless View on Mobile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Right Column (Desktop Tree): Clean Card */}
        <div className="hidden lg:block lg:col-span-5">
          <Card className="rounded-2xl border border-border/50 bg-card/60 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold">
                עץ יחידות ושוטרים
              </CardTitle>
              <CardDescription className="text-xs">
                בחר יחידות או שוטרים לשליחת ההודעה
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">{renderTreeContent()}</CardContent>
          </Card>
        </div>

        {/* Left Column (Main Composer): Borderless on Mobile, Clean Card on Desktop */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl sm:rounded-3xl lg:border lg:border-border/50 lg:bg-card/50 lg:shadow-xs flex flex-col space-y-5 sm:space-y-6 p-0 sm:p-2 lg:p-6">
            
            {/* Desktop Header Section (Hidden on Mobile since page header already exists) */}
            <div className="hidden sm:flex sm:items-center justify-between gap-2.5 pb-3 border-b border-border/30">
              <div>
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  ניסוח והפצת הודעה
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  הפצה מיידית לקבוצות וואטסאפ יחידתיות או לשוטרים
                </p>
              </div>

              <div className="flex items-center gap-2">
                {gatewayStatus.status === "connected" ? (
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/5 gap-1.5 py-1 px-2.5 rounded-xl"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      וואטסאפ מחובר
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGatewayLogout}
                      className="h-7 px-2 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 rounded-xl transition-colors cursor-pointer"
                      title="נתק חשבון וואטסאפ"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>התנתק</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQrModal(true)}
                    className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/60 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    חבר QR
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Top Controls Bar: WhatsApp Connection Status + Direct Target Picker (Flat & Clean) */}
            <div className="flex sm:hidden items-center justify-between gap-2 py-0.5">
              <div className="flex items-center gap-1">
                {gatewayStatus.status === "connected" ? (
                  <>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 gap-1.5 py-1 px-2.5 rounded-xl flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      וואטסאפ מחובר
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGatewayLogout}
                      className="h-7 px-1.5 text-[11px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 gap-0.5 rounded-lg cursor-pointer"
                      title="נתק חשבון וואטסאפ"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>התנתק</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQrModal(true)}
                    className="h-7 text-xs font-semibold gap-1.5 rounded-xl border-border/40"
                  >
                    <QrCode className="w-3 h-3" />
                    חבר QR
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMobileTreeOpen(true)}
                className="h-8 px-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 text-xs font-bold gap-1.5 text-foreground cursor-pointer shrink-0"
              >
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  {selectedTargets.length + selectedCustomGroupIds.size + selectedIndividuals.size > 0
                    ? `${selectedTargets.length + selectedCustomGroupIds.size + selectedIndividuals.size} נמענים ▾`
                    : "בחר נמענים ▾"}
                </span>
              </Button>
            </div>

            {/* Form Row 1: Template Selector & AI Smart Draft */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs gap-2">
                <label className="font-bold text-foreground text-xs sm:text-sm">
                  תבנית וניסוח הודעה
                </label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAiDraftModal(true)}
                    className="h-8 text-xs font-bold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 gap-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>מחולל הודעות</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenNewTemplateModal}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-semibold rounded-xl cursor-pointer"
                  >
                    + תבנית
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setTemplatePopoverOpen(true)}
                className="w-full justify-between h-11 text-xs sm:text-sm font-medium bg-background border-border/50 rounded-2xl px-3.5 hover:bg-muted/30 cursor-pointer shadow-2xs"
              >
                <span className="truncate">
                  {activeTemplate
                    ? activeTemplate.label
                    : "בחר תבנית מוכנה מראש (או לחץ לניסוח חופשי)..."}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground opacity-60 shrink-0" />
              </Button>

              {isTemplateModified && (
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                  <span className="truncate">
                    שינית את הניסוח לתבנית '{activeTemplate?.label}'
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveActiveTemplateChanges}
                    className="h-7 text-xs px-2.5 rounded-xl"
                  >
                    <Save className="w-3 h-3 ml-1" />
                    שמור
                  </Button>
                </div>
              )}
            </div>

            {/* Form Row 2: Subject */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                נושא / כותרת (אופציונלי)
              </label>
              <Input
                placeholder="עדכון יומי, תזכורת נוכחות..."
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                className="h-11 text-xs sm:text-sm rounded-2xl bg-background border-border/50 shadow-2xs"
              />
            </div>

            {/* Form Row 3: Message Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-foreground">
                  תוכן ההודעה <span className="text-primary">*</span>
                </label>
                <span className="text-muted-foreground font-mono text-[10px]">
                  {messageBody.length} תווים
                </span>
              </div>
              <Textarea
                placeholder="כתוב כאן את תוכן ההודעה..."
                rows={6}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="min-h-[160px] sm:min-h-[190px] text-xs sm:text-sm leading-relaxed resize-y custom-scrollbar rounded-2xl bg-background border-border/50 p-3.5 sm:p-4 shadow-2xs"
              />
            </div>

            {/* Mode A: Group targets quick list */}
            {(selectedTargets.length > 0 ||
              selectedCustomGroupIds.size > 0) && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <span className="text-xs font-bold text-foreground block">
                  קבוצות יעד לשליחה (
                  {selectedTargets.length + selectedCustomGroupIds.size}):
                </span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {/* Custom Groups */}
                  {customGroups
                    .filter((g) => selectedCustomGroupIds.has(g.id))
                    .map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl border bg-primary/5 border-primary/20 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold truncate">
                            {group.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            (מותאמת)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleOpenEditCustomGroupModal(group)
                            }
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-xl"
                            title="ערוך קבוצה / קישור"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAutoSendToCustomGroup(group)}
                            disabled={autoSending}
                            className="h-8 text-xs bg-[#25D366] hover:bg-[#1faa53] text-white font-bold rounded-xl px-3"
                          >
                            {autoSending ? (
                              <Loader2 className="w-3 h-3 animate-spin ml-1" />
                            ) : (
                              <WhatsAppIcon className="w-3 h-3 ml-1" />
                            )}
                            שלח
                          </Button>
                        </div>
                      </div>
                    ))}

                  {/* Organizational Units */}
                  {selectedTargets.map((target) => {
                    const key = `${target.level}_${target.id}`;
                    const hasLink = Boolean(groupLinks[key]);
                    const canEdit = canCommanderEditUnit(
                      user,
                      target,
                      structure,
                    );

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2.5 rounded-2xl border border-border/40 bg-muted/20 text-xs"
                      >
                        <span className="font-bold truncate">
                          {target.name}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {canEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditGroupLink(target)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-xl"
                              title="ערוך קישור קבוצה"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAutoSendToGroup(target)}
                            disabled={autoSending}
                            className="h-8 text-xs bg-[#25D366] hover:bg-[#1faa53] text-white font-bold rounded-xl px-3"
                          >
                            {autoSending ? (
                              <Loader2 className="w-3 h-3 animate-spin ml-1" />
                            ) : (
                              <WhatsAppIcon className="w-3 h-3 ml-1" />
                            )}
                            שלח
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode B: Individual officers quick list */}
            {(selectedIndividuals.size > 0 ||
              (selectedTargets.length === 0 &&
                selectedCustomGroupIds.size === 0 &&
                recipientEmployees.length > 0)) && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    שוטרים ({recipientEmployees.length}):
                  </span>
                  <Button
                    size="sm"
                    onClick={handleAutoBroadcastToAll}
                    disabled={autoSending || validPhoneCount === 0}
                    className="h-8 text-xs bg-[#25D366] hover:bg-[#1faa53] text-white font-bold rounded-xl px-3"
                  >
                    <WhatsAppIcon className="w-3 h-3 ml-1" />
                    שלח לכולם ({validPhoneCount})
                  </Button>
                </div>

                <div className="max-h-[140px] overflow-y-auto space-y-1 custom-scrollbar">
                  {recipientEmployees.map((emp) => {
                    const isSent = sentMap[emp.id];
                    const hasPhone = Boolean(emp.phone_number);

                    return (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-2 px-2.5 rounded-2xl border border-border/40 bg-muted/20 text-xs"
                      >
                        <span className="font-medium truncate block">
                          {emp.dominant_name ||
                            `${emp.first_name} ${emp.last_name}`}
                        </span>

                        <Button
                          size="sm"
                          variant={isSent ? "secondary" : "outline"}
                          onClick={() => handleOpenIndividualWhatsApp(emp)}
                          disabled={!hasPhone}
                          className="h-7 text-xs px-2.5 rounded-xl font-semibold"
                        >
                          {isSent ? "נשלח ✓" : "שלח"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons Footer: Structured 2-Row Layout */}
            <div className="pt-3 border-t border-border/30 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDirectWhatsAppShare}
                  disabled={!messageBody.trim()}
                  className="flex-1 h-12 text-sm font-bold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-2xl shadow-sm transition-all active:scale-[0.99] cursor-pointer gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 ml-1" />
                  <span>שתף בוואטסאפ</span>
                </Button>

                <Button
                  onClick={handleCopyMessage}
                  disabled={!messageBody.trim()}
                  variant="outline"
                  className="h-12 px-4 text-xs sm:text-sm font-bold rounded-2xl border-border/50 hover:bg-muted/40 cursor-pointer gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>העתק</span>
                </Button>
              </div>

              <Button
                onClick={handleSendInternalAlert}
                disabled={
                  !messageBody.trim() ||
                  resolvedRecipients.length === 0 ||
                  sendingInternal
                }
                variant="outline"
                className="w-full h-11 text-xs sm:text-sm font-bold rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 text-foreground cursor-pointer gap-2"
              >
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span>שידור התראה במערכת ({resolvedRecipients.length} נמענים)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Units Picker Dialog ── */}
      <Dialog open={mobileTreeOpen} onOpenChange={setMobileTreeOpen}>
        <DialogContent
          className="sm:max-w-md text-right rounded-2xl p-6 space-y-3"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b">
            <DialogTitle className="text-base font-semibold">
              בחירת יחידות ושוטרים
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              סמן מחלקות, מדורים או שוטרים להפצה
            </DialogDescription>
          </DialogHeader>

          <div className="py-1">{renderTreeContent()}</div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t">
            <span className="text-xs text-muted-foreground font-medium">
              {selectedIndividuals.size > 0
                ? `נבחרו: ${selectedIndividuals.size} שוטרים`
                : `נבחרו: ${selectedTargets.length + selectedCustomGroupIds.size} יחידות/קבוצות`}
            </span>
            <Button
              size="sm"
              onClick={() => setMobileTreeOpen(false)}
              className="text-xs px-5 font-semibold"
            >
              אישור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Templates Picker & Management Dialog (Native Bottom Sheet on Mobile) ── */}
      <Dialog open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
        <DialogContent
          className="sm:max-w-md text-right rounded-2xl p-6 space-y-4"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b">
            <DialogTitle className="text-base font-semibold">
              תבניות הודעה
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              בחר תבנית מוכנה להודעה או מחק תבניות קיימות
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            {/* Free Writing option */}
            <div
              onClick={() => {
                setActiveTemplateId(null);
                setMessageTitle("");
                setMessageBody("");
                setTemplatePopoverOpen(false);
              }}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors text-xs select-none",
                !activeTemplateId
                  ? "bg-primary/10 border-primary text-primary font-semibold"
                  : "hover:bg-muted text-muted-foreground bg-muted/20",
              )}
            >
              <span>ניסוח חופשי (ללא תבנית)</span>
              {!activeTemplateId && <Check className="w-4 h-4 text-primary" />}
            </div>

            {/* Template list */}
            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-0.5">
              {templates.map((tmpl) => {
                const isSelected = activeTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-xl border transition-colors text-xs select-none",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "hover:bg-muted border-border bg-card text-foreground",
                    )}
                  >
                    <div
                      onClick={() => {
                        handleSelectTemplate(tmpl);
                        setTemplatePopoverOpen(false);
                      }}
                      className="flex-1 min-w-0 cursor-pointer pr-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm block truncate">
                          {tmpl.label}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block truncate mt-0.5 font-normal">
                        {tmpl.content}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 mr-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditTemplate(tmpl);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                        title="ערוך תבנית"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(tmpl.id, tmpl.label);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="מחק תבנית"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-between items-center pt-3 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetTemplates}
              className="text-xs font-normal text-muted-foreground hover:text-foreground h-9 px-3"
            >
              <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
              איפוס לברירת מחדל
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setTemplatePopoverOpen(false);
                handleOpenNewTemplateModal();
              }}
              className="text-xs font-semibold px-4 h-9"
            >
              <Plus className="w-3.5 h-3.5 ml-1.5" />
              תבנית חדשה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Template Modal ── */}
      <Dialog
        open={Boolean(editingTemplate)}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent
          className="sm:max-w-md text-right rounded-2xl p-6 space-y-4"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b">
            <DialogTitle className="text-base font-semibold">
              עריכת תבנית הודעה
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              השינויים יישמרו לצמיתות עבור המשתמש שלך
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                שם התבנית:
              </label>
              <Input
                placeholder="הזן שם לתבנית..."
                value={editTemplateLabel}
                onChange={(e) => setEditTemplateLabel(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                נושא / כותרת (אופציונלי):
              </label>
              <Input
                placeholder="הזן כותרת..."
                value={editTemplateTitle}
                onChange={(e) => setEditTemplateTitle(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                תוכן ההודעה:
              </label>
              <Textarea
                placeholder="כתוב כאן את תוכן התבנית..."
                rows={5}
                value={editTemplateContent}
                onChange={(e) => setEditTemplateContent(e.target.value)}
                className="min-h-[120px] text-sm leading-relaxed resize-none custom-scrollbar"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingTemplate(null)}
              className="text-xs"
            >
              ביטול
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditedTemplate}
              className="text-xs font-semibold px-4"
            >
              <Save className="w-3.5 h-3.5 ml-1.5" />
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Group Link Modal ── */}
      <Dialog
        open={Boolean(editingGroupTarget)}
        onOpenChange={(open) => !open && setEditingGroupTarget(null)}
      >
        <DialogContent
          className="sm:max-w-lg text-right rounded-2xl p-6 space-y-4"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b">
            <DialogTitle className="text-base font-semibold">
              הגדרת קישור לקבוצת וואטסאפ
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              יחידה:{" "}
              <span className="font-semibold text-foreground">
                {editingGroupTarget?.name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                קישור הצטרפות לקבוצה:
              </label>
              <Input
                placeholder="https://chat.whatsapp.com/..."
                value={tempGroupLink}
                onChange={(e) => setTempGroupLink(e.target.value)}
                className="h-10 text-xs font-mono text-left"
                dir="ltr"
              />
            </div>

            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground block">
                כיצד מעתיקים את הקישור מוואטסאפ?
              </span>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>פותחים את הקבוצה בוואטסאפ בטלפון</li>
                <li>לוחצים על שם הקבוצה בראש המסך</li>
                <li>
                  בוחרים <strong>"הזמנה לקבוצה באמצעות קישור"</strong>
                </li>
                <li>
                  לוחצים על <strong>"העתק קישור"</strong> ומדביקים כאן
                </li>
              </ol>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingGroupTarget(null)}
              className="text-xs"
            >
              ביטול
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (editingGroupTarget) {
                  const key = `${editingGroupTarget.level}_${editingGroupTarget.id}`;
                  saveGroupLink(key, tempGroupLink);
                }
              }}
              className="text-xs bg-[#25D366] hover:bg-[#1faa53] text-white font-semibold"
            >
              שמור קישור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Template Modal ── */}
      <Dialog
        open={showNewTemplateModal}
        onOpenChange={setShowNewTemplateModal}
      >
        <DialogContent
          className="w-[95vw] sm:max-w-lg text-right rounded-3xl p-4 sm:p-6 space-y-3.5 max-h-[92vh] flex flex-col bg-card"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b border-border/30">
            <DialogTitle className="text-base sm:text-lg font-black text-foreground">
              שמירת תבנית הודעה חדשה
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              התבנית תישמר בחשבונך לשימוש מהיר בעתיד
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-1 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                שם התבנית:
              </label>
              <Input
                placeholder="הזן שם מזהה לתבנית (למשל: תזכורת שיבוץ)..."
                value={newTemplateLabel}
                onChange={(e) => setNewTemplateLabel(e.target.value)}
                className="h-10 sm:h-11 text-xs sm:text-sm rounded-xl bg-background border-border/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                נושא / כותרת (אופציונלי):
              </label>
              <Input
                placeholder="הזן כותרת..."
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                className="h-10 sm:h-11 text-xs sm:text-sm rounded-xl bg-background border-border/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                תוכן ההודעה:
              </label>
              <Textarea
                placeholder="כתוב כאן את תוכן התבנית..."
                rows={7}
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                className="min-h-[160px] sm:min-h-[200px] text-xs sm:text-sm leading-relaxed resize-y custom-scrollbar rounded-2xl bg-background border-border/50 p-3.5 sm:p-4 shadow-2xs"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2.5 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewTemplateModal(false)}
              className="text-xs h-9 px-4 rounded-xl cursor-pointer"
            >
              ביטול
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateNewTemplate}
              className="text-xs font-bold h-9 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
            >
              שמור תבנית
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Minimal QR Modal ── */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent
          className="sm:max-w-md text-right rounded-2xl p-6 space-y-3"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b">
            <DialogTitle className="text-base font-semibold">
              חיבור וואטסאפ לשליחה ישירה
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              סרוק את קוד ה-QR מוואטסאפ בטלפון
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border rounded-xl my-2 space-y-3">
            {gatewayStatus.qr ? (
              <div className="p-3 bg-white rounded-xl shadow-sm border">
                <img
                  src={gatewayStatus.qr}
                  alt="WhatsApp QR Code"
                  className="w-48 sm:w-52 h-48 sm:h-52 object-contain"
                />
              </div>
            ) : (
              <div className="w-48 sm:w-52 h-48 sm:h-52 flex flex-col items-center justify-center space-y-2 bg-muted/30 rounded-xl border border-dashed">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  טוען קוד QR...
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQrModal(false)}
              className="text-xs"
            >
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Custom WhatsApp Group Modal ── */}
      <Dialog
        open={showCustomGroupModal}
        onOpenChange={setShowCustomGroupModal}
      >
        <DialogContent
          className="sm:max-w-lg text-right rounded-2xl p-6 space-y-4"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 pb-2 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>
                {editingCustomGroup
                  ? "עריכת קבוצת וואטסאפ מותאמת"
                  : "יצירת קבוצת וואטסאפ חדשה"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              הגדר שם מזהה וקישור לקבוצת הוואטסאפ להפצה ישירה
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                שם הקבוצה: <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="צוות כוננות שבת, מפקדי תורנות, יחידת חילוץ..."
                value={customGroupName}
                onChange={(e) => setCustomGroupName(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                קישור לקבוצת הוואטסאפ:{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="https://chat.whatsapp.com/..."
                value={customGroupLink}
                onChange={(e) => setCustomGroupLink(e.target.value)}
                className="h-10 text-xs font-mono text-left"
                dir="ltr"
              />
            </div>

            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block">
                כיצד מעתיקים את הקישור מוואטסאפ?
              </span>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>פותחים את הקבוצה בוואטסאפ בטלפון</li>
                <li>לוחצים על שם הקבוצה בראש המסך</li>
                <li>
                  בוחרים <strong>"הזמנה לקבוצה באמצעות קישור"</strong>
                </li>
                <li>
                  לוחצים על <strong>"העתק קישור"</strong> ומדביקים כאן
                </li>
              </ol>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomGroupModal(false)}
              className="text-xs"
            >
              ביטול
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveCustomGroup}
              className="text-xs bg-[#25D366] hover:bg-[#1faa53] text-white font-semibold px-4 gap-1"
            >
              <Save className="w-3.5 h-3.5 ml-1" />
              {editingCustomGroup ? "שמור שינויים" : "צור קבוצה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AI Smart Message Generator Modal ── */}
      <AiMessageGeneratorModal
        open={showAiDraftModal}
        onOpenChange={setShowAiDraftModal}
        onApplyMessage={(title, body) => {
          setActiveTemplateId(null);
          setMessageTitle(title);
          setMessageBody(body);
        }}
      />
    </div>
  );
};
