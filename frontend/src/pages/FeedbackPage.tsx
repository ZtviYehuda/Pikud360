import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Send,
  History,
  AlertCircle,
  CheckCircle2,
  X,
  Settings,
  Search,
  User,
  Activity,
  Archive,
  RefreshCw,
  ChevronLeft,
  ShieldCheck,
  Download,
  Eye,
  Filter,
  Loader2,
  Trash2,
  Plus,
  Users,
  GitPullRequest
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import apiClient from "../config/api.client";
import { Badge } from "../components/ui/badge";
import {
  PageToolbar,
  SearchInput,
  FilterGroup,
  FilterSelect,
  ClearFiltersButton,
} from "@/components/shared/page-toolbar";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Card } from "../components/ui/card";
import { useAuthContext } from "../context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { useNotifications } from "../hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

import { PageHeader } from "@/components/layout/PageHeader";
import type { SupportTicket, Ticket } from "@/types/feedback.types";

const parseDateSafe = (dateStr: any) => {
  if (!dateStr) return new Date(0);
  if (dateStr instanceof Date) return dateStr;

  if (
    typeof dateStr === "string" &&
    !dateStr.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(dateStr)
  ) {
    const parts = dateStr.split(/[-T:]/);
    if (parts.length >= 5) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parseInt(parts[3], 10);
      const minute = parseInt(parts[4], 10);
      const second = parts[5] ? parseFloat(parts[5]) : 0;
      return new Date(year, month, day, hour, minute, second);
    }
  }
  return new Date(dateStr);
};

const getScreenshotUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseURL = apiClient.defaults.baseURL || "";
  if (baseURL.startsWith("http://") || baseURL.startsWith("https://")) {
    const origin = baseURL.replace(/\/api$/, "");
    return `${origin}${url}`;
  }
  return url;
};

const FeedbackPage = () => {
  const { user: currentUser } = useAuthContext();
  const { openChat, openGroupModal } = useChat();
  const { alerts, markAsRead, refreshAlerts } = useNotifications();
  const isAdmin = currentUser?.is_admin;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    (searchParams.get("tab") as any) || (isAdmin ? "admin-view" : "send");
  const [activeTab, setActiveTab] = useState<
    | "send"
    | "my-tickets"
    | "admin-view"
    | "whats-new"
    | "messages"
    | "chat-admin"
  >(initialTab);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Admin Chat Management State
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [selectedConvExport, setSelectedConvExport] = useState<any | null>(
    null,
  );
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [convSortBy, setConvSortBy] = useState<"name" | "date" | "count">(
    "name",
  );

  // Message Board State
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [composeToList, setComposeToList] = useState<string[]>([]);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDesc, setComposeDesc] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");

  // Chat UI State
  const [selectedChatContact, setSelectedChatContact] = useState<any | null>(
    null,
  );
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizingRef = React.useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isActionPopoverOpen, setIsActionPopoverOpen] = useState(false);

  // System Updates State
  const [systemUpdates, setSystemUpdates] = useState<any[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [newUpdateVersion, setNewUpdateVersion] = useState("");
  const [newUpdateDate, setNewUpdateDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newUpdateFeatures, setNewUpdateFeatures] = useState<string[]>([""]);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Send ticket form state
  const [ticketCategory, setTicketCategory] = useState("הצעה לשיפור");
  const [ticketDescription, setTicketDescription] = useState("");
  const [isSendingTicket, setIsSendingTicket] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription.trim()) {
      toast.error("אנא הזן תיאור");
      return;
    }
    setIsSendingTicket(true);
    try {
      let uploadedUrl = null;
      if (screenshotFile) {
        const formData = new FormData();
        formData.append("screenshot", screenshotFile);
        const uploadRes = await apiClient.post("/feedback/upload-screenshot", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        if (uploadRes.data && uploadRes.data.screenshot_url) {
          uploadedUrl = uploadRes.data.screenshot_url;
        }
      }

      const categoryMapping: Record<string, string> = {
        באג: "bug",
        "הצעה לשיפור": "improvement",
        "פיצ'ר חדש": "feature",
      };

      await apiClient.post("/feedback", {
        category: categoryMapping[ticketCategory] || "improvement",
        description: ticketDescription,
        screenshot_url: uploadedUrl,
        context_page: "feedback_page",
      });
      toast.success("הפנייה נשלחה בהצלחה");
      setTicketDescription("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setActiveTab("my-tickets");
      fetchMyTickets();
      refreshAlerts(); // Force refresh to show the auto-reply in global alerts instantly
    } catch (error) {
      toast.error("שגיאה בשליחת הפנייה");
    } finally {
      setIsSendingTicket(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const startResizing = React.useCallback(
    (mouseDownEvent: React.MouseEvent) => {
      isResizingRef.current = true;
      const startX = mouseDownEvent.clientX;
      const startWidth = sidebarWidth;

      const doDrag = (mouseMoveEvent: MouseEvent) => {
        if (!isResizingRef.current) return;
        // RTL dragging: divider moves left -> sidebar (on the right) becomes wider
        const newWidth = startWidth + (startX - mouseMoveEvent.clientX);
        if (newWidth >= 180 && newWidth <= 500) {
          setSidebarWidth(newWidth);
        }
      };

      const stopDrag = () => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", doDrag);
        document.removeEventListener("mouseup", stopDrag);
      };

      document.addEventListener("mousemove", doDrag);
      document.addEventListener("mouseup", stopDrag);
    },
    [sidebarWidth],
  );

  // Track read contacts: { [contactId]: ISO timestamp of last read }
  const [readTimestamps, setReadTimestamps] = useState<Record<number, string>>(
    () => {
      try {
        const saved = localStorage.getItem("chat_read_timestamps");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  const markContactAsRead = (contactId: number, timestamp?: string) => {
    // Clear global alerts for this contact
    alerts
      .filter((a) => a.id.startsWith("msg-") && Number(a.data?.sender_id) === Number(contactId))
      .forEach((a) => markAsRead(a.id));

    const timeToSave = timestamp || new Date().toISOString();
    setReadTimestamps((prev) => {
      const next = { ...prev, [contactId]: timeToSave };
      localStorage.setItem("chat_read_timestamps", JSON.stringify(next));
      return next;
    });
  };

  const getUnreadCount = (contactId: number) => {
    return alerts.filter(
      (a) => a.id.startsWith("msg-") && Number(a.data?.sender_id) === Number(contactId)
    ).length;
  };

  // SaaS Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState<
    "all" | "pending" | "done" | "dismissed"
  >("pending");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<
    "all" | "bug" | "improvement" | "feature" | "support"
  >("all");

  const [selectedItem, setSelectedItem] = useState<{
    data: any;
    type: "feedback" | "support";
  } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchMyTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await apiClient.get("/feedback/my");
      setMyTickets(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchAdminTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const [feedbackRes, supportRes] = await Promise.all([
        apiClient.get("/feedback/admin/all"),
        apiClient.get("/support/tickets"),
      ]);
      setAllTickets(feedbackRes.data);
      setSupportTickets(supportRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchSystemUpdates = async () => {
    setIsLoadingUpdates(true);
    try {
      const response = await apiClient.get("/feedback/updates");
      setSystemUpdates(response.data);
    } catch (error) {
      console.error("Error fetching system updates:", error);
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  const handleDeleteSystemUpdate = async (id: number) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק עדכון גרסה זה?")) return;
    try {
      await apiClient.delete(`/feedback/updates/${id}`);
      toast.success("עדכון הגרסה נמחק בהצלחה");
      fetchSystemUpdates();
    } catch (error) {
      console.error("Error deleting update:", error);
      toast.error("שגיאה במחיקת העדכון");
    }
  };

  const handleAddSystemUpdate = async () => {
    const cleanFeatures = newUpdateFeatures.filter((f) => f.trim());
    if (
      !newUpdateVersion.trim() ||
      !newUpdateDate ||
      cleanFeatures.length === 0
    ) {
      toast.error("נא להזין מספר גרסה, תאריך ולפחות שינוי אחד");
      return;
    }
    setIsSubmittingUpdate(true);
    try {
      await apiClient.post("/feedback/updates", {
        version: newUpdateVersion.trim(),
        release_date: newUpdateDate,
        features: cleanFeatures,
      });
      toast.success("עדכון הגרסה פורסם בהצלחה 🎉");
      setNewUpdateVersion("");
      setNewUpdateDate(new Date().toISOString().split("T")[0]);
      setNewUpdateFeatures([""]);
      setAddUpdateOpen(false);
      fetchSystemUpdates();
    } catch (error: any) {
      console.error("Error saving update:", error);
      toast.error(error.response?.data?.error || "שגיאה בשמירת עדכון הגרסה");
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const fetchInternalMessages = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await apiClient.get("/notifications/messages");
      setInternalMessages(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchEmployeesForMessages = async () => {
    try {
      const response = await apiClient.get("/employees/chat-contacts");
      setEmployees(response.data.filter((e: any) => e.is_active));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchChatMessages = async (otherId: number) => {
    setLoadingChat(true);
    try {
      const { data } = await apiClient.get(
        `/notifications/messages/conversation/${otherId}`,
      );
      setChatMessages(data);

      // Update read status locally with timezone-safe logic
      if (data && data.length > 0) {
        const receivedMsgs = data.filter(
          (m: any) => Number(m.sender_id) === Number(otherId),
        );
        if (receivedMsgs.length > 0) {
          const latestMsg = receivedMsgs[receivedMsgs.length - 1];
          markContactAsRead(otherId, latestMsg.created_at);
        } else {
          markContactAsRead(otherId);
        }
      } else {
        markContactAsRead(otherId);
      }

      // Automatically mark backend message alerts for this user as read
      alerts.forEach((alert) => {
        if (
          alert.id.startsWith("msg-") &&
          Number(alert.data?.sender_id) === Number(otherId)
        ) {
          markAsRead(alert.id);
        }
      });

      setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedChatContact || sendingChat) return;
    setSendingChat(true);
    try {
      await apiClient.post("/notifications/send", {
        recipient_id: selectedChatContact.id,
        title: `הודעה מ${currentUser?.first_name} ${currentUser?.last_name}`,
        description: chatInput.trim(),
      });
      setChatInput("");
      fetchChatMessages(selectedChatContact.id);
      fetchInternalMessages();
    } catch (e) {
      toast.error("שגיאה בשליחת ההודעה");
    } finally {
      setSendingChat(false);
    }
  };

  const fetchAllConversations = async () => {
    try {
      const { data } = await apiClient.get(
        "/notifications/messages/admin/all-conversations",
      );
      setAllConversations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConvMessages = async (user1_id: number, user2_id: number) => {
    setLoadingConv(true);
    try {
      const { data } = await apiClient.get(
        `/notifications/messages/conversation/${user1_id}/${user2_id}/export`,
      );
      setConvMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConv(false);
    }
  };

  const handleExportJson = (conv: any) => {
    const dataStr = JSON.stringify(
      { ...conv, messages: convMessages },
      null,
      2,
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${conv.user1_name}_${conv.user2_name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedConversations = useMemo(() => {
    let list = [...allConversations];
    if (convSearch) {
      const q = convSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.user1_name?.toLowerCase().includes(q) ||
          c.user2_name?.toLowerCase().includes(q),
      );
    }
    if (convSortBy === "name") {
      list.sort((a, b) =>
        (a.user1_name || "").localeCompare(b.user1_name || "", "he"),
      );
    } else if (convSortBy === "date") {
      list.sort(
        (a, b) =>
          new Date(b.last_message_at).getTime() -
          new Date(a.last_message_at).getTime(),
      );
    } else if (convSortBy === "count") {
      list.sort((a, b) => b.total_messages - a.total_messages);
    }
    return list;
  }, [allConversations, convSearch, convSortBy]);

  useEffect(() => {
    if (activeTab === "my-tickets") fetchMyTickets();
    else if (activeTab === "admin-view" && isAdmin) fetchAdminTickets();
    else if (activeTab === "messages") {
      fetchInternalMessages();
      if (employees.length === 0) fetchEmployeesForMessages();
    } else if (activeTab === "chat-admin" && isAdmin) fetchAllConversations();
    else if (activeTab === "whats-new") fetchSystemUpdates();
  }, [activeTab, isAdmin]);

  // Real-time message polling
  useEffect(() => {
    if (activeTab !== "messages") return;
    const interval = setInterval(() => {
      fetchInternalMessages();
      if (selectedChatContact) {
        apiClient
          .get(`/notifications/messages/conversation/${selectedChatContact.id}`)
          .then(({ data }) => {
            setChatMessages(data);
            if (data && data.length > 0) {
              const receivedMsgs = data.filter(
                (m: any) =>
                  Number(m.sender_id) === Number(selectedChatContact.id),
              );
              if (receivedMsgs.length > 0) {
                const latestMsg = receivedMsgs[receivedMsgs.length - 1];
                markContactAsRead(selectedChatContact.id, latestMsg.created_at);
              }
            }
          })
          .catch((err) => console.error(err));
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, selectedChatContact]);

  const handleSendInternalMessage = async () => {
    if (
      (!isBroadcast && !composeTo) ||
      (isBroadcast && composeToList.length === 0) ||
      !composeTitle
    )
      return;
    try {
      await apiClient.post("/notifications/send", {
        recipient_id: isBroadcast ? undefined : composeTo,
        recipient_ids: isBroadcast ? composeToList : undefined,
        title: composeTitle,
        description: composeDesc,
      });
      toast.success(
        isBroadcast ? "ההודעות נשלחו בהצלחה לקבוצה" : "הודעה נשלחה בהצלחה",
      );
      setComposeOpen(false);
      setComposeTo("");
      setComposeToList([]);
      setIsBroadcast(false);
      setComposeTitle("");
      setComposeDesc("");
      fetchInternalMessages();
    } catch (error) {
      toast.error("שגיאה בשליחת ההודעה");
    }
  };

  const handleAdminReply = async () => {
    if (!replyText.trim() || !selectedItem) return;
    try {
      if (selectedItem.type === "feedback") {
        await apiClient.put(`/feedback/admin/update/${selectedItem.data.id}`, {
          status: "done",
          admin_reply: replyText,
        });
      } else {
        await apiClient.put(`/support/tickets/${selectedItem.data.id}/reply`, {
          admin_reply: replyText,
        });
      }
      toast.success("תשובה נשלחה");
      setReplyText("");
      setSelectedItem(null);
      fetchAdminTickets();
    } catch (error) {
      toast.error("שגיאה בשליחה");
    }
  };

  const availableCommanders = useMemo(() => {
    if (!currentUser) return [];

    // If Admin: Can message ANYONE
    if (currentUser.is_admin) {
      return employees.filter((e) => Number(e.id) !== Number(currentUser.id));
    }

    // Include ALL commanders and Admins
    const allCommandersAndAdmins = employees.filter(
      (e) =>
        (e.is_commander || e.is_admin) &&
        Number(e.id) !== Number(currentUser.id),
    );

    // If Commander: Include subordinates
    let subordinates: any[] = [];
    if (currentUser.is_commander) {
      subordinates = employees.filter((e) => {
        if (Number(e.id) === Number(currentUser.id)) return false;
        if (
          currentUser.commands_department_id &&
          e.department_id === currentUser.commands_department_id
        )
          return true;
        if (
          currentUser.commands_section_id &&
          e.section_id === currentUser.commands_section_id
        )
          return true;
        if (
          currentUser.commands_team_id &&
          e.team_id === currentUser.commands_team_id
        )
          return true;
        return false;
      });
    }

    // Combine and deduplicate
    const combined = [...allCommandersAndAdmins, ...subordinates];

    return Array.from(new Set(combined.map((e) => e.id)))
      .map((id) => combined.find((e) => e.id === id))
      .sort((a, b) => {
        if (a.is_admin && !b.is_admin) return -1;
        if (!a.is_admin && b.is_admin) return 1;
        return 0;
      });
  }, [employees, currentUser]);

  const totalUnreadCount = useMemo(() => {
    return alerts.filter((a) => a.id.startsWith("msg-")).length;
  }, [alerts]);

  const filteredItems = useMemo(() => {
    if (!isAdmin) return [];
    const items = [
      ...allTickets.map((t) => ({ ...t, type: "feedback" as const })),
      ...supportTickets.map((t) => ({
        ...t,
        type: "support" as const,
        description: t.message,
        category: t.subject,
      })),
    ];
    return items
      .filter((item) => {
        if (
          searchQuery &&
          !`${(item as any).first_name || ""} ${(item as any).last_name || ""} ${(item as any).full_name || ""} ${item.description}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
          return false;
        if (
          adminFilter === "pending" &&
          (item.status === "done" ||
            item.status === "dismissed" ||
            item.status === "irrelevant")
        )
          return false;
        if (adminFilter === "done" && item.status !== "done") return false;
        if (
          adminFilter === "dismissed" &&
          item.status !== "dismissed" &&
          item.status !== "irrelevant"
        )
          return false;
        if (adminCategoryFilter === "support" && item.type !== "support")
          return false;
        if (
          adminCategoryFilter === "bug" &&
          (item.type !== "feedback" || (item.category !== "bug" && item.category !== "באג"))
        )
          return false;
        if (
          adminCategoryFilter === "improvement" &&
          (item.type !== "feedback" || (item.category !== "improvement" && item.category !== "הצעה לשיפור"))
        )
          return false;
        if (
          adminCategoryFilter === "feature" &&
          (item.type !== "feedback" || (item.category !== "feature" && item.category !== "פיצ'ר חדש"))
        )
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [
    allTickets,
    supportTickets,
    adminFilter,
    adminCategoryFilter,
    searchQuery,
    isAdmin,
  ]);

  const getStatusBadge = (status: string) => {
    const configs: any = {
      received: {
        label: "ממתין",
        classes: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      },
      reviewing: {
        label: "בבדיקה",
        classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      },
      in_progress: {
        label: "בטיפול",
        classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      },
      done: {
        label: "בוצע",
        classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      },
      dismissed: {
        label: "נדחה",
        classes: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      },
      irrelevant: {
        label: "לא רלוונטי",
        classes: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      },
      open: {
        label: "פתוח",
        classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      },
      closed: {
        label: "נענה",
        classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      },
    };
    const config = configs[status] || configs.received;
    return (
      <Badge
        className={cn(
          "px-3 py-1 rounded-full font-black text-[10px] border shadow-sm",
          config.classes,
        )}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <div
        className={cn(
          "w-full relative bg-background font-assistant flex flex-col pb-20 lg:pb-0",
          activeTab === "messages"
            ? "h-[calc(100vh-70px)] md:h-full overflow-hidden pb-16 md:pb-0"
            : "min-h-screen",
        )}
        dir="rtl"
      >
        {/* Page Header */}
        <div className="pt-4 pb-2 px-4 sm:px-6 shrink-0">
          <PageHeader
            icon={MessageSquare}
            title="הודעות וניהול פניות"
            subtitle="ניהול התכתבויות פנימיות ופניות למערכת"
            className="mb-0"
            hideMobile={true}
          />
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Desktop Horizontal Navigation (Replaces Sidebar) */}
          <div className="hidden lg:flex items-center gap-1 sticky top-[-35px] bg-background/95 backdrop-blur z-50 pb-0 overflow-x-auto no-scrollbar pt-2 px-6">
            {isAdmin && (
              <TabItem
                label="ניהול משימות"
                active={activeTab === "admin-view"}
                onClick={() => {
                  setActiveTab("admin-view");
                  setSearchParams({ tab: "admin-view" });
                }}
              />
            )}
            {isAdmin && (
              <TabItem
                label="גיבוי צ'אטים"
                active={activeTab === "chat-admin"}
                onClick={() => {
                  setActiveTab("chat-admin");
                  setSearchParams({ tab: "chat-admin" });
                }}
              />
            )}
            <TabItem
              label="הודעות מפקדים"
              active={activeTab === "messages"}
              onClick={() => {
                setActiveTab("messages");
                setSearchParams({ tab: "messages" });
              }}
              badge={totalUnreadCount}
            />
            {!isAdmin && (
              <TabItem
                label="פנייה חדשה"
                active={activeTab === "send"}
                onClick={() => {
                  setActiveTab("send");
                  setSearchParams({ tab: "send" });
                }}
              />
            )}
            <TabItem
              label={isAdmin ? "ארכיון שלי" : "הפניות שלי"}
              active={activeTab === "my-tickets"}
              onClick={() => {
                setActiveTab("my-tickets");
                setSearchParams({ tab: "my-tickets" });
                fetchMyTickets();
              }}
            />
            <TabItem
              label="מה חדש?"
              active={activeTab === "whats-new"}
              onClick={() => {
                setActiveTab("whats-new");
                setSearchParams({ tab: "whats-new" });
              }}
            />
          </div>

          {/* Main Card */}
          <main
            className={cn(
              "flex-1 px-4 sm:px-6 pb-8 mt-2",
              activeTab === "messages"
                ? "overflow-hidden flex flex-col min-h-0"
                : "overflow-y-auto",
            )}
          >
            <div
              className={cn(
                "overflow-hidden flex flex-col flex-grow",
                activeTab === "messages" ? "flex-1 min-h-0" : "min-h-[600px]",
              )}
            >
              {/* Tab Content */}
              <div
                className={cn(
                  "flex-1",
                  activeTab === "messages"
                    ? "overflow-hidden flex flex-col min-h-0 p-0"
                    : "overflow-y-auto space-y-6 custom-scrollbar p-4 sm:p-6",
                )}
              >
                <AnimatePresence mode="wait">
                  {activeTab === "admin-view" && isAdmin && (
                    <motion.div
                      key="admin-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <PageToolbar>
                        <SearchInput
                          value={searchQuery}
                          onChange={setSearchQuery}
                          placeholder="חיפוש לפי שם, תיאור..."
                          className="max-w-md flex-1"
                        />

                        <FilterSelect
                          label="סטטוס"
                          value={adminFilter}
                          onChange={(val) => setAdminFilter(val as any)}
                          options={[
                            { value: "all", label: "כל הסטטוסים" },
                            { value: "pending", label: "ממתין", color: "#d97706" },
                            { value: "done", label: "טופל", color: "#059669" },
                            { value: "dismissed", label: "ארכיון", color: "#6b7280" },
                          ]}
                        />

                        <FilterSelect
                          label="סוג פנייה"
                          value={adminCategoryFilter}
                          onChange={(val) => setAdminCategoryFilter(val as any)}
                          options={[
                            { value: "all", label: "כל הסוגים" },
                            { value: "bug", label: "באג" },
                            { value: "improvement", label: "שיפור" },
                            { value: "feature", label: "פיצ'ר" },
                            { value: "support", label: "תמיכה" },
                          ]}
                        />

                        <ClearFiltersButton
                          hasActiveFilters={adminFilter !== "all" || adminCategoryFilter !== "all" || !!searchQuery}
                          onClick={() => {
                            setAdminFilter("all");
                            setAdminCategoryFilter("all");
                            setSearchQuery("");
                          }}
                        />

                        <div className="mr-auto flex items-center gap-2">
                          <RefreshButton
                            onClick={isAdmin ? fetchAdminTickets : fetchMyTickets}
                            loading={isLoadingTickets}
                          />

                          {isAdmin && (
                            <Button
                              onClick={() => setAddUpdateOpen(true)}
                              className="h-9 px-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-primary text-white font-black text-xs shadow-2xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              <GitPullRequest className="w-3.5 h-3.5" />
                              <span>עדכון גרסה</span>
                            </Button>
                        </div>
                      </PageToolbar>
                      {/* Stylized Cards List */}
                      <div className="space-y-3">
                        {filteredItems.length === 0 ? (
                          <div className="py-16 flex flex-col items-center justify-center text-center bg-card/10 rounded-[2rem] border border-border/30 backdrop-blur-sm relative overflow-hidden">
                            {/* Graphic visual: modern minimalist envelope ticket */}
                            <div className="relative w-16 h-12 mb-4 flex items-center justify-center">
                              <div className="absolute inset-0 bg-primary/5 rounded-xl border border-primary/20 transform rotate-3" />
                              <div className="absolute inset-0 bg-card rounded-xl border border-border/50 shadow-sm flex flex-col justify-between p-2 transform -rotate-2">
                                <div className="w-8 h-1 bg-primary/20 rounded" />
                                <div className="w-12 h-1 bg-muted-foreground/10 rounded" />
                                <div className="w-6 h-1 bg-muted-foreground/10 rounded" />
                              </div>
                            </div>
                            <h3 className="text-xs font-black text-foreground">
                              אין פניות תואמות
                            </h3>
                            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                              לא נמצאו פניות העונות לסינון שהגדרת.
                            </p>
                          </div>
                        ) : (
                          filteredItems.map((item) => (
                            <Card
                              key={`${item.type}-${item.id}`}
                              onClick={() =>
                                setSelectedItem({ data: item, type: item.type })
                              }
                              className="group bg-card/40 border border-border/40 backdrop-blur-xl rounded-3xl p-4 sm:p-5 hover:bg-card/60 hover:border-primary/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm active:scale-[0.98]"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm sm:text-base shrink-0 border border-primary/20">
                                  {(item.type === "feedback"
                                    ? item.first_name?.[0]
                                    : item.full_name?.[0]) || "U"}
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm text-foreground truncate">
                                      {item.type === "feedback"
                                        ? `${item.first_name} ${item.last_name}`
                                        : item.full_name}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full shrink-0">
                                      {new Date(
                                        item.created_at,
                                      ).toLocaleDateString("he-IL")}
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-muted-foreground line-clamp-1 opacity-70">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-4 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/10">
                                {getStatusBadge(item.status)}
                                <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "messages" && (
                    <motion.div
                      key="messages-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex-grow min-h-0 flex flex-col overflow-hidden rounded-[2rem]"
                    >
                      <div className="flex flex-1 min-h-0 rounded-[2rem] overflow-hidden bg-card/40 backdrop-blur-xl shadow-sm">
                        {/* ── Contacts Sidebar ── */}
                        <div
                          className={cn(
                            "flex flex-col border-l border-border/10 bg-background/50 shrink-0",
                            selectedChatContact
                              ? "hidden md:flex"
                              : "flex w-full md:flex",
                          )}
                          style={
                            !isMobile
                              ? {
                                  width: `${sidebarWidth}px`,
                                  minWidth: "180px",
                                  maxWidth: "500px",
                                }
                              : undefined
                          }
                        >
                          {/* Sidebar Header */}
                          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/10">
                            <span className="text-sm font-black text-foreground">
                              הודעות
                            </span>
                            <button
                              onClick={openGroupModal}
                              className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90 shadow-sm"
                              title="הודעה קבוצתית"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Search */}
                          <div className="px-4 py-3">
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                              <input
                                type="text"
                                placeholder="חיפוש..."
                                value={contactSearch}
                                onChange={(e) =>
                                  setContactSearch(e.target.value)
                                }
                                className="w-full h-8 pr-9 pl-3 bg-muted/30 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all border-none"
                              />
                            </div>
                          </div>

                          {/* Contacts List */}
                          <div className="flex-1 overflow-y-auto divide-y divide-border/5 p-2 space-y-1 custom-scrollbar">
                            {availableCommanders
                              .filter((contact: any) => {
                                const name = contact.is_admin
                                  ? "צוות תמיכה"
                                  : `${contact.first_name} ${contact.last_name}`;
                                return (
                                  !contactSearch ||
                                  name
                                    .toLowerCase()
                                    .includes(contactSearch.toLowerCase())
                                );
                              })
                              .map((contact: any) => {
                                const isSelected =
                                  selectedChatContact?.id === contact.id;
                                const displayName = contact.is_admin
                                  ? "צוות תמיכה"
                                  : `${contact.first_name} ${contact.last_name}`;
                                const lastMsg = internalMessages.find(
                                  (m: any) =>
                                    Number(m.other_id) === Number(contact.id),
                                );
                                const unreadCount = getUnreadCount(contact.id);

                                return (
                                  <button
                                    key={contact.id}
                                    onClick={() => {
                                      setSelectedChatContact(contact);
                                      fetchChatMessages(contact.id);
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right group border border-transparent",
                                      isSelected
                                        ? "bg-primary/10 text-foreground border-primary/20 shadow-sm"
                                        : "hover:bg-muted/40 text-foreground/85",
                                    )}
                                  >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                      <div
                                        className={cn(
                                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all",
                                          isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : contact.is_admin
                                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                              : "bg-muted text-muted-foreground",
                                        )}
                                      >
                                        {contact.is_admin
                                          ? "💬"
                                          : `${contact.first_name?.[0] ?? ""}${contact.last_name?.[0] ?? ""}`}
                                      </div>
                                      {contact.is_online && (
                                        <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                                      )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <h4
                                          className={cn(
                                            "font-black text-xs sm:text-sm transition-colors truncate",
                                            isSelected
                                              ? "text-primary"
                                              : "text-foreground group-hover:text-primary",
                                          )}
                                        >
                                          {displayName}
                                        </h4>
                                        {lastMsg && (
                                          <span className="text-[9px] text-muted-foreground/60 font-bold shrink-0">
                                            {new Date(
                                              lastMsg.created_at,
                                            ).toLocaleTimeString("he-IL", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] text-muted-foreground/75 truncate flex-1 min-w-0 font-medium leading-none text-right">
                                          {lastMsg
                                            ? lastMsg.description
                                            : contact.is_admin
                                              ? "ניהול מערכת"
                                              : contact.department_name ||
                                                "מפקד"}
                                        </p>
                                        {unreadCount > 0 && (
                                          <span className="bg-destructive text-destructive-foreground text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                                            {unreadCount}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            {availableCommanders.length === 0 && (
                              <div className="p-8 text-center text-xs text-muted-foreground font-bold">
                                לא נמצאו אנשי קשר זמינים.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Drag Handle Divider - only visible on desktop (md and up) */}
                        {!isMobile && (
                          <div
                            onMouseDown={startResizing}
                            className="hidden md:block w-1 hover:w-1.5 active:w-1.5 bg-border/40 hover:bg-primary/50 active:bg-primary transition-all cursor-col-resize self-stretch shrink-0 z-20 relative"
                            title="גרור לשינוי גודל"
                          />
                        )}

                        {/* Right: Chat Panel */}
                        <div
                          className={cn(
                            "flex-grow flex flex-col bg-background/20 relative min-w-0",
                            !selectedChatContact
                              ? "hidden md:flex items-center justify-center"
                              : "flex h-full min-h-0",
                          )}
                        >
                          {selectedChatContact ? (
                            <div className="flex flex-col h-full min-h-0 w-full">
                              {/* Chat Header */}
                              <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 bg-background/30 backdrop-blur-md z-10 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Mobile Back Arrow */}
                                  <button
                                    onClick={() => setSelectedChatContact(null)}
                                    className="md:hidden p-1.5 hover:bg-muted/50 rounded-xl transition-all"
                                  >
                                    <ChevronLeft className="w-5 h-5 rotate-180 text-foreground" />
                                  </button>

                                  {/* Avatar */}
                                  <div className="relative shrink-0">
                                    <div
                                      className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs bg-primary text-primary-foreground",
                                      )}
                                    >
                                      {selectedChatContact.is_admin
                                        ? "💬"
                                        : `${selectedChatContact.first_name?.[0] ?? ""}${selectedChatContact.last_name?.[0] ?? ""}`}
                                    </div>
                                    {selectedChatContact.is_online && (
                                      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                                    )}
                                  </div>

                                  {/* Name & Subtitle */}
                                  <div className="min-w-0 text-right">
                                    <h4 className="font-black text-sm text-foreground truncate">
                                      {selectedChatContact.is_admin
                                        ? "צוות תמיכה"
                                        : `${selectedChatContact.first_name} ${selectedChatContact.last_name}`}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground truncate font-semibold">
                                      {selectedChatContact.is_admin
                                        ? "צוות תמיכה וניהול פניות"
                                        : selectedChatContact.department_name ||
                                          "מפקד"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      fetchChatMessages(selectedChatContact.id)
                                    }
                                    disabled={loadingChat}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
                                    title="רענן שיחה"
                                  >
                                    <RefreshCw
                                      className={cn(
                                        "w-4 h-4",
                                        loadingChat && "animate-spin",
                                      )}
                                    />
                                  </button>
                                </div>
                              </div>

                              {/* Messages Area */}
                              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col min-h-0 bg-background/5">
                                {loadingChat && chatMessages.length === 0 ? (
                                  <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                  </div>
                                ) : chatMessages.length === 0 ? (
                                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 gap-2">
                                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                                    <p className="text-xs font-bold">
                                      אין הודעות בשיחה זו עדיין.
                                    </p>
                                    <p className="text-[10px]">
                                      שלח הודעה כדי להתחיל את השיחה!
                                    </p>
                                  </div>
                                ) : (
                                  chatMessages.map((msg: any) => {
                                    const isOwn =
                                      Number(msg.sender_id) ===
                                      Number(currentUser?.id);
                                    return (
                                      <div
                                        key={msg.id}
                                        className={cn(
                                          "flex flex-col max-w-[75%] sm:max-w-[65%]",
                                          isOwn
                                            ? "self-start align-left"
                                            : "self-end align-right",
                                        )}
                                      >
                                        {/* Bubble */}
                                        <div
                                          className={cn(
                                            "p-3 rounded-2xl text-xs font-medium leading-relaxed break-words shadow-sm text-right",
                                            isOwn
                                              ? "bg-primary text-primary-foreground rounded-tl-none"
                                              : "bg-card border border-border/20 text-foreground rounded-tr-none",
                                          )}
                                        >
                                          {msg.description}
                                        </div>
                                        {/* Time */}
                                        <span
                                          className={cn(
                                            "text-[9px] text-muted-foreground/60 font-semibold mt-1 px-1",
                                            isOwn
                                              ? "text-left self-start"
                                              : "text-right self-end",
                                          )}
                                        >
                                          {new Date(
                                            msg.created_at,
                                          ).toLocaleTimeString("he-IL", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    );
                                  })
                                )}
                                <div ref={chatEndRef} />
                              </div>

                              {/* Chat Input Bar */}
                              <div className="p-3 border-t border-border/10 bg-background/30 backdrop-blur-md shrink-0">
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendChat();
                                  }}
                                  className="flex items-end gap-2"
                                >
                                  <textarea
                                    id="chat-textarea"
                                    value={chatInput}
                                    onChange={(e) =>
                                      setChatInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendChat();
                                      }
                                    }}
                                    placeholder="הקלד הודעה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
                                    disabled={sendingChat}
                                    className="flex-1 min-h-[40px] h-11 max-h-[200px] py-2.5 px-4 bg-muted/40 border border-border/20 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground/50 resize-y custom-scrollbar"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!chatInput.trim() || sendingChat}
                                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/95 transition-all active:scale-95 disabled:opacity-40 disabled:scale-100 shrink-0 mb-[2px]"
                                  >
                                    {sendingChat ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4 transform rotate-180" />
                                    )}
                                  </button>
                                </form>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-30 text-center p-6">
                              <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center">
                                <MessageSquare className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-foreground">
                                  התכתבות פנימית
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                  בחר איש קשר מהרשימה כדי להתחיל בשיחה
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "my-tickets" && (
                    <motion.div
                      key="history-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        {myTickets.length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center text-center bg-card/20 rounded-3xl border border-dashed border-border/50">
                            <Archive className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <h3 className="text-sm font-black text-foreground">
                              אין היסטוריית פניות
                            </h3>
                          </div>
                        ) : (
                          myTickets.map((ticket) => (
                            <Card
                              key={ticket.id}
                              className="group bg-card/40 border border-border/40 backdrop-blur-xl rounded-2xl p-4 hover:bg-card/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm text-foreground">
                                    {ticket.category}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                    {new Date(
                                      ticket.created_at,
                                    ).toLocaleDateString("he-IL")}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-muted-foreground line-clamp-1 max-w-xl">
                                  {ticket.description}
                                </p>
                                {ticket.screenshot_url && (
                                  <div className="mt-3 flex items-center gap-3">
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(getScreenshotUrl(ticket.screenshot_url), "_blank");
                                      }}
                                      className="relative w-16 h-12 rounded-xl overflow-hidden border border-border/40 bg-black/5 cursor-pointer hover:border-primary/40 transition-all group shrink-0"
                                    >
                                      <img
                                        src={getScreenshotUrl(ticket.screenshot_url)}
                                        alt="צילום מסך פנייה"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="w-3.5 h-3.5 text-white" />
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground">
                                      צילום מסך מצורף (לחץ להגדלה)
                                    </span>
                                  </div>
                                )}
                                {ticket.admin_reply && (
                                  <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                                    <p className="text-[10px] font-black uppercase text-primary/70 mb-1">
                                      תשובת צוות ניהול
                                    </p>
                                    <p className="text-xs font-bold text-foreground">
                                      {ticket.admin_reply}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="self-start sm:self-center">
                                {getStatusBadge(ticket.status)}
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "chat-admin" && isAdmin && (
                    <motion.div
                      key="chat-admin-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Card className="bg-card/40 border border-border/40 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-black text-foreground">
                            גיבוי התכתבויות
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            כל השיחות הפנימיות — לחץ לצפייה וייצוא
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs font-black"
                          onClick={fetchAllConversations}
                        >
                          <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
                          רענן
                        </Button>
                      </Card>

                      {selectedConvExport ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-xs font-black"
                              onClick={() => {
                                setSelectedConvExport(null);
                                setConvMessages([]);
                              }}
                            >
                              <ChevronLeft className="w-4 h-4 ml-1" />
                              חזרה לרשימה
                            </Button>
                            <span className="text-sm font-black text-foreground">
                              {selectedConvExport.user1_name} ↔{" "}
                              {selectedConvExport.user2_name}
                            </span>
                            <Button
                              size="sm"
                              className="mr-auto rounded-xl text-xs font-black bg-primary hover:bg-primary/90"
                              onClick={() =>
                                handleExportJson(selectedConvExport)
                              }
                            >
                              <Download className="w-3.5 h-3.5 ml-1.5" />
                              ייצוא JSON
                            </Button>
                          </div>
                          <Card className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden">
                            {loadingConv ? (
                              <div className="p-10 text-center text-xs text-muted-foreground">
                                טוען...
                              </div>
                            ) : convMessages.length === 0 ? (
                              <div className="p-10 text-center text-xs text-muted-foreground">
                                אין הודעות
                              </div>
                            ) : (
                              <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
                                {convMessages.map((msg: any) => (
                                  <div key={msg.id} className="p-4 flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                                      {msg.sender_first?.[0]}
                                      {msg.sender_last?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-foreground">
                                          {msg.sender_first} {msg.sender_last}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {new Date(
                                            msg.created_at,
                                          ).toLocaleString("he-IL")}
                                        </span>
                                        {(msg.is_deleted_by_sender ||
                                          msg.is_deleted_by_recipient) && (
                                          <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-bold">
                                            נמחק מהתצוגה
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-foreground">
                                        {msg.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        </div>
                      ) : (
                        <Card className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden">
                          {allConversations.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                              <h3 className="text-sm font-black">
                                אין התכתבויות במערכת
                              </h3>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-border/40">
                                <div className="relative flex-1">
                                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <input
                                    type="text"
                                    placeholder="חיפוש לפי שם..."
                                    value={convSearch}
                                    onChange={(e) =>
                                      setConvSearch(e.target.value)
                                    }
                                    className="w-full h-9 pr-9 pl-4 bg-background/50 border border-border/50 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                                  />
                                </div>
                                <select
                                  value={convSortBy}
                                  onChange={(e) =>
                                    setConvSortBy(e.target.value as any)
                                  }
                                  className="h-9 px-3 bg-background/50 border border-border/50 rounded-xl text-xs font-black text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-auto"
                                >
                                  <option value="name">
                                    מיון לפי שם (א-ת)
                                  </option>
                                  <option value="date">מיון לפי תאריך</option>
                                  <option value="count">
                                    מיון לפי כמות הודעות
                                  </option>
                                </select>
                              </div>
                              {/* Table Header */}
                              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-border/40 bg-muted/20">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  משתתפים
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-24">
                                  הודעות
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-28">
                                  תאריך אחרון
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-28">
                                  פעולות
                                </span>
                              </div>
                              {/* Rows */}
                              <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
                                {sortedConversations.length === 0 ? (
                                  <div className="p-8 text-center text-xs font-bold text-muted-foreground">
                                    לא נמצאו תוצאות לחיפוש.
                                  </div>
                                ) : (
                                  sortedConversations.map(
                                    (conv: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-muted/20 transition-colors"
                                      >
                                        {/* Users */}
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="flex -space-x-2 rtl:space-x-reverse shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border-2 border-card flex items-center justify-center text-[11px] font-black z-10">
                                              {conv.user1_name?.[0]}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-500 border-2 border-card flex items-center justify-center text-[11px] font-black">
                                              {conv.user2_name?.[0]}
                                            </div>
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-black text-foreground leading-tight">
                                              {conv.user1_name}
                                              <span className="mx-1.5 text-muted-foreground/40 font-normal">
                                                ↔
                                              </span>
                                              {conv.user2_name}
                                            </p>
                                          </div>
                                        </div>
                                        {/* Count */}
                                        <div className="flex justify-start sm:justify-center w-24">
                                          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-black px-2.5 py-1 rounded-full border border-primary/20">
                                            <MessageSquare className="w-3 h-3" />
                                            {conv.total_messages}
                                          </span>
                                        </div>
                                        {/* Date */}
                                        <div className="hidden sm:flex justify-center w-28">
                                          <span className="text-[11px] text-muted-foreground font-bold">
                                            {conv.last_message_at
                                              ? new Date(
                                                  conv.last_message_at,
                                                ).toLocaleDateString("he-IL")
                                              : "—"}
                                          </span>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 justify-start sm:justify-center w-28">
                                          <button
                                            className="h-7 px-2.5 rounded-lg text-[11px] font-black text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                                            onClick={() => {
                                              setSelectedConvExport(conv);
                                              fetchConvMessages(
                                                conv.user1_id,
                                                conv.user2_id,
                                              );
                                            }}
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            צפה
                                          </button>
                                          <button
                                            className="h-7 px-2.5 rounded-lg text-[11px] font-black text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
                                            onClick={async () => {
                                              setSelectedConvExport(conv);
                                              await fetchConvMessages(
                                                conv.user1_id,
                                                conv.user2_id,
                                              );
                                              handleExportJson(conv);
                                            }}
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            ייצא
                                          </button>
                                        </div>
                                      </div>
                                    ),
                                  )
                                )}
                              </div>
                            </>
                          )}
                        </Card>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "whats-new" && (
                    <motion.div
                      key="whats-new-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-foreground">
                              עדכוני מערכת
                            </h3>
                            <p className="text-[10px] text-muted-foreground">
                              כל הגרסאות שהושקו
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={fetchSystemUpdates}
                            disabled={isLoadingUpdates}
                            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all outline-none"
                          >
                            <RefreshCw
                              className={cn(
                                "w-3.5 h-3.5",
                                isLoadingUpdates && "animate-spin",
                              )}
                            />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setAddUpdateOpen(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-primary text-white font-black text-[11px] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              הוסף עדכון
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Updates List */}
                      {isLoadingUpdates ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                        </div>
                      ) : systemUpdates.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center bg-card/20 rounded-3xl border border-dashed border-border/50">
                          <Activity className="w-10 h-10 text-primary/40 mb-3" />
                          <h3 className="text-base font-black text-foreground">
                            אין עדכונים עדיין
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            המערכת מעודכנת לגרסה האחרונה.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {systemUpdates.map((upd: any, idx: number) => {
                            let features: string[] = [];
                            try {
                              features =
                                typeof upd.features === "string"
                                  ? JSON.parse(upd.features)
                                  : upd.features;
                            } catch {
                              features = Array.isArray(upd.features)
                                ? upd.features
                                : [];
                            }

                            const isLatest = idx === 0;
                            return (
                              <div
                                key={upd.id}
                                className={cn(
                                  "group relative rounded-2xl border p-4 sm:p-5 transition-all",
                                  isLatest
                                    ? "bg-gradient-to-br from-primary/5 via-primary/8 to-transparent border-primary/20 shadow-sm shadow-primary/10"
                                    : "bg-card/40 border-border/40 hover:border-border/60",
                                )}
                              >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-3 gap-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-xl font-black tracking-tight",
                                        isLatest
                                          ? "text-primary"
                                          : "text-foreground",
                                      )}
                                    >
                                      {upd.version}
                                    </span>
                                    {isLatest && (
                                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase tracking-widest">
                                        חדש
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-bold text-muted-foreground">
                                      {new Date(
                                        upd.release_date,
                                      ).toLocaleDateString("he-IL", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </span>
                                    {isAdmin && (
                                      <button
                                        onClick={() =>
                                          handleDeleteSystemUpdate(upd.id)
                                        }
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all outline-none"
                                        title="מחק עדכון"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {/* Features List */}
                                <ul className="space-y-2">
                                  {features.map((f: string, fi: number) => (
                                    <li
                                      key={fi}
                                      className="flex items-start gap-2.5 text-sm text-foreground/80 font-medium leading-relaxed"
                                    >
                                      <div
                                        className={cn(
                                          "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                          isLatest
                                            ? "bg-primary"
                                            : "bg-muted-foreground/40",
                                        )}
                                      />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "send" && (
                    <motion.div
                      key="send-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 w-full"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        {/* Right Column: The Form Card (lg:col-span-8) */}
                        <Card className="lg:col-span-8 bg-card/50 border border-border/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 space-y-4 text-right">
                          <div className="space-y-0.5 pb-1 border-b border-border/20">
                            <h3 className="text-sm font-black text-foreground">שליחת פנייה לצוות</h3>
                            <p className="text-[11px] text-muted-foreground">
                              אנחנו כאן כדי לשמוע אותך. הפידבק שלך בונה את המערכת.
                            </p>
                          </div>

                          <form onSubmit={handleSubmitTicket} className="space-y-4">
                            {/* Category */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">
                                סוג הפנייה
                              </label>
                              <div className="flex gap-2">
                                {["באג", "הצעה לשיפור", "פיצ'ר חדש"].map((cat) => (
                                  <button
                                    type="button"
                                    key={cat}
                                    onClick={() => setTicketCategory(cat)}
                                    className={cn(
                                      "flex-1 py-2 px-2 rounded-xl text-[11px] font-black transition-all duration-200 border",
                                      ticketCategory === cat
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-card/40 border-border/20 text-muted-foreground hover:bg-muted/50",
                                    )}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">
                                תיאור הפנייה
                              </label>
                              <textarea
                                placeholder="ספרו לנו מה אפשר לשפר..."
                                value={ticketDescription}
                                onChange={(e) => setTicketDescription(e.target.value)}
                                className="w-full min-h-[110px] resize-none rounded-xl border border-border/30 bg-background/40 text-sm text-right p-3 leading-relaxed focus:bg-background focus:border-primary/30 transition-all font-medium placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary/10"
                                required
                              />
                            </div>

                            {/* Screenshot */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">
                                צרף צילום מסך (אופציונלי)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setScreenshotFile(file);
                                    setScreenshotPreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="hidden"
                                id="screenshot-upload"
                              />
                              <label
                                htmlFor="screenshot-upload"
                                className="flex items-center justify-center gap-2 h-9 px-3 border border-dashed border-border/40 hover:border-primary/30 rounded-xl cursor-pointer bg-background/20 hover:bg-primary/5 transition-all text-[11px] font-bold text-muted-foreground hover:text-primary"
                              >
                                <span>📎 לחץ להעלאת תמונה / צילום מסך</span>
                              </label>

                              {screenshotPreview && (
                                <div className="relative rounded-xl overflow-hidden border border-border/50 max-h-36 flex items-center justify-center bg-muted/10 p-1">
                                  <img
                                    src={screenshotPreview}
                                    alt="תצוגה מקדימה"
                                    className="max-h-32 object-contain rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-destructive text-destructive-foreground rounded-lg flex items-center justify-center transition-all active:scale-90 shadow"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <Button
                              type="submit"
                              disabled={isSendingTicket || !ticketDescription.trim()}
                              className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              {isSendingTicket ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5 transform rotate-180 shrink-0" />
                                  שליחת פנייה לצוות
                                </>
                              )}
                            </Button>
                          </form>
                        </Card>

                        {/* Left Column: Guidelines Card (lg:col-span-4) */}
                        <Card className="lg:col-span-4 bg-card/50 border border-border/30 backdrop-blur-xl rounded-2xl p-4 sm:p-5 space-y-4 text-right">
                          <div className="space-y-0.5 pb-1 border-b border-border/20">
                            <h3 className="text-sm font-black text-primary">מדריך לפנייה יעילה</h3>
                            <p className="text-[11px] text-muted-foreground">
                              עקבו אחר הדגשים לטיפול מהיר יותר.
                            </p>
                          </div>

                          <div className="space-y-3">
                            {[
                              {
                                title: "פירוט שלבי התקלה",
                                desc: "מה ניסיתם, מה קרה, ומה הציפייה.",
                                icon: MessageSquare,
                              },
                              {
                                title: "צירוף צילום מסך",
                                desc: "מקצר את זמן איתור הבאג משמעותית.",
                                icon: Eye,
                              },
                              {
                                title: "פנייה ישירה למפתחים",
                                desc: "אינו מיועד להודעות פיקודיות.",
                                icon: ShieldCheck,
                              },
                            ].map((item, idx) => {
                              const IconComp = item.icon;
                              return (
                                <div key={idx} className="flex gap-3 items-start">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                    <IconComp className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <h4 className="text-[11px] font-black text-foreground">{item.title}</h4>
                                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-black text-primary mb-0.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>טיפ מועיל</span>
                            </p>
                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                              עקבו אחר הסטטוס תחת "הפניות שלי".
                            </p>
                          </div>
                        </Card>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* end tab content */}
            </div>
          </main>
        </div>{" "}
        {/* Close the extra flex-1 flex-col div wrapper */}
        {/* Detail Slider */}
        <AnimatePresence>
          {selectedItem && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-card border-r border-border/50 shadow-2xl z-[250] flex flex-col"
              >
                <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between bg-card/50 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-foreground truncate max-w-[180px] sm:max-w-none">
                        {selectedItem.type === "feedback"
                          ? `${(selectedItem.data as any).first_name} ${(selectedItem.data as any).last_name}`
                          : (selectedItem.data as any).full_name}
                      </h3>
                      <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {selectedItem.type === "feedback"
                          ? "פניית משוב"
                          : "שיחת תמיכה"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      תוכן הפנייה
                    </label>
                    <div className="p-4 bg-muted/30 rounded-2xl text-sm font-medium leading-relaxed text-foreground border border-border/50">
                      {selectedItem.data.description}
                    </div>
                  </div>
                  {selectedItem.type === "feedback" && selectedItem.data.screenshot_url && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        צילום מסך מצורף
                      </label>
                      <div className="relative rounded-2xl overflow-hidden border border-border/50 max-h-[300px] flex items-center justify-center bg-black/5 hover:bg-black/10 transition-all cursor-pointer group">
                        <img
                          src={getScreenshotUrl(selectedItem.data.screenshot_url)}
                          alt="צילום מסך פנייה"
                          className="max-w-full max-h-[300px] object-contain"
                          onClick={() => window.open(getScreenshotUrl(selectedItem.data.screenshot_url), "_blank")}
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Eye className="w-5 h-5 text-white" />
                          <span className="text-xs font-black text-white">לחץ להגדלה</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      מענה רשמי
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="כתוב כאן את התשובה..."
                      className="w-full h-32 p-4 bg-background border border-border/50 rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                    <Button
                      onClick={handleAdminReply}
                      className="w-full h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      שליחת מענה
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Compose Message Dialog */}
        <AnimatePresence>
          {composeOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setComposeOpen(false)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-[850px] max-h-[90vh] bg-card border border-border/50 rounded-3xl shadow-2xl z-[250] overflow-hidden flex flex-col"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-center p-6 md:p-8 pb-4 border-b border-border/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center rotate-3">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-foreground tracking-tight">
                        הודעה חדשה
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        שלח הודעה פנימית למפקד
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
                  {/* Right Column: Recipient Selection */}
                  <div className="w-full md:w-[45%] flex flex-col border-b md:border-b-0 md:border-l border-border/50 bg-muted/10 p-6 md:p-8">
                    <div className="space-y-4 flex flex-col h-full">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1 shrink-0">
                        בחירת נמען
                      </label>

                      {availableCommanders.length > 0 ? (
                        <div className="flex flex-col h-full overflow-hidden space-y-3">
                          <div className="relative shrink-0">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="חיפוש לפי שם..."
                              value={recipientSearch}
                              onChange={(e) => setRecipientSearch(e.target.value)}
                              className="w-full h-10 pr-9 pl-4 bg-background border border-border/50 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                          </div>

                          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-[150px]">
                            {availableCommanders
                              .filter(
                                (c) =>
                                  !recipientSearch ||
                                  `${c.is_admin ? "צוות תמיכה" : c.first_name + " " + c.last_name}`
                                    .toLowerCase()
                                    .includes(recipientSearch.toLowerCase()),
                              )
                              .map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => setComposeTo(c.id.toString())}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border text-right",
                                    composeTo === c.id.toString()
                                      ? "bg-primary/10 border-primary/20 shadow-sm"
                                      : "bg-background border-transparent hover:bg-muted/50 hover:border-border/50",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-[11px] shrink-0 transition-colors",
                                      composeTo === c.id.toString()
                                        ? "bg-primary text-white"
                                        : c.is_admin
                                          ? "bg-emerald-500/10 text-emerald-600"
                                          : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {c.first_name?.[0]}
                                    {c.last_name?.[0]}
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-bold text-foreground truncate">
                                      {c.first_name} {c.last_name}
                                    </span>
                                    <span className="text-[9px] font-medium text-muted-foreground truncate">
                                      {c.department_name || "מפקד"}
                                    </span>
                                  </div>
                                  {composeTo === c.id.toString() && (
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                  )}
                                </button>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background border border-dashed border-border rounded-2xl">
                          <p className="text-xs font-bold text-muted-foreground">
                            לא נמצאו נמענים זמינים.
                          </p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1">
                            יש להוסיף שוטרים/מפקדים למערכת כדי להתחיל התכתבות.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Left Column: Message Content */}
                  <div className="w-full md:w-[55%] flex flex-col p-6 md:p-8">
                    <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
                          נושא ההודעה
                        </label>
                        <input
                          type="text"
                          value={composeTitle}
                          onChange={(e) => setComposeTitle(e.target.value)}
                          placeholder="הזן כותרת עניינית..."
                          className="w-full h-12 px-4 bg-muted/30 border border-border/50 rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-1.5 flex-1 flex flex-col">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
                          תוכן ההודעה
                        </label>
                        <textarea
                          value={composeDesc}
                          onChange={(e) => setComposeDesc(e.target.value)}
                          placeholder="כתוב את הודעתך כאן..."
                          className="w-full flex-1 min-h-[160px] p-4 bg-muted/30 border border-border/50 rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all resize-none outline-none custom-scrollbar"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSendInternalMessage}
                      disabled={!composeTo || !composeTitle || !composeDesc}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-6 shrink-0"
                    >
                      <Send className="w-5 h-5 ml-2" />
                      שלח הודעה כעת
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* ==================== ADD SYSTEM UPDATE DIALOG ==================== */}
        <AnimatePresence>
          {addUpdateOpen && isAdmin && (
            <>
              {/* Backdrop */}
              <motion.div
                key="add-update-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAddUpdateOpen(false)}
                className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
              />
              {/* Dialog */}
              <motion.div
                key="add-update-dialog"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed inset-0 z-[121] flex items-center justify-center p-4"
                style={{ pointerEvents: "none" }}
              >
                <div
                  className="relative w-full max-w-md bg-card rounded-3xl border border-border/40 shadow-2xl p-6 flex flex-col gap-5"
                  style={{ pointerEvents: "auto" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Activity className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-black text-base text-foreground">
                          פרסום עדכון גרסה
                        </h2>
                        <p className="text-[10px] text-muted-foreground">
                          הוספת עדכון חדש לכל משתמשי המערכת
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAddUpdateOpen(false)}
                      className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground transition-all outline-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Version + Date Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        גרסה
                      </label>
                      <input
                        type="text"
                        value={newUpdateVersion}
                        onChange={(e) => setNewUpdateVersion(e.target.value)}
                        placeholder="לדוגמה: v2.4.1"
                        className="w-full h-11 px-3 bg-background border border-border/50 rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        תאריך שחרור
                      </label>
                      <input
                        type="date"
                        value={newUpdateDate}
                        onChange={(e) => setNewUpdateDate(e.target.value)}
                        className="w-full h-11 px-3 bg-background border border-border/50 rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      פיצ'רים ושינויים
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {newUpdateFeatures.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => {
                              const upd = [...newUpdateFeatures];
                              upd[idx] = e.target.value;
                              setNewUpdateFeatures(upd);
                            }}
                            placeholder={`שינוי ${idx + 1}...`}
                            className="flex-1 h-10 px-3 bg-background border border-border/50 rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          />
                          {newUpdateFeatures.length > 1 && (
                            <button
                              onClick={() =>
                                setNewUpdateFeatures(
                                  newUpdateFeatures.filter((_, i) => i !== idx),
                                )
                              }
                              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all outline-none shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        setNewUpdateFeatures([...newUpdateFeatures, ""])
                      }
                      className="flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors outline-none mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      הוסף שינוי נוסף
                    </button>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleAddSystemUpdate}
                    disabled={
                      !newUpdateVersion ||
                      !newUpdateDate ||
                      newUpdateFeatures.every((f) => !f.trim()) ||
                      isSubmittingUpdate
                    }
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-primary text-white font-black text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                  >
                    {isSubmittingUpdate ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                        פרסם עדכון
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Mobile Bottom Navigation Bar - Standard Fixed */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border flex justify-around items-center h-16 px-2 safe-area-bottom">
          {isAdmin && (
            <MobileBottomNavLink
              label="ניהול"
              icon={Settings}
              active={activeTab === "admin-view"}
              onClick={() => {
                setActiveTab("admin-view");
                setSearchParams({ tab: "admin-view" });
              }}
            />
          )}
          {isAdmin && (
            <MobileBottomNavLink
              label="גיבוי"
              icon={ShieldCheck}
              active={activeTab === "chat-admin"}
              onClick={() => {
                setActiveTab("chat-admin");
                setSearchParams({ tab: "chat-admin" });
              }}
            />
          )}
          <MobileBottomNavLink
            label="הודעות"
            icon={MessageSquare}
            active={activeTab === "messages"}
            onClick={() => {
              setActiveTab("messages");
              setSearchParams({ tab: "messages" });
            }}
            badge={totalUnreadCount}
          />
          <MobileBottomNavLink
            label={isAdmin ? "ארכיון" : "הפניות שלי"}
            icon={History}
            active={activeTab === "my-tickets"}
            onClick={() => {
              setActiveTab("my-tickets");
              setSearchParams({ tab: "my-tickets" });
              fetchMyTickets();
            }}
          />
          {!isAdmin && (
            <MobileBottomNavLink
              label="פנייה"
              icon={Send}
              active={activeTab === "send"}
              onClick={() => {
                setActiveTab("send");
                setSearchParams({ tab: "send" });
              }}
            />
          )}
          <MobileBottomNavLink
            label="מה חדש?"
            icon={Activity}
            active={activeTab === "whats-new"}
            onClick={() => {
              setActiveTab("whats-new");
              setSearchParams({ tab: "whats-new" });
            }}
          />
        </div>
      </div>
    </>
  );
};

function TabItem({
  id,
  label,
  active,
  onClick,
  className,
  badge,
}: {
  id?: string;
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
  badge?: number;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={cn(
        "relative px-4 py-2.5 rounded-lg transition-all font-bold text-sm whitespace-nowrap",
        active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="bg-destructive text-destructive-foreground text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {badge}
          </span>
        )}
      </div>
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full mx-2" />
      )}
    </button>
  );
}

function MobileBottomNavLink({
  id,
  label,
  icon: Icon,
  active,
  onClick,
  badge,
}: {
  id?: string;
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div
        className={`p-1.5 rounded-xl transition-all ${active ? "bg-primary/10" : "bg-transparent"}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-[calc(50%-18px)] bg-destructive text-destructive-foreground text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full " />
      )}
    </button>
  );
}

function StatItem({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bgColor,
  className,
}: any) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-between bg-card border-border/50 hover:-translate-y-0.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-primary/40 hover:shadow-md active:translate-y-0 active:scale-[0.98] active:bg-slate-200/80 dark:active:bg-slate-750",
        className,
      )}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <div className="space-y-0.5 text-right min-w-0 flex-1">
          <p className="text-[9px] sm:text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wide leading-none truncate">
            {label}
          </p>
          <p
            className={cn(
              "text-base sm:text-xl font-black tracking-tight leading-none mt-1",
              color || "text-foreground",
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground/50 leading-none mt-1">
              {sub}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 shadow-sm",
            bgColor,
          )}
        >
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", color)} />
        </div>
      </div>
    </Card>
  );
}

export default FeedbackPage;
