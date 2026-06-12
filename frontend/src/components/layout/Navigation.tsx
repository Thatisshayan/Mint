import { useTheme } from '@/components/ThemeProvider';

export function Navigation() {
  const { theme, toggle } = useTheme();
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 px-6">
      <div className="text-sm font-semibold tracking-widest uppercase text-accent">Mint</div>
      <button
        onClick={toggle}
        className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest"
      >
        {theme}
      </button>
    </header>
  );
}
