import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { authApi } from '@/lib/api/auth';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const protectedPrefix = '/app';

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!session && pathname.startsWith(protectedPrefix)) {
    navigate('/', { replace: true });
    return null;
  }

  if (session && pathname === '/') {
    navigate('/app/projects', { replace: true });
    return null;
  }

  return <>{children}</>;
}
