export type TargetType = 'team' | 'section' | 'department';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface TransferRequest {
  id: number;
  employee_id: number;
  requester_id: number;
  
  // Target details
  target_type: TargetType;
  target_id: number;
  target_name: string; // Calculated field from backend
  
  status: RequestStatus;
  notes: string | null;
  rejection_reason: string | null;
  
  // Timestamps
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
  
  // Joined fields for display
  employee_name?: string; // first_name + last_name
  first_name: string;
  last_name: string;
  requester_first: string;
  requester_last: string;
  resolver_first?: string;
}

export interface CreateTransferPayload {
  employee_id: number;
  target_type: TargetType;
  target_id: number;
  notes?: string;
}