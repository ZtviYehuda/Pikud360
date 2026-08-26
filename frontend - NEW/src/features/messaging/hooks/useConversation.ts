import { useState, useEffect, useCallback } from "react";
import type { Message, Conversation } from "../types/messaging.types";
import { messagingApi } from "../api/messagingApi";
import { toast } from "sonner";

export function useConversation(conversationId?: string | null, onConversationUpdated?: () => void) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const loadConversationData = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      const [convData, msgData] = await Promise.all([
        messagingApi.getConversation(conversationId),
        messagingApi.getMessages(conversationId, 50, 0),
      ]);
      setConversation(convData);
      setMessages(msgData);

      if (convData.unread_count > 0) {
        await messagingApi.markAsRead(conversationId);
        onConversationUpdated?.();
      }
    } catch (err: any) {
      console.error("Failed loading conversation:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onConversationUpdated]);

  useEffect(() => {
    loadConversationData();
  }, [loadConversationData]);

  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const [latestMessages, typingRes] = await Promise.all([
          messagingApi.getMessages(conversationId, 50, 0),
          messagingApi.getTypingUsers(conversationId),
        ]);
        setMessages(latestMessages);
        setTypingUsers(typingRes.typing_users || []);
      } catch (err) {
        // silent
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [conversationId]);

  const sendMessage = async (content: string, attachments?: any[]) => {
    if (!conversationId) return;
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    try {
      setIsSending(true);
      const newMsg = await messagingApi.sendMessage(conversationId, {
        content: content.trim(),
        message_type: attachments && attachments.length > 0 ? "FILE" : "TEXT",
        reply_to_message_id: replyTarget?.id,
        attachments,
      });

      setMessages((prev) => [...prev, newMsg]);
      setReplyTarget(null);
      onConversationUpdated?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "שגיאה בשליחת ההודעה");
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  const editMessage = async (msgId: string, newContent: string) => {
    try {
      const edited = await messagingApi.editMessage(msgId, newContent);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? edited : m)));
      setEditingMessage(null);
      toast.success("ההודעה עודכנה");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "שגיאה בעריכת ההודעה");
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      await messagingApi.deleteMessage(msgId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: "הודעה זו נמחקה", deleted_at: new Date().toISOString() } : m
        )
      );
      toast.success("ההודעה נמחקה");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "שגיאה במחיקת ההודעה");
    }
  };

  const triggerTyping = async (isTyping: boolean) => {
    if (!conversationId) return;
    try {
      await messagingApi.sendTyping(conversationId, isTyping);
    } catch (err) {
      // silent
    }
  };

  return {
    conversation,
    messages,
    isLoading,
    isSending,
    replyTarget,
    setReplyTarget,
    editingMessage,
    setEditingMessage,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    triggerTyping,
    reloadMessages: loadConversationData,
  };
}
