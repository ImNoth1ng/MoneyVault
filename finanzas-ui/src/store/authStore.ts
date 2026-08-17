import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest } from '../types';
import { authService } from '../services/authService';
import { isTokenExpired } from '../utils/jwtUtils';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initialize: () => void;
  checkTokenExpiration: () => boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkTokenExpiration: () => {
    const currentToken = get().token || localStorage.getItem('authToken');
    if (isTokenExpired(currentToken)) {
      get().logout();
      return true;
    }
    return false;
  },

  initialize: () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isLoading: false });
        return;
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }
    }

    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const data = await authService.login(credentials);
      const userStr = localStorage.getItem('user');
      if (userStr && data.token) {
        set({ token: data.token, user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      await authService.register(payload);
      // Auto login after register
      await useAuthStore.getState().login({ username: payload.username, password: payload.password });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

