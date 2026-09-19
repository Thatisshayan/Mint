import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./tts.service.js', () => ({
  generateSpeech: vi.fn(),
}));
vi.mock('./whisper.service.js', () => ({
  transcribeAudio: vi.fn(),
}));
vi.mock('./pexels.service.js', () => ({
  searchStockVideos: vi.fn(),
}));
vi.mock('@remotion/bundler', () => ({
  bundle: vi.fn(async () => '/fake/bundle/dir'),
}));
vi.mock('@remotion/renderer', () => ({
  selectComposition: vi.fn(async () => ({
    id: 'CaptionedVideo',
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 300,
  })),
  renderMedia: vi.fn(async () => undefined),
}));
vi.mock('../outputPaths.js', () => ({
  saveMintBlob: vi.fn(() => ({
    absolutePath: '/fake/output/video/999.mp4',
    filename: '999.mp4',
    publicUrl: '/api/files/video/999.mp4',
  })),
}));
vi.mock('fs/promises', () => ({
  readFile: vi.fn(async () => Buffer.from('fake-audio-bytes')),
}));

import { generateSpeech } from './tts.service.js';
import { transcribeAudio } from './whisper.service.js';
import { searchStockVideos } from './pexels.service.js';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { generateCaptionedVideo } from './remotion.service.js';

describe('generateCaptionedVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateSpeech).mockResolvedValue({
      audioUrl: 'data:audio/mp3;base64,AAAA',
      fileUrl: '/api/files/audio/1.mp3',
      absolutePath: '/fake/output/audio/1.mp3',
      durationMs: 4000,
      format: 'mp3',
    });
  });

  it('passes real Whisper caption timing through to the render when available', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue({
      text: 'hello world',
      segments: [{ start: 0, end: 1.2, text: 'hello' }, { start: 1.2, end: 2.5, text: 'world' }],
      language: 'en',
      fileUrl: '/api/files/transcripts/1.json',
    });
    vi.mocked(searchStockVideos).mockResolvedValue({ videos: [] });

    await generateCaptionedVideo({ script: 'hello world' });

    const inputProps = vi.mocked(selectComposition).mock.calls[0][0].inputProps as {
      captions: Array<{ start: number; end: number; text: string }>;
    };
    expect(inputProps.captions).toEqual([
      { start: 0, end: 1.2, text: 'hello' },
      { start: 1.2, end: 2.5, text: 'world' },
    ]);
  });

  it('falls back to a single full-length caption when Whisper returns no segments', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue({ text: '', language: 'en' });
    vi.mocked(searchStockVideos).mockResolvedValue({ videos: [] });

    await generateCaptionedVideo({ script: 'hello world' });

    const inputProps = vi.mocked(selectComposition).mock.calls[0][0].inputProps as {
      captions: Array<{ start: number; end: number; text: string }>;
    };
    expect(inputProps.captions).toHaveLength(1);
    expect(inputProps.captions[0].start).toBe(0);
  });

  it('passes footageSrc through when Pexels returns a result', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue({ text: '', language: 'en' });
    vi.mocked(searchStockVideos).mockResolvedValue({
      videos: [{ url: 'https://example.com/clip.mp4', thumbnail: '', duration: 10, width: 1080, height: 1920 }],
    });

    await generateCaptionedVideo({ script: 'hello world' });

    const inputProps = vi.mocked(selectComposition).mock.calls[0][0].inputProps as { footageSrc?: string };
    expect(inputProps.footageSrc).toBe('https://example.com/clip.mp4');
  });

  it('omits footageSrc (fallback background) when Pexels returns nothing', async () => {
    vi.mocked(transcribeAudio).mockResolvedValue({ text: '', language: 'en' });
    vi.mocked(searchStockVideos).mockResolvedValue({ videos: [] });

    await generateCaptionedVideo({ script: 'hello world' });

    const inputProps = vi.mocked(selectComposition).mock.calls[0][0].inputProps as { footageSrc?: string };
    expect(inputProps.footageSrc).toBeUndefined();
  });

  it('propagates a TTS failure without calling renderMedia', async () => {
    vi.mocked(generateSpeech).mockRejectedValue(new Error('TTS request timed out'));

    await expect(generateCaptionedVideo({ script: 'hello world' })).rejects.toThrow('TTS request timed out');
    expect(renderMedia).not.toHaveBeenCalled();
  });
});
