import { create } from 'zustand';
import api from '../api/axios.js';

const initialUser = JSON.parse(localStorage.getItem('user') || 'null');
const initialToken = localStorage.getItem('token');

export const useAuthStore = create((set) => ({
  token: initialToken,
  user: initialUser,
  isLoggingIn: false,
  isSigningUp: false,
  login: async (payload) => {
    set({ isLoggingIn: true });

    try {
      const response = await api.post('/auth/login', payload);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ token, user });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      throw new Error(message);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  signup: async (payload) => {
    set({ isSigningUp: true });

    try {
      const response = await api.post('/auth/register', payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      throw new Error(message);
    } finally {
      set({ isSigningUp: false });
    }
  },
  updateProfile: async (payload) => {
    try {
      const response = await api.put('/user/update-profile', payload);
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      throw new Error(message);
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
