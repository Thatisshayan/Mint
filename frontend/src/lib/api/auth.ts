import { request } from './fetchWrapper';
import { useState } from 'react';

export type Session = {
  user: { id: string; email: string; name?: string };
  accessToken: string;
  expiresAt: string;
};

const TOKEN_KEY = '***';
const EXPIRY_KEY = 'mint_token_expires_at';
const USER_KEY = 'mint_user';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const init = () => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      const expiresAt = typeof localStorage !== 'undefined' ? localStorage.getItem(EXPIRY_KEY) : null;
      const user = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
      setSession(token && expiresAt && user ? { user: JSON.parse(user), accessToken: token, expiresAt } : null);
    } catch {
      setSession(null);
    }
    setLoading(false);
  };

  if (typeof window !== 'undefined') {
    useState(() => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === TOKEN_KEY) {
          init();
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    });
  }

  return {
    session,
    loading,
    signOut: () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        localStorage.removeItem(USER_KEY);
      }
      setSession(null);
    },
  };
}

export const authApi = {
  async getSession(): Promise<Session | null> {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      const expiresAt = typeof localStorage !== 'undefined' ? localStorage.getItem(EXPIRY_KEY) : null;
      const user = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
      if (!token || !expiresAt || !user) return null;
      return { user: JSON.parse(user), accessToken: token, expiresAt };
    } catch {
      return null;
    }
  },
  async signInWithMagicLink(email: string) {
    const response = await request('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) });
    return response.json();
  },
  async verifyMagicLink(token: string) {
    const response = await request('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) });
    const result = await response.json();
    if (result?.accessToken && result?.expiresAt && result?.user) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, result.accessToken);
          localStorage.setItem(EXPIRY_KEY, result.expiresAt);
          localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        }
      } catch {
        // ignore storage errors
      }
    }
    return result;
  },
  signOut() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // ignore storage errors
    }
  },
  isAuthenticated() {
    try {
      return typeof localStorage !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
    } catch {
      return false;
    }
  },
};
