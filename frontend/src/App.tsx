import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { RouteGuard } from '@/components/RouteGuard';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Loading from '@/components/ui/Loading';

const Landing = lazy(() => import('@/pages/Landing'));
const AppHome = lazy(() => import('@/pages/AppHome'));

export default function App() {
  const { session, loading, signOut } = useSession();

  return (
    <RouteGuard loading={loading} session={session}>
      <div className="relative min-h-screen bg-background text-foreground">
        {session?.user && (
          <>
            <Sidebar />
            <Header user={session.user} onSignOut={signOut} />
          </>
        )}
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={session?.user ? <Navigate to="/app" replace /> : <Landing />} />
            <Route
              path="/app/*"
              element={
                session?.user ? (
                  <AppHome />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<div className="p-10">Not found</div>} />
          </Routes>
        </Suspense>
      </div>
    </RouteGuard>
  );
}
