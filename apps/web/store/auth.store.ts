import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  roles: string[];
  organizationId: string;
  organization_id?: string; // For compatibility with different API responses
  first_name?: string;
  last_name?: string;
  firstName?: string; // If we normalize it
  lastName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,

  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const { user, tokens } = response.data;
      localStorage.setItem('token', tokens.accessToken);
      set({ user, token: tokens.accessToken });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (data) => {
    try {
      const response = await api.post('/api/auth/register', data);
      const { user, tokens } = response.data;
      localStorage.setItem('token', tokens.accessToken);
      set({ user, token: tokens.accessToken });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await api.get('/api/auth/me');
      set({ user: response.data.user, token });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));
