import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { RouteGuard } from '@/components/RouteGuard';
import Loader from '@/components/ui/Loading';
import { ThemeProvider } from '@/components/ThemeProvider';

const Landing = lazy(() => import('@/pages/Landing'));
const Projects = lazy(() => import('@/pages/Projects'));
const Studio = lazy(() => import('@/pages/Studio'));
const Library = lazy(() => import('@/pages/Library'));
const Publish = lazy(() => import('@/pages/Publish'));

export default function App() {
  const { session, loading, signOut } = useSession();
  return (
    <RouteGuard loading={loading} session={session}>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={session?.user ? <Navigate to="/app" replace /> : <Landing />} />
          <Route
            path="/app/*"
            element={
              session?.user ? (
                <ThemeProvider>
                  <div className="relative min-h-screen bg-background text-foreground">
                    <div className="flex min-h-[calc(100vh-56px)]">
                      <main className="flex-1">
                        <Routes>
                          <Route index element={<Projects />} />
                          <Route path="projects" element={<Projects />} />
                          <Route path="studio" element={<Studio />} />
                          <Route path="library" element={<Library />} />
                          <Route path="publish" element={<Publish />} />
                          <Route path="*" element={<div className="p-10">Not found</div>} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ThemeProvider>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<div className="p-10">Not found</div>} />
        </Routes>
      </Suspense>
    </RouteGuard>
  );
}
