export type ConversationType = "DIRECT" | "GROUP" | "ORG_UNIT";
export type MemberRole = "ADMIN" | "MEMBER";
export type MessageType = "TEXT" | "FILE" | "IMAGE" | "SYSTEM";
export type MessageDeliveryStatus = "SENT" | "DELIVERED" | "READ";

export interface MessageAttachment {
  id: string;
  message_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  message_type: MessageType;
  status: MessageDeliveryStatus;
  reply_to_message_id?: string;
  reply_to_content?: string;
  reply_to_sender_name?: string;
  forwarded_from_message_id?: string;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  deleted_by?: string;
  attachments?: MessageAttachment[];
  read_by_users?: string[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  user_name?: string;
  user_role_title?: string;
  avatar_url?: string;
  role: MemberRole;
  joined_at: string;
  left_at?: string;
  permissions?: Record<string, any>;
  is_online?: boolean;
  last_seen?: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  type: ConversationType;
  title: string;
  description?: string;
  avatar_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_muted: boolean;
  is_pinned: boolean;
  unread_count: number;
  last_read_message_id?: string;
  last_message?: Message;
  members: ConversationMember[];
  settings?: Record<string, any>;
}

export interface UserPresence {
  status: "online" | "away" | "busy" | "offline";
  custom_status?: string;
  last_seen: string;
}

export interface SearchResults {
  conversations: Array<{ id: string; title: string; type: ConversationType; description?: string }>;
  messages: Array<{ id: string; conversation_id: string; content: string; created_at: string; sender_name: string }>;
  files: Array<{ id: string; message_id: string; filename: string; mime_type: string; file_size: number; storage_path: string; conversation_id: string }>;
}
