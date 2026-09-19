import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResearchStream } from './useResearchStream';

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    getSession: vi.fn(async () => ({
      user: { id: 'u1', email: 'u@test.local' },
      accessToken: 'test-token',
      expiresAt: '9999999999999',
    })),
  },
}));

const mockSockets: any[] = [];

class MockWebSocket {
  static OPEN = 1;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];
  constructor(public url: string) {
    mockSockets.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.onclose?.();
  }
}

beforeEach(() => {
  mockSockets.length = 0;
  vi.stubGlobal('WebSocket', MockWebSocket as any);
});

describe('useResearchStream', () => {
  it('goes idle -> researching -> done on a successful run', async () => {
    const { result } = renderHook(() => useResearchStream());

    act(() => {
      result.current.start('test query');
    });

    // connect() awaits authApi.getSession() before constructing the socket,
    // so the mock socket only exists after that microtask resolves.
    await waitFor(() => expect(mockSockets.length).toBe(1));
    const socket = mockSockets[0];

    act(() => {
      socket.readyState = MockWebSocket.OPEN;
      socket.onopen?.();
    });
    expect(result.current.status).toBe('researching');
    expect(socket.sent[0]).toBe(JSON.stringify({ query: 'test query' }));

    act(() => {
      socket.onmessage?.({ data: JSON.stringify({ type: 'progress', message: 'Searching...' }) });
    });
    expect(result.current.logs).toContain('Searching...');

    act(() => {
      socket.onmessage?.({
        data: JSON.stringify({ type: 'done', report: '# Report', sources: [], id: 'r1' }),
      });
    });

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.result?.report).toBe('# Report');
  });

  it('goes to error status on a server error message', async () => {
    const { result } = renderHook(() => useResearchStream());
    act(() => {
      result.current.start('q');
    });
    await waitFor(() => expect(mockSockets.length).toBe(1));
    const socket = mockSockets[0];
    act(() => {
      socket.readyState = MockWebSocket.OPEN;
      socket.onopen?.();
      socket.onmessage?.({ data: JSON.stringify({ type: 'error', message: 'boom' }) });
    });
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
