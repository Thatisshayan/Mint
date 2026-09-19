import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig, Loop, OffthreadVideo } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { z } from 'zod';

// A real Zod schema, not just a TS interface — required by this installed
// Remotion version's <Composition> typing (Composition<Schema, Props> takes
// two generics with no default; the schema-less "loose props" path that
// some Remotion docs examples show didn't typecheck against the actual
// installed .d.ts, which requires Schema to extend AnyZodObject). Passing a
// real schema lets both generics be fully inferred instead of guessed, and
// gets real runtime prop validation as a side benefit.
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
  // orchestrator is expected to have already probed the audio's real
  // duration via ffprobe in that case and passes a synthetic single
  // caption spanning the full clip instead of leaving captions empty.
  // This fallback exists only as a last-resort guard so rendering never
  // produces a literally zero-duration video.
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
