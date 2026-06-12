import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { RouteGuard } from '@/components/RouteGuard';
import Loader from '@/components/ui/Loading';
import Landing from '@/pages/Landing';
import Projects from '@/pages/Projects';
import Studio from '@/pages/Studio';
import Library from '@/pages/Library';
import Publish from '@/pages/Publish';
import NotFound from '@/pages/NotFound';

export default function App() {
  const { session, loading, signOut } = useSession();

  return (
    <RouteGuard loading={loading} session={session}>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route
            path="/"
            element={
              session?.user ? <Navigate to="/app/projects" replace /> : <Landing />
            }
          />
          <Route
            path="/app/*"
            element={
              session?.user ? (
                <div className="relative min-h-screen bg-background text-foreground">
                  <div className="flex min-h-[calc(100vh-56px)]">
                    <main className="flex-1">
                      <Routes>
                        <Route index element={<Projects />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="studio" element={<Studio />} />
                        <Route path="library" element={<Library />} />
                        <Route path="publish" element={<Publish />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
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
