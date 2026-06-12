import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import Loading from '@/components/ui/Loading';
import Landing from '@/pages/Landing';
import Projects from '@/pages/Projects';
import Studio from '@/pages/Studio';
import Library from '@/pages/Library';
import Publish from '@/pages/Publish';
import NotFound from '@/pages/NotFound';
import { Sidebar, Header } from '@/components/layout/AppShell';
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
                <div className="relative min-h-screen bg-background text-foreground">
                  <Header onSignOut={signOut} />
                  <div className="flex min-h-[calc(100vh-64px)]">
                    <Sidebar />
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
