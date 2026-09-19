import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../outputPaths.js', () => ({
  saveMintBlob: vi.fn(() => ({
    absolutePath: '/fake/output/audio/123-abcd.mp3',
    filename: '123-abcd.mp3',
    publicUrl: '/api/files/audio/123-abcd.mp3',
  })),
}));

vi.stubGlobal(
  'fetch',
  vi.fn(async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  })),
);

import { generateSpeech } from './tts.service.js';

describe('generateSpeech', () => {
  it('exposes the absolute file path alongside the public URL', async () => {
    const result = await generateSpeech({ text: 'hello world' });
    expect(result.absolutePath).toBe('/fake/output/audio/123-abcd.mp3');
    expect(result.fileUrl).toBe('/api/files/audio/123-abcd.mp3');
  });
});
