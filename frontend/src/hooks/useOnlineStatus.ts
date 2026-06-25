import { useState, useEffect, useCallback } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastChecked: Date | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: navigator.onLine,
    isBackendReachable: true,
    lastChecked: null,
  });

  const checkBackend = useCallback(async () => {
    try {
      const response = await fetch('/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const isReachable = response.ok;
      setStatus((prev) => ({
        ...prev,
        isBackendReachable: isReachable,
        lastChecked: new Date(),
      }));
    } catch {
      setStatus((prev) => ({
        ...prev,
        isBackendReachable: false,
        lastChecked: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      checkBackend();
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        isBackendReachable: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check backend on mount
    checkBackend();

    // Periodic health check
    const interval = setInterval(checkBackend, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkBackend]);

  return status;
}
