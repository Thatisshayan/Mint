# Remotion Captioned Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third video-rendering path — captioned video (voiceover + Whisper-timed
captions burned over Pexels stock footage, brand-color fallback if unavailable) —
rendered server-side with Remotion, alongside MINT's existing FFmpeg-assembly and
Money Printer Turbo paths.

**Architecture:** A new `remotion/` sub-project (its own bundler, not Vite) holds the
video template. A new backend orchestrator chains four existing services
(TTS → Whisper → Pexels → Remotion render) and exposes one route; the frontend gets
one new button mirroring the existing "Generate Short Video" button exactly.

**Tech Stack:** `remotion`, `@remotion/bundler`, `@remotion/renderer` (new backend
deps — pure Node/TS, no Python, no new local service/port). Reuses Fastify 5, Zod,
the existing `saveMintBlob` output convention.

**Scope note:** this plan is larger than the GPT Researcher one — it modifies an
existing service's return type, chains four existing services, and adds a whole
separate sub-project with its own build step. Budget more time than a typical
3-4 task plan.

**Spec:** `docs/superpowers/specs/2026-09-19-remotion-captioned-video-design.md`

**Known gaps carried into this plan** (see spec for full reasoning — not blockers,
just things to know going in):
- Whisper CLI isn't installed on this dev machine, so `transcribeAudio()` will always
  hit its internal catch-all and return `{ text: '', language }` with **no
  `segments` field at all** (confirmed by reading `whisper.service.ts` — it never
  throws, it swallows every failure). The empty-captions fallback path (Task 3) is
  therefore the only path actually exercisable end-to-end on this machine right now.
- `@remotion/renderer` bundles a ~200-300MB headless Chromium download on first
  install — this session's `npm install`s have repeatedly hung on this machine for
  unrelated reasons (see `docs/governance/DEFERRED_WORK.md`); expect that friction.

---

## Task 1: Expose `absolutePath` on `TTSResult`

`generateSpeech()` already computes the file's absolute path via `saveMintBlob()` but
throws it away — the orchestrator in Task 3 needs it to hand a real file to Remotion.

**Files:**
- Modify: `backend/src/services/ai/tts.service.ts`
- Test: `backend/src/services/ai/tts.service.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/ai/tts.service.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run backend/src/services/ai/tts.service.test.ts`
Expected: FAIL — `result.absolutePath` is `undefined` (not in the current
`TTSResult` interface / return object).

- [ ] **Step 3: Add `absolutePath` to the interface and return value**

Modify `backend/src/services/ai/tts.service.ts`:

```typescript
export interface TTSResult {
  audioUrl: string;
  fileUrl?: string | null;
  absolutePath?: string;
  durationMs: number;
  format: string;
}
```

And in the function body, replace:

```typescript
    let fileUrl: string | null = null;
    try {
      fileUrl = saveMintBlob('audio', 'mp3', Buffer.from(audioBuffer)).publicUrl;
    } catch (err) {
      console.warn('Failed to persist TTS output:', err);
    }

    return {
      audioUrl: `data:audio/mp3;base64,${base64}`,
      fileUrl,
      durationMs: Math.round((text.split(' ').length / 150) * 60 * 1000),
      format: 'mp3',
    };
```

with:

```typescript
    let fileUrl: string | null = null;
    let absolutePath: string | undefined;
    try {
      const saved = saveMintBlob('audio', 'mp3', Buffer.from(audioBuffer));
      fileUrl = saved.publicUrl;
      absolutePath = saved.absolutePath;
    } catch (err) {
      console.warn('Failed to persist TTS output:', err);
    }

    return {
      audioUrl: `data:audio/mp3;base64,${base64}`,
      fileUrl,
      absolutePath,
      durationMs: Math.round((text.split(' ').length / 150) * 60 * 1000),
      format: 'mp3',
    };
```

(Leave the `durationMs` WPM estimate as-is — Task 3's orchestrator doesn't use it for
video duration, per the spec's decision to use `calculateMetadata()` instead. Not
fixing this pre-existing inaccuracy here would be scope creep; it's out of scope for
this plan.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run backend/src/services/ai/tts.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/ai/tts.service.ts backend/src/services/ai/tts.service.test.ts
git commit -m "feat: expose absolutePath on TTSResult for the Remotion orchestrator"
```

---

## Task 2: Scaffold the `remotion/` sub-project

**Files:**
- Create: `remotion/src/index.ts`
- Create: `remotion/src/Root.tsx`
- Create: `remotion/src/CaptionedVideo.tsx`
- Create: `remotion/tsconfig.json`
- Modify: `package.json` (root — Remotion deps live at the repo root alongside the
  rest of the frontend/backend deps, matching how this repo already keeps one
  top-level `package.json` for frontend code)

- [ ] **Step 1: Install dependencies**

```bash
npm install remotion @remotion/bundler @remotion/renderer
```

Expected: adds three packages to `package.json`'s `dependencies`. This is the step
most likely to hit this machine's demonstrated npm-install slowness (Chromium
download) — if it hangs with no output for several minutes, that's consistent with
this session's known pattern (see `docs/governance/DEFERRED_WORK.md`), not
necessarily a new problem; let it run rather than assuming failure.

- [ ] **Step 2: Create the composition component**

> **Correction discovered during execution**: the plan as originally written used
> `<Composition<CaptionedVideoProps>>` with a plain TS interface and no `schema` prop.
> That failed typecheck against the actually-installed Remotion version —
> `Composition`'s real declaration (`node_modules/remotion/dist/cjs/Composition.d.ts`)
> requires **two** generics, `<Schema extends AnyZodObject, Props extends
> Record<string, unknown>>`, with no default for `Schema`. The fix below defines a
> real Zod schema (zod is already a MINT dependency) and lets both generics be
> inferred from it — this is what the code blocks in this step already reflect.

Create `remotion/src/CaptionedVideo.tsx`:

```tsx
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig, Loop, OffthreadVideo } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { z } from 'zod';

// A real Zod schema, not just a TS interface — required by this installed
// Remotion version's <Composition> typing (Composition<Schema, Props> takes
// two generics with no default). Passing a real schema lets both generics
// be fully inferred instead of guessed, and gets real runtime prop
// validation as a side benefit.
export const captionSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
});

export const captionedVideoPropsSchema = z.object({
  audioSrc: z.string(),
  footageSrc: z.string().optional(),
  captions: z.array(captionSchema),
  footageDurationSec: z.number().optional(),
});

export type Caption = z.infer<typeof captionSchema>;
export type CaptionedVideoProps = z.infer<typeof captionedVideoPropsSchema>;

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
  CaptionedVideoProps
> = async ({ props }) => {
  const fps = 30;
  // Prefer real caption timing (ground truth from Whisper). Fall back to a
  // fixed 10s placeholder only when there are no captions at all — the
  // orchestrator (Task 3) is expected to have already probed the audio's
  // real duration via ffprobe in that case and can pass it through a
  // synthetic single caption spanning the full clip instead of leaving
  // captions empty. This fallback exists only as a last-resort guard so
  // rendering never produces a literally zero-duration video.
  const lastEnd = props.captions.length > 0 ? props.captions[props.captions.length - 1].end : 10;
  return {
    durationInFrames: Math.max(1, Math.ceil(lastEnd * fps)),
    fps,
    props,
  };
};

function CaptionOverlay({ captions }: { captions: Caption[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = captions.find((c) => t >= c.start && t < c.end);
  if (!active) return null;
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          fontFamily: 'sans-serif',
          fontWeight: 800,
          fontSize: 56,
          color: 'white',
          textAlign: 'center',
          textShadow: '0 4px 12px rgba(0,0,0,0.8)',
          maxWidth: '85%',
          textTransform: 'uppercase',
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
}

export function CaptionedVideo({ audioSrc, footageSrc, captions, footageDurationSec }: CaptionedVideoProps) {
  const { durationInFrames, fps } = useVideoConfig();
  const totalDurationSec = durationInFrames / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1f16' }}>
      {footageSrc ? (
        footageDurationSec && footageDurationSec < totalDurationSec ? (
          <Loop durationInFrames={Math.ceil(footageDurationSec * fps)}>
            <OffthreadVideo src={footageSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Loop>
        ) : (
          <OffthreadVideo src={footageSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )
      ) : (
        <AbsoluteFill style={{ background: 'linear-gradient(160deg, #0a1f16, #103524)' }} />
      )}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <Audio src={audioSrc} />
        <CaptionOverlay captions={captions} />
      </Sequence>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 3: Create the Root component**

Create `remotion/src/Root.tsx`:

```tsx
import { Composition } from 'remotion';
import { CaptionedVideo, calculateCaptionedVideoMetadata, captionedVideoPropsSchema } from './CaptionedVideo.js';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CaptionedVideo"
      component={CaptionedVideo}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={300}
      schema={captionedVideoPropsSchema}
      defaultProps={{ audioSrc: '', captions: [] }}
      calculateMetadata={calculateCaptionedVideoMetadata}
    />
  );
};
```

(`width`/`height` are 1080x1920 — vertical 9:16, matching MINT's existing
`aspectForPlatform()` default for shorts/reels/tiktok in `video.service.ts`.
`durationInFrames={300}` here is only the pre-render placeholder Remotion Studio
shows before `calculateMetadata` resolves the real value — it's not used at render
time, `selectComposition()` overrides it.)

- [ ] **Step 4: Create the entry point**

Create `remotion/src/index.ts`:

```typescript
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root.js';

registerRoot(RemotionRoot);
```

- [ ] **Step 5: Add a minimal `remotion/tsconfig.json` and verify with it**

An ad-hoc `tsc` invocation without a proper config will fail on module resolution
for the `remotion` package's own type exports (it ships as ESM with `exports` map
entries `tsc` needs `moduleResolution: "bundler"` or `"node16"` to follow correctly).
Create `remotion/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

Run: `npx tsc -p remotion/tsconfig.json`
Expected: no errors. (This is a standalone check — `remotion/` is intentionally not
part of the root `tsconfig.json`'s project references, since it has its own
bundler/build concerns separate from the frontend/backend split.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json remotion/
git commit -m "feat: scaffold remotion/ sub-project with the CaptionedVideo composition"
```

---

## Task 3: `remotion.service.ts` — the orchestrator

**Files:**
- Create: `backend/src/services/ai/remotion.service.ts`
- Test: `backend/src/services/ai/remotion.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/services/ai/remotion.service.test.ts`:

```typescript
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

import { generateSpeech } from './tts.service.js';
import { transcribeAudio } from './whisper.service.js';
import { searchStockVideos } from './pexels.service.js';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { generateCaptionedVideo } from './remotion.service.js';

describe('generateCaptionedVideo', () => {
  beforeEach(() => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run backend/src/services/ai/remotion.service.test.ts`
Expected: FAIL with "Cannot find module './remotion.service.js'"

- [ ] **Step 3: Implement the orchestrator**

Create `backend/src/services/ai/remotion.service.ts`:

```typescript
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
```

(Note: `saveMintBlob('video', 'mp4', Buffer.alloc(0))` is used to get a correctly-named
output path from the existing convention, then `renderMedia` overwrites that empty
file with the real render — this reuses `saveMintBlob`'s filename/path logic without
needing a parallel path-generation scheme.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run backend/src/services/ai/remotion.service.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/ai/remotion.service.ts backend/src/services/ai/remotion.service.test.ts
git commit -m "feat: remotion.service.ts orchestrator (TTS -> Whisper -> Pexels -> render)"
```

---

## Task 4: `POST /studio/generate-captioned-video` route

**Files:**
- Modify: `backend/src/routes/studio.routes.ts`

- [ ] **Step 1: Add the route**

Modify `backend/src/routes/studio.routes.ts` — add this route right after the
existing `fastify.post('/studio/generate-video', ...)` handler (mirrors it exactly):

```typescript
  fastify.post('/studio/generate-captioned-video', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({
      script: z.string().min(1).max(10000),
      title: z.string().max(200).optional(),
      platform: z.enum(['youtube_shorts', 'instagram_reel', 'tiktok']).optional(),
      voice: z.string().optional(),
    }).parse(request.body);
    const { generateCaptionedVideo } = await import('../services/ai/remotion.service.js');
    return await generateCaptionedVideo({ script: body.script, title: body.title, platform: body.platform, voice: body.voice });
  });
```

- [ ] **Step 2: Verify the file still typechecks**

Run: `npx tsc -p backend/tsconfig.json --noEmit`
Expected: no new errors introduced by this change (pre-existing errors, if any,
aren't this task's concern — only check nothing new broke).

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/studio.routes.ts
git commit -m "feat: POST /studio/generate-captioned-video route"
```

---

## Task 5: Frontend button in `ContentGenerator.tsx`

**Files:**
- Modify: `frontend/src/components/ContentGenerator.tsx`

- [ ] **Step 1: Add state, mirroring the existing video state exactly**

Modify `frontend/src/components/ContentGenerator.tsx` — near the existing
`generatingVideo`/`videoUrl` state declarations:

```typescript
  const [generatingCaptionedVideo, setGeneratingCaptionedVideo] = useState(false);
  const [captionedVideoUrl, setCaptionedVideoUrl] = useState<string | null>(null);
```

- [ ] **Step 2: Add the handler, mirroring `generateVideoFromScript` exactly**

Right after the existing `generateVideoFromScript` callback:

```typescript
  const generateCaptionedVideoFromScript = useCallback(async (script: string) => {
    setGeneratingCaptionedVideo(true);
    setCaptionedVideoUrl(null);
    try {
      const res = await apiClient.post('/studio/generate-captioned-video', { script, platform: 'youtube_shorts' });
      const data = await res.json();
      if (data.url) setCaptionedVideoUrl(data.url);
    } catch {
      // video generation failed silently, same posture as generateVideoFromScript
    } finally {
      setGeneratingCaptionedVideo(false);
    }
  }, []);
```

- [ ] **Step 3: Add the button next to the existing "Generate Short Video" one**

Modify the JSX block containing the `generateVideoFromScript` button:

```tsx
                  <button
                    onClick={() => generateVideoFromScript(selectedItem.content)}
                    disabled={generatingVideo}
                    className="rounded-2xl border border-mint-500/30 bg-mint-500/10 p-4 text-left text-sm font-bold text-mint-300 hover:bg-mint-500/20 disabled:opacity-50"
                  >
                    {generatingVideo ? 'Generating video...' : 'Generate Short Video'}
                  </button>
                  <button
                    onClick={() => generateCaptionedVideoFromScript(selectedItem.content)}
                    disabled={generatingCaptionedVideo}
                    className="rounded-2xl border border-mint-500/30 bg-mint-500/10 p-4 text-left text-sm font-bold text-mint-300 hover:bg-mint-500/20 disabled:opacity-50"
                  >
                    {generatingCaptionedVideo ? 'Generating captions...' : 'Generate Captioned Video'}
                  </button>
```

- [ ] **Step 4: Add the video player, mirroring the existing `videoUrl` block**

Right after the existing `{videoUrl && (...)}` block:

```tsx
            {captionedVideoUrl && (
              <div className="rounded-2xl border border-mint-500/30 bg-mint-500/10 p-4">
                <video controls className="w-full rounded-xl" src={captionedVideoUrl}>
                  Your browser does not support video.
                </video>
                <p className="mt-2 text-xs text-mint-400">
                  Captioned video generated - plays below. First render after install may take longer (downloads a
                  one-time headless browser component).
                </p>
              </div>
            )}
```

- [ ] **Step 5: Manual verification**

```bash
npm run dev:all
```

Open `http://localhost:5173/app/studio`, generate a script, click "Generate Captioned
Video", confirm the button shows "Generating captions..." while in flight and a video
player appears on success. (Full caption-sync verification is deferred per the
Known Gaps section — Whisper isn't installed on this machine, so this manual check
validates the fallback-caption/no-footage path, not real transcript-synced captions.)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ContentGenerator.tsx
git commit -m "feat: Generate Captioned Video button in ContentGenerator"
```

---

## Task 6: Docs

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `GROUND_TRUTH.md`

- [ ] **Step 1: README — add to the feature table**

In `README.md`'s feature table (the one with the `**Research**` row from the GPT
Researcher integration), add a row:

```
| **Captioned Video** | Templated captioned video over stock footage via Remotion — a third video path alongside Money Printer Turbo and raw FFmpeg assembly |
```

- [ ] **Step 2: AGENTS.md — note the new dependency and its license**

In `AGENTS.md`'s "## Local Services" section (or nearby), add:

```
- **Remotion** (in-process, no separate service/port) — renders captioned video
  (voiceover + Whisper-timed captions over Pexels footage). Pure Node/TS, no Python.
  First install/render downloads a bundled headless Chromium (~200-300MB). License:
  free for individuals and companies up to 3 employees; a paid Company License is
  required at 4+ — see `docs/superpowers/specs/2026-09-19-remotion-captioned-video-design.md`.
```

- [ ] **Step 3: GROUND_TRUTH.md — log it like the GPT Researcher entry**

In `GROUND_TRUTH.md`'s Sprint History table, add a row following the same pattern as
the "Research feature" row added for GPT Researcher:

```
| Captioned video | 2026-09-19 | Remotion integration — third video path, captions synced to Whisper transcript with an ffprobe-duration fallback when Whisper isn't available |
```

And in the "Known Issues / Accepted Limitations" table, add:

```
| ISS-008 | Captioned-video caption sync not live-verified (Whisper CLI not installed on the dev machine that built this) | Low | Deferred — see docs/governance/DEFERRED_WORK.md |
```

- [ ] **Step 4: Commit**

```bash
git add README.md AGENTS.md GROUND_TRUTH.md
git commit -m "docs: document the Remotion captioned-video feature"
```

---

## Self-Review Notes

**Spec coverage check:**
- What it renders (captions over footage, fallback background) → Task 2 (composition), Task 3 (orchestrator). ✓
- In-process npm dependency, no separate service → Task 2. ✓
- One button, full pipeline → Task 3 (orchestrator), Task 5 (button). ✓
- Second button next to MPT's → Task 5. ✓
- `calculateMetadata()` duration from real Whisper timing, not the fake WPM estimate → Task 1 (exposes `absolutePath` so real audio can be read), Task 2 (`calculateCaptionedVideoMetadata`), Task 3 (passes real `captions` through). ✓
- Footage loop/trim handling → Task 2's `CaptionedVideo` component (`<Loop>` when footage is shorter than audio; naturally cut off by `durationInFrames` when longer, matching the spec's stated behavior). ✓
- 180s render timeout → Task 3's `RENDER_TIMEOUT_MS` passed to `renderMedia`. ✓
- License documented → Task 6. ✓
- Empty-captions ffprobe fallback → Task 3's `probeAudioDurationSec`. ✓
- Known gaps (Whisper not installed, Chromium download risk) stated plainly → plan header, Task 2 Step 1, Task 5 Step 5. ✓

**Type consistency check:** `Caption { start, end, text }` in Task 2's
`CaptionedVideo.tsx` matches the `{ start, end, text }` shape `whisper.service.ts`
already returns in `TranscriptionResult.segments` (verified against the real file,
not assumed) and matches what Task 3's orchestrator passes through as `captions` in
`inputProps`. `GenerateCaptionedVideoResult { url, fileUrl }` matches what Task 4's
route returns directly and what Task 5's frontend handler reads (`data.url`).
