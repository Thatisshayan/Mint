import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
