const EDGE_TTS_API = 'https://api.edge-tts.com/v1/tts';

export interface TTSOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
}

export interface TTSResult {
  audioUrl: string;
  durationMs: number;
  format: string;
}

export async function generateSpeech({
  text,
  voice = 'en-US-JennyNeural',
  rate = 1,
  pitch = 1,
}: TTSOptions): Promise<TTSResult> {
  const baseUrl = process.env.TTS_BASE_URL || EDGE_TTS_API;
  const url = new URL(baseUrl);

  // Guard: clamp rate/pitch and refuse NaN. The TTS providers reject junk and bubble up ugly errors.
  const safeRate = Math.max(-1, Math.min(2, Number.isFinite(rate) ? rate : 1));
  const safePitch = Math.max(-1, Math.min(2, Number.isFinite(pitch) ? pitch : 1));

  const payload = {
    text,
    voice,
    rate: `${safeRate > 0 ? '+' : ''}${Math.round((safeRate - 1) * 100)}%`,
    pitch: `${safePitch > 0 ? '+' : ''}${Math.round((safePitch - 1) * 100)}Hz`,
    outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
  };

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const details = await res.text().catch(() => '');
      throw new Error(`TTS failed (${res.status}): ${details || res.statusText}`);
    }

    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    const dataUrl = `data:audio/mp3;base64,${base64}`;

    return {
      audioUrl: dataUrl,
      durationMs: Math.round((text.split(' ').length / 150) * 60 * 1000),
      format: 'mp3',
    };
  } catch (err) {
    if ((err as Error).name === 'TimeoutError' || (err as Error).name === 'AbortError') {
      throw new Error('TTS request timed out');
    }
    throw err;
  }
}
