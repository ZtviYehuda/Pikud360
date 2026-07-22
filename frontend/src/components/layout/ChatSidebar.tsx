import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  Loader2, 
  MessageSquare,
  MoreVertical,
  Phone,
  CheckCheck,
  ChevronLeft,
  Search,
  Trash2, 
  UserCircle,
  Users
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/config/api.client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  title: string;
  description: string;
  created_at: string;
  sender_first: string;
  sender_last: string;
}

export const ChatSidebar: React.FC = () => {
  const { isChatOpen, selectedRecipient, closeChat, openChat, openGroupModal } = useChat();
  const { employees, chatContacts, openProfile, refreshReferenceData } = useEmployeeContext();
  const { user } = useAuthContext();
  const { alerts, markAsRead, refreshAlerts } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoOpenAttemptedRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Click outside detection to close the sidebar on desktop
  useEffect(() => {
    if (!isChatOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside the sidebar, or on chat trigger buttons
      const isTriggerClick = target.closest("#chat-button") || target.closest("#mobile-broadcast-button") || target.closest("#broadcast-button");
      
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        !isTriggerClick
      ) {
        closeChat();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isChatOpen, closeChat]);

  // Real-time Chat States
  const [recipientPresence, setRecipientPresence] = useState<{
    is_online: boolean;
    chat_status: string;
    chat_status_custom: string | null;
    is_typing: boolean;
  } | null>(null);

  const [isMeTyping, setIsMeTyping] = useState(false);
  const typingTimeoutRef = useRef<any | null>(null);

  // My own Status States
  const [myStatus, setMyStatus] = useState<string>("online");
  const [myCustomStatus, setMyCustomStatus] = useState<string>("");
  const [isEditingCustomStatus, setIsEditingCustomStatus] = useState(false);

  // Sync initial status from user context
  useEffect(() => {
    if (user) {
      setMyStatus((user as any).chat_status || "online");
      setMyCustomStatus((user as any).chat_status_custom || "");
    }
  }, [user]);

  // Handle typing state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isMeTyping) {
      setIsMeTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsMeTyping(false);
    }, 3000);
  };

  // Reset the auto-open tracker when the chat sidebar is closed
  useEffect(() => {
    if (!isChatOpen) {
      autoOpenAttemptedRef.current = false;
    }
  }, [isChatOpen]);

  // Refresh alerts when chat sidebar is opened
  useEffect(() => {
    if (isChatOpen) {
      refreshAlerts();
    }
  }, [isChatOpen]);

  // Mark alerts as read when a conversation is opened or when alerts update while chat is open
  useEffect(() => {
    if (isChatOpen && selectedRecipient && alerts.length > 0) {
      alerts.forEach(alert => {
        if (alert.id.startsWith("msg-") && Number(alert.data?.sender_id) === Number(selectedRecipient.id)) {
          markAsRead(alert.id);
        }
      });
    }
  }, [isChatOpen, selectedRecipient, alerts, markAsRead]);

  // Auto-open conversation if there is an unread message from a contact and we just opened the chat
  useEffect(() => {
    if (isChatOpen && !selectedRecipient && !autoOpenAttemptedRef.current && alerts.length > 0 && chatContacts.length > 0) {
      const msgAlerts = alerts.filter(a => a.id.startsWith("msg-"));
      if (msgAlerts.length > 0) {
        // Find the sender_id of the most recent message alert
        const firstAlert = msgAlerts[0];
        const senderId = Number(firstAlert.data?.sender_id);
        if (senderId) {
          const contact = chatContacts.find((c: any) => Number(c.id) === senderId) || 
                          employees.find((e: any) => Number(e.id) === senderId);
          if (contact) {
            autoOpenAttemptedRef.current = true;
            openChat({
              id: contact.id,
              name: contact.is_admin ? "צוות תמיכה" : `${contact.first_name} ${contact.last_name}`,
              role: contact.is_admin ? "ניהול מערכת" : "מפקד"
            });
          }
        }
      }
    }
  }, [isChatOpen, selectedRecipient, alerts, chatContacts, employees, openChat]);

  // Poll for messages
  useEffect(() => {
    if (isChatOpen && selectedRecipient) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 5000); // Polling for new messages
      return () => clearInterval(interval);
    }
  }, [isChatOpen, selectedRecipient]);

  // Poll for recipient presence + send my typing state
  useEffect(() => {
    if (isChatOpen && selectedRecipient) {
      const sendChatHeartbeat = async () => {
        try {
          const { data } = await apiClient.post("/employees/chat/heartbeat", {
            recipient_id: selectedRecipient.id,
            is_typing: isMeTyping && newMessage.trim().length > 0
          });
          if (data.success && data.recipient) {
            setRecipientPresence(data.recipient);
          }
        } catch (err) {
          console.error("Chat heartbeat failed:", err);
        }
      };

      sendChatHeartbeat();
      const heartbeatInterval = setInterval(sendChatHeartbeat, 3000); // Heartbeat every 3s
      return () => clearInterval(heartbeatInterval);
    }
  }, [isChatOpen, selectedRecipient, isMeTyping, newMessage]);

  // Poll for all contacts status updates when viewing contacts list
  useEffect(() => {
    if (isChatOpen && !selectedRecipient) {
      const interval = setInterval(() => {
        refreshReferenceData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, selectedRecipient, refreshReferenceData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversation = async () => {
    if (!selectedRecipient) return;
    try {
      const { data } = await apiClient.get(`/notifications/messages/conversation/${selectedRecipient.id}`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedRecipient || sending) return;

    setSending(true);
    setIsMeTyping(false);
    try {
      await apiClient.post("/notifications/send", {
        recipient_id: selectedRecipient.id,
        title: "הודעה חדשה בצ'אט",
        description: newMessage.trim(),
      });
      setNewMessage("");
      fetchConversation();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string, customText?: string) => {
    try {
      setMyStatus(status);
      const text = status === "custom" ? (customText !== undefined ? customText : myCustomStatus) : null;
      if (status !== "custom") {
        setMyCustomStatus("");
      }
      await apiClient.put("/employees/chat/status", {
        chat_status: status,
        chat_status_custom: text
      });
      toast.success("הסטטוס שלך עודכן בהצלחה");
      if (user) {
        (user as any).chat_status = status;
        (user as any).chat_status_custom = text || undefined;
      }
    } catch (err) {
      toast.error("שגיאה בעדכון הסטטוס");
    }
  };

  const handleClearHistory = async () => {
    if (!selectedRecipient) return;
    if (!confirm("האם אתה בטוח שברצונך למחוק את כל היסטוריית ההתכתבות עם משתמש זה? פעולה זו אינה ניתנת לביטול.")) return;
    
    try {
      await apiClient.delete(`/notifications/messages/conversation/${selectedRecipient.id}`);
      setMessages([]);
      toast.success("היסטוריית ההתכתבות נמחקה");
    } catch (err) {
      toast.error("שגיאה במחיקת היסטוריית ההתכתבות");
    }
  };

  // Helper to determine status dot color for a contact
  const getStatusDotColor = (emp: any) => {
    if (!emp.is_online) return "bg-slate-300 dark:bg-slate-600";
    switch (emp.chat_status) {
      case "online": return "bg-emerald-500 animate-pulse";
      case "busy": return "bg-rose-500";
      case "away": return "bg-amber-500";
      default: return "bg-emerald-500 animate-pulse";
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] sm:hidden"
          />

          {/* Window Panel */}
          <motion.div
            id="chat-sidebar-container"
            ref={sidebarRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-4 sm:bottom-6 sm:left-6 sm:right-auto sm:inset-x-auto w-auto sm:w-[420px] h-[calc(100dvh-32px)] sm:h-[650px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[250] flex flex-col border border-border overflow-hidden"
            dir="rtl"
          >
            {selectedRecipient ? (
              <>
                {/* Header for Conversation */}
                <div className="p-4 sm:p-5 bg-card border-b border-border/40 text-foreground flex items-center justify-between shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => { openChat(null as any); setRecipientPresence(null); }} className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                      <ChevronLeft className="w-5 h-5 rotate-180" />
                    </Button>
                    <div 
                      className="relative cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => selectedRecipient && openProfile(selectedRecipient.id)}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-black">
                        {selectedRecipient.name?.[0]}
                      </div>
                      {/* Realtime Status indicator */}
                      <div className={cn("absolute -bottom-0.5 -left-0.5 w-3 h-3 border-2 border-card rounded-full",
                        recipientPresence?.is_online ? (
                          recipientPresence.chat_status === "busy" ? "bg-rose-400" :
                          recipientPresence.chat_status === "away" ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                        ) : "bg-slate-400"
                      )} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-black text-xs sm:text-sm text-foreground leading-tight">
                        {selectedRecipient.name}
                      </h3>
                      <span className="text-[10px] font-bold text-muted-foreground/80 leading-none mt-0.5">
                        {recipientPresence?.is_typing ? (
                          <span className="animate-pulse text-emerald-500 font-black">מקליד/ה...</span>
                        ) : recipientPresence ? (
                          recipientPresence.is_online ? (
                            recipientPresence.chat_status === "busy" ? "🔴 עסוק/ה" :
                            recipientPresence.chat_status === "away" ? "🟡 לא נמצא/ת" :
                            recipientPresence.chat_status_custom ? `💬 ${recipientPresence.chat_status_custom}` : "🟢 פעיל/ה כעת"
                          ) : "⚫ לא פעיל/ה"
                        ) : (
                          selectedRecipient.role || "טוען..."
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedRecipient && (
                      <>
                        {(() => {
                          const emp = employees?.find(e => e.id === selectedRecipient.id) || chatContacts?.find(e => e.id === selectedRecipient.id);
                          if (emp?.phone_number) {
                            return (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                                onClick={() => window.location.href = `tel:${emp.phone_number}`}
                                title={`חיוג ל-${emp.phone_number}`}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1 rounded-2xl shadow-2xl border-border/40 backdrop-blur-xl bg-card/95 z-[300]" align="start">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (selectedRecipient) {
                                openProfile(selectedRecipient.id);
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-muted rounded-xl transition-colors text-right w-full"
                          >
                            <UserCircle className="w-4 h-4 text-primary" />
                            <span>צפה בפרופיל מלא</span>
                          </button>
                          
                          <div className="h-px bg-border/40 my-1" />
                          
                          <button
                            onClick={handleClearHistory}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-destructive/10 text-destructive rounded-xl transition-colors text-right w-full"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>מחק היסטוריית צ'אט</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" onClick={closeChat} className="h-9 w-9 rounded-xl text-white/80 hover:bg-white/20 hover:text-white">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10 custom-scrollbar"
                >
                  {loading ? (
                    <div className="h-full flex items-center justify-center opacity-30">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <h4 className="font-black text-sm mb-1">אין היסטוריית התכתבות</h4>
                      <p className="text-xs font-bold leading-relaxed">שלח הודעה ראשונה כדי להתחיל את השיחה.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4">
                       <div className="flex justify-center my-4">
                         <span className="text-[10px] font-black text-muted-foreground/60 uppercase bg-muted/30 px-3 py-1 rounded-full border border-border/40">היום</span>
                       </div>
                       {messages.map((msg, idx) => {
                          const isMe = Number(msg.sender_id) === Number(user?.id);
                          const nextIsMe = Number(messages[idx+1]?.sender_id) === Number(msg.sender_id);
                          return (
                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={msg.id} className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", isMe ? "self-start items-end" : "self-end items-start")}>
                              {!nextIsMe && <span className="text-[9px] font-bold text-muted-foreground mb-1 mx-1">{format(new Date(msg.created_at), "HH:mm", { locale: he })}</span>}
                              <div className={cn("p-3 sm:p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm", isMe ? "bg-primary/10 text-primary border border-primary/20 rounded-tl-lg" : "bg-card border border-border/40 text-foreground rounded-tr-lg")}>
                                {msg.description}
                                {isMe && <div className="flex justify-end mt-1 opacity-70"><CheckCheck className="w-3.5 h-3.5" /></div>}
                              </div>
                            </motion.div>
                          );
                       })}
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 sm:p-6 border-t border-border/50 bg-card shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-muted/30 border border-border/50 rounded-2xl p-2 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                    <Input value={newMessage} onChange={handleInputChange} placeholder="הקלד הודעה..." className="border-none bg-transparent focus-visible:ring-0 shadow-none text-right font-bold text-sm min-h-[44px] h-auto py-2" />
                    <Button type="submit" disabled={!newMessage.trim() || sending} size="icon" className={cn("rounded-xl h-10 w-10 shrink-0 shadow-lg transition-all active:scale-95", newMessage.trim() ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <>

                {/* Header for Contacts List */}
                <div className="p-6 bg-card border-b border-border/40 shadow-sm shrink-0 rounded-t-[2.5rem]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xl text-foreground tracking-tight">הודעות</h3>
                    <div className="flex items-center gap-2">
                      {/* Group Message Button */}
                      <Button
                        id="group-message-btn"
                        variant="ghost"
                        size="icon"
                        onClick={openGroupModal}
                        title="שלח הודעה קבוצתית"
                        className="relative w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary/20 p-0 shrink-0"
                      >
                        <Users className="w-4 h-4" />
                      </Button>

                      {/* Self Status Popover in Header */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            id="chat-status-avatar-btn"
                            variant="ghost" 
                            className="relative w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary/20 p-0 font-black text-xs shrink-0"
                            title="עדכן סטטוס פרופיל"
                          >
                            {user?.is_admin ? "💬" : `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`}
                            <div className={cn("absolute -bottom-0.5 -left-0.5 w-3 h-3 border-2 border-primary rounded-full",
                              myStatus === "online" ? "bg-emerald-500 animate-pulse" :
                              myStatus === "busy" ? "bg-rose-500" :
                              myStatus === "away" ? "bg-amber-500" : 
                              myStatus === "custom" ? "bg-indigo-500" : "bg-slate-400"
                            )} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4 rounded-3xl shadow-2xl border-border/40 backdrop-blur-xl bg-card/95 z-[300]" align="end">
                          <div className="flex flex-col gap-3 text-right" dir="rtl">
                            <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-black text-sm shrink-0">
                                {user?.is_admin ? "💬" : `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <h4 className="font-black text-sm text-foreground truncate">{user?.first_name} {user?.last_name}</h4>
                                <span className="text-[10px] text-muted-foreground font-bold leading-none mt-0.5">
                                  {user?.is_admin ? "ניהול מערכת" : user?.is_commander ? "מפקד" : "שוטר"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                                <span className={cn("w-2 h-2 rounded-full",
                                  myStatus === "online" ? "bg-emerald-500" :
                                  myStatus === "busy" ? "bg-rose-500" :
                                  myStatus === "away" ? "bg-amber-500" : "bg-indigo-500"
                                )} />
                                סטטוס פעילות: <span className="text-muted-foreground font-bold">{
                                  myStatus === "online" ? "מחובר/ת" :
                                  myStatus === "busy" ? "עסוק/ה" :
                                  myStatus === "away" ? "לא נמצא/ת" :
                                  myCustomStatus ? `💬 ${myCustomStatus}` : "סטטוס מותאם"
                                }</span>
                              </span>
                              
                              <div className="grid grid-cols-2 gap-1.5 mt-1">
                                <Button 
                                  variant={myStatus === "online" ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => handleUpdateStatus("online")}
                                  className="h-8 text-[11px] font-black rounded-xl"
                                >
                                  🟢 מחובר
                                </Button>
                                <Button 
                                  variant={myStatus === "busy" ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => handleUpdateStatus("busy")}
                                  className="h-8 text-[11px] font-black rounded-xl"
                                >
                                  🔴 עסוק
                                </Button>
                                <Button 
                                  variant={myStatus === "away" ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => handleUpdateStatus("away")}
                                  className="h-8 text-[11px] font-black rounded-xl"
                                >
                                  🟡 לא נמצא
                                </Button>
                                <Button 
                                  variant={myStatus === "custom" ? "default" : "outline"} 
                                  size="sm"
                                  onClick={() => setIsEditingCustomStatus(true)}
                                  className="h-8 text-[11px] font-black rounded-xl"
                                >
                                  💬 מותאם...
                                </Button>
                              </div>
                              
                              {isEditingCustomStatus && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 flex flex-col gap-1.5">
                                  <Input
                                    placeholder="רשום סטטוס משלך..."
                                    value={myCustomStatus}
                                    onChange={(e) => setMyCustomStatus(e.target.value)}
                                    className="h-9 text-xs font-bold px-2.5 rounded-xl border border-border focus-visible:ring-primary/20"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleUpdateStatus("custom", myCustomStatus);
                                        setIsEditingCustomStatus(false);
                                      }
                                    }}
                                  />
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        handleUpdateStatus("custom", myCustomStatus);
                                        setIsEditingCustomStatus(false);
                                      }}
                                      className="flex-1 h-8 text-xs font-bold rounded-xl"
                                    >
                                      עדכן
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setIsEditingCustomStatus(false)}
                                      className="h-8 text-xs font-bold rounded-xl px-2"
                                    >
                                      ביטול
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button variant="ghost" size="icon" onClick={closeChat} className="rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="חיפוש איש קשר..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="pr-10 h-11 bg-muted/50 border-border/50 rounded-2xl text-xs font-bold text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Contacts List */}
                <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {chatContacts
                     .filter((emp: any) => {
                       const displayName = emp.is_admin ? "צוות תמיכה" : `${emp.first_name} ${emp.last_name}`;
                       return Number(emp.id) !== Number(user?.id) && 
                         (!contactSearch || displayName.toLowerCase().includes(contactSearch.toLowerCase()));
                     })
                     .sort((a: any, b: any) => {
                       // 1. Contacts with unread messages first
                       const aAlerts = alerts.filter(al => al.id.startsWith("msg-") && Number(al.data?.sender_id) === Number(a.id));
                       const bAlerts = alerts.filter(al => al.id.startsWith("msg-") && Number(al.data?.sender_id) === Number(b.id));
                       if (aAlerts.length > 0 && bAlerts.length === 0) return -1;
                       if (aAlerts.length === 0 && bAlerts.length > 0) return 1;

                       if (a.is_admin && !b.is_admin) return -1;
                       if (!a.is_admin && b.is_admin) return 1;
                       // Keep alphabetical order for others
                       const displayNameA = a.is_admin ? "צוות תמיכה" : `${a.first_name} ${a.last_name}`;
                       const displayNameB = b.is_admin ? "צוות תמיכה" : `${b.first_name} ${b.last_name}`;
                       return displayNameA.localeCompare(displayNameB, 'he');
                     })
                     .map((emp: any) => {
                      const contactAlerts = alerts.filter(a => a.id.startsWith("msg-") && Number(a.data?.sender_id) === Number(emp.id));
                      const unreadCount = contactAlerts.length;
                      const hasUnread = unreadCount > 0;

                      return (
                       <button
                         key={emp.id}
                         onClick={() => openChat({ id: emp.id, name: emp.is_admin ? "צוות תמיכה" : `${emp.first_name} ${emp.last_name}` })}
                         className={cn(
                           "w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-right group border border-transparent",
                           hasUnread 
                             ? "bg-primary/5 dark:bg-primary/10 border-primary/15 hover:bg-primary/10 shadow-sm" 
                             : "hover:bg-muted/50"
                         )}
                       >
                         {/* Avatar with Status Dot */}
                         <div className="relative shrink-0">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all",
                             hasUnread 
                               ? "bg-primary text-primary-foreground" 
                               : "bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white"
                           )}>
                             {emp.is_admin ? "💬" : `${emp.first_name?.[0] ?? ""}${emp.last_name?.[0] ?? ""}`}
                           </div>
                           {/* Real-time Status Dot Badge */}
                           <div className={cn("absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm", getStatusDotColor(emp))} />
                         </div>
                         
                         <div className="flex-grow min-w-0">
                           <div className="flex items-center justify-between mb-0.5">
                             <h4 className={cn(
                               "font-bold text-sm text-foreground transition-colors",
                               hasUnread ? "text-primary font-black" : "group-hover:text-primary"
                             )}>
                               {emp.is_admin ? "צוות תמיכה" : `${emp.first_name} ${emp.last_name}`}
                             </h4>
                             <div className="flex items-center gap-1.5">
                               {unreadCount > 0 && (
                                 <span className="bg-primary text-primary-foreground text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                                   {unreadCount}
                                 </span>
                               )}
                               {emp.is_online && (
                                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                     פעיל/ה
                                 </span>
                               )}
                             </div>
                           </div>
                           {hasUnread ? (
                             <p className="text-xs text-primary font-semibold truncate max-w-[200px] leading-relaxed mt-0.5">
                               {contactAlerts[contactAlerts.length - 1].description}
                             </p>
                           ) : emp.chat_status_custom ? (
                             <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg truncate max-w-[185px] inline-block mt-0.5">
                               💬 {emp.chat_status_custom}
                             </p>
                           ) : (
                             <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest truncate">{emp.is_admin ? "ניהול מערכת" : (emp.section_name || emp.department_name || "מפקד")}</p>
                           )}
                         </div>
                         <ChevronLeft className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all shrink-0" />
                       </button>
                      );
                    })}
                     {chatContacts.filter((emp: any) => Number(emp.id) !== Number(user?.id)).length === 0 && (
                      <div className="p-8 text-center opacity-40">
                        <p className="text-xs font-bold">לא נמצאו אנשי קשר זמינים.</p>
                      </div>
                    )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
