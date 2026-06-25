import { Sidebar, Header } from '@/components/layout/AppShell';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal';
import OfflineIndicator from '@/components/OfflineIndicator';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  onSignOut: () => void;
  children?: React.ReactNode;
}

export default function AppLayout({ onSignOut, children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <Header onSignOut={onSignOut} />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
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
