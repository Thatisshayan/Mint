import { ThemeProvider } from '@/components/ThemeProvider';

export function AppShell({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
