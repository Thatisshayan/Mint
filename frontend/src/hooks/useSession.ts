import { useEffect, useState } from 'react';
import { TOKEN_KEY, EXPIRY_KEY, USER_KEY } from '@/lib/api/auth';

export type Session = {
  user: { id: string; email: string; name?: string };
  accessToken: string;
  expiresAt: string;
};

type StoredUser = { id: string; email: string; name?: string };

function isStoredUser(value: unknown): value is StoredUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { email?: unknown }).email === 'string'
  );
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const readStored = (): Session | null => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      const expiresAt = typeof localStorage !== 'undefined' ? localStorage.getItem(EXPIRY_KEY) : null;
      const rawUser = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
      if (!token || !expiresAt || !rawUser) return null;
      let user: StoredUser | null = null;
      try {
        const parsed: unknown = JSON.parse(rawUser);
        if (isStoredUser(parsed)) {
          user = parsed;
        }
      } catch {
        // ignore parse errors
      }
      if (!user) return null;
      return { user, accessToken: token, expiresAt };
    };

    setSession(readStored());
    setLoading(false);

    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        setSession(readStored());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
