import { create } from "zustand";
import { DashboardData } from "../types/dashboard.types";
import { dashboardService } from "../services/dashboard.service";

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await dashboardService.getDashboardData();
      set({ data, loading: false, error: null });
    } catch (err: any) {
      set({ loading: false, error: err?.message || "שגיאה שטעינת הנתונים" });
    }
  },
}));
