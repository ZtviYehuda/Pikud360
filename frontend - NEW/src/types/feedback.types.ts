export interface Ticket {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  category: string;
  description: string;
  status: 'received' | 'reviewing' | 'in_progress' | 'done' | 'dismissed' | 'irrelevant' | 'open' | 'closed';
  admin_reply: string | null;
  created_at: string;
  screenshot_url?: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  full_name: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  is_read_by_user: boolean;
  created_at: string;
}
