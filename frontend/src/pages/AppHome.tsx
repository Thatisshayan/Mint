import { Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import Loading from '@/components/ui/Loading';
import Projects from '@/pages/Projects';
import Library from '@/pages/Library';
import Publish from '@/pages/Publish';
import NotFound from '@/pages/NotFound';

export default function AppHome() {
  return (
    <ThemeProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Projects />} />
            <Route path="projects" element={<Projects />} />
            <Route path="library" element={<Library />} />
            <Route path="publish" element={<Publish />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

function AppShell() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="flex min-h-[calc(100vh-56px)]">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
