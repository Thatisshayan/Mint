export interface VideoGenOptions {
  script: string;
  title?: string;
  platform?: 'youtube_shorts' | 'instagram_reel' | 'tiktok';
  voice?: string;
  duration?: number;
}

export interface VideoGenResult {
  url: string;
  provider: string;
  taskId?: string;
  durationMs?: number;
}

export async function generateVideo(options: VideoGenOptions): Promise<VideoGenResult> {
  const mptUrl = process.env.MONEY_PRINTER_URL || 'http://localhost:8501';

  const payload = {
    script: options.script,
    video_subject: options.title || 'MINT Generated',
    voice_name: options.voice || 'en-US-JennyNeural',
    video_aspect: options.platform === 'youtube_shorts' ? '9:16' : '16:9',
    bg_music_type: 'random',
    subtitle_enabled: true,
  };

  try {
    const res = await fetch(`${mptUrl}/api/v1/video/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(300_000),
    });

    if (!res.ok) {
      const details = await res.text().catch(() => '');
      throw new Error(`Video generation failed (${res.status}): ${details || res.statusText}`);
    }

    const data = (await res.json()) as { task_id?: string; video_url?: string; progress?: number };
    return {
      url: data.video_url || `${mptUrl}/api/v1/video/result/${data.task_id}`,
      provider: 'moneymaker',
      taskId: data.task_id,
      durationMs: options.duration || undefined,
    };
  } catch (err) {
    if ((err as Error).name === 'TimeoutError' || (err as Error).name === 'AbortError') {
      throw new Error('Video generation timed out after 5 minutes');
    }
    throw err;
  }
}
