import { lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import Loading from '@/components/ui/Loading';

export default function AppHome() {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        <div className="flex min-h-[calc(100vh-56px)]">
          <main className="flex-1">
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
