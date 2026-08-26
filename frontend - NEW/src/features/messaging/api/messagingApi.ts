import apiClient from "@/config/api.client";
import type { Conversation, Message, SearchResults, UserPresence } from "../types/messaging.types";

export const messagingApi = {
  listConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get<Conversation[]>("/messaging/conversations");
    return res.data;
  },

  getConversation: async (convId: string): Promise<Conversation> => {
    const res = await apiClient.get<Conversation>(`/messaging/conversations/${convId}`);
    return res.data;
  },

  getOrCreateDirect: async (targetUserId: string, initialMessage?: string): Promise<Conversation> => {
    const res = await apiClient.post<Conversation>("/messaging/conversations/direct", {
      target_user_id: targetUserId,
      initial_message: initialMessage,
    });
    return res.data;
  },

  createGroup: async (data: {
    title: string;
    description?: string;
    member_user_ids: string[];
    initial_message?: string;
    avatar_url?: string;
  }): Promise<Conversation> => {
    const res = await apiClient.post<Conversation>("/messaging/conversations/group", data);
    return res.data;
  },

  getMessages: async (convId: string, limit = 50, offset = 0): Promise<Message[]> => {
    const res = await apiClient.get<Message[]>(`/messaging/conversations/${convId}/messages`, {
      params: { limit, offset },
    });
    return res.data;
  },

  sendMessage: async (
    convId: string,
    data: {
      content: string;
      message_type?: string;
      reply_to_message_id?: string;
      forwarded_from_message_id?: string;
      attachments?: any[];
    }
  ): Promise<Message> => {
    const res = await apiClient.post<Message>(`/messaging/conversations/${convId}/messages`, data);
    return res.data;
  },

  editMessage: async (msgId: string, content: string): Promise<Message> => {
    const res = await apiClient.put<Message>(`/messaging/messages/${msgId}`, { content });
    return res.data;
  },

  deleteMessage: async (msgId: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/messaging/messages/${msgId}`);
    return res.data;
  },

  markAsRead: async (convId: string, lastReadMessageId?: string): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>(`/messaging/conversations/${convId}/read`, {
      last_read_message_id: lastReadMessageId,
    });
    return res.data;
  },

  search: async (query: string): Promise<SearchResults> => {
    const res = await apiClient.get<SearchResults>("/messaging/search", {
      params: { q: query },
    });
    return res.data;
  },

  updatePresence: async (status: string, customStatus?: string): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>("/messaging/presence", {
      status,
      custom_status: customStatus,
    });
    return res.data;
  },

  sendTyping: async (convId: string, isTyping: boolean): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>("/messaging/typing", {
      conversation_id: convId,
      is_typing: isTyping,
    });
    return res.data;
  },

  getTypingUsers: async (convId: string): Promise<{ typing_users: string[]; is_typing: boolean }> => {
    const res = await apiClient.get<{ typing_users: string[]; is_typing: boolean }>(`/messaging/typing/${convId}`);
    return res.data;
  },
};
