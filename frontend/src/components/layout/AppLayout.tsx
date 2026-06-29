import { Sidebar, Header } from '@/components/layout/AppShell';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal';
import OfflineIndicator from '@/components/OfflineIndicator';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface AppLayoutProps {
  onSignOut: () => void;
  children?: React.ReactNode;
}

export default function AppLayout({ onSignOut, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={onSignOut}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only top bar */}
        <Header onSignOut={onSignOut} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      <KeyboardShortcutsModal />
      <OfflineIndicator />
    </div>
  );
}
