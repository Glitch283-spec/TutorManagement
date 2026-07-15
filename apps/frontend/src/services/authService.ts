import { api } from '../lib/api';
import { Profile } from '../types';

const TOKEN_KEY = 'tms_token';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
  profile: Profile;
}

interface MeResponse {
  user: {
    id: string;
    email: string;
  };
  profile: Profile;
}

export const authService = {
  async signIn(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  async signOut() {
    localStorage.removeItem(TOKEN_KEY);
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors; client session is already cleared.
    }
  },

  async getSession(): Promise<MeResponse | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const { data } = await api.get<MeResponse>('/auth/me');
      return data;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};
