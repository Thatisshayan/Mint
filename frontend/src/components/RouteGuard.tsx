import { Navigate } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';

type GuardProps = {
  loading: boolean;
  session: { user: { id: string; email: string; name?: string } } | null;
  children: React.ReactNode;
};

export default function RouteGuard({ loading, session, children }: GuardProps) {
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading</div>;
  return <>{children}</>;
}
