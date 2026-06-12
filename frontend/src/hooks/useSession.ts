import { useEffect, useState } from 'react';

export type Session = {
  user: { id: string; email: string; name?: string };
  accessToken: string;
  expiresAt: string;
};

const TOKEN_KEY='***';
const EXPIRY_KEY = 'mint_token_expires_at';
const USER_KEY = 'mint_user';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const init = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = localStorage.getItem(EXPIRY_KEY);
    const user = localStorage.getItem(USER_KEY);
    setSession(token && expiresAt && user ? { user: JSON.parse(user), accessToken: token, expiresAt } : null);
    setLoading(false);
  };

  useEffect(() => {
    init();
    const onStorage = (e: StorageEvent) => {
      if (e.key === localStorage.getItem(TOKEN_KEY)) void init();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
    setSession(null);
  };

  return { session, loading, signOut };
}
