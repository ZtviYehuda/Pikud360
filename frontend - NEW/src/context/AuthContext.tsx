import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types/auth.types";
import apiClient from "@/config/api.client";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: (hard?: boolean) => void;
  changePassword: (newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, error, login, logout, fetchUser, changePassword } =
    useAuth();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Global chat heartbeat for presence
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      apiClient.post("/employees/chat/heartbeat", {}).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 20000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        changePassword,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthContext must be used within AuthProvider");
  return context;
};
