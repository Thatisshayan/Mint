import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWsInstances: any[] = [];

vi.mock('ws', () => {
  type Listener = (...args: any[]) => void;

  class MockWebSocket {
    static OPEN = 1;
    readyState = 0;
    listeners: Record<string, Listener[]> = {};
    sentMessages: string[] = [];
    constructor(public url: string) {
      mockWsInstances.push(this);
    }
    on(event: string, cb: Listener) {
      (this.listeners[event] ||= []).push(cb);
      return this;
    }
    send(data: string) {
      this.sentMessages.push(data);
    }
    close() {
      this.emit('close');
    }
    emit(event: string, ...args: any[]) {
      for (const cb of this.listeners[event] || []) cb(...args);
    }
  }
  return { default: MockWebSocket, WebSocket: MockWebSocket };
});

import { runResearch } from './gptResearcher.service.js';

describe('runResearch', () => {
  beforeEach(() => {
    mockWsInstances.length = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          report: '# Report\n\nSynthesized content.',
          sources: [{ title: 'Example Source', url: 'https://example.com/a' }],
        }),
      })),
    );
  });

  it('sends the start command with the task payload', async () => {
    const promise = runResearch('best video hooks 2026', { onProgress: () => {} });
    const ws = mockWsInstances[0];
    ws.emit('open');
    expect(ws.sentMessages[0]).toMatch(/^start /);
    const payload = JSON.parse(ws.sentMessages[0].slice('start '.length));
    expect(payload.task).toBe('best video hooks 2026');
    expect(payload.report_type).toBe('research_report');
    expect(payload.report_source).toBe('web');

    ws.emit(
      'message',
      JSON.stringify({ type: 'path', output: { json: '/outputs/abc123.json' } }),
    );
    const result = await promise;
    expect(result.report).toContain('Synthesized content.');
    expect(result.sources).toEqual([{ title: 'Example Source', url: 'https://example.com/a' }]);
  });

  it('forwards logs messages via onProgress', async () => {
    const progress: string[] = [];
    const promise = runResearch('q', { onProgress: (msg) => progress.push(msg) });
    const ws = mockWsInstances[0];
    ws.emit('open');
    ws.emit('message', JSON.stringify({ type: 'logs', content: 'searching', output: 'Searching the web...' }));
    ws.emit('message', JSON.stringify({ type: 'path', output: { json: '/outputs/x.json' } }));
    await promise;
    expect(progress).toContain('Searching the web...');
  });

  it('rejects when the connection errors before completion', async () => {
    const promise = runResearch('q', { onProgress: () => {} });
    const ws = mockWsInstances[0];
    ws.emit('error', new Error('ECONNREFUSED'));
    await expect(promise).rejects.toThrow(/ECONNREFUSED|connect/i);
  });
});
