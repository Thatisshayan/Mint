import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const { isOnline, isBackendReachable } = useOnlineStatus();

  if (isOnline && isBackendReachable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 backdrop-blur-sm">
        <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
        {!isOnline ? (
          <span>You are offline. Check your internet connection.</span>
        ) : (
          <span>Backend unreachable. Reconnecting...</span>
        )}
      </div>
    </div>
  );
}
