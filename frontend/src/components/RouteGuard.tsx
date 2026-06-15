import { type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';

export default function RouteGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      // Only redirect if we're on an /app/* route and not authenticated
      if (window.location.pathname.startsWith('/app')) {
        navigate('/', { replace: true });
      }
    }
  }, [session, loading, navigate]);

  return <>{children}</>;
}
