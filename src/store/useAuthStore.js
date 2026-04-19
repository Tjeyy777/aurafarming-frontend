import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axiosConfig';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, token } = res.data.data;
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed. Please try again.';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      // Register action
      register: async (name, email, password, role) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/register', { name, email, password, role });
          const { user, token } = res.data.data;
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Registration failed. Please try again.';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      // Logout action
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'quarry-auth',           // localStorage key
      partialize: (state) => ({      // only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
