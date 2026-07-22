import { useState, useCallback } from "react";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/auth.endpoints";
import type { AuthUser, LoginResponse } from "@/types/auth.types";
import { useAuthStore } from "@/stores/authStore";

export const useAuth = () => {
  // Restore user from localStorage immediately on mount for zero-flicker state persistence
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn("Failed to parse stored user from localStorage", e);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    // If token exists but no stored user, we must block while fetching
    return !!token && !storedUser;
  });

  const [error, setError] = useState<string | null>(null);

  const syncZustandStore = (token: string, u: AuthUser) => {
    try {
      useAuthStore.getState().login(token, {
        id: String(u.id),
        name: `${u.first_name} ${u.last_name}`,
        email: u.email || `${u.username}@pikud360.gov.il`,
        roles: u.is_admin ? ["admin", "COMMANDER"] : u.is_commander ? ["COMMANDER"] : ["USER"],
        permissions: ["ALL"],
      });
    } catch (e) {
      console.warn("Failed to sync Zustand authStore", e);
    }
  };

  // Function to fetch/validate current user from backend
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      localStorage.removeItem("user");
      useAuthStore.getState().logout();
      setLoading(false);
      return;
    }

    // Pre-validate token exp locally if possible
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn("JWT token has expired locally");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          useAuthStore.getState().logout();
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Invalid token string format -> proceed to backend validation
    }

    try {
      const { data } = await apiClient.get<any>(endpoints.AUTH_ME_ENDPOINT);
      const userData: AuthUser = data.user || data.data || data;

      if (userData && userData.id) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        syncZustandStore(token, userData);
        setError(null);
      }
    } catch (err: any) {
      console.error("fetchUser error:", err);
      // Only clear session and force logout if backend explicitly returns 401/403
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        useAuthStore.getState().logout();
      } else {
        // Network error / 500 error: retain cached user if available
        setError("Network error while validating session");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Login Function
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>(
        endpoints.AUTH_LOGIN_ENDPOINT,
        { username, password }
      );

      if (data.success && data.token) {
        const loggedUser: AuthUser = data.user || (data as any).data?.user;
        localStorage.setItem("token", data.token);
        if (loggedUser) {
          localStorage.setItem("user", JSON.stringify(loggedUser));
          setUser(loggedUser);
          syncZustandStore(data.token, loggedUser);
        }
        setError(null);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Login failed";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout Function
  const logout = (hard: boolean = false) => {
    if (!hard && user) {
      localStorage.setItem(
        "locked_user",
        JSON.stringify({
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          id: user.id,
        }),
      );
    } else {
      localStorage.removeItem("locked_user");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    useAuthStore.getState().logout();
    window.location.href = "/login";
  };

  // Change Password Function
  const changePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        endpoints.AUTH_CHANGE_PASSWORD_ENDPOINT,
        { new_password: newPassword }
      );

      if (data.success) {
        await fetchUser();
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Failed to change password";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, login, logout, fetchUser, changePassword };
};
