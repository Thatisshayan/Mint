import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const NAV = [
  { label: 'Dashboard', to: '/app/dashboard' },
  { label: 'Projects', to: '/app/projects' },
  { label: 'Studio', to: '/app/studio' },
  { label: 'Research', to: '/app/research' },
  { label: 'Library', to: '/app/library' },
  { label: 'Publish', to: '/app/publish' },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-border bg-card/50 p-4 md:block">
      <div className="mb-8 flex items-center gap-3 px-3">
        <img
          src="/mint-logo.png"
          alt="Mint"
          className="h-8 w-8"
        />
        <span className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Mint</span>
      </div>
      <nav className="space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-mint-500/10 text-mint-500'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function Header({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/30 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 md:hidden">
        <img
          src="/mint-logo.png"
          alt="Mint"
          className="h-7 w-7"
        />
        <span className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Mint</span>
      </div>
      <div className="flex-1" />
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSignOut}
        className="h-9 rounded-full border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
      >
        Sign out
      </motion.button>
    </header>
  );
}
