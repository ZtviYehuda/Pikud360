import { useState, useEffect, useCallback, useMemo } from "react";
import type { Conversation, ConversationType } from "../types/messaging.types";
import { messagingApi } from "../api/messagingApi";
import { toast } from "sonner";

export function useMessaging(selectedConversationId?: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UNREAD" | "DIRECT" | "GROUP">("ALL");

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await messagingApi.listConversations();
      setConversations(data);
    } catch (err: any) {
      console.error("Failed to load conversations:", err);
      setError(err?.response?.data?.error || "שגיאה בטעינת השיחות");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 8000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title?.toLowerCase().includes(q);
        const matchLastMsg = c.last_message?.content?.toLowerCase().includes(q);
        if (!matchTitle && !matchLastMsg) return false;
      }

      if (activeFilter === "UNREAD") return c.unread_count > 0;
      if (activeFilter === "DIRECT") return c.type === "DIRECT";
      if (activeFilter === "GROUP") return c.type === "GROUP" || c.type === "ORG_UNIT";

      return true;
    });
  }, [conversations, searchQuery, activeFilter]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  }, [conversations]);

  const createGroup = async (title: string, description?: string, memberUserIds: string[] = []) => {
    try {
      const newGroup = await messagingApi.createGroup({
        title,
        description,
        member_user_ids: memberUserIds,
      });
      toast.success("הקבוצה נוצרה בהצלחה");
      await loadConversations();
      return newGroup;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "שגיאה ביצירת הקבוצה");
      throw err;
    }
  };

  const startDirectChat = async (targetUserId: string, initialMessage?: string) => {
    try {
      const direct = await messagingApi.getOrCreateDirect(targetUserId, initialMessage);
      await loadConversations();
      return direct;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "שגיאה בפתיחת השיחה");
      throw err;
    }
  };

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    totalUnreadCount,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    reloadConversations: loadConversations,
    createGroup,
    startDirectChat,
  };
}
