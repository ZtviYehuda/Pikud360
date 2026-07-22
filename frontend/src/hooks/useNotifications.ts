import { useState, useEffect } from "react";
import apiClient from "@/config/api.client";
import { useAuthContext } from "@/context/AuthContext";

export interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
  link: string;
  read_at?: string;
  data?: any;
}

export function useNotifications() {
  const { user } = useAuthContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<Alert[]>("/notifications/alerts");
      // The API now returns only unread alerts
      setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data } = await apiClient.get<Alert[]>(
        "/notifications/alerts/history",
      );
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch notification history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Find the alert to send its snapshot details
      const alert = alerts.find((a) => a.id === notificationId);

      await apiClient.post(`/notifications/alerts/${notificationId}/read`, {
        title: alert?.title,
        description: alert?.description,
        type: alert?.type,
        link: alert?.link,
      });

      // Remove from active alerts and refetch history if needed
      setAlerts((prev) => prev.filter((a) => a.id !== notificationId));
      fetchHistory(); // Refresh history immediately
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/alerts/${notificationId}/read`);

      // Remove from history immediately
      setHistory((prev) => prev.filter((a) => a.id !== notificationId));

      // Fetch active alerts to show it back in the list
      fetchAlerts();
    } catch (err) {
      console.error("Failed to mark notification as unread:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (alerts.length === 0) return;

      // Prepare payload with all necessary snapshot data
      const notificationsPayload = alerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        type: alert.type,
        link: alert.link,
      }));

      await apiClient.post(
        `/notifications/alerts/read-all`,
        notificationsPayload,
      );

      // Clear all alerts from local state immediately
      setAlerts([]);

      // Refresh history to include newly read items
      fetchHistory();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const toggleRead = async (id: string, currentlyRead: boolean = false) => {
    if (currentlyRead) {
      await markAsUnread(id);
    } else {
      await markAsRead(id);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = alerts.length; // All alerts shown are unread

  return {
    alerts,
    history,
    loading,
    loadingHistory,
    unreadCount,
    readIds: [] as string[], // Deprecated, kept for compatibility
    refreshAlerts: fetchAlerts,
    fetchHistory,
    markAllAsRead,
    toggleRead,
    markAsRead,
    markAsUnread,
  };
}
