import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const exec = promisify(execFile);

const RENDER_TIMEOUT_MS = 180_000;

export interface GenerateCaptionedVideoOptions {
  script: string;
  title?: string;
  platform?: 'youtube_shorts' | 'instagram_reel' | 'tiktok';
  voice?: string;
}

export interface GenerateCaptionedVideoResult {
  url: string;
  fileUrl: string | null;
}

// Bundled once per process — bundling is slow, and Node module state persists
// for the life of the backend process, so this genuinely only happens once
// per server start, not once per request.
let bundlePromise: Promise<string> | null = null;

async function getBundleUrl(): Promise<string> {
  if (!bundlePromise) {
    const { bundle } = await import('@remotion/bundler');
    const here = dirname(fileURLToPath(import.meta.url));
    // backend/src/services/ai/ -> repo root -> remotion/src/index.ts
    const entryPoint = join(here, '..', '..', '..', '..', 'remotion', 'src', 'index.ts');
    bundlePromise = bundle({ entryPoint });
  }
  return bundlePromise;
}

async function probeAudioDurationSec(absolutePath: string): Promise<number> {
  try {
    const { stdout } = await exec('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      absolutePath,
    ]);
    const seconds = parseFloat(stdout.trim());
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 10;
  } catch {
    // ffprobe missing or the file is unreadable — last-resort fixed duration
    // so rendering never fails purely because we couldn't measure length.
    return 10;
  }
}

export async function generateCaptionedVideo(
  options: GenerateCaptionedVideoOptions,
): Promise<GenerateCaptionedVideoResult> {
  const { generateSpeech } = await import('./tts.service.js');
  const { transcribeAudio } = await import('./whisper.service.js');
  const { searchStockVideos } = await import('./pexels.service.js');
  const { saveMintBlob } = await import('../outputPaths.js');

  const speech = await generateSpeech({ text: options.script, voice: options.voice });

  let captions: Array<{ start: number; end: number; text: string }> = [];
  if (speech.absolutePath) {
    const { readFile } = await import('fs/promises');
    const audioBase64 = (await readFile(speech.absolutePath)).toString('base64');
    const transcript = await transcribeAudio({ audioBase64 });
    if (transcript.segments && transcript.segments.length > 0) {
      captions = transcript.segments;
    }
  }

  if (captions.length === 0) {
    // Whisper returned nothing (not installed, or genuine silence) — fall
    // back to a single full-length caption spanning the real audio
    // duration, measured via ffprobe, rather than leaving captions empty
    // (which calculateMetadata treats as a 10s placeholder — fine as a
    // last resort, but real audio duration is better when we can get it).
    const durationSec = speech.absolutePath ? await probeAudioDurationSec(speech.absolutePath) : 10;
    captions = [{ start: 0, end: durationSec, text: options.title || '' }];
  }

  const stock = await searchStockVideos({ query: options.title || options.script.slice(0, 60) });
  const footageSrc = stock.videos[0]?.url;
  const footageDurationSec = stock.videos[0]?.duration;

  const { selectComposition, renderMedia } = await import('@remotion/renderer');
  const serveUrl = await getBundleUrl();

  const composition = await selectComposition({
    serveUrl,
    id: 'CaptionedVideo',
    inputProps: {
      audioSrc: speech.absolutePath || speech.audioUrl,
      footageSrc,
      footageDurationSec,
      captions,
    },
  });

  const { absolutePath: outputPath, publicUrl } = saveMintBlob('video', 'mp4', Buffer.alloc(0));

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: outputPath,
    timeoutInMilliseconds: RENDER_TIMEOUT_MS,
  });

  return { url: publicUrl, fileUrl: publicUrl };
}
