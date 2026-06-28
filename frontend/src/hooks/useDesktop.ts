import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    __TAURI__?: Record<string, unknown>;
  }
}

export function useDesktop() {
  const isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;

  useEffect(() => {
    if (!isDesktop) return;

    let unlistenGenerate: (() => void) | undefined;
    let unlistenSave: (() => void) | undefined;

    // Listen for global shortcut events from Rust
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('shortcut-generate', () => {
        window.dispatchEvent(new CustomEvent('mint-shortcut-generate'));
      }).then((unlisten) => {
        unlistenGenerate = unlisten;
      });

      listen('shortcut-save', () => {
        window.dispatchEvent(new CustomEvent('mint-shortcut-save'));
      }).then((unlisten) => {
        unlistenSave = unlisten;
      });
    });

    return () => {
      unlistenGenerate?.();
      unlistenSave?.();
    };
  }, [isDesktop]);

  const getBackendPort = useCallback(async (): Promise<number> => {
    if (!isDesktop) return 4000;
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('get_backend_port');
  }, [isDesktop]);

  const getAiStatus = useCallback(async (): Promise<{ ollama_available: boolean; comfyui_available: boolean }> => {
    if (!isDesktop) return { ollama_available: false, comfyui_available: false };
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('get_ai_status');
  }, [isDesktop]);

  return {
    isDesktop,
    getBackendPort,
    getAiStatus,
  };
}
