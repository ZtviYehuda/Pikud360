import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/config/api.client';
import * as endpoints from '@/config/attendance.endpoints';
import type { DashboardData, StatusType } from '@/types/attendance.types';

export const useAttendance = () => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [statusTypes, setStatusTypes] = useState<StatusType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Dashboard Stats (Numbers + Birthdays)
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<DashboardData>(endpoints.ATTENDANCE_STATS_ENDPOINT);
      setStats(data);
    } catch (err) {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Status Types (Colors/Names)
  const fetchStatusTypes = useCallback(async () => {
    try {
      const { data } = await apiClient.get<StatusType[]>(endpoints.ATTENDANCE_STATUS_TYPES_ENDPOINT);
      setStatusTypes(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Log a new status
  const logStatus = async (payload: { employee_id?: number; status_type_id: number; note?: string; start_date?: string; end_date?: string }) => {
    setLoading(true);
    try {
      await apiClient.post(endpoints.ATTENDANCE_LOG_ENDPOINT, payload);
      await fetchStats(); // Update dashboard immediately
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchStats();
    fetchStatusTypes();
  }, [fetchStats, fetchStatusTypes]);

  return { 
    stats, 
    statusTypes, 
    loading, 
    error, 
    fetchStats, 
    logStatus 
  };
};