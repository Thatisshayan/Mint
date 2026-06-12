import { authApi, type Session } from '@/lib/api/auth';

export function useSession() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const current = await authApi.getSession();
      if (!cancelled) {
        setSession(current);
        setLoading(false);
      }
    };
    void init();
    const onStorage = (e: StorageEvent) => {
      if (e.key === '***') {
        void init();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const signOut = React.useCallback(async () => {
    await authApi.signOut();
    setSession(null);
  }, []);

  return { session, loading, signOut };
}
