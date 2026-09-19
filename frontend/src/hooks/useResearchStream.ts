import { useCallback, useRef, useState } from 'react';
import { authApi } from '@/lib/api/auth';

export type ResearchStreamStatus = 'idle' | 'connecting' | 'researching' | 'done' | 'error';

export interface ResearchStreamResult {
  report: string;
  sources: { title: string; url: string }[];
  id?: string;
}

export function useResearchStream() {
  const [status, setStatus] = useState<ResearchStreamStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ResearchStreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectedRef = useRef(false);

  const connect = useCallback(async (query: string) => {
    const session = await authApi.getSession();
    const token = session?.accessToken || '';
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/^http/, 'ws').replace(/\/api$/, '');
    const wsUrl = `${base || location.origin.replace(/^http/, 'ws')}/api/research/stream?token=${encodeURIComponent(token)}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('researching');
      socket.send(JSON.stringify({ query }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setLogs((prev) => [...prev, data.message]);
      } else if (data.type === 'done') {
        setResult({ report: data.report, sources: data.sources || [], id: data.id });
        setStatus('done');
      } else if (data.type === 'error') {
        setError(data.message);
        setStatus('error');
      }
    };

    socket.onerror = () => {
      setStatus((current) => {
        if (current !== 'done' && !reconnectedRef.current) {
          reconnectedRef.current = true;
          connect(query);
          return current;
        }
        setError('Connection lost');
        return 'error';
      });
    };

    socket.onclose = () => {
      socketRef.current = null;
    };
  }, []);

  const start = useCallback(
    (query: string) => {
      reconnectedRef.current = false;
      setLogs([]);
      setResult(null);
      setError(null);
      setStatus('connecting');
      connect(query);
    },
    [connect],
  );

  const stop = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setStatus('idle');
  }, []);

  return { status, logs, result, error, start, stop };
}
