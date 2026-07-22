import { useState, useCallback } from "react";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/transfers.endpoints";

export interface TransferRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  source_type: string;
  source_id: number;
  source_name: string;
  target_type: string;
  target_id: number;
  target_name: string;
  requester_id: number;
  requester_name: string;
  requester_unit?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  reason?: string;
  rejection_reason?: string;
  resolver_name?: string;
  resolver_unit?: string;
  can_approve?: boolean;
  can_cancel?: boolean;
}

export const useTransfers = () => {
  const [pendingTransfers, setPendingTransfers] = useState<TransferRequest[]>(
    [],
  );
  const [history, setHistory] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<TransferRequest[]>(
        endpoints.TRANSFERS_PENDING_ENDPOINT,
      );
      setPendingTransfers(data);
      setError(null);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to fetch pending transfers",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<TransferRequest[]>(
        endpoints.TRANSFERS_HISTORY_ENDPOINT,
      );
      setHistory(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch transfer history");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransfer = async (payload: {
    employee_id: number;
    target_type: "department" | "section" | "team";
    target_id: number;
    reason?: string;
  }) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.TRANSFERS_BASE_ENDPOINT, payload);
      await fetchPending();
      return true;
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to create transfer request",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const approveTransfer = async (id: number) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.approveTransferEndpoint(id));
      await fetchPending();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to approve transfer");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectTransfer = async (id: number, reason: string) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.rejectTransferEndpoint(id), { reason });
      await fetchPending();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reject transfer");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelTransfer = async (id: number) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.cancelTransferEndpoint(id));
      await fetchPending();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cancel transfer");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    pendingTransfers,
    history,
    loading,
    error,
    fetchPending,
    fetchHistory,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    cancelTransfer,
  };
};
