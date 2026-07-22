import { create } from "zustand";
import { AuthUser, LoginCredentials } from "../types/auth.types";
import { authService } from "../services/auth.service";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  quickLogin: (userId: number) => Promise<boolean>;
  logout: (hard?: boolean) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 1,
    username: "commander",
    first_name: "מפקד",
    last_name: "יחידה",
    is_admin: true,
    is_commander: true,
    department_name: "מפקדה",
    role_name: "מפקד יחידה",
  },
  token: localStorage.getItem("token") || "default-token",
  isAuthenticated: true,
  loading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ loading: true, error: null });
    try {
      const res = await authService.login(credentials);
      if (res.success) {
        localStorage.setItem("token", res.token);
        set({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return true;
      }
      set({ loading: false, error: "שם משתמש או סיסמה שגויים" });
      return false;
    } catch (err: any) {
      set({ loading: false, error: err?.message || "שגיאת התחברות" });
      return false;
    }
  },

  quickLogin: async (userId: number) => {
    set({ loading: true, error: null });
    try {
      const res = await authService.quickLogin(userId);
      if (res.success) {
        localStorage.setItem("token", res.token);
        set({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return true;
      }
      set({ loading: false, error: "שגיאת התחברות מהירה" });
      return false;
    } catch (err: any) {
      set({ loading: false, error: err?.message || "שגיאה בתהליך ההתחברות" });
      return false;
    }
  },

  logout: (hard = false) => {
    if (hard) {
      localStorage.removeItem("locked_user");
    }
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },

  fetchUser: async () => {
    set({ loading: true });
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        set({ user, isAuthenticated: true, loading: false });
      } else {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));
