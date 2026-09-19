# Remotion Captioned Video Integration — Design Spec

## Overview

Add a third video-rendering path to MINT: React-component-based captioned video via
[Remotion](https://remotion.dev), rendered server-side with headless Chromium. This
produces the "kinetic captions burned over stock footage" style neither of MINT's
existing paths do — FFmpeg assembly (`assembly.service.ts`) just concatenates raw
clips, and Money Printer Turbo (`video.service.ts`, fixed earlier this session)
generates its own footage/subtitles MINT doesn't control the visual style of. Second
of the four AI-tools-sheet integrations (GPT Researcher done and merged; AnimateDiff,
SadTalker+OpenVoice queued after this one).

**Scope note, stated plainly**: this is a larger integration than GPT Researcher was.
That one touched a single route file plus a few new ones. This touches an existing
service's return type (`tts.service.ts`), chains four existing services together, adds
a whole separate Remotion sub-project with its own bundler, a new heavy npm
dependency, a new route, and a new frontend button.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| What it renders | Captioned video: voiceover + Whisper-timed captions burned over Pexels stock footage (brand-color fallback if no Pexels key) | Fills the actual gap; reuses services MINT already has (TTS, Whisper, Pexels) rather than reinventing them. |
| Run mode | In-process npm dependency (`@remotion/renderer` + `remotion`), no separate local service/port | Pure Node/TS, unlike GPT Researcher/ComfyUI — no Python, no new process to manage, no Settings-page reachability row needed. |
| Orchestration | One route, one button, full pipeline (script → TTS → Whisper → Pexels → render) | Matches the existing "Generate Short Video" (MPT) button's UX exactly — one click, finished video. |
| UI placement | Second button next to the existing MPT one: "Generate Captioned Video" | Two distinct styles side by side; user picks per script rather than MINT guessing which is better. |
| Duration source | `calculateMetadata()` fed by Whisper's last caption segment's `end` timestamp (ground truth from the actual audio, not `tts.service.ts`'s fake words-per-minute estimate) | Verified via Remotion's own docs — `calculateMetadata()` is the real mechanism for computing `durationInFrames` dynamically before render. The existing `TTSResult.durationMs` is a WPM guess, not real audio duration; using it would desync captions or truncate the video. |
| Footage/audio length mismatch | Loop the Pexels clip if shorter than the voiceover; trim if longer | Simplest correct behavior; no gap of dead frames, no abrupt mid-word cut. |
| Render timeout | 180s (matches the existing MPT route's timeout tier, shorter since no network task-polling is involved — this is a local render) | Headless-Chromium frame-by-frame rendering is slow (~1,350 frames for a 45s/30fps short); needs a hard ceiling so a stuck render doesn't hang the request forever. |
| License | Remotion is free for individuals and companies up to 3 employees; a paid Company License is required at 4+ employees (verified against the actual license text, not assumed) | **Stated explicitly because it differs from the rest of this MIT-licensed repo's dependencies.** Fine for MINT today (personal, single-user). If this repo is ever used by a team, this becomes a real constraint someone needs to know about — noted here so it isn't a surprise later. |

## Known Gaps (carried forward honestly, not fixed in this spec)

- **Whisper CLI isn't installed on this dev machine** (`where whisper` found nothing) —
  same shape of gap as GPT Researcher's Ollama dependency. `ffprobe` *is* available
  locally as a duration cross-check/fallback, but caption *content* timing needs
  Whisper (or an equivalent STT) and can't be end-to-end verified in this session.
  Implementation proceeds on `whisper.service.ts`'s already-existing, already-used
  interface; live verification is deferred, same posture as the GPT Researcher spike.
- **Chromium download risk**: `@remotion/renderer` pulls a bundled headless Chromium
  (~200-300MB) on first install/render. This session's `npm install`s have hung
  repeatedly on this machine for unrelated reasons (documented in
  `docs/governance/DEFERRED_WORK.md`) — flagging this as expected friction during
  implementation, not a surprise if it happens again.

## Architecture

```
Frontend (ContentGenerator.tsx)
  │ POST /studio/generate-captioned-video  { script, platform }
  ▼
Backend (Fastify)
  └─ studio.routes.ts (new route)
       └─ services/ai/remotion.service.ts (NEW) — orchestrator
            ├─ tts.service.ts.generateSpeech()        → voiceover audio + absolutePath
            ├─ whisper.service.ts.transcribeAudio()   → timed caption segments
            ├─ pexels.service.ts.searchStockVideos()  → footage URL (or none → fallback bg)
            └─ @remotion/renderer renderMedia()
                 against the bundled composition in remotion/
                 with calculateMetadata() computing durationInFrames
                 from the real Whisper-derived audio length
       → saveMintBlob('video', ...) — same Files/output convention as every other video path

remotion/ (NEW, separate sub-project — Remotion uses its own bundler, not Vite)
  ├─ Root.tsx            — registers the CaptionedVideo composition
  └─ CaptionedVideo.tsx  — the actual template: captions + footage/fallback background
```

## Components

### `remotion/Root.tsx`, `remotion/CaptionedVideo.tsx` (new)
- Pure React, no backend coupling. `CaptionedVideo` takes props
  `{ audioSrc: string; footageSrc?: string; captions: {start: number; end: number; text: string}[] }`.
- `calculateMetadata()` on the composition: reads `props.captions`, sets
  `durationInFrames = Math.ceil(captions[captions.length - 1].end * fps)`. **Edge
  case**: if `captions` is empty (Whisper produced nothing — silence, or a
  transcription failure that didn't throw), fall back to probing `audioSrc`'s real
  duration via `ffprobe` (already a MINT dependency, used by `assembly.service.ts`)
  rather than producing a zero-duration/invalid composition.
- If `footageSrc` is absent (no Pexels key configured), renders a solid brand-color
  background instead of failing.
- Footage duration handling: if `footageSrc`'s natural duration < audio duration, loop
  it (Remotion's `<Loop>` component); if longer, it's simply cut off by the
  composition's own `durationInFrames` (no explicit trim needed — Remotion doesn't
  render past the composition's duration).

### `backend/src/services/ai/tts.service.ts` (modified)
- `TTSResult` gains `absolutePath: string` (currently discarded after
  `saveMintBlob()` returns it) — the orchestrator needs a real file path to hand to
  the Remotion render, not just the public URL string.
- No behavior change to the actual speech generation — purely exposing data that
  already existed but was thrown away.

### `backend/src/services/ai/remotion.service.ts` (new)
- `generateCaptionedVideo(options: { script: string; title?: string; platform?: 'youtube_shorts' | 'instagram_reel' | 'tiktok' }): Promise<{ url: string; fileUrl: string | null }>`
- Bundles the Remotion composition once via `@remotion/bundler`'s `bundle()`, caching
  the resulting `serveUrl` in a module-level variable (a lazily-initialized promise,
  awaited by every call — Node module state persists for the life of the backend
  process, so this genuinely only bundles once per process start, not once per
  request). Re-bundling per request would make every generate call pay that cost.
- Calls the four services in sequence as shown in Architecture; on Pexels returning
  no results, passes `footageSrc: undefined` (fallback background, not a failure).
- Calls `renderMedia()` with a 180s timeout; on timeout or any step's failure, throws
  a clear error — no silent partial/corrupt video, matching the MPT route's posture.

### `backend/src/routes/studio.routes.ts` (modified)
- New `fastify.post('/studio/generate-captioned-video', { preHandler: authMiddleware }, ...)`
  — validates `{ script: string, platform?: ... }` via Zod (same pattern as the
  existing `/studio/generate-video`), calls `remotion.service.ts`, returns
  `{ url, fileUrl }`.

### `frontend/src/components/ContentGenerator.tsx` (modified)
- New state (`generatingCaptionedVideo`, `captionedVideoUrl`) mirroring the existing
  `generatingVideo`/`videoUrl` pattern exactly.
- New button "Generate Captioned Video" next to the existing "Generate Short Video"
  one, calling the new route the same way `generateVideoFromScript` calls
  `/studio/generate-video`.

## Error Handling

- **TTS or Whisper fails** → route fails fast with the underlying error message; no
  partial video attempted.
- **Pexels unavailable/no key** → not an error; composition falls back to a solid
  background (this is the existing MINT convention for optional integrations).
- **Render exceeds 180s** → `renderMedia()` call is aborted, route returns a timeout
  error (mirrors the MPT route's 300s pattern, shorter here since this is a local
  CPU-bound render with no external task-polling latency to account for).
- **Chromium/bundler not yet downloaded on first call** → the first request after
  install will be slow (Chromium fetch); document this in the frontend as an expected
  "first run may take longer" note near the button, not silently swallowed.

## Testing

- **Backend unit**: mock `generateSpeech`/`transcribeAudio`/`searchStockVideos`/
  `renderMedia` —
  1. happy path: all four called in order, `calculateMetadata`-derived duration
     matches the mocked Whisper segments' last `end` value.
  2. no Pexels key → `renderMedia` called with `footageSrc: undefined`, not skipped/thrown.
  3. TTS failure → route rejects, `renderMedia` never called.
  4. render timeout → route returns a timeout error, not a hang.
- **Manual** (once Whisper is confirmed installed/working, deferred per the Known Gaps
  section above): generate a real captioned video end-to-end, verify caption sync
  against the actual spoken words, verify footage looping/fallback behavior with and
  without `PEXELS_API_KEY` set.

## Out of Scope (this spec)

- AnimateDiff, SadTalker/OpenVoice — separate specs, per the agreed order.
- Multiple templates/styles — one clean default composition for v1; template
  selection is a natural follow-up, not required for the feature to be useful.
- Custom brand colors/fonts beyond a single default — same reasoning.
