import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: (user, token) => {
    if (typeof window !== 'undefined') (window as any).__accessToken = token;
    set({ user, accessToken: token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') (window as any).__accessToken = null;
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setToken: (token) => {
    if (typeof window !== 'undefined') (window as any).__accessToken = token;
    set({ accessToken: token });
  },
}));
