import { api } from './api';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  user: User;
  accessToken: string;
}

export const auth = {
  async login(email: string, password: string) {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    if (res.data) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return res;
  },

  async register(data: { email: string; password: string; fullName: string; phone?: string }) {
    const res = await api.post<RegisterResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      fullname: data.fullName,
      phone: data.phone,
    });
    if (res.data) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    return res;
  },

  async loginWithGoogle(idToken: string) {
    const res = await api.post<LoginResponse>('/auth/google-login', { idToken });
    if (res.data) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return res;
  },

  async forgotPassword(email: string) {
    return api.post<{ ok: boolean }>('/auth/forgot-password', { email });
  },

  async resetPassword(resetToken: string, password: string) {
    return api.post<{ ok: boolean }>('/auth/reset-password', { resetToken, password });
  },

  async getProfile() {
    return api.get<User>('/auth/profile');
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return { error: 'No refresh token' };

    const res = await api.post<{ accessToken: string }>('/auth/refresh-token', { refreshToken });
    if (res.data) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    return res;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  getToken() {
    return localStorage.getItem('accessToken');
  },
};

