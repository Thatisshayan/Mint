import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

const _EASE: Easing = [0.25, 0.46, 0.45, 0.94] as unknown as Easing;

const NAV = [
  {
    label: 'Dashboard',
    to: '/app/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".8" />
      </svg>
    ),
  },
  {
    label: 'Projects',
    to: '/app/projects',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4.5A2.5 2.5 0 014.5 2h7A2.5 2.5 0 0114 4.5v7A2.5 2.5 0 0111.5 14h-7A2.5 2.5 0 012 11.5v-7z" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M5 4h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Studio',
    to: '/app/studio',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L9.8 6.2L14.5 6.2L10.9 9.1L12.4 14L8 11.2L3.6 14L5.1 9.1L1.5 6.2L6.2 6.2L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    label: 'Research',
    to: '/app/research',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Library',
    to: '/app/library',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="4.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <rect x="8" y="2" width="2.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M12.5 2l1.5 11.5-2.5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    label: 'Publish',
    to: '/app/publish',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 10V2M8 2L5 5M8 2L11 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 11v1.5A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const sidebarVariants: Variants = {
  hidden: { x: -16, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.22, ease: _EASE } },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-3">
      <img
        src={`${import.meta.env.BASE_URL}mint-logo.jpg`}
        alt="MINT"
        className="h-7 w-7 rounded-lg object-contain"
      />
      <span className="text-[13px] font-bold tracking-tight text-foreground">MINT</span>
    </div>
  );
}

export function Sidebar({ isOpen, onClose, onSignOut }: { isOpen?: boolean; onClose?: () => void; onSignOut?: () => void }) {
  const { toggle, theme } = useTheme();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-[hsl(var(--sidebar-border,var(--border)))]">
        <Logo />
        {isOpen !== undefined && onClose && (
          <button onClick={onClose} className="ml-auto mr-3 rounded-md p-1.5 text-muted-foreground/60 hover:text-foreground md:hidden">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <span className={`relative ${isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground/70'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="relative">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[hsl(var(--sidebar-border,var(--border)))] px-2 py-3 space-y-0.5">
        <button
          onClick={toggle}
          className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11.5 8.5A5 5 0 015.5 2.5a5 5 0 100 9 5 5 0 006-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2M10 10l3-3-3-3M13 7H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-[hsl(var(--sidebar-border,var(--border)))] bg-[hsl(var(--sidebar,var(--card)))] md:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-y-0 left-0 z-50 w-56 border-r border-border bg-card md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function Header({ onSignOut, onToggleSidebar }: { onSignOut: () => void; onToggleSidebar?: () => void }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-card/60 px-4 backdrop-blur-sm md:hidden">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Toggle menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <Logo />
    </header>
  );
}
