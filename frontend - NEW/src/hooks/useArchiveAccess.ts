import { useState, useEffect, useCallback, useMemo } from "react";
import { format, isBefore, startOfDay, subMonths } from "date-fns";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface ArchiveGrant {
  id?: string;
  start_date?: string | null;
  end_date?: string | null;
  duration?: string;
  expires_at?: string | null;
  is_valid: boolean;
  all_dates?: boolean;
}

export function useArchiveAccess() {
  const { user } = useAuth();
  const [grants, setGrants] = useState<ArchiveGrant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGrants = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get("/archive/user-access");
      if (res.data && Array.isArray(res.data.grants)) {
        setGrants(res.data.grants);
      } else {
        setGrants([]);
      }
    } catch (err) {
      console.error("Error fetching archive access grants:", err);
      setGrants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants, user?.id, user?.is_impersonated]);

  const threeMonthsAgo = useMemo(() => subMonths(startOfDay(new Date()), 3), []);

  const getActiveGrantForDate = useCallback(
    (date: Date): ArchiveGrant | null => {
      // 1. If user is system administrator, permanent access to all historical data
      if (user?.is_admin) {
        return {
          all_dates: true,
          duration: "permanent",
          is_valid: true,
          expires_at: null,
        };
      }

      if (!grants || grants.length === 0) return null;

      const dateStr = format(date, "yyyy-MM-dd");
      const now = new Date();

      for (const g of grants) {
        if (!g.is_valid) continue;

        // Check expiration
        if (g.expires_at) {
          const exp = new Date(g.expires_at);
          if (exp <= now) continue;
        }

        // If grant covers all dates
        if (g.all_dates) return g;

        // Check if date falls in requested date range
        if (g.start_date && g.end_date) {
          if (dateStr >= g.start_date && dateStr <= g.end_date) {
            return g;
          }
        } else if (g.start_date) {
          if (dateStr === g.start_date) {
            return g;
          }
        } else {
          // General grant without specific date bounds
          return g;
        }
      }

      return null;
    },
    [user?.is_admin, grants],
  );

  const isDateAllowed = useCallback(
    (date: Date): boolean => {
      // If date is within the last 3 months, it's open for everyone
      if (!isBefore(startOfDay(date), threeMonthsAgo)) {
        return true;
      }

      // If older than 3 months, check if user is admin or has an active approved grant
      return getActiveGrantForDate(date) !== null;
    },
    [threeMonthsAgo, getActiveGrantForDate],
  );

  return {
    grants,
    isLoading,
    refreshArchiveAccess: fetchGrants,
    isDateAllowed,
    getActiveGrantForDate,
    threeMonthsAgo,
  };
}
