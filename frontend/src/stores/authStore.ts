import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Try loading session from local/session storage for state preservation
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  let user: User | null = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
    }
  }

  return {
    user,
    token: storedToken,
    isAuthenticated: !!storedToken && !!user,
    
    login: (token: string, user: User) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    },
    
    hasPermission: (permission: string) => {
      const currentUser = get().user;
      if (!currentUser) return false;
      // Admins bypass normal permission rules
      if (currentUser.roles.includes('admin') || currentUser.roles.includes('SUPER_ADMIN')) {
        return true;
      }
      return currentUser.permissions.includes(permission);
    },
    
    hasRole: (role: string) => {
      const currentUser = get().user;
      if (!currentUser) return false;
      return currentUser.roles.includes(role);
    }
  };
});
