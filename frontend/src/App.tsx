import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import Loading from '@/components/ui/Loading';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSession } from '@/hooks/useSession';

const Landing = lazy(() => import('@/pages/Landing'));
const Projects = lazy(() => import('@/pages/Projects'));
const Studio = lazy(() => import('@/pages/Studio'));
const Library = lazy(() => import('@/pages/Library'));
const Publish = lazy(() => import('@/pages/Publish'));
const Research = lazy(() => import('@/pages/Research'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  const { session, loading, signOut } = useSession();

  if (loading) return <Loading />;

  return (
    <RouteGuard>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Root goes to dashboard if logged in, landing if not */}
          <Route path="/" element={session?.user ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/landing" replace />} />
          <Route path="/landing" element={<Landing />} />
          <Route
            path="/app/*"
            element={
              session?.user ? (
                <AppLayout onSignOut={signOut}>
                  <ErrorBoundary>
                    <Suspense fallback={<Loading />}>
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="studio" element={<Studio />} />
                        <Route path="research" element={<Research />} />
                        <Route path="library" element={<Library />} />
                        <Route path="publish" element={<Publish />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </AppLayout>
              ) : (
                <Navigate to="/landing" replace />
              )
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteGuard>
  );
}
