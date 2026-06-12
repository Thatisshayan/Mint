import { fetchWrapper } from '@/lib/api/fetchWrapper';

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
  expiresAt: string;
}

const TOKEN_KEY = '***';
const EXPIRY_KEY = 'mint_token_expires_at';
const USER_KEY = 'mint_user';

export const authApi = {
  async getSession(): Promise<Session | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = localStorage.getItem(EXPIRY_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (!token || !expiresAt || !user) return null;
    return {
      accessToken: token,
      expiresAt,
      user: JSON.parse(user),
    };
  },
  async signInWithMagicLink(email: string) {
    const response = await fetchWrapper('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
      auth: false,
    });
    return response.json();
  },
  async verifyMagicLink(token: string) {
    const response = await fetchWrapper('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
      auth: false,
    });
    const data = await response.json();
    if (data.accessToken && data.expiresAt && data.user) {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(EXPIRY_KEY, data.expiresAt);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },
  async signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
