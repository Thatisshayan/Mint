import { Sidebar, Header } from '@/components/layout/AppShell';

interface AppLayoutProps {
  onSignOut: () => void;
  children?: React.ReactNode;
}

export default function AppLayout({ onSignOut, children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Header onSignOut={onSignOut} />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}