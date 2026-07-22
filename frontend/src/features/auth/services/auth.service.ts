import { AuthUser, LoginCredentials, LoginResponse } from "../types/auth.types";

const MOCK_USERS: Record<number, AuthUser> = {
  1: {
    id: 1,
    username: "commander",
    first_name: "מפקד",
    last_name: "יחידה",
    is_admin: true,
    is_commander: true,
    department_name: "מפקדה",
    role_name: "מפקד יחידה",
  },
  2: {
    id: 2,
    username: "admin",
    first_name: "מנהל",
    last_name: "מערכת",
    is_admin: true,
    is_commander: false,
    department_name: "טכנולוגיה",
    role_name: "מנהל רשת",
  },
  3: {
    id: 3,
    username: "officer",
    first_name: "קצין",
    last_name: "מבצעים",
    is_admin: false,
    is_commander: false,
    department_name: "מבצעים",
    role_name: "קצין חמ\"ל",
  },
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Simulated API authentication call
    await new Promise((res) => setTimeout(res, 500));

    const found = Object.values(MOCK_USERS).find(
      (u) => u.username.toLowerCase() === credentials.username.toLowerCase()
    ) || MOCK_USERS[1];

    const token = `mock-token-${found.id}-${Date.now()}`;
    return {
      success: true,
      token,
      user: found,
    };
  },

  async quickLogin(userId: number): Promise<LoginResponse> {
    await new Promise((res) => setTimeout(res, 300));
    const user = MOCK_USERS[userId] || MOCK_USERS[1];
    const token = `mock-token-${user.id}-${Date.now()}`;
    return {
      success: true,
      token,
      user,
    };
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = localStorage.getItem("token");
    if (!token) return null;
    await new Promise((res) => setTimeout(res, 200));
    return MOCK_USERS[1];
  },

  async logout(): Promise<void> {
    localStorage.removeItem("token");
  },
};
