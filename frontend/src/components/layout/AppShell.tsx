const NAV = [
  { label: 'Projects', to: '/app/projects' },
  { label: 'Studio', to: '/app/studio' },
  { label: 'Library', to: '/app/library' },
  { label: 'Publish', to: '/app/publish' },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-white/5 bg-black/20 p-4 md:block">
      <div className="mb-8 text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">Mint</div>
      <nav className="space-y-1">
        {NAV.map((item) => (
          <a
            key={item.to}
            href={item.to}
            className="flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-white"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export function Header({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 px-6">
      <span className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">Mint</span>
      <button
        onClick={onSignOut}
        className="h-9 rounded-full border border-white/10 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-white"
      >
        Sign out
      </button>
    </header>
  );
}
