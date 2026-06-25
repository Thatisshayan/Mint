import { useState, useEffect } from 'react';
import { SHORTCUT_LIST } from '@/hooks/useKeyboardShortcuts';

export default function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = SHORTCUT_LIST.reduce((acc, shortcut) => {
    const cat = shortcut.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(shortcut);
    return acc;
  }, {} as Record<string, typeof SHORTCUT_LIST>);

  const formatKey = (shortcut: typeof SHORTCUT_LIST[0]) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg bg-white/[0.05] px-3 py-1 text-xs text-muted-foreground hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="space-y-4">
          {Object.entries(categories).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.description} className="flex items-center justify-between">
                    <span className="text-sm text-white/80">{shortcut.description}</span>
                    <kbd className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-mono text-muted-foreground">
                      {formatKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
