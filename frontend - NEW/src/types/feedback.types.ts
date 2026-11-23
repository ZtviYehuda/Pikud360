export interface Ticket {
  id: string | number;
  user_id?: string | number;
  first_name?: string;
  last_name?: string;
  sender_name?: string;
  department_name?: string;
  category: string;
  title?: string;
  description: string;
  priority?: string;
  status:
    | 'received'
    | 'reviewing'
    | 'in_progress'
    | 'done'
    | 'dismissed'
    | 'irrelevant'
    | 'open'
    | 'closed'
    | 'approved'
    | 'rejected';
  resolution_comment?: string | null;
  admin_reply: string | null;
  created_at: string;
  updated_at?: string;
  screenshot_url?: string;
  context_page?: string;
  start_date?: string | null;
  end_date?: string | null;
  access_duration?: string | null;
  access_expires_at?: string | null;
}

export interface SupportTicket {
  id: string | number;
  user_id: string | number;
  full_name: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  is_read_by_user: boolean;
  created_at: string;
}
