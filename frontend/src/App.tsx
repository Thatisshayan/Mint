import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import Loading from '@/components/ui/Loading';
import Landing from '@/pages/Landing';
import Projects from '@/pages/Projects';
import Studio from '@/pages/Studio';
import Library from '@/pages/Library';
import Publish from '@/pages/Publish';
import Research from '@/pages/Research';
import NotFound from '@/pages/NotFound';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSession } from '@/hooks/useSession';

export default function App() {
  const { session, loading, signOut } = useSession();

  if (loading) return <Loading />;

  return (
    <RouteGuard>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/app/*"
            element={
              session?.user ? (
                <AppLayout onSignOut={signOut}>
                  <ErrorBoundary>
                    <Routes>
                      <Route index element={<Projects />} />
                      <Route path="projects" element={<Projects />} />
                      <Route path="studio" element={<Studio />} />
                      <Route path="research" element={<Research />} />
                      <Route path="library" element={<Library />} />
                      <Route path="publish" element={<Publish />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ErrorBoundary>
                </AppLayout>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteGuard>
  );
}
