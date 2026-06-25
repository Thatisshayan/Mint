import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : true;
        const metaMatch = shortcut.meta ? e.metaKey : true;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && metaMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const SHORTCUT_LIST = [
  { key: 'g', ctrl: true, description: 'Generate content', category: 'Studio' },
  { key: 's', ctrl: true, description: 'Save to library', category: 'Studio' },
  { key: 'c', ctrl: true, description: 'Copy to clipboard', category: 'Studio' },
  { key: 'p', ctrl: true, shift: true, description: 'Go to Publish', category: 'Navigation' },
  { key: 'l', ctrl: true, shift: true, description: 'Go to Library', category: 'Navigation' },
  { key: 'r', ctrl: true, shift: true, description: 'Go to Research', category: 'Navigation' },
  { key: 'k', ctrl: true, shift: true, description: 'Show shortcuts', category: 'Help' },
];
